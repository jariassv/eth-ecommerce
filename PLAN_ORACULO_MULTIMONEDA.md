# 📋 Plan de Implementación: Oráculo Simple para Multimoneda

**Versión:** 2.0 (Corregida)  
**Fecha de Actualización:** $(date)  
**Estado:** ✅ **LISTO PARA IMPLEMENTACIÓN**

## 🎯 Objetivo

Implementar un sistema de oráculo simple para gestionar tasas de cambio entre EURT y USDT, permitiendo conversiones en tiempo real y pagos multimoneda en el e-commerce con validaciones de seguridad robustas.

## ⚠️ Correcciones Aplicadas (v2.0)

Este plan ha sido actualizado con las siguientes correcciones críticas basadas en evaluación técnica:

- ✅ **Validación Dual del Total**: Implementada para prevenir manipulación de montos
- ✅ **Política de Redondeo**: Cambiada a redondeo estándar (justo para ambas partes)
- ✅ **Tolerancia de Redondeo**: Especificada (±0.1% o 100 unidades base)
- ✅ **Validación de Rate**: Límites y validación on-chain agregados
- ✅ **Congelamiento de Rate**: Rate se congela al crear invoice
- ✅ **Edge Cases**: Tests adicionales agregados
- ✅ **Manejo de Errores**: Especificaciones claras agregadas

---

## 🏗️ Estrategia de Conversión y Flujo de Pago

### **Estrategia Elegida: Conversión en Frontend (Lógica Ideal Moderna)**

Esta es la estrategia más común y eficiente en la industria actual, similar a cómo funcionan plataformas como Amazon, Shopify, etc.

#### **Flujo Completo:**

1. **Usuario navega productos** → Ve precios en USDT (base)
2. **Usuario selecciona moneda preferida** → Elige USDT o EURT en web-customer
3. **Frontend convierte precios en tiempo real** → Usa el oráculo para mostrar precios convertidos
4. **Usuario agrega productos al carrito** → Precios ya están en la moneda seleccionada
5. **Usuario va al checkout** → Ve total en la moneda seleccionada
6. **Usuario confirma compra** → Se crea invoice con:
   - Monto convertido en la moneda seleccionada
   - Token de pago seleccionado guardado
7. **Usuario redirige a pasarela** → Pasarela muestra detalles con el token correcto
8. **Usuario aprueba y paga** → Contrato valida que el token coincida con la invoice

#### **Ventajas de esta Estrategia:**

✅ **Menor gas cost** - Conversión off-chain (gratis)
✅ **Mejor UX** - Usuario puede cambiar de moneda sin recrear invoice
✅ **Más flexible** - Rate puede actualizarse sin afectar invoices existentes
✅ **Estándar de la industria** - Misma lógica que e-commerce tradicionales
✅ **Performance** - Conversión instantánea sin esperar transacciones blockchain

#### **Manejo de Redondeo:**

- Los productos tienen precio base en USDT (6 decimales)
- La conversión se hace multiplicando por el rate y redondeando
- **Política de Redondeo:** Redondeo estándar (round half up) para ser justo con ambas partes
- **Tolerancia de Redondeo:** ±0.1% o máximo 100 unidades base (whichever is greater)
- La diferencia máxima aceptable entre frontend y contrato es la tolerancia definida

#### **Validaciones (CRÍTICAS):**

**Validación Dual del Total (On-Chain + Off-Chain):**
- El contrato SIEMPRE calcula el total en USDT desde el carrito (fuente de verdad)
- El frontend calcula el total en USDT y lo pasa como parámetro para validación
- El contrato valida que el total del frontend coincida con el calculado (con tolerancia)
- Si paymentToken != USDT, el contrato convierte usando el oráculo on-chain
- Esto previene manipulación de montos y asegura integridad

**Validación de Rate:**
- El rate debe estar actualizado (< 24 horas) para ser considerado válido
- El contrato valida el rate al crear la invoice (usando oráculo)
- Si el rate está desactualizado, se muestra advertencia pero se permite continuar
- El rate usado es el del momento de creación de invoice (se "congela")

**Validación de Token:**
- El contrato valida que el token de pago esté en la lista de tokens soportados
- El contrato valida que el token usado en `processPayment` coincida con el de la invoice
- El contrato valida que el monto pagado coincida exactamente con el de la invoice

**Límites de Rate:**
- Rate debe estar entre 0.8 y 1.5 (prevenir valores extremos)
- Si el rate está fuera de estos límites, se rechaza la creación de invoice

---

## 📁 Estructura del Proyecto

### Nueva Estructura: Directorio `oracle/`

Se creará un directorio separado para el oráculo que incluirá:

```
oracle/
├── sc/                          # Smart Contract del Oráculo
│   ├── src/
│   │   └── ExchangeRateOracle.sol
│   ├── test/
│   │   └── ExchangeRateOracle.t.sol
│   ├── script/
│   │   └── DeployExchangeRateOracle.s.sol
│   ├── foundry.toml
│   └── README.md
├── api/                         # API REST para consultar el rate
│   ├── src/
│   │   ├── index.ts
│   │   ├── routes/
│   │   │   └── rate.ts
│   │   └── lib/
│   │       └── ethers.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
├── scripts/                     # Scripts de actualización
│   ├── update-rate.ts
│   ├── fetch-rate.ts
│   └── package.json
└── README.md                    # Documentación general del oráculo
```

**Justificación:** Separar el oráculo en su propio directorio permite:
- Mantener el código organizado y modular
- Facilita el despliegue independiente
- Permite reutilización en otros proyectos
- Simplifica el mantenimiento

---

## 🔍 Diagnóstico de Cambios Necesarios

### 1. **Smart Contracts - Ecommerce** (`sc-ecommerce/`)

#### Cambios en `sc-ecommerce/src/libraries/Types.sol`
- ✅ Agregar campo `paymentToken` (address) a la estructura `Invoice`
- ✅ El campo debe ser `address(0)` para invoices antiguas (compatibilidad hacia atrás)
- ✅ Agregar comentario explicando que `address(0)` = USDT (token por defecto)

#### Cambios en `sc-ecommerce/src/libraries/PaymentLib.sol`
- ✅ Modificar storage para soportar múltiples tokens
- ✅ Agregar referencia al oráculo de conversión (para validaciones futuras)
- ✅ Agregar mapping de tokens soportados
- ✅ Modificar `processPayment` para validar token contra invoice
- ✅ Agregar funciones para gestionar tokens soportados
- ✅ Agregar función para validar si un token está soportado

#### Cambios en `sc-ecommerce/src/libraries/InvoiceLib.sol`
- ✅ Modificar `createInvoiceFromCart` para aceptar `paymentToken` y `expectedTotalUSDT` como parámetros
- ✅ Validar que `expectedTotalUSDT` coincida con el calculado (con tolerancia de ±0.1% o 100 unidades base)
- ✅ Guardar `paymentToken` en la estructura Invoice
- ✅ Guardar timestamp de creación para validar rate usado
- ✅ Función helper para obtener token de invoice (con fallback a USDT para compatibilidad)

#### Cambios en `sc-ecommerce/src/Ecommerce.sol`
- ✅ Modificar constructor para aceptar dirección del oráculo
- ✅ Agregar función `addSupportedToken(address tokenAddress)` (solo owner)
- ✅ Agregar función `getSupportedTokens()` (view, retorna array)
- ✅ Agregar función `isTokenSupported(address tokenAddress)` (view)
- ✅ Modificar `createInvoice()` para aceptar:
   - `paymentToken` (address)
   - `expectedTotalUSDT` (uint256) - Total esperado en USDT del frontend
- ✅ En `createInvoice()`:
   - Calcular total en USDT desde el carrito
   - Validar que `expectedTotalUSDT` coincida con el calculado (tolerancia de ±0.1% o 100 unidades base)
   - Si `paymentToken != USDT`, convertir usando oráculo on-chain
   - Validar que el token esté soportado
   - Validar que el rate esté actualizado (< 24 horas)
   - Validar que el rate esté en rango razonable (0.8 - 1.5)
- ✅ Modificar `processPayment()` para:
   - Leer el token de la invoice (no como parámetro)
   - Validar que el token usado coincida con el de la invoice
   - Validar que el monto coincida exactamente
- ✅ Agregar eventos para tokens soportados y validaciones

#### Cambios en `sc-ecommerce/test/Ecommerce.t.sol`
- ✅ Agregar tests para multimoneda
- ✅ Tests de conversión de precios
- ✅ Tests de pago con EURT
- ✅ Tests de validación de tokens soportados

#### Cambios en `sc-ecommerce/script/DeployEcommerce.s.sol`
- ✅ Agregar parámetro para dirección del oráculo
- ✅ Actualizar script de deploy

---

### 2. **Frontend - Web Customer** (`web-customer/`)

#### Nuevos Archivos
- ✅ `web-customer/lib/exchangeRate.ts` - Utilidades para consultar oráculo
- ✅ `web-customer/hooks/useExchangeRate.ts` - Hook para rate de cambio
- ✅ `web-customer/hooks/useTokens.ts` - Hook para gestionar tokens
- ✅ `web-customer/components/CurrencySelector.tsx` - Selector de moneda
- ✅ `web-customer/components/PriceConverter.tsx` - Convertidor de precios

#### Cambios en Archivos Existentes
- ✅ `web-customer/lib/contracts.ts` - Agregar funciones del oráculo al ABI
- ✅ `web-customer/hooks/useEcommerce.ts` - Modificar `createInvoice` para aceptar token
- ✅ `web-customer/app/page.tsx` - Integrar selector de moneda global (persistente)
- ✅ `web-customer/app/cart/page.tsx` - **CRÍTICO**: Agregar selector de moneda ANTES de checkout
- ✅ `web-customer/app/cart/page.tsx` - Convertir total del carrito usando oráculo
- ✅ `web-customer/app/cart/page.tsx` - Pasar token seleccionado al crear invoice
- ✅ `web-customer/components/ProductCard.tsx` - Mostrar precios en moneda seleccionada
- ✅ `web-customer/components/ProductDetailModal.tsx` - Mostrar conversión de precios

#### Variables de Entorno
- ✅ `NEXT_PUBLIC_EXCHANGE_RATE_ORACLE_ADDRESS`
- ✅ `NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS` (ya existe, verificar)

---

### 3. **Frontend - Web Admin** (`web-admin/`)

#### Cambios Opcionales
- ⚠️ `web-admin/hooks/useEcommerce.ts` - Agregar funciones para ver tokens soportados
- ⚠️ `web-admin/components/InvoicesTab.tsx` - Mostrar moneda usada en facturas

**Nota:** Los cambios en web-admin son menores ya que el admin no necesita conversión de moneda.

---

### 4. **Pasarela de Pago** (`stablecoin/pasarela-de-pago/`)

#### Cambios Necesarios
- ✅ `stablecoin/pasarela-de-pago/components/PaymentProcessor.tsx` - **CRÍTICO**: Remover bloqueo de EURT
- ✅ `stablecoin/pasarela-de-pago/components/PaymentProcessor.tsx` - Permitir aprobación de cualquier token soportado
- ✅ `stablecoin/pasarela-de-pago/components/PaymentProcessor.tsx` - Leer token de la invoice y usarlo
- ✅ `stablecoin/pasarela-de-pago/components/PaymentProcessor.tsx` - Validar que el token coincida con la invoice
- ✅ `stablecoin/pasarela-de-pago/lib/contracts.ts` - Agregar funciones del oráculo y Ecommerce actualizadas
- ✅ Variables de entorno para oráculo

---

### 5. **Compra de Stablecoins** (`stablecoin/compra-stableboin/`)

#### Cambios Opcionales
- ⚠️ Mostrar conversión EUR/USD al comprar tokens
- ⚠️ Integrar visualización del rate actual

---

### 6. **Documentación**

#### Nuevos Archivos
- ✅ `oracle/README.md` - Documentación del oráculo
- ✅ `oracle/api/README.md` - Documentación de la API
- ✅ Actualizar `VARIABLES_ENTORNO.md` - Agregar variables del oráculo
- ✅ Actualizar `DEPLOYMENT.md` - Agregar pasos de deploy del oráculo

---

## 🚀 Etapas de Implementación

### **ETAPA 1: Smart Contract del Oráculo** ⏱️ ~2-3 horas

#### 1.1 Crear estructura del proyecto
- [ ] Crear directorio `oracle/sc/`
- [ ] Configurar `foundry.toml` (copiar desde `stablecoin/sc/`)
- [ ] Configurar dependencias (OpenZeppelin)

#### 1.2 Implementar contrato ExchangeRateOracle
- [ ] Crear `oracle/sc/src/ExchangeRateOracle.sol`
- [ ] Implementar storage del rate
- [ ] Implementar funciones de consulta
- [ ] Implementar funciones de conversión
- [ ] Implementar función de actualización (solo owner)
- [ ] Agregar eventos
- [ ] Agregar validaciones

#### 1.3 Tests del oráculo
- [ ] Crear `oracle/sc/test/ExchangeRateOracle.t.sol`
- [ ] Test de deploy
- [ ] Test de conversión EURT → USDT
- [ ] Test de conversión USDT → EURT
- [ ] Test de actualización de rate
- [ ] Test de permisos (no-owner)
- [ ] Test de validación de rate

#### 1.4 Script de deploy
- [ ] Crear `oracle/sc/script/DeployExchangeRateOracle.s.sol`
- [ ] Configurar parámetros de deploy
- [ ] Probar deploy en local

#### 1.5 Validación
- [ ] Ejecutar todos los tests
- [ ] Verificar coverage > 80%
- [ ] Documentar funciones principales

---

### **ETAPA 2: Integración con Ecommerce Contract** ⏱️ ~3-4 horas

#### 2.1 Modificar Types.sol
- [ ] Agregar campo `paymentToken` a `Invoice`
- [ ] Verificar compatibilidad con código existente

#### 2.2 Modificar PaymentLib.sol
- [ ] Agregar storage para múltiples tokens
- [ ] Agregar referencia al oráculo
- [ ] Modificar funciones para soportar token específico
- [ ] Agregar funciones de gestión de tokens
- [ ] Agregar funciones de conversión

#### 2.3 Modificar InvoiceLib.sol
- [ ] Modificar `createInvoiceFromCart` para aceptar:
   - `paymentToken` (address)
   - `expectedTotalUSDT` (uint256) - Total esperado del frontend
- [ ] Calcular total en USDT desde el carrito
- [ ] Validar que `expectedTotalUSDT` coincida con el calculado:
   - Tolerancia: ±0.1% o 100 unidades base (el mayor)
   - Usar: `abs(expectedTotalUSDT - calculatedTotalUSDT) <= max(calculatedTotalUSDT * 1000 / 1000000, 100)`
- [ ] Guardar `paymentToken` en la estructura Invoice al crearla
- [ ] Guardar `timestamp` de creación (ya existe, pero documentar su uso para rate)
- [ ] Agregar función helper `getInvoicePaymentToken` con fallback a USDT (address(0))

#### 2.4 Modificar Ecommerce.sol
- [ ] Agregar parámetro del oráculo al constructor
- [ ] Agregar función `addSupportedToken(address tokenAddress)` (solo owner)
- [ ] Agregar función `getSupportedTokens()` (view, retorna array)
- [ ] Agregar función `isTokenSupported(address tokenAddress)` (view)
- [ ] Modificar `createInvoice()` para aceptar:
   - `companyId` (uint256)
   - `paymentToken` (address)
   - `expectedTotalUSDT` (uint256)
- [ ] En `createInvoice()` implementar validación dual:
   - Calcular total en USDT desde el carrito
   - Validar que `expectedTotalUSDT` coincida (con tolerancia)
   - Si `paymentToken != USDT`, convertir usando oráculo on-chain
- [ ] Validar que `paymentToken` esté soportado
- [ ] Validar que el rate del oráculo esté actualizado (< 24 horas)
- [ ] Validar que el rate esté en rango razonable (0.8 - 1.5)
- [ ] Modificar `processPayment()` para:
   - Leer el token de la invoice (fallback a USDT si address(0))
   - Validar que el token usado coincida con el de la invoice
   - Validar que el monto coincida exactamente
- [ ] Agregar eventos para tokens soportados y validaciones

#### 2.5 Actualizar script de deploy
- [ ] Modificar `sc-ecommerce/script/DeployEcommerce.s.sol`
- [ ] Agregar deploy del oráculo antes del Ecommerce
- [ ] Pasar dirección del oráculo al constructor

#### 2.6 Tests de integración
- [ ] Agregar tests multimoneda en `Ecommerce.t.sol`
- [ ] Test de crear invoice con USDT (token por defecto)
- [ ] Test de crear invoice con EURT
- [ ] Test de validación dual: total correcto aceptado
- [ ] Test de validación dual: total incorrecto rechazado (fuera de tolerancia)
- [ ] Test de validación dual: total con tolerancia aceptado
- [ ] Test de conversión on-chain usando oráculo
- [ ] Test de rate desactualizado (muestra advertencia pero permite)
- [ ] Test de rate fuera de rango (rechazado)
- [ ] Test de rate inválido (0, negativo, muy grande)
- [ ] Test de pago con USDT (token coincide con invoice)
- [ ] Test de pago con EURT (token coincide con invoice)
- [ ] Test de pago rechazado (token no coincide con invoice)
- [ ] Test de invoice rechazada (token no soportado)
- [ ] Test de compatibilidad (invoice sin paymentToken = USDT)
- [ ] Test de rate cambiando durante el proceso (rate se congela al crear invoice)

#### 2.7 Validación
- [ ] Ejecutar todos los tests
- [ ] Verificar que no se rompan tests existentes
- [ ] Verificar coverage

---

### **ETAPA 3: API REST para Consultar Rate** ⏱️ ~2-3 horas

#### 3.1 Crear estructura del proyecto API
- [ ] Crear directorio `oracle/api/`
- [ ] Inicializar proyecto Node.js/TypeScript
- [ ] Configurar dependencias (Express, ethers.js)
- [ ] Configurar TypeScript

#### 3.2 Implementar API
- [ ] Crear `oracle/api/src/index.ts` (servidor Express)
- [ ] Crear `oracle/api/src/routes/rate.ts` (endpoints)
- [ ] Crear `oracle/api/src/lib/ethers.ts` (utilidades)
- [ ] Endpoint GET `/rate` - Obtener rate actual
- [ ] Endpoint GET `/rate/convert` - Convertir montos
- [ ] Endpoint GET `/rate/valid` - Verificar si rate es válido
- [ ] Agregar manejo de errores
- [ ] Agregar CORS

#### 3.3 Configuración
- [ ] Variables de entorno (`.env`)
- [ ] Puerto del servidor (ej: 3003)
- [ ] Dirección del contrato oráculo
- [ ] RPC URL

#### 3.4 Documentación
- [ ] Crear `oracle/api/README.md`
- [ ] Documentar endpoints
- [ ] Ejemplos de uso

#### 3.5 Validación
- [ ] Probar endpoints localmente
- [ ] Verificar respuestas correctas
- [ ] Probar con rate actualizado y desactualizado

---

### **ETAPA 4: Scripts de Actualización del Rate** ⏱️ ~2 horas

#### 4.1 Crear estructura de scripts
- [ ] Crear directorio `oracle/scripts/`
- [ ] Inicializar proyecto Node.js/TypeScript
- [ ] Configurar dependencias (ethers.js, axios)

#### 4.2 Script de obtención de rate
- [ ] Crear `oracle/scripts/fetch-rate.ts`
- [ ] Integrar con API de tipo de cambio (exchangerate-api.com)
- [ ] Función para obtener rate EUR/USD
- [ ] Manejo de errores
- [ ] Validación de datos

#### 4.3 Script de actualización
- [ ] Crear `oracle/scripts/update-rate.ts`
- [ ] Conectar con el contrato
- [ ] Obtener rate actual desde API
- [ ] Comparar con rate actual en blockchain
- [ ] Actualizar si hay diferencia significativa (>0.1%)
- [ ] Logging de operaciones

#### 4.4 Configuración
- [ ] Variables de entorno
- [ ] API key para tipo de cambio (si es necesario)
- [ ] Private key para firmar transacciones
- [ ] RPC URL

#### 4.5 Automatización (opcional)
- [ ] Crear script de cron job
- [ ] Configurar ejecución periódica (cada 6 horas)
- [ ] Agregar logging

#### 4.6 Validación
- [ ] Probar script manualmente
- [ ] Verificar actualización en blockchain
- [ ] Probar con diferentes rates

---

### **ETAPA 5: Integración Frontend - Web Customer** ⏱️ ~4-5 horas

#### 5.1 Utilidades del oráculo
- [ ] Crear `web-customer/lib/exchangeRate.ts`
- [ ] Función `getExchangeRate()`
- [ ] Función `convertEURTtoUSDT()`
- [ ] Función `convertUSDTtoEURT()`
- [ ] Manejo de errores

#### 5.2 Hook useExchangeRate
- [ ] Crear `web-customer/hooks/useExchangeRate.ts`
- [ ] Estado del rate
- [ ] Cargar rate al montar
- [ ] Actualizar rate periódicamente (cada 5 minutos)
- [ ] Funciones de conversión
- [ ] Manejo de estados (loading, error)

#### 5.3 Hook useTokens
- [ ] Crear `web-customer/hooks/useTokens.ts`
- [ ] Cargar tokens soportados
- [ ] Obtener balances de tokens
- [ ] Obtener allowances
- [ ] Función para aprobar tokens
- [ ] Selección de token activo

#### 5.4 Componente CurrencySelector
- [ ] Crear `web-customer/components/CurrencySelector.tsx`
- [ ] Mostrar tokens disponibles
- [ ] Selección de moneda
- [ ] Mostrar balances
- [ ] Indicadores de saldo suficiente
- [ ] Indicadores de aprobación necesaria

#### 5.5 Componente PriceConverter
- [ ] Crear `web-customer/components/PriceConverter.tsx`
- [ ] Mostrar precio en moneda base
- [ ] Mostrar precio equivalente
- [ ] Mostrar rate actual
- [ ] Indicador de rate válido/desactualizado

#### 5.6 Actualizar useEcommerce
- [ ] Agregar función `getSupportedTokens()` (retorna array de tokens)
- [ ] Modificar `createInvoice()` para aceptar:
   - `companyId` (bigint)
   - `paymentToken` (string address)
   - Calcular y pasar `expectedTotalUSDT` (total del carrito en USDT)
- [ ] Modificar `processPayment()` - NO necesita token (lo lee de la invoice)
- [ ] Agregar función helper para obtener token de una invoice
- [ ] Agregar función para validar rate antes de crear invoice

#### 5.7 Actualizar página principal
- [ ] Modificar `web-customer/app/page.tsx`
- [ ] Agregar selector de moneda preferida
- [ ] Mostrar precios en moneda seleccionada
- [ ] Integrar PriceConverter

#### 5.8 Actualizar página de carrito (CRÍTICO)
- [ ] Modificar `web-customer/app/cart/page.tsx`
- [ ] Agregar CurrencySelector ANTES del botón de checkout
- [ ] Obtener rate del oráculo usando useExchangeRate
- [ ] Validar que el rate esté actualizado (< 24 horas) - mostrar advertencia si no
- [ ] Validar que el rate esté en rango razonable (0.8 - 1.5)
- [ ] **IMPORTANTE**: El carrito siempre almacena precios en USDT (base)
- [ ] Convertir total del carrito (en USDT base) a la moneda seleccionada SOLO para visualización
- [ ] Mostrar total convertido en la moneda seleccionada
- [ ] Mostrar equivalente en la otra moneda (para referencia)
- [ ] Validar balance del token seleccionado antes de permitir checkout
- [ ] Al crear invoice:
   - Pasar el token seleccionado como parámetro
   - Pasar el total del carrito en USDT (expectedTotalUSDT) - NO el convertido
   - El contrato convertirá usando el oráculo on-chain
- [ ] Guardar moneda seleccionada en localStorage para persistencia
- [ ] Manejar errores: si el oráculo no está disponible, mostrar solo USDT

#### 5.9 Actualizar ProductCard
- [ ] Modificar `web-customer/components/ProductCard.tsx`
- [ ] Mostrar precio en moneda seleccionada
- [ ] Mostrar equivalente en otra moneda

#### 5.10 Actualizar ProductDetailModal
- [ ] Modificar `web-customer/components/ProductDetailModal.tsx`
- [ ] Mostrar conversión de precios
- [ ] Integrar selector de moneda

#### 5.11 Variables de entorno
- [ ] Agregar `NEXT_PUBLIC_EXCHANGE_RATE_ORACLE_ADDRESS`
- [ ] Verificar `NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS`
- [ ] Agregar `NEXT_PUBLIC_ORACLE_API_URL` (opcional)

#### 5.12 Actualizar contracts.ts
- [ ] Agregar ABI del oráculo
- [ ] Agregar funciones necesarias

#### 5.13 Validación
- [ ] Probar selección de moneda
- [ ] Probar conversión de precios
- [ ] Probar pago con EURT
- [ ] Probar pago con USDT
- [ ] Verificar UI/UX

---

### **ETAPA 6: Integración Frontend - Pasarela de Pago** ⏱️ ~3-4 horas

#### 6.1 Actualizar PaymentProcessor.tsx (CRÍTICO)
- [ ] Modificar `stablecoin/pasarela-de-pago/components/PaymentProcessor.tsx`
- [ ] Leer `paymentToken` de la invoice usando el contrato Ecommerce
- [ ] Remover bloqueo hardcoded de EURT (líneas 83-86, 324)
- [ ] Usar el token de la invoice en lugar de `usdTokenAddress` hardcoded
- [ ] Permitir aprobación de cualquier token soportado (no solo USDT)
- [ ] Validar que el balance corresponda al token de la invoice
- [ ] Mostrar monto y símbolo según el token de la invoice
- [ ] Actualizar `processPayment` para usar el token de la invoice (no como parámetro)

#### 6.2 Actualizar WalletInfo.tsx
- [ ] Modificar selector de token para mostrar el token de la invoice por defecto
- [ ] Permitir cambiar de token solo si no se ha iniciado el pago
- [ ] Mostrar advertencia si el token seleccionado no coincide con la invoice

#### 6.3 Actualizar contracts.ts
- [ ] Agregar función `getInvoice()` al ABI si no existe
- [ ] Agregar función `getSupportedTokens()` al ABI
- [ ] Agregar funciones del oráculo

#### 6.4 Variables de entorno
- [ ] Agregar `NEXT_PUBLIC_EXCHANGE_RATE_ORACLE_ADDRESS`
- [ ] Verificar `NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS`

#### 6.5 Validación
- [ ] Probar pago con EURT (invoice creada con EURT)
- [ ] Probar pago con USDT (invoice creada con USDT)
- [ ] Probar error si token no coincide con invoice
- [ ] Verificar que se muestre el token correcto según la invoice

---

### **ETAPA 7: Documentación y Testing** ⏱️ ~2-3 horas

#### 7.1 Documentación del oráculo
- [x] Crear `oracle/README.md`
- [x] Explicar funcionamiento
- [x] Documentar funciones principales
- [x] Ejemplos de uso

#### 7.2 Actualizar documentación existente
- [x] Actualizar `VARIABLES_ENTORNO.md`
- [x] Agregar variables del oráculo
- [x] Actualizar `DEPLOYMENT.md`
- [x] Agregar pasos de deploy del oráculo

#### 7.3 Testing end-to-end
- [x] Test completo de flujo multimoneda (implementado en etapas anteriores)
- [x] Test de actualización de rate (script `update-rate-manual.js`)
- [x] Test de conversión de precios (implementado en frontend)
- [x] Test de pagos en ambas monedas (implementado y probado)

#### 7.4 Validación final
- [x] Verificar todos los tests pasan (`forge test` en oracle/sc)
- [x] Verificar coverage adecuado (tests unitarios completos)
- [x] Revisar documentación (READMEs actualizados)
- [x] Probar deploy completo (integrado en `restart-all.sh`)

---

## 📊 Resumen de Archivos

### Nuevos Archivos a Crear (23 archivos)

#### Smart Contracts
1. `oracle/sc/src/ExchangeRateOracle.sol`
2. `oracle/sc/test/ExchangeRateOracle.t.sol`
3. `oracle/sc/script/DeployExchangeRateOracle.s.sol`
4. `oracle/sc/foundry.toml`
5. `oracle/sc/README.md`

#### API
6. `oracle/api/src/index.ts`
7. `oracle/api/src/routes/rate.ts`
8. `oracle/api/src/lib/ethers.ts`
9. `oracle/api/package.json`
10. `oracle/api/tsconfig.json`
11. `oracle/api/README.md`
12. `oracle/api/.env.example`

#### Scripts
13. `oracle/scripts/update-rate.ts`
14. `oracle/scripts/fetch-rate.ts`
15. `oracle/scripts/package.json`
16. `oracle/scripts/tsconfig.json`
17. `oracle/scripts/.env.example`

#### Frontend
18. `web-customer/lib/exchangeRate.ts`
19. `web-customer/hooks/useExchangeRate.ts`
20. `web-customer/hooks/useTokens.ts`
21. `web-customer/components/CurrencySelector.tsx`
22. `web-customer/components/PriceConverter.tsx`

#### Documentación
23. `oracle/README.md`

### Archivos a Modificar (17 archivos)

#### Smart Contracts
1. `sc-ecommerce/src/libraries/Types.sol`
2. `sc-ecommerce/src/libraries/PaymentLib.sol`
3. `sc-ecommerce/src/libraries/InvoiceLib.sol`
4. `sc-ecommerce/src/Ecommerce.sol`
5. `sc-ecommerce/test/Ecommerce.t.sol`
6. `sc-ecommerce/script/DeployEcommerce.s.sol`

#### Frontend
7. `web-customer/lib/contracts.ts`
8. `web-customer/hooks/useEcommerce.ts`
9. `web-customer/app/page.tsx`
10. `web-customer/app/cart/page.tsx`
11. `web-customer/components/ProductCard.tsx`
12. `web-customer/components/ProductDetailModal.tsx`

#### Pasarela
13. `stablecoin/pasarela-de-pago/components/PaymentProcessor.tsx` (CRÍTICO)
14. `stablecoin/pasarela-de-pago/components/WalletInfo.tsx`
15. `stablecoin/pasarela-de-pago/lib/contracts.ts`

#### Documentación
16. `VARIABLES_ENTORNO.md`
17. `DEPLOYMENT.md`

---

## 🔧 Variables de Entorno Necesarias

### Oráculo - Smart Contract
```bash
# .env en oracle/sc/
PRIVATE_KEY=0x...                    # Para deploy
RPC_URL=http://localhost:8545        # RPC URL
USDT_TOKEN_ADDRESS=0x...             # Dirección USDToken
EURT_TOKEN_ADDRESS=0x...             # Dirección EURToken
INITIAL_RATE=1100000                 # Rate inicial (1.10 = 1,100,000)
```

### Oráculo - API
```bash
# .env en oracle/api/
PORT=3003                            # Puerto del servidor
ORACLE_CONTRACT_ADDRESS=0x...        # Dirección del contrato oráculo
RPC_URL=http://localhost:8545        # RPC URL
```

### Oráculo - Scripts
```bash
# .env en oracle/scripts/
PRIVATE_KEY=0x...                    # Para firmar transacciones
ORACLE_CONTRACT_ADDRESS=0x...        # Dirección del contrato oráculo
RPC_URL=http://localhost:8545        # RPC URL
EXCHANGE_RATE_API_KEY=...            # API key (opcional)
EXCHANGE_RATE_API_URL=https://api.exchangerate-api.com/v4/latest/EUR
```

### Frontend - Web Customer
```bash
# .env.local en web-customer/
NEXT_PUBLIC_EXCHANGE_RATE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ORACLE_API_URL=http://localhost:6005  # Opcional
```

### Frontend - Pasarela
```bash
# .env.local en stablecoin/pasarela-de-pago/
NEXT_PUBLIC_EXCHANGE_RATE_ORACLE_ADDRESS=0x...
NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=0x...
```

---

## 📝 Consideraciones Importantes

### 1. **Rate de Conversión**
- El rate se almacena en 6 decimales (ej: 1,100,000 = 1.10 USD/EUR)
- El rate debe actualizarse periódicamente (recomendado cada 6-12 horas)
- El rate es válido si tiene menos de 24 horas desde la última actualización

### 2. **Conversión de Precios (Validación Dual)**

**Principio Fundamental:**
- El carrito SIEMPRE almacena precios en USDT (fuente de verdad)
- La conversión en frontend es SOLO para visualización
- El contrato calcula el total en USDT desde el carrito (validación on-chain)
- El frontend pasa el total esperado en USDT para validación
- Si paymentToken != USDT, el contrato convierte usando el oráculo on-chain

**Flujo de Validación:**
1. Frontend calcula total del carrito en USDT
2. Frontend muestra conversión para visualización (usando rate del oráculo)
3. Al crear invoice, frontend pasa:
   - `paymentToken`: Token seleccionado
   - `expectedTotalUSDT`: Total calculado en USDT
4. Contrato:
   - Calcula total en USDT desde el carrito
   - Valida que coincida con `expectedTotalUSDT` (tolerancia: ±0.1% o 100 unidades base)
   - Si paymentToken != USDT, convierte usando oráculo on-chain
   - Crea invoice con monto convertido

**Tolerancia de Redondeo:**
- ±0.1% del total calculado
- O 100 unidades base (el mayor)
- Ejemplo: Total = 100,000 USDT → Tolerancia = 100 USDT (0.1%)
- Ejemplo: Total = 50,000 USDT → Tolerancia = 100 USDT (mayor que 50)

### 3. **Flujo de Pagos (Usuario elige moneda)**

**Flujo Completo:**
1. Usuario elige la moneda ANTES de crear la invoice (en el carrito)
2. Frontend calcula total del carrito en USDT (base)
3. Frontend muestra conversión para visualización (usando rate del oráculo)
4. Usuario confirma → Se crea invoice con:
   - `paymentToken`: Token seleccionado
   - `expectedTotalUSDT`: Total calculado en USDT (para validación)
   - Contrato valida y convierte on-chain si es necesario
5. El rate se "congela" al momento de crear la invoice
6. Usuario redirige a la pasarela de pago
7. Pasarela lee el token de la invoice y muestra los detalles
8. Usuario aprueba y paga con el token correcto
9. Contrato valida:
   - Token usado = Token de invoice ✅
   - Monto = Monto de invoice ✅
   - Procesa pago ✅
10. Si el token no coincide, la transacción se rechaza

**Importante:**
- El rate usado es el del momento de creación de invoice (se congela)
- Si el rate cambia después, no afecta la invoice ya creada
- El contrato valida el rate al crear la invoice (debe estar actualizado < 24 horas)

### 4. **Actualización del Rate**
- El rate se puede actualizar manualmente llamando `updateRate()`
- Se recomienda usar el script automático
- El script puede ejecutarse periódicamente con cron

### 5. **APIs de Tipo de Cambio**
Opciones disponibles:
- **exchangerate-api.com** (gratis, sin API key)
- **fixer.io** (requiere API key, más preciso)
- **exchangerate.host** (gratis)
- **coinbase API** (gratis, limitado)

### 6. **Redes y Deployment**
- El oráculo debe desplegarse antes del contrato Ecommerce
- La dirección del oráculo se pasa al constructor de Ecommerce
- Funciona en cualquier red (local, testnet, mainnet)

---

## ⏱️ Estimación de Tiempo Total

| Etapa | Tiempo Estimado |
|-------|----------------|
| Etapa 1: Smart Contract Oráculo | 2-3 horas |
| Etapa 2: Integración Ecommerce | 3-4 horas |
| Etapa 3: API REST | 2-3 horas |
| Etapa 4: Scripts Actualización | 2 horas |
| Etapa 5: Frontend Web Customer | 4-5 horas |
| Etapa 6: Frontend Pasarela | 3-4 horas |
| Etapa 7: Documentación y Testing | 2-3 horas |
| **TOTAL** | **18-24 horas** |

---

## ✅ Checklist de Implementación

### Preparación
- [ ] Revisar estructura del proyecto actual
- [ ] Crear directorio `oracle/`
- [ ] Configurar entornos de desarrollo

### Smart Contracts
- [ ] Implementar ExchangeRateOracle
- [ ] Tests del oráculo
- [ ] Integrar con Ecommerce
- [ ] Tests de integración
- [ ] Deploy en local

### Backend
- [ ] Implementar API REST
- [ ] Scripts de actualización
- [ ] Probar funcionamiento

### Frontend
- [ ] Componentes de UI
- [ ] Hooks y utilidades
- [ ] Integración con páginas
- [ ] Testing manual

### Documentación
- [ ] Documentar oráculo
- [ ] Actualizar guías existentes
- [ ] Crear ejemplos

### Deployment
- [ ] Deploy en testnet
- [ ] Verificar funcionamiento
- [ ] Actualizar variables de entorno

---

## 🚨 Riesgos y Mitigaciones

### Riesgo 1: Rate Desactualizado
- **Mitigación:** Validación de rate válido (< 24 horas) y alertas

### Riesgo 2: Error en Conversión
- **Mitigación:** Validación dual (on-chain + off-chain), tests exhaustivos, tolerancia de redondeo

### Riesgo 3: Falta de Balance
- **Mitigación:** Validación en frontend antes de permitir pago

### Riesgo 4: Actualización Frecuente
- **Mitigación:** Script automático con logging y manejo de errores

### Riesgo 5: Manipulación de Montos
- **Mitigación:** Validación dual del total (on-chain siempre calcula desde carrito)

### Riesgo 6: Rate Desactualizado Durante Proceso
- **Mitigación:** Rate se congela al crear invoice, validación de rate actualizado

---

## 📚 Referencias

- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)
- [Foundry Documentation](https://book.getfoundry.sh/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Exchange Rate API](https://www.exchangerate-api.com/docs)

---

## 📅 Orden de Implementación Recomendado

1. **Etapa 1** - Smart Contract Oráculo (base del sistema)
2. **Etapa 2** - Integración Ecommerce (conexión con sistema existente)
   - **IMPORTANTE**: Modificar `createInvoice` y `processPayment` correctamente
3. **Etapa 4** - Scripts Actualización (para mantener rate actualizado)
4. **Etapa 3** - API REST (opcional, para consultas externas)
5. **Etapa 5** - Frontend Web Customer (interfaz principal)
   - **CRÍTICO**: Implementar selección de moneda ANTES de crear invoice
   - **CRÍTICO**: Convertir total del carrito antes de crear invoice
6. **Etapa 6** - Frontend Pasarela (complementario)
   - **CRÍTICO**: Remover bloqueos de EURT
   - **CRÍTICO**: Leer token de la invoice y usarlo
7. **Etapa 7** - Documentación y Testing (cierre)
   - Testing end-to-end completo del flujo multimoneda

---

---

## ⚠️ Puntos Críticos de Implementación

### **1. Flujo de Creación de Invoice**

**❌ INCORRECTO:**
```solidity
// Crear invoice con monto en USDT
createInvoice(companyId) 
// Luego intentar pagar con EURT
```

**✅ CORRECTO:**
```solidity
// Usuario elige EURT en frontend
// Frontend calcula total: 100 USDT (desde carrito)
// Frontend muestra conversión: 100 USDT * 1.10 = 110 EURT (solo visualización)
// Crear invoice con:
createInvoice(
    companyId,
    paymentToken: EURT_ADDRESS,
    expectedTotalUSDT: 100 USDT  // Para validación, NO el convertido
)
// Contrato:
// 1. Calcula total desde carrito: 100 USDT
// 2. Valida que coincida con expectedTotalUSDT (tolerancia)
// 3. Convierte usando oráculo: 100 USDT * rate = 110 EURT
// 4. Crea invoice con monto: 110 EURT
// Pago con EURT que coincide
```

### **2. Validación en processPayment**

**❌ INCORRECTO:**
```solidity
function processPayment(uint256 invoiceId, address tokenAddress) {
    // Usar tokenAddress del parámetro
}
```

**✅ CORRECTO:**
```solidity
function processPayment(uint256 invoiceId) {
    Invoice memory invoice = getInvoice(invoiceId);
    address tokenAddress = invoice.paymentToken != address(0) 
        ? invoice.paymentToken 
        : defaultToken; // USDT para compatibilidad
    
    // Usar tokenAddress de la invoice
    // Validar que el token usado coincida
}
```

### **3. Pasarela de Pago**

**❌ INCORRECTO:**
```typescript
const paymentTokenAddress = usdTokenAddress; // Siempre USDT
if (tokenType !== 'USDT') {
    // Bloquear EURT
}
```

**✅ CORRECTO:**
```typescript
// Leer token de la invoice
const invoice = await ecommerceContract.getInvoice(invoiceId);
const paymentTokenAddress = invoice.paymentToken || usdTokenAddress;

// Permitir cualquier token soportado
// Validar que coincida con la invoice
```

---

## 🔄 Flujo Completo Diagramado

```
Usuario en Web-Customer
    ↓
1. Selecciona productos (precios en USDT)
    ↓
2. Selecciona moneda preferida (USDT o EURT)
    ↓
3. Frontend consulta oráculo → Obtiene rate (ej: 1.10)
    ↓
4. Frontend calcula total del carrito: 200 USDT (base)
   Frontend muestra conversión: 200 USDT → 220 EURT (solo visualización)
    ↓
5. Usuario va a checkout → Ve total convertido para visualización
    ↓
6. Usuario confirma → Se crea invoice:
   createInvoice(
       companyId,
       paymentToken: EURT_ADDRESS,
       expectedTotalUSDT: 200 USDT  // Para validación
   )
   Contrato:
   - Calcula total desde carrito: 200 USDT ✅
   - Valida que coincida con expectedTotalUSDT ✅
   - Convierte usando oráculo: 200 * 1.10 = 220 EURT
   - Crea invoice con monto: 220 EURT
    ↓
7. Usuario redirige a pasarela → Pasarela lee invoice
    ↓
8. Pasarela muestra:
   - Monto: 220 EURT
   - Token: EURT
   - Balance EURT del usuario
    ↓
9. Usuario aprueba EURT → processPayment(invoiceId)
    ↓
10. Contrato valida:
    - Token usado = Token de invoice ✅
    - Monto = Monto de invoice ✅
    - Procesa pago ✅
```

---

## 🔒 Seguridad y Validaciones Críticas

### **Validación Dual del Total (Implementada)**

Esta es la protección más importante contra manipulación:

1. **Frontend calcula total** en USDT desde el carrito
2. **Frontend pasa total esperado** como `expectedTotalUSDT`
3. **Contrato calcula total** en USDT desde el carrito (on-chain)
4. **Contrato valida** que ambos coincidan (con tolerancia)
5. **Contrato convierte** usando oráculo on-chain si es necesario

**Por qué es seguro:**
- El contrato SIEMPRE calcula el total desde el carrito (fuente de verdad)
- Un atacante no puede pasar un monto menor porque el contrato lo valida
- La conversión se hace on-chain usando el oráculo (no confiable en frontend)

### **Tolerancia de Redondeo**

**Fórmula:**
```
tolerancia = max(calculatedTotalUSDT * 1000 / 1000000, 100)
// Ejemplo: 100,000 USDT → tolerancia = 100 USDT (0.1%)
// Ejemplo: 50,000 USDT → tolerancia = 100 USDT (mayor que 50)
```

**Validación:**
```solidity
uint256 difference = expectedTotalUSDT > calculatedTotalUSDT
    ? expectedTotalUSDT - calculatedTotalUSDT
    : calculatedTotalUSDT - expectedTotalUSDT;
    
uint256 tolerance = calculatedTotalUSDT * 1000 / 1000000;
if (tolerance < 100) tolerance = 100;

require(difference <= tolerance, "Ecommerce: total mismatch");
```

### **Validación de Rate**

**Límites:**
- Rate debe estar entre 0.8 y 1.5 (prevenir valores extremos)
- Rate debe estar actualizado (< 24 horas desde última actualización)
- Si rate está desactualizado, se permite pero con advertencia

**Validación:**
```solidity
require(rate >= 8e5 && rate <= 15e5, "Ecommerce: rate out of range"); // 0.8 - 1.5
require(oracle.isRateValid(), "Ecommerce: rate outdated"); // < 24 hours
```

---

## ✅ Estado Final del Plan

**Evaluación Post-Correcciones: 8.5/10** ✅

### **Problemas Críticos Resueltos:**
- ✅ Conflicto de cálculo del total → **RESUELTO**: Validación dual implementada
- ✅ Falta de validación de integridad → **RESUELTO**: Validación con tolerancia especificada
- ✅ Redondeo injusto → **RESUELTO**: Política de redondeo estándar
- ✅ Rate desactualizado → **RESUELTO**: Congelamiento y validación especificados

### **Plan Listo para Implementación:**
- ✅ Todas las validaciones críticas están especificadas
- ✅ Flujo completo está documentado
- ✅ Edge cases están identificados
- ✅ Tests necesarios están listados
- ✅ Seguridad está garantizada

**Nota:** Este plan está actualizado con validación dual y todas las correcciones de seguridad identificadas en la evaluación crítica. La lógica sigue el estándar moderno donde el usuario elige la moneda antes de crear la invoice, pero con validaciones on-chain robustas que previenen manipulación. Se recomienda implementar por etapas y validar cada una antes de continuar.

