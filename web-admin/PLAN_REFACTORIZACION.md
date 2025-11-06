# Plan de Refactorización - Web Admin

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
} as const;

export const RPC_URL = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545')
  : 'http://localhost:8545';
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

// Función helper para mapear producto
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

// Función helper para mapear factura
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

// Función helper para mapear review
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
- ✅ Verificar que los tipos coinciden exactamente con los actuales

---

### FASE 2: Refactorización de Hooks (Cambios Internos)

**Objetivo:** Usar las utilidades creadas en el hook useEcommerce.

#### 2.1 Actualizar `hooks/useEcommerce.ts` - Usar helpers de mapeo

**Cambios:**
1. Importar helpers
2. Reemplazar mapeo inline con funciones helper
3. Mantener misma lógica y comportamiento

**Pasos:**
1. Agregar imports al inicio del archivo
2. Reemplazar `getCompanyProducts` - mapeo inline → `mapRawProductToProduct`
3. Reemplazar `getProduct` - mapeo inline → `mapRawProductToProduct`
4. Reemplazar `getCompanyInvoices` - mapeo inline → `mapRawInvoiceToInvoice`
5. Reemplazar `getInvoice` - mapeo inline → `mapRawInvoiceToInvoice`
6. Reemplazar `getProductReviews` - mapeo inline → `mapRawReviewToReview`

**Verificación después de cada cambio:**
- ✅ Compila sin errores
- ✅ No hay cambios en la interfaz pública del hook
- ✅ Probar en navegador que funciona igual

**Ejemplo de cambio:**
```typescript
// ANTES
const products = await contract.getProductsByCompany(companyId);
return products.map((p: any) => {
  return {
    productId: BigInt(p.productId.toString()),
    // ... resto del mapeo
  };
});

// DESPUÉS
import { mapRawProductToProduct } from '@/lib/contractHelpers';
const products = await contract.getProductsByCompany(companyId);
return products.map((p: any) => mapRawProductToProduct(p));
```

---

#### 2.2 Reemplazar console.log con logger en `hooks/useEcommerce.ts`

**Cambios:**
- Reemplazar `console.log` → `logger.debug`
- Reemplazar `console.error` → `logger.error`
- Mantener mismo comportamiento (solo en desarrollo)

**Verificación:**
- ✅ Compila
- ✅ Verificar en desarrollo que logs funcionan igual
- ✅ Verificar que no hay logs en producción

---

#### 2.3 Usar constantes en `hooks/useEcommerce.ts`

**Cambios:**
- Reemplazar definición local de `ECOMMERCE_ADDRESS` con import de `lib/constants.ts`
- Mantener misma lógica

**Verificación:**
- ✅ Compila
- ✅ Funciona igual en navegador

---

### FASE 3: Extracción de Componentes (Reorganización)

#### 3.1 Extraer `ProductCard` de `ProductsTab.tsx`

**Objetivo:** Mover ProductCard a archivo separado sin cambiar funcionalidad.

**Pasos:**
1. Crear `components/ProductCard.tsx` (nuevo)
2. Copiar componente ProductCard completo (líneas 117-239)
3. Agregar imports necesarios
4. Actualizar `ProductsTab.tsx` para importar ProductCard
5. Eliminar definición antigua de ProductCard

**Verificación:**
- ✅ Compila
- ✅ UI se ve igual (mismo diseño)
- ✅ Funcionalidad igual (edit, toggle active)
- ✅ No hay errores en consola

**Importante:**
- ✅ Mantener exactamente los mismos props
- ✅ Mantener exactamente los mismos estilos (className)
- ✅ No cambiar lógica de eventos

---

### FASE 4: Mejoras de Tipos (Type Safety)

#### 4.1 Reemplazar `any` en `hooks/useEcommerce.ts`

**Cambios incrementales:**
1. Reemplazar `catch (err: any)` → `catch (err: unknown)`
2. Agregar type guards donde sea necesario
3. Mantener mismo manejo de errores

**Ejemplo:**
```typescript
// ANTES
catch (err: any) {
  setError(err.message || 'Error al obtener producto');
  throw err;
}

// DESPUÉS
catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : 'Error al obtener producto';
  setError(errorMessage);
  throw err;
}
```

**Verificación después de cada cambio:**
- ✅ Compila
- ✅ Funciona igual (manejo de errores igual)
- ✅ Probar con error real para verificar

---

#### 4.2 Reemplazar `any` en componentes

**Archivos:**
- `app/company/[id]/page.tsx` - `useState<any>` → `useState<Company | null>`

**Verificación:**
- ✅ Compila
- ✅ UI funciona igual
- ✅ No hay errores de tipo

---

### FASE 5: Limpieza Final

#### 5.1 Eliminar código comentado y logs innecesarios

**Solo eliminar:**
- Comentarios obsoletos
- Logs de debug que ya no se usan
- Código comentado

**NO eliminar:**
- Comentarios útiles
- Logs que son necesarios para debugging

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

---

## 🗓️ Orden de Ejecución Recomendado

1. **Día 1:** Fase 1 completa (crear utilidades)
2. **Día 2:** Fase 2.1 y 2.2 (mapeo y logger)
3. **Día 3:** Fase 2.3 y Fase 3 (constantes y ProductCard)
4. **Día 4:** Fase 4 (tipos)
5. **Día 5:** Fase 5 y verificación final

**Total estimado:** 5 días (con testing exhaustivo)

---

## 🔍 Verificación Final

Después de completar todas las fases:

1. **Pruebas funcionales:**
   - [ ] Registrar empresa
   - [ ] Agregar producto
   - [ ] Editar producto
   - [ ] Ver facturas
   - [ ] Ver reviews
   - [ ] Ver analytics

2. **Verificación visual:**
   - [ ] Todas las páginas se ven igual
   - [ ] No hay cambios en estilos
   - [ ] Responsive funciona igual

3. **Verificación de código:**
   - [ ] No hay errores de TypeScript
   - [ ] No hay warnings relevantes
   - [ ] Código más limpio y organizado

---

## 📚 Notas

- **Incremental:** Cada cambio es pequeño y seguro
- **Reversible:** Cada cambio puede revertirse fácilmente
- **Testeable:** Verificar después de cada cambio
- **Conservador:** Si hay duda, no cambiar

---

**Última actualización:** $(date)

