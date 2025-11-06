'use client';

import { useTokens, SupportedCurrency } from '@/hooks/useTokens';
import { useWallet } from '@/hooks/useWallet';
import { formatTokenAmount } from '@/lib/ethers';
import BuyTokensButton from './BuyTokensButton';

interface CurrencySelectorProps {
  selectedCurrency: SupportedCurrency;
  onCurrencyChange: (currency: SupportedCurrency) => void;
  requiredAmount?: bigint;
  showBalance?: boolean;
}

export default function CurrencySelector({
  selectedCurrency,
  onCurrencyChange,
  requiredAmount,
  showBalance = true,
}: CurrencySelectorProps) {
  const { provider, address } = useWallet();
  const { tokens, loading, getSelectedToken, loadTokens } = useTokens(provider, address);

  const selectedToken = getSelectedToken();
  const usdtToken = tokens.get('USDT');
  const eurtToken = tokens.get('EURT');

  if (!address) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          Conecta tu wallet para seleccionar una moneda de pago
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Moneda de Pago
        </label>
        <div className="grid grid-cols-2 gap-3">
          {/* USDT Option */}
          <div
            onClick={() => {
              if (usdtToken) {
                onCurrencyChange('USDT');
              }
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedCurrency === 'USDT'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${!usdtToken ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">USDT</span>
              {selectedCurrency === 'USDT' && (
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {showBalance && usdtToken && (
              <div className="text-sm text-gray-600">
                <p>Balance: <span className="font-semibold">{usdtToken.balanceFormatted}</span></p>
                {requiredAmount !== undefined && (
                  <p className={`mt-1 ${usdtToken.balance >= requiredAmount ? 'text-green-600' : 'text-red-600'}`}>
                    {usdtToken.balance >= requiredAmount ? '✓ Saldo suficiente' : '✗ Saldo insuficiente'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* EURT Option */}
          <div
            onClick={() => {
              if (eurtToken) {
                onCurrencyChange('EURT');
              }
            }}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedCurrency === 'EURT'
                ? 'border-indigo-600 bg-indigo-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${!eurtToken ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">EURT</span>
              {selectedCurrency === 'EURT' && (
                <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
            </div>
            {showBalance && eurtToken && (
              <div className="text-sm text-gray-600">
                <p>Balance: <span className="font-semibold">{eurtToken.balanceFormatted}</span></p>
                {requiredAmount !== undefined && (
                  <p className={`mt-1 ${eurtToken.balance >= requiredAmount ? 'text-green-600' : 'text-red-600'}`}>
                    {eurtToken.balance >= requiredAmount ? '✓ Saldo suficiente' : '✗ Saldo insuficiente'}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {selectedToken && requiredAmount !== undefined && (
        <div className="space-y-2">
          {(() => {
            // Calcular directamente si hay suficiente balance
            const hasSufficientBalance = selectedToken.balance >= requiredAmount;
            const needsApproval = selectedToken.allowance < requiredAmount;
            
            return (
              <>
                {!hasSufficientBalance && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Saldo insuficiente:</strong> Necesitas {formatTokenAmount(requiredAmount, selectedToken.decimals)} {selectedCurrency} 
                      pero tienes {selectedToken.balanceFormatted} {selectedCurrency}
                    </p>
                  </div>
                )}
                {needsApproval && hasSufficientBalance && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Aprobación necesaria:</strong> Necesitas aprobar el contrato para gastar {selectedCurrency}
                    </p>
                  </div>
                )}
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

