'use client';

import { useWallet } from '@/contexts/WalletContext';
import { Button } from './ui/button';
import { FaSignOutAlt as LogOut } from "react-icons/fa";
import { useRouter } from 'next/navigation';

export function WalletButton() {
    const { isAuthenticated, address, connect, disconnect } = useWallet();
    const router = useRouter();

    const handleConnect = async () => {
        try {
            connect();
            router.push('/terminal');
        } catch (error) {
            console.error('Failed to connect to wallet:', error);
        }
    };

    const handleLogout = async () => {
        try {
            disconnect();
            router.push('/');
        } catch (error) {
            console.error('Failed to disconnect wallet:', error);
        }
    };

    if (isAuthenticated && address) {
        return (
            <Button
                onClick={handleLogout}
                variant="default"
                className="gap-2"
            >
                <LogOut className="h-4 w-4" /> {address.slice(0, 6)}...{address.slice(-4)}
            </Button>
        );
    }

    return (
        <Button onClick={handleConnect} variant="outline">
            Connect Wallet
        </Button>
    );
} 