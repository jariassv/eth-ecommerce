/**
 * Centraliza el acceso a variables de entorno, aplicando defaults amigables
 * para desarrollo. Las referencias utilizan acceso directo para que Next.js
 * pueda reemplazarlas en tiempo de compilación.
 */

const withFallback = (value: string | undefined, fallback: string) =>
  value && value.trim() !== '' ? value : fallback;

export const RPC_URL = withFallback(
  process.env.NEXT_PUBLIC_RPC_URL ?? process.env.RPC_URL,
  'http://localhost:8545'
);

export const APP_URL = withFallback(
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL,
  'http://localhost:6001'
);

export const PAYMENT_GATEWAY_URL = withFallback(
  process.env.NEXT_PUBLIC_PAYMENT_GATEWAY_URL ?? process.env.PAYMENT_GATEWAY_URL,
  'http://localhost:6002'
);

export const USD_TOKEN_ADDRESS = withFallback(
  process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS,
  ''
);

export const EUR_TOKEN_ADDRESS = withFallback(
  process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS,
  ''
);


