/**
 * Constantes centralizadas para el proyecto web-customer
 * Todas las constantes de configuración y direcciones de contratos
 */

export const CONTRACTS = {
  ECOMMERCE: typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
    : '',
  USD_TOKEN: typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
    : '',
  EUR_TOKEN: typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
    : '',
} as const;

export const RPC_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545')
  : 'http://localhost:8545';

export const ORACLE_API_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_ORACLE_API_URL || 'http://localhost:3001')
  : 'http://localhost:3001';

