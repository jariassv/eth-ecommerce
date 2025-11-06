# Análisis de Calidad de Código - Web Admin

## 📋 Resumen Ejecutivo

Este documento analiza la calidad del código del proyecto **web-admin**, identificando áreas de mejora, código repetido, inconsistencias y oportunidades de refactorización siguiendo estándares profesionales.

**Proyecto:** Web Admin Panel  
**Versión:** develop  
**Fecha de Análisis:** $(date)  
**Objetivo:** Dashboard administrativo para gestión de empresas, productos, facturas y reviews

---

## 📊 Métricas Generales

### Archivos Analizados
- **Hooks:** 3 archivos (useEcommerce.ts, useWallet.ts, useIPFS.ts)
- **Componentes:** 6 archivos (Header, ProductsTab, InvoicesTab, AnalyticsTab, ReviewsTab, ProductForm)
- **Librerías:** 2 archivos (contracts.ts, ethers.ts)
- **Páginas:** 3 archivos (page.tsx, register/page.tsx, company/[id]/page.tsx)
- **API Routes:** 1 archivo (rpc/route.ts)

### Líneas de Código
- **Total:** ~2,500 líneas
- **Hooks:** ~800 líneas
- **Componentes:** ~1,200 líneas
- **Librerías:** ~200 líneas

---

## 🔍 1. Código Duplicado Interno

### 1.1 Validación de Contratos - Repetida 3 veces

**Ubicación:**
- `hooks/useEcommerce.ts:38-60` - Validación en useEffect
- `hooks/useEcommerce.ts:96-105` - Validación en getOwner
- Potencialmente en otros métodos

**Problema:**
```typescript
// Repetido en múltiples lugares
if (!ECOMMERCE_ADDRESS || ECOMMERCE_ADDRESS === '') {
  setError('Dirección del contrato Ecommerce no configurada...');
  return;
}
if (!ethers.isAddress(ECOMMERCE_ADDRESS)) {
  setError(`Dirección del contrato Ecommerce inválida: ${ECOMMERCE_ADDRESS}`);
  return;
}
const code = await contractProvider.getCode(ECOMMERCE_ADDRESS);
if (!code || code === '0x') {
  throw new Error(`No hay contrato desplegado...`);
}
```

**Solución Recomendada:**
```typescript
// lib/contractValidation.ts
export async function validateContractAddress(
  address: string,
  provider: ethers.Provider
): Promise<{ valid: boolean; error?: string }> {
  if (!address || address === '') {
    return { valid: false, error: 'Dirección del contrato no configurada' };
  }
  if (!ethers.isAddress(address)) {
    return { valid: false, error: `Dirección inválida: ${address}` };
  }
  const code = await provider.getCode(address);
  if (!code || code === '0x') {
    return { valid: false, error: 'No hay contrato desplegado en esta dirección' };
  }
  return { valid: true };
}
```

### 1.2 Mapeo de Productos - Lógica Duplicada

**Ubicación:**
- `hooks/useEcommerce.ts:282-300` - getCompanyProducts
- `hooks/useEcommerce.ts:309-334` - getProduct

**Problema:**
```typescript
// Mapeo repetido en ambas funciones
return {
  productId: BigInt(p.productId.toString()),
  companyId: BigInt(p.companyId.toString()),
  name: p.name,
  description: p.description,
  price: BigInt(p.price.toString()),
  stock: BigInt(p.stock.toString()),
  ipfsImageHash: p.ipfsImageHash || '',
  ipfsAdditionalImages: p.ipfsAdditionalImages || [],
  totalSales: BigInt(p.totalSales.toString()),
  isActive: p.isActive,
};
```

**Solución Recomendada:**
```typescript
// lib/contractHelpers.ts
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
```

### 1.3 Mapeo de Facturas - Lógica Duplicada

**Ubicación:**
- `hooks/useEcommerce.ts:353-364` - getCompanyInvoices
- `hooks/useEcommerce.ts:376-401` - getInvoice

**Problema:** Mismo patrón de mapeo repetido

**Solución:** Extraer a función helper similar a productos

### 1.4 Mapeo de Reviews - Lógica Duplicada

**Ubicación:**
- `hooks/useEcommerce.ts:425-433` - getProductReviews

**Problema:** Mapeo repetitivo

**Solución:** Extraer a función helper

---

## 🏗️ 2. Estructura y Organización

### 2.1 ✅ Aspectos Positivos

1. **Separación clara de responsabilidades**
   - Hooks en `/hooks`
   - Componentes en `/components`
   - Librerías en `/lib`
   - Páginas en `/app`

2. **Estructura de componentes modular**
   - Tabs separados (AnalyticsTab, ProductsTab, etc.)
   - Componentes reutilizables (Header, ProductForm)

3. **TypeScript bien configurado**
   - `strict: true` en tsconfig.json
   - Tipos bien definidos

### 2.2 ⚠️ Áreas de Mejora

#### **A. Falta de Utilidades Compartidas**

**Problema:** Funciones helper dispersas en hooks

**Estructura Actual:**
```
lib/
  contracts.ts
  ethers.ts
hooks/
  useEcommerce.ts (contiene helpers)
```

**Estructura Recomendada:**
```
lib/
  contracts.ts
  ethers.ts
  contractHelpers.ts (nuevo)
  contractValidation.ts (nuevo)
  constants.ts (nuevo)
hooks/
  useEcommerce.ts (solo lógica de hooks)
```

#### **B. Constantes Dispersas**

**Problema:**
```typescript
// Repetido en múltiples archivos
const ECOMMERCE_ADDRESS = typeof window !== 'undefined'
  ? (process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '')
  : '';
```

**Solución:**
```typescript
// lib/constants.ts
export const CONTRACTS = {
  ECOMMERCE: process.env.NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS || '',
} as const;

export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545';
```

#### **C. Componente ProductCard dentro de ProductsTab**

**Problema:** 
- `ProductCard` está definido dentro de `ProductsTab.tsx` (líneas 117-239)
- Debería ser un componente separado para reutilización

**Solución:** Extraer a `components/ProductCard.tsx`

---

## 📝 3. Estándares de Código

### 3.1 TypeScript

#### **A. Uso de `any`**

**Encontrado:** ~15 ocurrencias de `any`

**Ejemplos:**
```typescript
// hooks/useEcommerce.ts:109
catch (err: any) {
  const errorMessage = err.message || 'Error al obtener owner';
}

// components/company/[id]/page.tsx:21
const [company, setCompany] = useState<any>(null);
```

**Problema:** Pierde beneficios de TypeScript

**Solución:**
```typescript
// Usar unknown y type guards
catch (err: unknown) {
  const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
}

// Usar el tipo correcto
const [company, setCompany] = useState<Company | null>(null);
```

#### **B. Tipos de Eventos sin Definir**

**Problema:**
```typescript
// hooks/useEcommerce.ts:127-134
const event = receipt.logs.find((log: any) => {
  try {
    const parsedLog = contract.interface.parseLog(log);
    return parsedLog && parsedLog.name === 'CompanyRegistered';
  } catch {
    return false;
  }
});
```

**Solución:**
```typescript
// lib/contractEvents.ts
export interface CompanyRegisteredEvent {
  companyId: bigint;
  companyAddress: string;
  name: string;
}

export function findCompanyRegisteredEvent(
  logs: ethers.Log[],
  contract: ethers.Contract
): CompanyRegisteredEvent | null {
  // ... implementación tipada
}
```

### 3.2 Manejo de Errores

#### **A. Inconsistencia en Manejo de Errores**

**Problema:** Diferentes estrategias en diferentes lugares

```typescript
// Algunos lugares: lanzan error
throw new Error('Error al obtener owner');

// Otros lugares: solo setean error
setError(err.message || 'Error al obtener empresa');

// Otros lugares: ignoran silenciosamente
catch (err) {
  // No tiene empresa registrada
  setCompanyId(null);
}
```

**Solución Recomendada:**
```typescript
// lib/errorHandler.ts
export class ContractError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'ContractError';
  }
}

export function handleContractError(err: unknown): string {
  if (err instanceof ContractError) {
    return err.message;
  }
  if (err instanceof Error) {
    return err.message;
  }
  return 'Error desconocido';
}
```

#### **B. Errores Silenciados**

**Problema:**
```typescript
// app/page.tsx:53-55
catch (err) {
  // No tiene empresa registrada
  setCompanyId(null);
}
```

**Solución:**
```typescript
catch (err) {
  // No tiene empresa registrada - esto es esperado
  if (process.env.NODE_ENV === 'development') {
    console.log('No se encontró empresa para esta dirección:', err);
  }
  setCompanyId(null);
}
```

### 3.3 Logging

#### **A. Console.log en Producción**

**Encontrado:** 31 ocurrencias de `console.log/error/warn`

**Problema:**
```typescript
// hooks/useEcommerce.ts:284-286
console.log('Producto obtenido del contrato:', p.name, 'Hash IPFS:', ipfsHash);
```

**Solución:**
```typescript
// lib/logger.ts
export const logger = {
  debug: (...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
    // Opcional: enviar a servicio de logging
  },
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
};
```

### 3.4 React Hooks

#### **A. Dependencias de useEffect**

**✅ Bien implementado en la mayoría de casos:**
```typescript
useEffect(() => {
  if (isConnected && address && isReady) {
    checkCompany();
    checkIfOwner();
  } else {
    setLoading(false);
  }
}, [isConnected, address, isReady]); // ✅ Correcto
```

**⚠️ Problema potencial:**
```typescript
// app/company/[id]/page.tsx:26-30
useEffect(() => {
  if (isReady && companyId) {
    loadCompany();
  }
}, [isReady, companyId]); // ⚠️ Falta loadCompany en dependencias
```

**Solución:**
```typescript
const loadCompany = useCallback(async () => {
  // ... lógica
}, [isReady, companyId, getCompany]);

useEffect(() => {
  if (isReady && companyId) {
    loadCompany();
  }
}, [isReady, companyId, loadCompany]);
```

---

## 🎯 4. Problemas Específicos

### 4.1 Hook useEcommerce - Demasiado Grande

**Problema:** 497 líneas, 15 funciones

**Métricas:**
- Complejidad ciclomática alta
- Múltiples responsabilidades
- Difícil de mantener y testear

**Solución Recomendada:**
```typescript
// Dividir en hooks más pequeños
hooks/
  useEcommerce.ts (orquestador)
  useCompany.ts (gestión de empresas)
  useProducts.ts (gestión de productos)
  useInvoices.ts (gestión de facturas)
  useReviews.ts (gestión de reviews)
```

### 4.2 Componente ProductsTab - Mezcla de Responsabilidades

**Problema:**
- Maneja lista de productos
- Contiene ProductCard interno
- Maneja estado de carga
- Maneja formulario

**Solución:**
- Extraer `ProductCard` a componente separado
- Extraer lógica de carga a hook personalizado `useProducts`
- Separar UI de lógica de negocio

### 4.3 Validación de Formularios

**Problema:**
```typescript
// components/ProductForm.tsx:70-72
if (!name.trim() || !description.trim() || !price || !stock) {
  setError('Por favor completa todos los campos requeridos');
  return;
}
```

**Problemas:**
- Validación básica
- No valida formato de precio
- No valida rango de valores
- Mensajes de error genéricos

**Solución:**
```typescript
// lib/validation.ts
export function validateProductForm(data: {
  name: string;
  description: string;
  price: string;
  stock: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  
  if (!data.name.trim()) {
    errors.name = 'El nombre es requerido';
  } else if (data.name.length < 3) {
    errors.name = 'El nombre debe tener al menos 3 caracteres';
  }
  
  const priceNum = parseFloat(data.price);
  if (isNaN(priceNum) || priceNum <= 0) {
    errors.price = 'El precio debe ser un número mayor a 0';
  }
  
  const stockNum = parseInt(data.stock);
  if (isNaN(stockNum) || stockNum < 0) {
    errors.stock = 'El stock debe ser un número mayor o igual a 0';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
```

### 4.4 Manejo de Estado de Carga

**Problema:** Múltiples estados de loading dispersos

```typescript
// En diferentes componentes
const [loading, setLoading] = useState(false);
const [loadingProducts, setLoadingProducts] = useState(true);
const [loadingCompany, setLoadingCompany] = useState(true);
const [processing, setProcessing] = useState(false);
```

**Solución Recomendada:**
```typescript
// hooks/useLoadingState.ts
export function useLoadingState() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});
  
  const setLoading = useCallback((key: string, value: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const isLoading = useCallback((key: string) => {
    return loadingStates[key] ?? false;
  }, [loadingStates]);
  
  const isAnyLoading = useMemo(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);
  
  return { setLoading, isLoading, isAnyLoading };
}
```

---

## 🚀 5. Recomendaciones Prioritarias

### 🔴 Prioridad Alta (Hacer Inmediatamente)

1. **Extraer funciones helper de mapeo**
   - Crear `lib/contractHelpers.ts`
   - Mover funciones de mapeo (Product, Invoice, Review)
   - **Impacto:** Reduce duplicación, facilita mantenimiento

2. **Eliminar uso de `any`**
   - Reemplazar con tipos específicos o `unknown`
   - Crear tipos para eventos
   - **Impacto:** Mejor type safety, menos bugs

3. **Extraer ProductCard a componente separado**
   - Crear `components/ProductCard.tsx`
   - **Impacto:** Reutilización, mejor organización

4. **Centralizar constantes**
   - Crear `lib/constants.ts`
   - **Impacto:** Mantenibilidad, consistencia

5. **Implementar sistema de logging**
   - Crear `lib/logger.ts`
   - Reemplazar `console.log` con logger
   - **Impacto:** Mejor debugging, control de logs

### 🟡 Prioridad Media (Próximas 2 semanas)

6. **Refactorizar useEcommerce**
   - Dividir en hooks más pequeños
   - Extraer lógica de negocio
   - **Impacto:** Mantenibilidad, testabilidad

7. **Mejorar validación de formularios**
   - Crear `lib/validation.ts`
   - Implementar validaciones robustas
   - **Impacto:** Mejor UX, menos errores

8. **Unificar manejo de errores**
   - Crear `lib/errorHandler.ts`
   - Clases de error personalizadas
   - **Impacto:** Consistencia, mejor debugging

9. **Mejorar manejo de estados de carga**
   - Crear hook `useLoadingState`
   - **Impacto:** Consistencia, mejor UX

10. **Extraer validación de contratos**
    - Crear `lib/contractValidation.ts`
    - **Impacto:** Reutilización, menos duplicación

### 🟢 Prioridad Baja (Mejoras Futuras)

11. **Añadir Error Boundaries**
    - Crear componente ErrorBoundary
    - Implementar en layouts principales
    - **Impacto:** Mejor manejo de errores de renderizado

12. **Optimizar performance**
    - Memoizar componentes pesados
    - Optimizar re-renders
    - **Impacto:** Mejor performance

13. **Añadir tests**
    - Unit tests para hooks
    - Integration tests para componentes
    - **Impacto:** Confianza, calidad

14. **Documentación**
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

### Performance
- [ ] Componentes pesados memoizados
- [ ] Lazy loading donde aplica
- [ ] Optimizaciones de carga

---

## 📚 Estándares Aplicados

- [Next.js Best Practices](https://nextjs.org/docs)
- [React Hooks Best Practices](https://react.dev/reference/react)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Clean Code Principles](https://github.com/ryanmcdermott/clean-code-javascript)

---

**Conclusión:** El proyecto tiene una base sólida con buena separación de responsabilidades, pero necesita refactorización para eliminar duplicación, mejorar type safety y organizar mejor el código. Las mejoras priorizadas pueden implementarse de forma incremental sin afectar la funcionalidad existente.

