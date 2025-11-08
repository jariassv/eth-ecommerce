/**
 * Configuración centralizada para la pasarela de pago.
 * Todas las URL deben provenir de variables de entorno para facilitar cambios.
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
  'http://localhost:6002'
);

export const BUY_TOKENS_URL = withFallback(
  getEnv('NEXT_PUBLIC_BUY_TOKENS_URL') ?? getEnv('BUY_TOKENS_URL'),
  'http://localhost:6001'
);


