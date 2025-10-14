'use client';

import { PropsWithChildren, createContext, useContext, useState, useEffect } from "react";
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { StacksTestnet, StacksMainnet } from '@stacks/network';

interface WalletContextType {
  userSession: UserSession;
  userData: any;
  isAuthenticated: boolean;
  connect: () => void;
  disconnect: () => void;
  address: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

const appConfig = new AppConfig(['store_write', 'publish_data']);
const userSession = new UserSession({ appConfig });

export function WalletProvider({ children }: PropsWithChildren) {
  const [userData, setUserData] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [address, setAddress] = useState<string | null>(null);

  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const data = userSession.loadUserData();
      setUserData(data);
      setIsAuthenticated(true);
      const addr = data?.profile?.stxAddress?.testnet || data?.profile?.stxAddress?.mainnet;
      setAddress(addr || null);
    }
  }, []);

  const connect = () => {
    const network = process.env.NEXT_PUBLIC_NETWORK === 'mainnet'
      ? new StacksMainnet()
      : new StacksTestnet();

    showConnect({
      appDetails: {
        name: 'Prompt.Fun',
        icon: typeof window !== 'undefined' ? window.location.origin + '/icon.png' : '',
      },
      network,
      onFinish: () => {
        const data = userSession.loadUserData();
        setUserData(data);
        setIsAuthenticated(true);
        const addr = data?.profile?.stxAddress?.testnet || data?.profile?.stxAddress?.mainnet;
        setAddress(addr || null);
      },
      userSession,
    });
  };

  const disconnect = () => {
    userSession.signUserOut();
    setUserData(null);
    setIsAuthenticated(false);
    setAddress(null);
  };

  return (
    <WalletContext.Provider value={{ userSession, userData, isAuthenticated, connect, disconnect, address }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
} 