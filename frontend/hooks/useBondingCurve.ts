import { useState } from 'react';
import {
  makeContractCall,
  AnchorMode,
  stringAsciiCV,
  uintCV,
  PostConditionMode,
} from '@stacks/transactions';
import { useStacksAuth } from './useStacksAuth';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
const CONTRACT_NAME = 'bonding-curve';

export function useBondingCurve() {
  const { network } = useStacksAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const launchToken = async (
    symbol: string,
    basePrice: number,
    curveType: number,
    slope: number,
    graduationThreshold: number,
    maxSupply: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'launch-token',
        functionArgs: [
          stringAsciiCV(symbol),
          uintCV(basePrice),
          uintCV(curveType),
          uintCV(slope),
          uintCV(graduationThreshold),
          uintCV(maxSupply),
        ],
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: any) => {
          setLoading(false);
        },
        onCancel: () => {
          setLoading(false);
          setError('Transaction cancelled');
        },
      };

      await makeContractCall(txOptions);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const buyToken = async (
    symbol: string,
    amount: number,
    maxSlippage: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'buy-token',
        functionArgs: [
          stringAsciiCV(symbol),
          uintCV(amount),
          uintCV(maxSlippage),
        ],
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: any) => {
          setLoading(false);
        },
        onCancel: () => {
          setLoading(false);
          setError('Transaction cancelled');
        },
      };

      await makeContractCall(txOptions);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const sellToken = async (
    symbol: string,
    amount: number,
    minReceived: number
  ) => {
    setLoading(true);
    setError(null);

    try {
      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName: 'sell-token',
        functionArgs: [
          stringAsciiCV(symbol),
          uintCV(amount),
          uintCV(minReceived),
        ],
        network,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Allow,
        onFinish: (data: any) => {
          setLoading(false);
        },
        onCancel: () => {
          setLoading(false);
          setError('Transaction cancelled');
        },
      };

      await makeContractCall(txOptions);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return {
    launchToken,
    buyToken,
    sellToken,
    loading,
    error,
  };
}
