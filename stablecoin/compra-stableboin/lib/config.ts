/**
 * Centraliza el acceso a variables de entorno, aplicando defaults amigables
 * para desarrollo. De esta manera evitamos tener URLs hardcodeadas en el código.
 */

const getEnv = (key: string): string | undefined => {
  if (typeof process === 'undefined') {
    return undefined;
  }
  return process.env[key];
};

const withFallback = (value: string | undefined, fallback: string) =>
  value && value.trim() !== '' ? value : fallback;

export const RPC_URL = withFallback(
  getEnv('NEXT_PUBLIC_RPC_URL') ?? getEnv('RPC_URL'),
  'http://localhost:8545'
);

export const APP_URL = withFallback(
  getEnv('NEXT_PUBLIC_APP_URL') ?? getEnv('APP_URL'),
  'http://localhost:6001'
);

export const PAYMENT_GATEWAY_URL = withFallback(
  getEnv('NEXT_PUBLIC_PAYMENT_GATEWAY_URL') ?? getEnv('PAYMENT_GATEWAY_URL'),
  'http://localhost:6002'
);

export const USD_TOKEN_ADDRESS = withFallback(
  getEnv('NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS'),
  ''
);

export const EUR_TOKEN_ADDRESS = withFallback(
  getEnv('NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS'),
  ''
);


