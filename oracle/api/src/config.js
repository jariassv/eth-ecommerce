const normalize = (value, fallback) =>
  value && value.trim() !== '' ? value : fallback;

export const RPC_URL = normalize(process.env.RPC_URL, 'http://localhost:8545');

