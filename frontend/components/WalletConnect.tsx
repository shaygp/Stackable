import { useStacksAuth } from '../hooks/useStacksAuth';

export default function WalletConnect() {
  const { isAuthenticated, userData, connectWallet, disconnectWallet } = useStacksAuth();

  if (isAuthenticated && userData) {
    const address = userData.profile.stxAddress.testnet || userData.profile.stxAddress.mainnet;
    const shortAddress = `${address.slice(0, 6)}...${address.slice(-4)}`;

    return (
      <div className="flex items-center gap-4">
        <div className="bg-stacks-gray border border-stacks-orange/50 rounded-lg py-2 px-4">
          <p className="text-sm text-gray-400">Connected</p>
          <p className="font-mono text-xs text-stacks-white">
            {shortAddress}
          </p>
        </div>
        <button
          onClick={disconnectWallet}
          className="bg-stacks-gray hover:bg-stacks-gray-light text-stacks-white font-bold py-3 px-6 rounded-lg border border-stacks-orange transition-all duration-200"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="bg-stacks-orange hover:bg-stacks-orange-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
    >
      Connect Wallet
    </button>
  );
}
