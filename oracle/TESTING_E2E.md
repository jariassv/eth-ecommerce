# 🧪 Testing End-to-End - Oracle Multi-Moneda

Guía para realizar pruebas end-to-end del sistema de oráculo multi-moneda.

## 📋 Checklist de Testing

### 1. Smart Contract Tests

```bash
cd oracle/sc
forge test -vvv
```

**Tests a verificar:**
- ✅ Constructor con validaciones
- ✅ `updateRate()` con límites de rate
- ✅ `getRate()` retorna rate correcto
- ✅ `convertEURTtoUSDT()` y `convertUSDTtoEURT()` con diferentes montos
- ✅ `isRateValid()` verifica validez temporal
- ✅ Solo owner puede actualizar rate

### 2. API REST Tests

```bash
cd oracle/api
npm start
```

**Tests manuales:**

#### Health Check
```bash
curl http://localhost:6005/health
```

**Esperado:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Obtener Rate
```bash
curl http://localhost:6005/api/rate
```

**Esperado:**
```json
{
  "success": true,
  "rate": "1100000",
  "rateDecimal": 1.1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

#### Información Completa del Rate
```bash
curl http://localhost:6005/api/rate/info
```

**Esperado:**
```json
{
  "success": true,
  "rate": "1100000",
  "rateDecimal": 1.1,
  "lastUpdate": "1704067200",
  "lastUpdateDate": "2024-01-01T00:00:00.000Z",
  "isValid": true,
  "timeSinceUpdate": "3600",
  "timestamp": "2024-01-01T01:00:00.000Z"
}
```

#### Convertir Monto
```bash
curl -X POST http://localhost:6005/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "from": "USDT",
    "to": "EURT",
    "amount": "100000000"
  }'
```

**Esperado:**
```json
{
  "success": true,
  "from": "USDT",
  "to": "EURT",
  "amount": "100000000",
  "converted": "90909090",
  "rate": "1100000",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 3. Scripts de Actualización

#### Fetch Rate (solo lectura)
```bash
cd oracle/scripts
npm run fetch-rate
```

**Verificar:**
- ✅ Obtiene rate desde API externa
- ✅ Muestra rate en formato decimal
- ✅ Muestra rate en formato del contrato

#### Update Rate Manual
```bash
cd oracle/scripts
npm run update-rate-manual 1.10
```

**Verificar:**
- ✅ Valida que el rate esté en rango (0.8 - 1.5)
- ✅ Verifica ownership del contrato
- ✅ Muestra rate actual antes de actualizar
- ✅ Actualiza rate en el contrato
- ✅ Confirma actualización después de transacción

#### Update Rate Automático (desde API)
```bash
cd oracle/scripts
npm run update-rate
```

**Verificar:**
- ✅ Obtiene rate actual del contrato
- ✅ Obtiene rate desde API externa
- ✅ Compara ambos rates
- ✅ Solo actualiza si diferencia >= threshold
- ✅ Actualiza rate en el contrato si es necesario

### 4. Flujo Completo Multi-Moneda

#### Prerequisitos
1. Anvil corriendo
2. Contratos desplegados (USDToken, EURToken, Oracle, Ecommerce)
3. Oracle API corriendo
4. Web Customer corriendo

#### Test 1: Selección de Moneda en Header

1. **Abrir Web Customer** (http://localhost:6003)
2. **Conectar MetaMask**
3. **Verificar balance en header** (debe mostrar USDT por defecto)
4. **Hacer clic en selector de moneda**
5. **Seleccionar EURT**
6. **Verificar**:
   - ✅ Balance cambia a EURT
   - ✅ Precios de productos se actualizan a EURT
   - ✅ Precios muestran equivalente en USDT

#### Test 2: Agregar Producto al Carrito con EURT

1. **Seleccionar EURT en header**
2. **Agregar producto al carrito**
3. **Verificar**:
   - ✅ Precio del producto se muestra en EURT
   - ✅ Precio muestra equivalente en USDT
   - ✅ Total del carrito se muestra en EURT

#### Test 3: Checkout con EURT

1. **Ir al carrito** con productos agregados
2. **Verificar selector de moneda** (debe mantener EURT seleccionado)
3. **Verificar total** (debe estar en EURT)
4. **Verificar balance** (debe mostrar balance EURT)
5. **Completar checkout**:
   - ✅ Si no hay suficiente balance EURT, mostrar error
   - ✅ Si no hay aprobación, solicitar aprobación
   - ✅ Crear invoice con EURT como token de pago
   - ✅ Redirigir a pasarela de pago

#### Test 4: Pago en Pasarela con EURT

1. **Llegar a pasarela de pago** desde checkout
2. **Verificar**:
   - ✅ Monto se muestra en EURT
   - ✅ Token seleccionado es EURT
   - ✅ Balance EURT se muestra
3. **Aprobar EURT** (si es necesario)
4. **Procesar pago**:
   - ✅ Pago se procesa con EURT
   - ✅ Invoice se marca como pagada
   - ✅ Transacción se confirma

#### Test 5: Verificar Invoice en Mis Pedidos

1. **Regresar a Web Customer**
2. **Ir a "Mis Pedidos"**
3. **Verificar invoice**:
   - ✅ Invoice muestra monto en EURT
   - ✅ Invoice muestra `paymentToken` como EURT
   - ✅ Invoice muestra `expectedTotalUSDT` para validación

#### Test 6: Flujo Completo con USDT

Repetir tests 1-5 pero con USDT seleccionado:
- ✅ Verificar que todo funciona igual con USDT
- ✅ Verificar que no hay conversión cuando se usa USDT
- ✅ Verificar que invoice se crea con USDT

### 5. Validación de Seguridad

#### Test de Rate Desactualizado

1. **Actualizar rate manualmente** a uno viejo (hace > 24 horas)
2. **Intentar crear invoice con EURT**
3. **Verificar**:
   - ✅ Frontend muestra advertencia
   - ✅ Contrato valida rate (puede rechazar o permitir con advertencia)

#### Test de Rate Fuera de Rango

1. **Intentar actualizar rate a 0.5** (fuera de rango)
2. **Verificar**:
   - ✅ Script rechaza actualización
   - ✅ Contrato rechaza actualización

#### Test de Validación Dual

1. **Crear invoice con EURT**
2. **Verificar en logs del contrato**:
   - ✅ Contrato calcula total desde carrito
   - ✅ Contrato valida contra `expectedTotalUSDT`
   - ✅ Tolerancia de redondeo aplicada correctamente

### 6. Edge Cases

#### Test de Conversión con Redondeo

1. **Crear carrito con montos que generen redondeo**
2. **Seleccionar EURT**
3. **Verificar**:
   - ✅ Conversión redondea correctamente
   - ✅ Tolerancia permite pequeñas diferencias

#### Test de Cambio de Moneda en Medio del Flujo

1. **Agregar productos con USDT seleccionado**
2. **Cambiar a EURT en header**
3. **Ir al carrito**
4. **Verificar**:
   - ✅ Precios se actualizan a EURT
   - ✅ Total se recalcula correctamente

#### Test de Rate Cambia Durante Checkout

1. **Iniciar checkout con EURT**
2. **Actualizar rate manualmente** (en otra terminal)
3. **Completar checkout**
4. **Verificar**:
   - ✅ Rate se "congela" al crear invoice
   - ✅ Conversión usa rate al momento de crear invoice

## ✅ Checklist Final

- [ ] Todos los tests del smart contract pasan
- [ ] API REST responde correctamente a todos los endpoints
- [ ] Scripts de actualización funcionan correctamente
- [ ] Flujo completo multi-moneda funciona con EURT
- [ ] Flujo completo multi-moneda funciona con USDT
- [ ] Validaciones de seguridad funcionan
- [ ] Edge cases manejan correctamente
- [ ] Documentación está completa y actualizada

## 🐛 Problemas Comunes

### Rate no se actualiza
- Verificar que el wallet sea el owner
- Verificar que el rate esté en rango válido
- Revisar logs del script

### API no responde
- Verificar que el servidor esté corriendo
- Verificar variables de entorno
- Revisar logs del servidor

### Precios no se actualizan
- Verificar que el rate esté disponible
- Verificar que el frontend está consultando la API
- Revisar consola del navegador

### Invoice no se crea con EURT
- Verificar que el rate esté válido
- Verificar que el balance EURT sea suficiente
- Revisar logs del contrato para validaciones fallidas

