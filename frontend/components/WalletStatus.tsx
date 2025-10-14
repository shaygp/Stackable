'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useEffect, useState } from 'react';

export function WalletStatus() {
    const { account, connected, wallets, signAndSubmitTransaction } = useWallet();
    const [walletDetectionStatus, setWalletDetectionStatus] = useState<string>('Checking...');
    const [windowAptos, setWindowAptos] = useState<boolean>(false);

    const formatAddress = (addr: any) => {
        if (!addr) return 'N/A';
        const addressStr = typeof addr === 'string' ? addr : addr.toString();
        return `${addressStr.slice(0, 6)}...${addressStr.slice(-4)}`;
    };

    useEffect(() => {
        // Check if window.aptos exists (Petra wallet)
        const checkWindowAptos = () => {
            if (typeof window !== 'undefined') {
                setWindowAptos(!!(window as any).aptos);
            }
        };

        // Check wallet detection status
        const checkWalletDetection = () => {
            if (wallets && Array.isArray(wallets) && wallets.length > 0) {
                const walletNames = wallets.map(w => w?.name || 'Unknown').filter(Boolean);
                setWalletDetectionStatus(`Detected ${wallets.length} wallet(s): ${walletNames.join(', ')}`);
            } else {
                setWalletDetectionStatus('No wallets detected');
            }
        };

        // Initial check
        checkWindowAptos();
        checkWalletDetection();

        // Re-check after a delay to allow extensions to load
        const timer = setTimeout(() => {
            checkWindowAptos();
            checkWalletDetection();
        }, 1000);

        return () => clearTimeout(timer);
    }, [wallets]);

    try {
        return (
            <div className="p-4 border rounded-lg bg-gray-50 border-gray-200 mb-4">
                <h3 className="font-medium text-gray-800 mb-2">Wallet Detection Debug</h3>
                <div className="text-sm text-gray-600 space-y-1">
                    <div>• Wallet Detection: {walletDetectionStatus}</div>
                    <div>• Window.aptos (Petra): {windowAptos ? 'Available' : 'Not available'}</div>
                    <div>• Connected: {connected ? 'Yes' : 'No'}</div>
                    <div>• Account: {account ? `Available (${formatAddress(account.address)})` : 'Not available'}</div>
                    <div>• Transaction Function: {typeof signAndSubmitTransaction === 'function' ? 'Available' : 'Not available'}</div>
                    <div>• Document Ready: {typeof document !== 'undefined' ? document.readyState : 'N/A'}</div>
                </div>
                
                {wallets?.length === 0 && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-yellow-800 text-sm">
                            <strong>No wallets detected.</strong> Please:
                            <ul className="mt-1 space-y-1">
                                <li>• Install Petra wallet extension from Chrome Web Store</li>
                                <li>• Enable the extension in your browser</li>
                                <li>• Refresh this page after installation</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error('Error in WalletStatus component:', error);
        return (
            <div className="p-4 border rounded-lg bg-red-50 border-red-200 mb-4">
                <h3 className="font-medium text-red-800 mb-2">Wallet Status Error</h3>
                <div className="text-sm text-red-600">
                    Error displaying wallet status. Please check the console for details.
                </div>
            </div>
        );
    }
} 