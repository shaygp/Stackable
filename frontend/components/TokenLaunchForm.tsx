import { useState } from 'react';
import { useBondingCurve } from '../hooks/useBondingCurve';

export default function TokenLaunchForm() {
  const [symbol, setSymbol] = useState('');
  const [basePrice, setBasePrice] = useState('1000');
  const [curveType, setCurveType] = useState('0');
  const { launchToken, loading, error } = useBondingCurve();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await launchToken(
      symbol,
      parseInt(basePrice),
      parseInt(curveType),
      10,
      1000000,
      100000000
    );
  };

  return (
    <form onSubmit={handleSubmit} className="bg-stacks-gray border border-stacks-orange/30 rounded-xl p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-stacks-orange to-bitcoin-orange bg-clip-text text-transparent">
        Launch Token
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-stacks-white">
            Token Symbol
          </label>
          <input
            type="text"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value.toUpperCase())}
            maxLength={10}
            className="w-full px-4 py-2 rounded-lg bg-stacks-black border border-stacks-orange/50 focus:border-stacks-orange outline-none transition-colors text-stacks-white"
            placeholder="MOON"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-stacks-white">
            Base Price (micro-STX)
          </label>
          <input
            type="number"
            value={basePrice}
            onChange={(e) => setBasePrice(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-stacks-black border border-stacks-orange/50 focus:border-stacks-orange outline-none transition-colors text-stacks-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-stacks-white">
            Curve Type
          </label>
          <select
            value={curveType}
            onChange={(e) => setCurveType(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-stacks-black border border-stacks-orange/50 focus:border-stacks-orange outline-none transition-colors text-stacks-white"
          >
            <option value="0">Linear</option>
            <option value="1">Exponential</option>
            <option value="2">Logarithmic</option>
            <option value="3">Sigmoid</option>
          </select>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 border border-red-500">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-stacks-orange hover:bg-stacks-orange-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Launching...' : 'Launch Token'}
        </button>
      </div>
    </form>
  );
}
