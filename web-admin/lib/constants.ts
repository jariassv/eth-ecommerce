/**
 * Constantes centralizadas para el proyecto web-admin
 * Todas las constantes de configuración y direcciones de contratos
 */

export const CONTRACTS = {
  ECOMMERCE: typeof window !== 'undefined'
    ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
    : '',
} as const;

export const RPC_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545')
  : 'http://localhost:8545';

