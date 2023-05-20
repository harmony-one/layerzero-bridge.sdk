import Web3 from 'web3';
import { HmyMethods } from './HmyMethods';
import { HmyMethodsWeb3 } from './HmyMethodsWeb3';
import { HmyMethodsERC20Web3 } from './HmyMethodsERC20Web3';
const { Harmony } = require('@harmony-js/core');
const { ChainType } = require('@harmony-js/utils');

import { HmyMethodsHRC20Web3 } from './HmyMethodsHRC20Web3';

export type HmyMethodsCommon = HmyMethods | HmyMethodsWeb3;
export type HmyMethodsErc20Common = HmyMethodsERC20Web3;
export type HmyMethodsHrc20Common = HmyMethodsHRC20Web3;

export interface IHmyClient {
  hmyMethodsERC20: HmyMethodsERC20Web3;
  getHmyBalance: (addr: string) => Promise<string>;
  getBech32Address: (addr: string) => string;
  addWallet: (pk: string) => void;
  getUserAddress: () => string;
}

export interface IHmyClientParams {
  sdk?: 'harmony' | 'web3';
  nodeURL: string;
  chainId: number;
  contracts: {
    busd: string;
    link: string;
    busdManager: string;
    linkManager: string;
    erc20Manager: string;
    erc721Manager: string;
    depositManager: string;
    hrc20Manager: string;
    hrc20BSCManager: string;
    erc20BSCManager: string;
    bscTokenManager: string;
    HMY_HRC1155_MANAGER_CONTRACT: string;
    HMY_ERC1155_MANAGER_CONTRACT: string;
    HMY_ERC1155_MANAGER_TOKEN: string;
    HMY_HRC721_MANAGER_CONTRACT: string;
  };
  gasLimit?: number;
  gasPrice?: number;
}

export const getHmyClient = async (params: IHmyClientParams): Promise<IHmyClient> => {
  const hmy = new Harmony(
    // let's assume we deploy smart contract to this end-point URL
    params.nodeURL,
    {
      chainType: ChainType.Harmony,
      chainId: Number(params.chainId),
    }
  );

  // const hmyUserAccount = params.privateKey
  //   ? hmy.wallet.addByPrivateKey(params.privateKey)
  //   : await hmy.wallet.createAccount();

  // const hmyUserAccount = await hmy.wallet.createAccount();
  let userAddress: string;

  // @ts-ignore
  let web3URL;

  try {
    // @ts-ignore
    web3URL = window.ethereum;
  } catch (e) {
    web3URL = params.nodeURL;
  }

  const web3 = new Web3(web3URL);

  const hmyMethodsERC20 = new HmyMethodsERC20Web3({ web3 });

  return {
    addWallet: async (privateKey: string) => {
      const ethUserAccount = await web3.eth.accounts.privateKeyToAccount(privateKey);
      web3.eth.accounts.wallet.add(ethUserAccount);
      web3.eth.defaultAccount = ethUserAccount.address;

      userAddress = ethUserAccount.address;
    },
    getUserAddress: () => userAddress,
    hmyMethodsERC20,
    getBech32Address: address => hmy.crypto.getAddress(address).bech32,
    getHmyBalance: address => hmy.blockchain.getBalance({ address }),
  };
};
