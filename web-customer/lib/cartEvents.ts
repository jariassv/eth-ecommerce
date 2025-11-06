/**
 * Eventos del carrito centralizados
 * Proporciona funciones para disparar eventos de actualización del carrito
 */

export const CART_EVENTS = {
  UPDATED: 'cartUpdated',
} as const;

/**
 * Dispara un evento de actualización del carrito
 * Útil para sincronizar el contador del carrito entre componentes
 */
export function dispatchCartUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_EVENTS.UPDATED));
  }
}

