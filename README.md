# Harmony Layer Zero Bridge SDK

### Install instructions

```
npm i hmy-bridge-sdk --save
```

## How to use

### 1. Init SDK instance

```js
const { BridgeSDK, TOKEN, EXCHANGE_MODE, STATUS } = require('hmy-bridge-sdk');
const configs = require('hmy-bridge-sdk/lib/configs');

const bridgeSDK = new BridgeSDK({ logLevel: 0 });

await bridgeSDK.init(configs.testnet);
```
#### You can set logLevel 0-2
```
0 - logs disabled
1 - only errors and success
2 - full log (errors, succees, info, panding, waiting etc)
```

#### You can use ```config.mainnet```: Harmony mainnet <> Ethereum mainnet.
#### Or you can use ```config.testnet```: Harmony testnet <> Ethereum Kovan testnet.

### 2. Set user wallet (NodeJS mode)
#### For ONE -> ETH operation you need to add ONE wallet:
```js
await bridgeSDK.addOneWallet('YOUR_PRIVATE_KEY');
```

#### For ETH -> ONE operation you need to add Ethereum wallet:
```js
await bridgeSDK.addEthWallet('YOUR_PRIVATE_KEY');
```

### 2.1. Set user wallet (Browser mode)
#### If you use Browser you can sign transactions with Metamask
#### Metamask:
```js
bridgeSDK.setUseMetamask(true);
```

### 3. Send tokens
```js
let oprationId;

try {
  await bridgeSDK.sendToken({
    type: EXCHANGE_MODE.ETH_TO_ONE,
    token: TOKEN.ERC20,
    erc20Address: '0x...',
    amount: 0.01,
    oneAddress: 'one11234dzthq23n58h43gr4t52fa62rutx4s247sk',
    ethAddress: '0x12344Ab6773925122E389fE2684A9A938043f475',
  }, (id) => oprationId = id);
} catch (e) {
  console.log(e.message);
}
```
You don't need to do anything more. All other actions will be done automaticly. If you work in browser mode - sign transactions action also will be called automaticly. You need only to fetch and display operation status (step 4)

#### * if you want to send ERC20 token - you need to set token ````token: TOKEN.ERC20```` and add one more param ``erc20Address: 0x...``

#### * Use try-catch to catch error with reason message. Also you can set logLevel = 2 for better debugging (look at step 1).

### 4. Get operation details

```js
const operation = await bridgeSDK.api.getOperation(operationId);
```
#### * Recommended to use this call in a cycle if you want to monitoring & display operation status (look at full example)
###
## Eth -> One (full example)

```js
const { BridgeSDK, TOKEN, EXCHANGE_MODE, STATUS } = require('hmy-bridge-sdk');
const configs = require('hmy-bridge-sdk/lib/configs');

const operationCall = async () => {
    const bridgeSDK = new BridgeSDK({ logLevel: 2 }); // 2 - full logs, 1 - only success & errors, 0 - logs off

    await bridgeSDK.init(configs.testnet);

    await bridgeSDK.addEthWallet('YOUR_PRIVATE_KEY');

    let operationId;

    // display operation status
    let intervalId = setInterval(async () => {
        if (operationId) {
            const operation = await bridgeSDK.api.getOperation(operationId);

            /*
            console.log(operation.status);
            console.log(
              'Action: ',
              operation.actions.filter(a => a.status === STATUS.IN_PROGRESS)
            );
            */

            if (operation.status !== STATUS.IN_PROGRESS) {
                clearInterval(intervalId);
            }
        }
    }, 4000);

    try {
        await bridgeSDK.sendToken(
            {
                type: EXCHANGE_MODE.ETH_TO_ONE,
                token: TOKEN.ERC20,
                erc20Address: '0x...',
                amount: 0.01,
                oneAddress: 'one1we0fmuz9wdncqljwkpgj79k49cp4jrt5hpy49j',
                ethAddress: '0xc491a4c5c762b9E9453dB0A9e6a4431057a5fE54',
            },
            id => (operationId = id)
        );
    } catch (e) {
        console.log('Error: ', e.message);
    }

    process.exit();
};

operationCall();
```

### You can see more examples here
* If you want to copy this this example sources to your project - you need to change:
```js
const { BridgeSDK, TOKEN, EXCHANGE_MODE, STATUS } = require('..');
const configs = require('../lib/configs');
```
to
```js
const { BridgeSDK, TOKEN, EXCHANGE_MODE, STATUS } = require('hmy-bridge-sdk');
const configs = require('hmy-bridge-sdk/lib/configs');
```

## More API methods

### getOperations
```js
const operations = await bridgeSDK.api.getOperations({ size: 50, page: 0 });
```
