'use client';

import { useExchangeRate } from '@/hooks/useExchangeRate';
import { convertEURTtoUSDT, convertUSDTtoEURT } from '@/lib/exchangeRate';
import { formatTokenAmount } from '@/lib/ethers';
import { SupportedCurrency } from '@/hooks/useTokens';

interface PriceConverterProps {
  amount: bigint; // Amount in USDT (base currency, 6 decimals)
  fromCurrency?: SupportedCurrency; // Currency to display (default: USDT)
  showEquivalent?: boolean; // Show equivalent in other currency
  decimals?: number;
}

export default function PriceConverter({
  amount,
  fromCurrency = 'USDT',
  showEquivalent = true,
  decimals = 6,
}: PriceConverterProps) {
  const { rate, rateInfo, loading, error } = useExchangeRate();

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-600">
        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Cargando conversión...</span>
      </div>
    );
  }

  if (error || !rate || !rateInfo) {
    // Si no hay rate, mostrar solo en USDT
    return (
      <div>
        <span className="font-semibold text-gray-900">
          {formatTokenAmount(amount, decimals)} USDT
        </span>
        {error && (
          <p className="text-xs text-yellow-600 mt-1">
            ⚠ Conversión no disponible
          </p>
        )}
      </div>
    );
  }

  // Validar rate
  const rateValid = rateInfo.isValid && rateInfo.isFresh;
  if (!rateValid) {
    return (
      <div>
        <span className="font-semibold text-gray-900">
          {formatTokenAmount(amount, decimals)} USDT
        </span>
        <p className="text-xs text-yellow-600 mt-1">
          ⚠ Rate no disponible o desactualizado
        </p>
      </div>
    );
  }

  // Calcular conversión
  let displayAmount = amount;
  let displayCurrency: SupportedCurrency = 'USDT';
  let equivalentAmount: bigint | null = null;
  let equivalentCurrency: SupportedCurrency = 'EURT';

  if (fromCurrency === 'EURT') {
    // Convertir de USDT a EURT para mostrar
    equivalentAmount = amount;
    equivalentCurrency = 'USDT';
    displayAmount = convertUSDTtoEURT(amount, rate);
    displayCurrency = 'EURT';
  } else {
    // Mostrar en USDT, equivalente en EURT
    equivalentAmount = convertUSDTtoEURT(amount, rate);
  }

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          {formatTokenAmount(displayAmount, decimals)}
        </span>
        <span className="text-sm font-semibold text-gray-600">{displayCurrency}</span>
      </div>
      {showEquivalent && equivalentAmount !== null && (
        <div className="text-sm text-gray-500">
          ≈ {formatTokenAmount(equivalentAmount, decimals)} {equivalentCurrency}
          <span className="ml-2 text-xs text-gray-400">
            (1 EUR = {rate.toFixed(4)} USD)
          </span>
        </div>
      )}
    </div>
  );
}

