'use client';

import Link from 'next/link';
import { SupportedCurrency } from '@/hooks/useTokens';
import { BUY_TOKENS_URL } from '@/lib/constants';

interface BuyTokensButtonProps {
  currency: SupportedCurrency;
  className?: string;
}

export default function BuyTokensButton({ currency, className = '' }: BuyTokensButtonProps) {

  return (
    <Link
      href={BUY_TOKENS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all transform hover:scale-105 shadow-md hover:shadow-lg ${className}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>Comprar {currency}</span>
    </Link>
  );
}

