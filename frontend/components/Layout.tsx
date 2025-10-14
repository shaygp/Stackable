import WalletConnect from './WalletConnect';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-stacks-black">
      <header className="border-b border-stacks-orange/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-stacks-orange rounded-lg flex items-center justify-center text-2xl">
              P
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-stacks-orange to-bitcoin-orange bg-clip-text text-transparent">
              Stackable
            </h1>
          </div>

          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-stacks-white hover:text-stacks-orange transition-colors">
              Launch
            </Link>
            <Link href="/marketplace" className="text-stacks-white hover:text-stacks-orange transition-colors">
              Marketplace
            </Link>
            <Link href="/terminal" className="text-stacks-white hover:text-stacks-orange transition-colors">
              Terminal
            </Link>
            <Link href="/templates" className="text-stacks-white hover:text-stacks-orange transition-colors">
              Templates
            </Link>
            <Link href="/profile" className="text-stacks-white hover:text-stacks-orange transition-colors">
              Profile
            </Link>
          </nav>
          <WalletConnect />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="border-t border-stacks-orange/30 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-gray-400">
          <p className="mb-2 text-stacks-white">
            Built on Stacks - Secured by Bitcoin
          </p>
          <p className="text-sm">
            Clarity is production ready. Bitcoin is the foundation.
          </p>
        </div>
      </footer>
    </div>
  );
}
