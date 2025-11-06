# Plan de Refactorización - Web Customer

## 🎯 Objetivo

Refactorizar y limpiar el código sin afectar:
- ❌ Funcionalidad existente
- ❌ Diseño/UI
- ❌ Lógica de contratos
- ❌ Interfaz pública de componentes

**Solo se realizará:**
- ✅ Reestructuración interna
- ✅ Eliminación de duplicación
- ✅ Mejora de tipos
- ✅ Organización de código

---

## 📋 Fases del Plan

### FASE 1: Preparación y Utilidades Base (Sin Riesgo)

**Objetivo:** Crear utilidades compartidas que no afecten código existente.

#### 1.1 Crear `lib/constants.ts`
- **Archivo nuevo** - No modifica código existente
- Extraer constantes de entorno
- **Impacto:** Cero (solo creación de archivo)

```typescript
// lib/constants.ts (NUEVO)
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
```

**Verificación:** 
- ✅ Crear archivo
- ✅ No modificar imports existentes todavía
- ✅ Verificar que compila

---

#### 1.2 Crear `lib/logger.ts`
- **Archivo nuevo** - No modifica código existente
- Sistema de logging
- **Impacto:** Cero (solo creación de archivo)

```typescript
// lib/logger.ts (NUEVO)
export const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  info: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info('[INFO]', ...args);
    }
  },
};
```

**Verificación:**
- ✅ Crear archivo
- ✅ No modificar console.log todavía
- ✅ Verificar que compila

---

#### 1.3 Crear `lib/contractHelpers.ts`
- **Archivo nuevo** - Funciones helper puras
- **Impacto:** Cero (solo creación de archivo)

```typescript
// lib/contractHelpers.ts (NUEVO)
import { Product, Invoice, Review } from './contracts';

export function mapRawProductToProduct(rawProduct: any): Product {
  return {
    productId: BigInt(rawProduct.productId.toString()),
    companyId: BigInt(rawProduct.companyId.toString()),
    name: rawProduct.name,
    description: rawProduct.description,
    price: BigInt(rawProduct.price.toString()),
    stock: BigInt(rawProduct.stock.toString()),
    ipfsImageHash: rawProduct.ipfsImageHash || '',
    ipfsAdditionalImages: rawProduct.ipfsAdditionalImages || [],
    totalSales: BigInt(rawProduct.totalSales.toString()),
    isActive: rawProduct.isActive,
  };
}

export function mapRawInvoiceToInvoice(rawInvoice: any): Invoice {
  return {
    invoiceId: BigInt(rawInvoice.invoiceId.toString()),
    companyId: BigInt(rawInvoice.companyId.toString()),
    customerAddress: rawInvoice.customerAddress,
    totalAmount: BigInt(rawInvoice.totalAmount.toString()),
    timestamp: BigInt(rawInvoice.timestamp.toString()),
    isPaid: rawInvoice.isPaid,
    paymentTxHash: rawInvoice.paymentTxHash,
    itemCount: BigInt(rawInvoice.itemCount.toString()),
    paymentToken: rawInvoice.paymentToken || '0x0000000000000000000000000000000000000000',
    expectedTotalUSDT: BigInt(rawInvoice.expectedTotalUSDT?.toString() || '0'),
  };
}

export function mapRawReviewToReview(rawReview: any): Review {
  return {
    reviewId: BigInt(rawReview.reviewId.toString()),
    productId: BigInt(rawReview.productId.toString()),
    customerAddress: rawReview.customerAddress,
    rating: BigInt(rawReview.rating.toString()),
    comment: rawReview.comment,
    timestamp: BigInt(rawReview.timestamp.toString()),
    isVerified: rawReview.isVerified,
  };
}
```

**Verificación:**
- ✅ Crear archivo
- ✅ No modificar uso todavía
- ✅ Verificar que compila
- ✅ Verificar que los tipos coinciden exactamente

---

#### 1.4 Crear `hooks/useIPFSImage.ts`
- **Hook nuevo** - Para reutilizar lógica de imágenes IPFS
- **Impacto:** Cero (solo creación de archivo)

```typescript
// hooks/useIPFSImage.ts (NUEVO)
import { useState, useCallback } from 'react';
import { getIPFSImageUrl, getNextIPFSGateway } from '@/lib/ipfs';
import { logger } from '@/lib/logger';

export function useIPFSImage(hash: string | undefined) {
  const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.target as HTMLImageElement;
    const cleanHash = hash?.trim();
    
    if (!cleanHash) {
      img.src = '/placeholder-product.png';
      return;
    }
    
    const nextGatewayIndex = getNextIPFSGateway(currentGatewayIndex);
    if (nextGatewayIndex === 0) {
      logger.error('Todos los gateways IPFS fallaron para:', cleanHash);
      setImageError(true);
      img.src = '/placeholder-product.png';
      return;
    }
    
    setCurrentGatewayIndex(nextGatewayIndex);
    img.src = getIPFSImageUrl(cleanHash, nextGatewayIndex);
  }, [hash, currentGatewayIndex]);

  const imageUrl = hash && hash.trim() && !imageError
    ? getIPFSImageUrl(hash, currentGatewayIndex)
    : '/placeholder-product.png';

  const reset = useCallback(() => {
    setCurrentGatewayIndex(0);
    setImageError(false);
  }, []);

  return {
    imageUrl,
    handleImageError,
    reset,
    key: `${hash}-${currentGatewayIndex}`, // Para forzar re-render
  };
}
```

**Verificación:**
- ✅ Crear archivo
- ✅ No modificar componentes todavía
- ✅ Verificar que compila

---

#### 1.5 Crear `lib/cartEvents.ts`
- **Utilidad nueva** - Para eventos de carrito
- **Impacto:** Cero (solo creación de archivo)

```typescript
// lib/cartEvents.ts (NUEVO)
export const CART_EVENTS = {
  UPDATED: 'cartUpdated',
} as const;

export function dispatchCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_EVENTS.UPDATED));
  }
}
```

**Verificación:**
- ✅ Crear archivo
- ✅ Verificar que compila

---

### FASE 2: Refactorización de Hooks (Cambios Internos)

#### 2.1 Actualizar `hooks/useEcommerce.ts` - Usar helpers de mapeo

**Cambios:**
1. Importar helpers
2. Reemplazar mapeo inline con funciones helper
3. Mantener misma lógica

**Pasos:**
1. Agregar imports
2. Reemplazar `getAllProducts` - usar `mapRawProductToProduct`
3. Reemplazar `getProduct` - usar `mapRawProductToProduct`
4. Reemplazar `getMyInvoices` - usar `mapRawInvoiceToInvoice`
5. Reemplazar `getInvoice` - usar `mapRawInvoiceToInvoice`
6. Reemplazar `getProductReviews` - usar `mapRawReviewToReview`
7. Reemplazar `getMyReviews` - usar `mapRawReviewToReview`

**Verificación después de cada cambio:**
- ✅ Compila sin errores
- ✅ No hay cambios en interfaz pública
- ✅ Probar en navegador

---

#### 2.2 Usar constantes en `hooks/useEcommerce.ts`

**Cambios:**
- Reemplazar `ECOMMERCE_ADDRESS` local con import de `lib/constants.ts`

**Verificación:**
- ✅ Compila
- ✅ Funciona igual

---

#### 2.3 Usar constantes en `hooks/useTokens.ts`

**Cambios:**
- Reemplazar `USD_TOKEN_ADDRESS`, `EUR_TOKEN_ADDRESS`, `ECOMMERCE_ADDRESS` con imports

**Verificación:**
- ✅ Compila
- ✅ Funciona igual

---

#### 2.4 Reemplazar console.log con logger

**Archivos:**
- `hooks/useEcommerce.ts`
- `hooks/useTokens.ts`
- `lib/exchangeRate.ts`

**Verificación:**
- ✅ Compila
- ✅ Logs funcionan igual en desarrollo

---

### FASE 3: Refactorización de Componentes (Reorganización)

#### 3.1 Usar `useIPFSImage` en `ProductCard.tsx`

**Cambios:**
1. Importar `useIPFSImage`
2. Reemplazar lógica inline con hook
3. Mantener mismo comportamiento

**Ejemplo:**
```typescript
// ANTES
const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
const [imageError, setImageError] = useState(false);
const handleImageError = (e) => { /* ... lógica completa ... */ };
const imageUrl = product.ipfsImageHash && !imageError
  ? getIPFSImageUrl(product.ipfsImageHash, currentGatewayIndex)
  : '/placeholder-product.png';

// DESPUÉS
const { imageUrl, handleImageError, key } = useIPFSImage(product.ipfsImageHash);
```

**Verificación:**
- ✅ Compila
- ✅ UI se ve igual
- ✅ Fallback de imágenes funciona igual

---

#### 3.2 Usar `useIPFSImage` en `ProductDetailModal.tsx`

**Cambios:** Similar a 3.1

**Verificación:**
- ✅ Compila
- ✅ Modal funciona igual
- ✅ Imágenes se cargan igual

---

#### 3.3 Usar `dispatchCartUpdated` en componentes

**Archivos:**
- `components/ProductCard.tsx`
- `app/cart/page.tsx`

**Cambios:**
```typescript
// ANTES
window.dispatchEvent(new CustomEvent('cartUpdated'));

// DESPUÉS
import { dispatchCartUpdated } from '@/lib/cartEvents';
dispatchCartUpdated();
```

**Verificación:**
- ✅ Compila
- ✅ Eventos funcionan igual
- ✅ Contador de carrito se actualiza igual

---

### FASE 4: Mejoras de Tipos (Type Safety)

#### 4.1 Reemplazar `any` en `hooks/useEcommerce.ts`

**Cambios incrementales:**
1. Reemplazar `catch (err: any)` → `catch (err: unknown)`
2. Agregar type guards
3. Mantener mismo manejo de errores

**Verificación después de cada cambio:**
- ✅ Compila
- ✅ Funciona igual
- ✅ Probar con error real

---

#### 4.2 Reemplazar `any` en `hooks/useTokens.ts`

**Cambios:** Similar a 4.1

**Verificación:**
- ✅ Compila
- ✅ Funciona igual

---

### FASE 5: Limpieza Final

#### 5.1 Eliminar código comentado y logs innecesarios

**Solo eliminar:**
- Comentarios obsoletos
- Logs de debug que ya no se usan
- Código comentado

**NO eliminar:**
- Comentarios útiles
- Logs necesarios

---

## 📝 Checklist de Verificación por Fase

### Antes de cada cambio:
- [ ] Hacer commit del estado actual
- [ ] Verificar que todo funciona en navegador
- [ ] Compilar sin errores

### Después de cada cambio:
- [ ] Compila sin errores
- [ ] No hay errores de TypeScript
- [ ] Probar funcionalidad en navegador
- [ ] Verificar que UI se ve igual
- [ ] Verificar que no hay errores en consola
- [ ] Hacer commit si funciona

### Si algo falla:
- [ ] Revertir cambio inmediatamente
- [ ] Analizar qué falló
- [ ] Ajustar plan si es necesario

---

## 🚨 Reglas de Seguridad

### ❌ NO HACER:
1. ❌ Cambiar interfaces públicas de componentes
2. ❌ Cambiar props de componentes
3. ❌ Modificar estilos/CSS/className
4. ❌ Cambiar llamadas a contratos
5. ❌ Cambiar lógica de negocio
6. ❌ Modificar flujos de usuario
7. ❌ Cambiar nombres de funciones exportadas
8. ❌ Cambiar estructura de retorno de hooks
9. ❌ Modificar lógica de conversión de monedas
10. ❌ Cambiar lógica de validación de rate

### ✅ SÍ HACER:
1. ✅ Extraer funciones helper
2. ✅ Reorganizar código en archivos
3. ✅ Mejorar tipos internos
4. ✅ Eliminar duplicación
5. ✅ Crear archivos nuevos
6. ✅ Mejorar nombres de variables internas
7. ✅ Agregar comentarios útiles

---

## 📊 Métricas de Éxito

### Al final de la refactorización:
- ✅ Mismo comportamiento funcional
- ✅ Mismo diseño visual
- ✅ Menos código duplicado
- ✅ Mejor type safety (menos `any`)
- ✅ Código más organizado
- ✅ Sin errores de compilación
- ✅ Sin errores en runtime
- ✅ Carrito funciona igual
- ✅ Conversión de monedas funciona igual
- ✅ Checkout funciona igual

---

## 🗓️ Orden de Ejecución Recomendado

1. **Día 1:** Fase 1 completa (crear utilidades)
2. **Día 2:** Fase 2.1, 2.2, 2.3 (mapeo, constantes, logger)
3. **Día 3:** Fase 2.4 y Fase 3 (logger restante, useIPFSImage, cartEvents)
4. **Día 4:** Fase 4 (tipos)
5. **Día 5:** Fase 5 y verificación final

**Total estimado:** 5 días (con testing exhaustivo)

---

## 🔍 Verificación Final

Después de completar todas las fases:

1. **Pruebas funcionales:**
   - [ ] Ver productos
   - [ ] Agregar al carrito
   - [ ] Ver carrito
   - [ ] Cambiar cantidad
   - [ ] Remover del carrito
   - [ ] Cambiar moneda (USDT/EURT)
   - [ ] Ver conversión de precios
   - [ ] Procesar checkout
   - [ ] Ver pedidos
   - [ ] Agregar review

2. **Verificación visual:**
   - [ ] Todas las páginas se ven igual
   - [ ] No hay cambios en estilos
   - [ ] Responsive funciona igual
   - [ ] Imágenes IPFS se cargan igual
   - [ ] Fallback de imágenes funciona

3. **Verificación de código:**
   - [ ] No hay errores de TypeScript
   - [ ] No hay warnings relevantes
   - [ ] Código más limpio y organizado

---

## 🎯 Consideraciones Especiales

### Multi-currency
- ⚠️ **CRÍTICO:** No modificar lógica de conversión
- ⚠️ **CRÍTICO:** No modificar validación de rate
- ⚠️ Solo refactorizar código que no afecte estas funcionalidades

### Carrito en Blockchain
- ⚠️ **CRÍTICO:** No modificar llamadas a contrato
- ⚠️ Solo refactorizar código de presentación

### Imágenes IPFS
- ⚠️ Asegurar que fallback funciona igual
- ⚠️ No cambiar lógica de gateways

---

## 📚 Notas

- **Incremental:** Cada cambio es pequeño y seguro
- **Reversible:** Cada cambio puede revertirse fácilmente
- **Testeable:** Verificar después de cada cambio
- **Conservador:** Si hay duda, no cambiar
- **Especial cuidado con:** Conversión de monedas, validación de rate, carrito

---

**Última actualización:** $(date)

