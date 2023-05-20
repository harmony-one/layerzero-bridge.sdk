import { mulDecimals } from '../../utils';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { getAddress } from '@harmony-js/crypto';
const BN = require('bn.js');

import { abi as ProxyERC20Abi } from '../out/ProxyHRC20Abi';
import { getTokenConfig } from '../../tokens-config';
import { NETWORK_TYPE, TOKEN } from '../../interfaces';

interface IHmyMethodsInitParams {
  web3: Web3;
  options?: { gasPrice: number; gasLimit: number };
}

export class HmyMethodsERC20Web3 {
  web3: Web3;
  hmyManagerContractAddress: string;
  // private options = { gasPrice: 3000000000, gasLimit: 6721900 };

  constructor(params: IHmyMethodsInitParams) {
    this.web3 = params.web3;
    // if (params.options) {
    //   this.options = params.options;
    // }
  }

  approveHmyManger = async (
    hrc20Address: string,
    amount: string,
    decimals: string,
    tokenType: TOKEN,
    network: NETWORK_TYPE,
    sendTxCallback?: (hash: string) => any,
  ) => {
    const tokenJson = require('../out/MyERC20');
    const hmyTokenContract = new this.web3.eth.Contract(
      tokenJson.abi,
      hrc20Address,
    );
    // @ts-ignore
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (Number(amount) === 0) {
      sendTxCallback('skip');
      return;
    }

    const res = await hmyTokenContract.methods
      .approve(
        getTokenConfig(hrc20Address, tokenType, network).proxyHRC20,
        mulDecimals(amount, decimals),
      )
      .send({
        from: accounts[0],
        gasLimit: process.env.GAS_LIMIT,
        gasPrice: Number(process.env.GAS_PRICE),
      })
      .on('transactionHash', sendTxCallback);

    return res;
  };

  getFee = async (
    hrc20Address: string,
    userAddr: string,
    amount: string,
    decimals: string,
    tokenType: TOKEN,
    network: NETWORK_TYPE,
  ) => {
    const token = getTokenConfig(hrc20Address, tokenType, network);

    const proxyContract = new this.web3.eth.Contract(
      ProxyERC20Abi as any,
      token.proxyHRC20,
    );

    // const - 500k gasLimitя
    const adapterParams = token.adapterParams || '0x';

    const sendFee = await proxyContract.methods
      .estimateSendFee(
        token.config.chainId,
        userAddr,
        mulDecimals(amount, decimals),
        false,
        adapterParams,
      )
      .call();

    return sendFee.nativeFee;
  };

  burnToken = async (
    hrc20Address: string,
    userAddr: string,
    amount: string,
    decimals: string,
    tokenType: TOKEN,
    network: NETWORK_TYPE,
    sendTxCallback?: (hash: string) => any,
  ) => {
    // @ts-ignore
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    const token = getTokenConfig(hrc20Address, tokenType, network);

    const proxyContract = new this.web3.eth.Contract(
      ProxyERC20Abi as any,
      token.proxyHRC20,
    );

    // const - 500k gasLimit
    const adapterParams = token.adapterParams || '0x';

    const sendFee = await proxyContract.methods
      .estimateSendFee(
        token.config.chainId,
        userAddr,
        mulDecimals(amount, decimals),
        false,
        adapterParams,
      )
      .call();

    console.log('Send Fee: ', sendFee);

    let value;

    switch (token.token) {
      case TOKEN.ONE:
        value = mulDecimals(amount, decimals).add(new BN(sendFee.nativeFee));
        break;

      default:
        value = sendFee.nativeFee;
    }

    const response = await proxyContract.methods
      .sendFrom(
        accounts[0], // from
        token.config.chainId,
        userAddr, // to user address
        mulDecimals(amount, decimals),
        accounts[0], // refund address
        '0x0000000000000000000000000000000000000000', // const
        adapterParams,
      )
      .send({
        value,
        from: accounts[0],
        gasLimit: process.env.GAS_LIMIT,
        gasPrice: Number(process.env.GAS_PRICE),
      })
      .on('transactionHash', sendTxCallback);

    return response;
  };

  checkHmyBalance = async (hrc20Address: string, addr: string) => {
    const tokenJson = require('../out/MyERC20');
    const hmyTokenContract = new this.web3.eth.Contract(
      tokenJson.abi,
      hrc20Address,
    );

    const addrHex = getAddress(addr).checksum;

    return await hmyTokenContract.methods.balanceOf(addrHex).call();
  };

  totalSupply = async (hrc20Address: string) => {
    const tokenJson = require('../out/MyERC20');
    const hmyTokenContract = new this.web3.eth.Contract(
      tokenJson.abi,
      hrc20Address,
    );

    return await hmyTokenContract.methods.totalSupply().call();
  };

  allowance = async (addr: string, erc20Address: string, tokenType: TOKEN, network: NETWORK_TYPE) => {
    const addrHex = getAddress(addr).checksum;

    const tokenJson = require('../out/MyERC20');
    const hmyTokenContract = new this.web3.eth.Contract(
      tokenJson.abi,
      erc20Address,
    );

    return await hmyTokenContract.methods
      .allowance(addrHex, getTokenConfig(erc20Address, tokenType, network).proxyHRC20)
      .call();
  };
}
