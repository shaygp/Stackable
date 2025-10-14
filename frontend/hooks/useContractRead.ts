"use client";

import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON, stringAsciiCV, ClarityValue } from '@stacks/transactions';
import { useStacksAuth } from './useStacksAuth';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

export function useContractRead(
  contractName: string,
  functionName: string,
  functionArgs: ClarityValue[]
) {
  const { network } = useStacksAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName,
          functionName,
          functionArgs,
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        setData(cvToJSON(result));
        setLoading(false);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [contractName, functionName, JSON.stringify(functionArgs), network]);

  return { data, loading, error };
}

export function useTokenSupply(symbol: string) {
  return useContractRead(
    'bonding-curve',
    'get-token-supply',
    [stringAsciiCV(symbol)]
  );
}

export function useCurveInfo(symbol: string) {
  return useContractRead(
    'bonding-curve',
    'get-curve-info',
    [stringAsciiCV(symbol)]
  );
}

export function useUserXP(address: string) {
  return useContractRead(
    'xp-system',
    'get-xp',
    []
  );
}
