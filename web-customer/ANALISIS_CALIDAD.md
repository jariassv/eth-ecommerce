# Análisis de Calidad de Código - Web Customer

## 📋 Resumen Ejecutivo

Este documento analiza la calidad del código del proyecto **web-customer**, identificando áreas de mejora, código repetido, inconsistencias y oportunidades de refactorización siguiendo estándares profesionales.

**Proyecto:** Web Customer Portal  
**Versión:** develop  
**Fecha de Análisis:** $(date)  
**Objetivo:** Portal de cliente para compra de productos, gestión de carrito y pedidos

---

## 📊 Métricas Generales

### Archivos Analizados
- **Hooks:** 4 archivos (useEcommerce.ts, useWallet.ts, useTokens.ts, useExchangeRate.ts)
- **Componentes:** 9 archivos (Header, ProductCard, ProductDetailModal, ProductFilters, ProductReviews, CartPreviewModal, FloatingCartButton, CurrencySelector, PriceConverter)
- **Librerías:** 4 archivos (contracts.ts, ethers.ts, ipfs.ts, exchangeRate.ts)
- **Páginas:** 3 archivos (page.tsx, cart/page.tsx, orders/page.tsx)
- **API Routes:** 1 archivo (rpc/route.ts)

### Líneas de Código
- **Total:** ~3,500 líneas
- **Hooks:** ~1,100 líneas
- **Componentes:** ~1,800 líneas
- **Librerías:** ~300 líneas

---

## 🔍 1. Código Duplicado Interno

### 1.1 Manejo de Imágenes IPFS - Repetido en Múltiples Componentes

**Ubicación:**
- `components/ProductCard.tsx:31-55` - Lógica de fallback de gateway
- `components/ProductDetailModal.tsx:65-90` - Misma lógica
- `components/ProductReviews.tsx` - Posiblemente similar

**Problema:**
```typescript
// Repetido en múltiples lugares
const [currentGatewayIndex, setCurrentGatewayIndex] = useState(0);
const [imageError, setImageError] = useState(false);

const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const img = e.target as HTMLImageElement;
  const hash = product.ipfsImageHash?.trim();
  
  if (!hash) {
    img.src = '/placeholder-product.png';
    return;
  }
  
  const nextGatewayIndex = getNextIPFSGateway(currentGatewayIndex);
  if (nextGatewayIndex === 0) {
    console.error('Todos los gateways IPFS fallaron para:', hash);
    setImageError(true);
    img.src = '/placeholder-product.png';
    return;
  }
  
  setCurrentGatewayIndex(nextGatewayIndex);
  img.src = getIPFSImageUrl(hash, nextGatewayIndex);
};
```

**Solución Recomendada:**
```typescript
// hooks/useIPFSImage.ts
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

  return {
    imageUrl,
    handleImageError,
    reset: () => {
      setCurrentGatewayIndex(0);
      setImageError(false);
    },
  };
}
```

### 1.2 Mapeo de Productos - Lógica Duplicada

**Ubicación:**
- `hooks/useEcommerce.ts:86-97` - getAllProducts
- `hooks/useEcommerce.ts:106-131` - getProduct

**Problema:** Mismo patrón de mapeo repetido

**Solución:** Extraer a función helper (similar a web-admin)

### 1.3 Mapeo de Facturas - Lógica Duplicada

**Ubicación:**
- `hooks/useEcommerce.ts:380-391` - getMyInvoices
- `hooks/useEcommerce.ts:401-426` - getInvoice

**Problema:** Mapeo repetitivo

**Solución:** Extraer a función helper

### 1.4 Mapeo de Reviews - Lógica Duplicada

**Ubicación:**
- `hooks/useEcommerce.ts:519-527` - getProductReviews
- `hooks/useEcommerce.ts:546-554` - getMyReviews

**Problema:** Mismo mapeo en dos funciones

**Solución:** Extraer a función helper

### 1.5 Manejo de Eventos de Carrito - Repetido

**Ubicación:**
- `components/ProductCard.tsx:84` - `window.dispatchEvent(new CustomEvent('cartUpdated'))`
- `app/cart/page.tsx:364` - Mismo evento
- Potencialmente en otros lugares

**Problema:** Lógica de eventos dispersa

**Solución:**
```typescript
// lib/cartEvents.ts
export const CART_EVENTS = {
  UPDATED: 'cartUpdated',
} as const;

export function dispatchCartUpdated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CART_EVENTS.UPDATED));
  }
}
```

---

## 🏗️ 2. Estructura y Organización

### 2.1 ✅ Aspectos Positivos

1. **Buen número de componentes reutilizables**
   - ProductCard, ProductDetailModal, PriceConverter, CurrencySelector
   - Separación clara de responsabilidades

2. **Hooks bien organizados**
   - useTokens, useExchangeRate separados
   - Responsabilidades claras

3. **Librerías bien estructuradas**
   - exchangeRate.ts, ipfs.ts separados
   - Funciones específicas

### 2.2 ⚠️ Áreas de Mejora

#### **A. Hook useEcommerce - Muy Grande**

**Problema:** 616 líneas, 18 funciones

**Métricas:**
- Complejidad ciclomática muy alta
- Múltiples responsabilidades (productos, carrito, facturas, reviews)
- Difícil de mantener y testear

**Solución Recomendada:**
```typescript
// Dividir en hooks más pequeños
hooks/
  useEcommerce.ts (orquestador)
  useProducts.ts (productos)
  useCart.ts (carrito)
  useInvoices.ts (facturas)
  useReviews.ts (reviews)
```

#### **B. Constantes Dispersas**

**Problema:**
```typescript
// Repetido en múltiples archivos
const USD_TOKEN_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '')
  : '';

const EUR_TOKEN_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '')
  : '';

const ECOMMERCE_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
  : '';
```

**Solución:**
```typescript
// lib/constants.ts
export const CONTRACTS = {
  ECOMMERCE: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '',
  USD_TOKEN: process.env.NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS || '',
  EUR_TOKEN: process.env.NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS || '',
} as const;

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
export const ORACLE_API_URL = process.env.NEXT_PUBLIC_ORACLE_API_URL || 'http://localhost:3001';
```

#### **C. Componente CartPage - Demasiado Grande**

**Problema:** 449 líneas, múltiples responsabilidades

**Responsabilidades:**
- Carga de carrito
- Gestión de productos
- Gestión de tokens
- Validación de rate
- Proceso de checkout
- UI compleja

**Solución Recomendada:**
```typescript
// Dividir en componentes más pequeños
components/
  CartPage/
    CartPage.tsx (orquestador)
    CartItemList.tsx
    CartSummary.tsx
    CheckoutButton.tsx
hooks/
  useCart.ts (lógica de carrito)
  useCheckout.ts (lógica de checkout)
```

---

## 📝 3. Estándares de Código

### 3.1 TypeScript

#### **A. Uso de `any`**

**Encontrado:** ~20 ocurrencias de `any`

**Ejemplos:**
```typescript
// hooks/useEcommerce.ts:98
catch (err: any) {
  setError(err.message || 'Error al obtener productos');
}

// hooks/useTokens.ts:173
catch (err: any) {
  console.error('Error loading tokens:', err);
}
```

**Solución:** Reemplazar con `unknown` y type guards

#### **B. Tipos Inconsistentes para getProductAverageRating**

**Problema:**
```typescript
// hooks/useEcommerce.ts:572-574
const result = await contract.getProductAverageRating(productId);
return {
  averageRating: BigInt(result[0].toString()),
  reviewCount: BigInt(result[1].toString()),
};
```

**Problema:** Asume que retorna array, pero el ABI puede retornar tuple nombrado

**Solución:** Verificar ABI y usar tipo correcto

### 3.2 Manejo de Errores

#### **A. Inconsistencia en Manejo de Errores**

**Problema:** Diferentes estrategias

```typescript
// Algunos lugares: alert
alert(err.message || 'Error al agregar al carrito');

// Otros lugares: setError
setError(err.message || 'Error al cargar carrito');

// Otros lugares: console.error
console.error('Error loading product:', err);
```

**Solución:** Unificar estrategia
- Errores de usuario: mostrar en UI (toast/notification)
- Errores de sistema: loggear y mostrar mensaje genérico

#### **B. Errores Silenciados en Header**

**Problema:**
```typescript
// components/Header.tsx:52-55
catch (err) {
  // Ignorar errores si no hay items o contrato no está listo
  setCartCount(0);
}
```

**Solución:** Al menos loggear en desarrollo

### 3.3 Logging

#### **A. Console.log en Producción**

**Encontrado:** 51 ocurrencias de `console.log/error/warn`

**Problema:**
```typescript
// hooks/useEcommerce.ts:163-167
console.log('Agregando al carrito:', { productId, quantity });
console.log('Transacción enviada:', tx.hash);
console.log('Transacción confirmada:', receipt);
```

**Solución:** Implementar sistema de logging (similar a web-admin)

### 3.4 React Hooks

#### **A. Dependencias de useEffect**

**⚠️ Problema:**
```typescript
// app/cart/page.tsx:153
useEffect(() => {
  if (address && isReady && total > 0n) {
    loadTokens(total, rate);
  }
}, [selectedCurrency, rate, total, address, isReady, loadTokens]);
// ⚠️ loadTokens puede cambiar en cada render
```

**Solución:**
```typescript
const loadTokensWithAmount = useCallback(async () => {
  if (selectedCurrency === 'EURT' && rate) {
    const requiredAmountEURT = convertUSDTtoEURT(total, rate);
    await loadTokens(total, rate);
  } else {
    await loadTokens(total, rate);
  }
}, [selectedCurrency, rate, total, loadTokens]);

useEffect(() => {
  if (address && isReady && total > 0n) {
    loadTokensWithAmount();
  }
}, [address, isReady, total, loadTokensWithAmount]);
```

#### **B. Estados Múltiples Relacionados**

**Problema:**
```typescript
// app/cart/page.tsx
const [cartItems, setCartItems] = useState<CartItem[]>([]);
const [products, setProducts] = useState<Map<string, Product>>(new Map());
const [total, setTotal] = useState<bigint>(0n);
const [processing, setProcessing] = useState(false);
const [error, setError] = useState<string | null>(null);
const [loadingCart, setLoadingCart] = useState(true);
const [approving, setApproving] = useState(false);
```

**Solución:** Considerar usar reducer o hook personalizado

---

## 🎯 4. Problemas Específicos

### 4.1 Lógica de Checkout Compleja

**Problema:** `app/cart/page.tsx:193-283` - 90 líneas de lógica compleja

**Responsabilidades mezcladas:**
- Validación de rate
- Validación de balance
- Aprobación de tokens
- Creación de invoice
- Redirección a pasarela

**Solución Recomendada:**
```typescript
// hooks/useCheckout.ts
export function useCheckout() {
  const { createInvoiceWithCurrency, clearCart, getCompany } = useEcommerce();
  const { getSelectedToken, approveToken } = useTokens();
  const { rateInfo } = useExchangeRate();
  
  const checkout = useCallback(async (params: {
    cartItems: CartItem[];
    products: Map<string, Product>;
    total: bigint;
    selectedCurrency: SupportedCurrency;
  }) => {
    // Validar rate
    if (!rateInfo?.isValid || !rateInfo?.isFresh) {
      throw new Error('Rate no disponible');
    }
    
    // Validar balance
    const selectedToken = getSelectedToken();
    if (!selectedToken || selectedToken.balance < params.requiredAmount) {
      throw new Error('Saldo insuficiente');
    }
    
    // Aprobar si es necesario
    if (selectedToken.needsApproval) {
      await approveToken(params.selectedCurrency, params.requiredAmount);
    }
    
    // Crear invoice
    const { invoiceId, totalAmount } = await createInvoiceWithCurrency(
      params.companyId,
      params.paymentToken,
      params.total
    );
    
    // Limpiar carrito
    await clearCart();
    
    // Redirigir
    return buildPaymentGatewayUrl({
      invoiceId,
      totalAmount,
      merchantAddress: params.merchantAddress,
    });
  }, [/* ... */]);
  
  return { checkout };
}
```

### 4.2 Hook useTokens - Complejo

**Problema:** 244 líneas, múltiples responsabilidades

**Responsabilidades:**
- Carga de información de tokens
- Gestión de currency seleccionada
- localStorage sync
- Event listeners
- Cálculo de balances y allowances

**Solución:** Considerar dividir en:
- `useTokenInfo` - Información de tokens
- `useCurrencySelection` - Selección de moneda
- `useTokenApproval` - Aprobación de tokens

### 4.3 Validación de Rate Duplicada

**Problema:**
```typescript
// app/cart/page.tsx:197-200
if (!rateInfo || !rateInfo.isValid || !rateInfo.isFresh) {
  setError('El rate de conversión no está disponible...');
  return;
}

// Y también en el botón disabled
disabled={... || (rateInfo && (!rateInfo.isValid || !rateInfo.isFresh))}
```

**Solución:**
```typescript
// hooks/useExchangeRate.ts - agregar helper
export function useExchangeRate() {
  // ... existing code
  
  const canUseCurrency = useMemo(() => {
    return rateInfo?.isValid && rateInfo?.isFresh;
  }, [rateInfo]);
  
  return {
    // ... existing returns
    canUseCurrency,
  };
}
```

### 4.4 Componente Header - Muy Grande

**Problema:** 317 líneas, múltiples responsabilidades

**Responsabilidades:**
- Navegación
- Wallet connection
- Currency selector
- Balance display
- Cart count
- Mobile menu

**Solución Recomendada:**
```typescript
// Dividir en componentes más pequeños
components/
  Header/
    Header.tsx (orquestador)
    Navigation.tsx
    WalletSection.tsx
    CurrencySelector.tsx (ya existe, usar)
    MobileMenu.tsx
```

---

## 🚀 5. Recomendaciones Prioritarias

### 🔴 Prioridad Alta (Hacer Inmediatamente)

1. **Crear hook useIPFSImage**
   - Consolidar lógica de imágenes IPFS
   - **Impacto:** Elimina duplicación, mejor UX

2. **Extraer funciones helper de mapeo**
   - Crear `lib/contractHelpers.ts`
   - Mover funciones de mapeo (Product, Invoice, Review)
   - **Impacto:** Reduce duplicación

3. **Centralizar constantes**
   - Crear `lib/constants.ts`
   - **Impacto:** Mantenibilidad, consistencia

4. **Implementar sistema de logging**
   - Crear `lib/logger.ts`
   - Reemplazar `console.log`
   - **Impacto:** Mejor debugging

5. **Eliminar uso de `any`**
   - Reemplazar con tipos específicos
   - **Impacto:** Mejor type safety

### 🟡 Prioridad Media (Próximas 2 semanas)

6. **Refactorizar useEcommerce**
   - Dividir en hooks más pequeños
   - **Impacto:** Mantenibilidad, testabilidad

7. **Extraer lógica de checkout**
   - Crear `hooks/useCheckout.ts`
   - **Impacto:** Mejor organización, testabilidad

8. **Unificar manejo de errores**
   - Crear `lib/errorHandler.ts`
   - Implementar toast notifications
   - **Impacto:** Mejor UX, consistencia

9. **Refactorizar CartPage**
   - Dividir en componentes más pequeños
   - Extraer lógica a hooks
   - **Impacto:** Mantenibilidad, legibilidad

10. **Refactorizar Header**
    - Dividir en componentes más pequeños
    - **Impacto:** Mantenibilidad

### 🟢 Prioridad Baja (Mejoras Futuras)

11. **Optimizar performance**
    - Memoizar componentes pesados
    - Optimizar re-renders
    - Lazy loading de imágenes
    - **Impacto:** Mejor performance

12. **Añadir Error Boundaries**
    - Crear componente ErrorBoundary
    - **Impacto:** Mejor manejo de errores

13. **Mejorar validaciones**
    - Validación de formularios robusta
    - Validación de rate más clara
    - **Impacto:** Mejor UX

14. **Añadir tests**
    - Unit tests para hooks
    - Integration tests para flujos
    - **Impacto:** Confianza, calidad

15. **Documentación**
    - JSDoc para funciones públicas
    - README con arquitectura
    - **Impacto:** Mantenibilidad

---

## 📋 Checklist de Calidad

### Estructura
- [ ] No hay código duplicado dentro del proyecto
- [ ] Constantes centralizadas
- [ ] Funciones helper organizadas
- [ ] Componentes reutilizables extraídos
- [ ] Hooks de tamaño razonable

### Código
- [ ] Sin uso de `any`
- [ ] Tipos bien definidos
- [ ] Manejo de errores consistente
- [ ] Logging apropiado
- [ ] Validaciones robustas

### React
- [ ] Hooks bien implementados
- [ ] Dependencias correctas en useEffect
- [ ] Estados manejados correctamente
- [ ] Sin re-renders innecesarios
- [ ] Componentes de tamaño razonable

### Performance
- [ ] Componentes pesados memoizados
- [ ] Lazy loading donde aplica
- [ ] Optimizaciones de carga
- [ ] Polling optimizado

---

## 🎨 Consideraciones Especiales

### Multi-currency Support

**Complejidad adicional:**
- Conversión de monedas
- Validación de rate
- Gestión de balances múltiples
- Aprobaciones por token

**Recomendaciones:**
- Mantener lógica de conversión centralizada
- Validar rate consistentemente
- UI clara para selección de moneda

### Carrito Persistente en Blockchain

**Consideraciones:**
- Carrito almacenado en smart contract
- Necesita transacciones para cambios
- Sincronización con estado local

**Mejoras:**
- Cache local del carrito
- Optimistic updates
- Sincronización inteligente

---

## 📚 Estándares Aplicados

- [Next.js Best Practices](https://nextjs.org/docs)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Conclusión:** El proyecto web-customer tiene buena estructura y componentes reutilizables, pero necesita refactorización para manejar la complejidad del hook useEcommerce, eliminar duplicación de lógica de imágenes IPFS, y mejorar la organización de componentes grandes como CartPage y Header. Las mejoras priorizadas pueden implementarse de forma incremental.

