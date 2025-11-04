# 🔮 Oracle de Tasa de Cambio - Multi-Moneda

Sistema completo de oráculo para gestión de tasa de conversión entre EURT (Euro Token) y USDT (USD Token) en el e-commerce blockchain.

## 📋 Descripción General

Este proyecto implementa un oráculo simple y centralizado para gestionar la tasa de conversión entre EURT y USDT, permitiendo pagos multi-moneda en el e-commerce. El sistema consta de tres componentes principales:

1. **Smart Contract**: Contrato Solidity que almacena y gestiona el rate on-chain
2. **API REST**: Servicio Node.js para consultar el rate off-chain
3. **Scripts de Actualización**: Herramientas para actualizar el rate automáticamente o manualmente

## 🏗️ Arquitectura

```
┌─────────────────┐
│  Smart Contract │ ← ExchangeRateOracle.sol
│  (On-Chain)     │   - Almacena rate
└────────┬────────┘   - Valida límites
         │            - Convierte montos
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────┐ ┌─────────────┐
│ API REST│ │   Scripts   │
│ (3001)  │ │  (Update)   │
└─────────┘ └─────────────┘
    │
    ▼
┌─────────────┐
│  Frontends  │
│ (Customer)  │
└─────────────┘
```

## 📁 Estructura del Proyecto

```
oracle/
├── sc/                    # Smart Contract
│   ├── src/
│   │   └── ExchangeRateOracle.sol
│   ├── test/
│   │   └── ExchangeRateOracle.t.sol
│   ├── script/
│   │   └── DeployExchangeRateOracle.s.sol
│   └── README.md
│
├── api/                   # API REST
│   ├── src/
│   │   ├── index.js
│   │   ├── services/
│   │   │   └── oracleService.js
│   │   └── middleware/
│   │       └── errorHandler.js
│   └── README.md
│
└── scripts/               # Scripts de actualización
    ├── src/
    │   ├── fetch-rate.js
    │   ├── update-rate.js
    │   └── update-rate-manual.js
    └── README.md
```

## 🚀 Inicio Rápido

### 1. Smart Contract

```bash
cd oracle/sc

# Instalar dependencias
forge install OpenZeppelin/openzeppelin-contracts

# Compilar
forge build

# Tests
forge test

# Deploy
export PRIVATE_KEY=0x...
export USDT_TOKEN_ADDRESS=0x...
export EURT_TOKEN_ADDRESS=0x...
export INITIAL_RATE=1100000  # 1.10 en 6 decimales
forge script script/DeployExchangeRateOracle.s.sol --rpc-url http://localhost:8545 --broadcast
```

Ver [oracle/sc/README.md](./sc/README.md) para más detalles.

### 2. API REST

```bash
cd oracle/api

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con RPC_URL, EXCHANGE_RATE_ORACLE_ADDRESS, etc.

# Iniciar servidor
npm start
```

La API estará disponible en `http://localhost:3001`.

Ver [oracle/api/README.md](./api/README.md) para más detalles.

### 3. Scripts de Actualización

```bash
cd oracle/scripts

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con RPC_URL, EXCHANGE_RATE_ORACLE_ADDRESS, PRIVATE_KEY, etc.

# Obtener rate desde API externa
npm run fetch-rate

# Actualizar rate desde API externa (solo si hay diferencia significativa)
npm run update-rate

# Actualizar rate manualmente
npm run update-rate-manual 1.10
```

Ver [oracle/scripts/README.md](./scripts/README.md) para más detalles.

## 🔧 Funcionalidades Principales

### Smart Contract

- **Almacenamiento de Rate**: Rate en 6 decimales (ej: 1,100,000 = 1.10 USD/EUR)
- **Conversión Bidireccional**: 
  - `convertEURTtoUSDT(uint256 eurtAmount)` → Convierte EURT a USDT
  - `convertUSDTtoEURT(uint256 usdtAmount)` → Convierte USDT a EURT
- **Validación de Rate**: 
  - Límites: 0.8 - 1.5 (prevenir valores extremos)
  - Validez temporal: < 24 horas desde última actualización
- **Control de Acceso**: Solo el owner puede actualizar el rate

### API REST

- **GET /health**: Health check
- **GET /api/rate**: Obtener rate actual
- **GET /api/rate/info**: Información completa del rate (validez, última actualización)
- **POST /api/convert**: Convertir montos entre USDT y EURT

### Scripts

- **fetch-rate**: Obtener rate desde API externa (solo lectura)
- **update-rate**: Actualizar rate desde API externa (solo si hay diferencia significativa)
- **update-rate-manual**: Actualizar rate especificando el valor directamente

## 📊 Flujo de Uso

### 1. Actualizar Rate

**Opción A: Automático (desde API externa)**
```bash
cd oracle/scripts
npm run update-rate
```

**Opción B: Manual**
```bash
cd oracle/scripts
npm run update-rate-manual 1.10
```

### 2. Consultar Rate

**Desde Frontend (via API)**
```typescript
const response = await fetch('http://localhost:3001/api/rate');
const { rate, rateDecimal } = await response.json();
```

**Desde Smart Contract (on-chain)**
```solidity
uint256 rate = oracle.getRate();
uint256 usdtAmount = oracle.convertEURTtoUSDT(eurtAmount);
```

### 3. Integración en E-commerce

El contrato `Ecommerce` usa el oráculo para:
- Validar conversiones durante la creación de invoices
- Convertir montos cuando el usuario elige EURT como moneda de pago
- Validar que el rate esté actualizado y en rango válido

## 🔒 Seguridad

### Validaciones Implementadas

1. **Límites de Rate**: 0.8 - 1.5 (previene valores extremos)
2. **Validez Temporal**: Rate debe estar actualizado (< 24 horas)
3. **Control de Acceso**: Solo owner puede actualizar
4. **Validación Dual**: El contrato Ecommerce valida el total calculado vs. esperado

### Recomendaciones

- ⚠️ **Nunca compartas tu PRIVATE_KEY**
- 🔐 Usa un wallet separado solo para el oráculo
- 📊 Monitorea las actualizaciones regularmente
- 🔄 Considera automatizar las actualizaciones (cron job)
- 🛡️ Para producción, considera usar un hardware wallet o multi-sig

## 📝 Variables de Entorno

### Smart Contract (Deploy)

- `PRIVATE_KEY`: Clave privada para firmar transacciones
- `USDT_TOKEN_ADDRESS`: Dirección del contrato USDToken
- `EURT_TOKEN_ADDRESS`: Dirección del contrato EURToken
- `INITIAL_RATE`: Rate inicial (opcional, default: 1,100,000 = 1.10)

### API REST

- `RPC_URL`: URL del RPC de la blockchain (default: http://localhost:8545)
- `EXCHANGE_RATE_ORACLE_ADDRESS`: Dirección del contrato Oracle (requerido)
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Entorno de ejecución (development/production)

### Scripts

- `RPC_URL`: URL del RPC de la blockchain (default: http://localhost:8545)
- `EXCHANGE_RATE_ORACLE_ADDRESS`: Dirección del contrato Oracle (requerido)
- `PRIVATE_KEY`: Private key del owner del contrato (requerido)
- `RATE_UPDATE_THRESHOLD`: Umbral de diferencia en % para actualizar (default: 0.1%)

## 🧪 Testing

### Smart Contract Tests

```bash
cd oracle/sc
forge test -vvv
```

### API Tests (Manual)

```bash
# Health check
curl http://localhost:3001/health

# Obtener rate
curl http://localhost:3001/api/rate

# Convertir monto
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{"from":"USDT","to":"EURT","amount":"100000000"}'
```

## 🔄 Automatización

### Cron Job (Actualización Automática)

Para actualizar el rate cada 6 horas:

```bash
# Editar crontab
crontab -e

# Agregar línea
0 */6 * * * cd /path/to/oracle/scripts && npm run update-rate >> /var/log/oracle-update.log 2>&1
```

## 📚 Documentación Adicional

- [Smart Contract README](./sc/README.md) - Documentación del contrato
- [API README](./api/README.md) - Documentación de la API REST
- [Scripts README](./scripts/README.md) - Documentación de los scripts
- [Plan de Implementación](../PLAN_ORACULO_MULTIMONEDA.md) - Plan completo del oráculo

## 🐛 Solución de Problemas

### Rate no se actualiza

- Verifica que el wallet sea el owner del contrato
- Verifica que el rate esté en el rango válido (0.8 - 1.5)
- Revisa los logs del script para ver errores

### API no responde

- Verifica que el servidor esté corriendo (`npm start`)
- Verifica que `RPC_URL` y `EXCHANGE_RATE_ORACLE_ADDRESS` estén correctos
- Revisa los logs del servidor para errores

### Conversiones incorrectas

- Verifica que el rate esté actualizado
- Verifica que los montos estén en el formato correcto (6 decimales)
- Revisa los logs del contrato para validaciones fallidas

## 📈 Próximos Pasos

- [ ] Implementar rate feed descentralizado (Chainlink)
- [ ] Agregar más validaciones de seguridad
- [ ] Implementar sistema de alertas para rate desactualizado
- [ ] Agregar dashboard de monitoreo
- [ ] Optimizar gas costs

## 📄 Licencia

MIT

