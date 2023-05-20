const Web3 = require('web3');
const BN = require('bn.js');
const { abi: ProxyERC20Abi } = require('./ProxyERC20Abi');
const { abi: ProxyHRC20Abi } = require('./ProxyHRC20Abi');
const { abi: ERC20Abi } = require('./ERC20Abi');

const layerZeroConfig = {
    ethereum: {
        endpoint: "0x66A71Dcef29A0fFBDBE3c6a460a3B5BC225Cd675",
        chainId: 101
    },
    bsc: {
        endpoint: "0x3c2269811836af69497E5F486A85D7316753cf62",
        chainId: 102
    },
    harmony: {
        endpoint: "0x9740FF91F1985D8d2B71494aE1A2f723bb3Ed9E4",
        chainId: 116
    }
}

// 1LINK token addresses
const tokenConfig = {
    proxyERC20: "0xEe381e476b4335B8584A2026f3E845edaC2c69de",
    proxyHRC20: "0x6bEe6e5cf8E02833550B228D9CC6aD19Dae3743E",
    erc20Address: "0x514910771af9ca656af840dff83e8264ecf986ca",
    hrc20Address: "0x218532a12a389a4a92fc0c5fb22901d1c19198aa"
}

// https://api.s0.t.hmny.io/
const hmyRPCUrl = "https://api.harmony.one";

const ethRPCUrl = "https://mainnet.infura.io/v3/5c21c1256d824ca39dfceb0815f757a2";


const web3 = new Web3(ethRPCUrl);

const USER_PK = proceess.env.USER_PK;

const account = web3.eth.accounts.privateKeyToAccount(USER_PK);
web3.eth.accounts.wallet.add(account);

const getTokenBalance = async (tokenAddr, userAddr) => {
    const tokenContract = new web3.eth.Contract(ERC20Abi, tokenAddr);

    const balance = await tokenContract.methods.balanceOf(userAddr).call();

    return balance;
}

const approveToken = async (tokenAddr, externalContract, amount) => {
    const tokenContract = new web3.eth.Contract(ERC20Abi, tokenAddr);

    const res = await tokenContract.methods.approve(
        externalContract,
        amount
    ).send({
        from: account.address,
        gas: 4712388,
        gasPrice: new BN(await web3.eth.getGasPrice())
    });

    return res;
}

// send 1LINK ETH -> HMY
const send1LINK = async () => {
    const amount = new BN('500000000000000000');

    console.log('User address: ', account.address);

    console.log('Balance 1LINK: ', await getTokenBalance(tokenConfig.erc20Address, account.address));

    // 1 Step - approve token contract
    const approveTokenRes = await approveToken(
        tokenConfig.erc20Address,
        tokenConfig.proxyERC20,
        amount
    );

    console.log('Approve token res: ', approveTokenRes);

    const proxyContract = new web3.eth.Contract(ProxyERC20Abi, tokenConfig.proxyERC20);

    // const - 500k gasLimit
    const adapterParams = '0x0001000000000000000000000000000000000000000000000000000000000007a120';

    const sendFee = await proxyContract.methods.estimateSendFee(
        layerZeroConfig.harmony.chainId,
        account.address, // to user address
        amount,
        false,
        adapterParams
    ).call();

    console.log('Send Fee: ', sendFee);

    const res = await proxyContract.methods.sendFrom(
        account.address, // from user address
        layerZeroConfig.harmony.chainId,
        account.address, // to user address
        amount,
        account.address, // refund address
        '0x0000000000000000000000000000000000000000', // const
        adapterParams
    ).send({
        value: sendFee.nativeFee,
        from: account.address,
        gas: 4712388,
        gasPrice: new BN(await web3.eth.getGasPrice())
    });

    console.log(res);
}

send1LINK();