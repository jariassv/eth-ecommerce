/**
 * Configuración centralizada para la pasarela de pago.
 * Todas las URL deben provenir de variables de entorno para facilitar cambios.
 */

const withFallback = (value: string | undefined, fallback: string) =>
  value && value.trim() !== '' ? value : fallback;

export const RPC_URL = withFallback(
  process.env.NEXT_PUBLIC_RPC_URL ?? process.env.RPC_URL,
  'http://localhost:8545'
);

export const APP_URL = withFallback(
  process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL,
  'http://localhost:6002'
);

export const BUY_TOKENS_URL = withFallback(
  process.env.NEXT_PUBLIC_BUY_TOKENS_URL ?? process.env.BUY_TOKENS_URL,
  'http://localhost:6001'
);


