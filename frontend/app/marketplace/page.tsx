"use client";

import Layout from '../../components/Layout';
import TokenCard from '../../components/TokenCard';

export default function Marketplace() {
  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Token Marketplace
          </h1>
          <p className="text-xl text-gray-400">
            Discover and trade tokens on the bonding curve
          </p>
        </div>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search tokens..."
            className="w-full px-6 py-4 rounded-lg bg-stacks-gray border border-stacks-orange/50 focus:border-stacks-orange outline-none transition-colors text-stacks-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <TokenCard symbol="MOON" />
          <TokenCard symbol="PEPE" />
          <TokenCard symbol="DOGE" />
          <TokenCard symbol="BONK" />
          <TokenCard symbol="WIF" />
          <TokenCard symbol="SHIB" />
        </div>
      </div>
    </Layout>
  );
}
