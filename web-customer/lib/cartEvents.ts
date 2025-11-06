/**
 * Eventos del carrito centralizados
 * Proporciona funciones para disparar eventos de actualización del carrito y balance
 */

export const CART_EVENTS = {
  UPDATED: 'cartUpdated',
  TOKEN_BALANCE_UPDATED: 'tokenBalanceUpdated',
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

/**
 * Dispara un evento de actualización del balance de tokens
 * Útil para notificar que el balance de tokens ha cambiado y necesita recargarse
 */
export function dispatchTokenBalanceUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_EVENTS.TOKEN_BALANCE_UPDATED));
  }
}

