import { useTokenSupply, useCurveInfo } from '../hooks/useContractRead';
import { useBondingCurve } from '../hooks/useBondingCurve';

interface TokenCardProps {
  symbol: string;
}

export default function TokenCard({ symbol }: TokenCardProps) {
  const { data: supply } = useTokenSupply(symbol);
  const { data: curveInfo } = useCurveInfo(symbol);
  const { buyToken, loading } = useBondingCurve();

  const handleBuy = () => {
    buyToken(symbol, 100, 1000);
  };

  const curveTypes = ['Linear', 'Exp', 'Log', 'Sigmoid'];

  return (
    <div className="bg-stacks-gray border border-stacks-orange/30 rounded-xl p-6 hover:border-stacks-orange/60 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-stacks-orange to-bitcoin-orange bg-clip-text text-transparent">
            ${symbol}
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Supply: {supply?.value || 0}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-stacks-orange">
            {curveInfo?.value?.['base-price']?.value || 0} STX
          </p>
          <p className="text-xs text-gray-400">Base Price</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-stacks-black/50 rounded-lg p-3">
          <p className="text-xs text-gray-400">Reserve</p>
          <p className="font-bold text-stacks-white">
            {curveInfo?.value?.['reserve-balance']?.value || 0}
          </p>
        </div>
        <div className="bg-stacks-black/50 rounded-lg p-3">
          <p className="text-xs text-gray-400">Type</p>
          <p className="font-bold text-stacks-white">
            {curveTypes[curveInfo?.value?.['curve-type']?.value || 0]}
          </p>
        </div>
      </div>

      <button
        onClick={handleBuy}
        disabled={loading}
        className="bg-stacks-orange hover:bg-stacks-orange-dark text-white font-bold py-3 px-6 rounded-lg transition-all duration-200 w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Buying...' : 'Buy Tokens'}
      </button>
    </div>
  );
}
