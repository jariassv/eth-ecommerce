/**
 * Lista de gateways IPFS como fallback
 */
const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://ipfs.io/ipfs',
  'https://dweb.link/ipfs',
];

/**
 * Función helper para obtener URL de imagen IPFS
 */
export function getIPFSImageUrl(hash: string, gatewayIndex: number = 0): string {
  if (!hash) return '';
  
  // Limpiar el hash (eliminar espacios, saltos de línea, etc.)
  const cleanHash = hash.trim();
  
  // Si el hash ya tiene el prefijo /ipfs/, removerlo
  let hashOnly = cleanHash;
  if (cleanHash.startsWith('/ipfs/')) {
    hashOnly = cleanHash.replace('/ipfs/', '');
  } else if (cleanHash.startsWith('ipfs://')) {
    hashOnly = cleanHash.replace('ipfs://', '');
  }
  
  // Usar el gateway especificado (por defecto el primero)
  const gateway = IPFS_GATEWAYS[gatewayIndex] || IPFS_GATEWAYS[0];
  return `${gateway}/${hashOnly}`;
}

/**
 * Obtener el siguiente gateway IPFS como fallback
 */
export function getNextIPFSGateway(currentIndex: number): number {
  return (currentIndex + 1) % IPFS_GATEWAYS.length;
}


