"use client";

import { useState, useEffect } from 'react';
import { AppConfig, showConnect, UserSession } from '@stacks/connect';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function useStacksAuth() {
  const [userData, setUserData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
    ? new StacksMainnet()
    : new StacksTestnet();

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      setUserData(userSession.loadUserData());
      setIsAuthenticated(true);
    }
  }, []);

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'Prompt.Fun',
        icon: typeof window !== 'undefined' ? window.location.origin + '/logo.svg' : '',
      },
      redirectTo: '/',
      onFinish: () => {
        setUserData(userSession.loadUserData());
        setIsAuthenticated(true);
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setUserData(null);
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return {
    userData,
    isAuthenticated,
    connectWallet,
    disconnectWallet,
    userSession,
    network,
  };
}
