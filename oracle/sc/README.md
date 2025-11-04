# Oráculo de Tasa de Cambio - Smart Contract

Smart contract para gestionar la tasa de cambio entre EURT y USDT.

## Descripción

El contrato `ExchangeRateOracle` almacena y gestiona la tasa de conversión entre EURT (Euro Token) y USDT (USD Token), permitiendo conversiones on-chain y validaciones de integridad.

## Características

- **Almacenamiento de Rate**: Rate en 6 decimales (ej: 1,100,000 = 1.10 USD/EUR)
- **Conversión Bidireccional**: Convierte EURT → USDT y USDT → EURT
- **Validación de Rate**: Límites de rate razonables (0.8 - 1.5)
- **Validación de Actualización**: Rate debe estar actualizado (< 24 horas)
- **Control de Acceso**: Solo el owner puede actualizar el rate

## Funciones Principales

### `getRate()`
Obtiene el rate actual de conversión.

### `convertEURTtoUSDT(uint256 eurtAmount)`
Convierte una cantidad de EURT a USDT.

### `convertUSDTtoEURT(uint256 usdtAmount)`
Convierte una cantidad de USDT a EURT.

### `updateRate(uint256 newRate)`
Actualiza el rate (solo owner).

### `isRateValid()`
Verifica si el rate está actualizado (< 24 horas).

## Tests

```bash
forge test
```

Todos los tests deben pasar antes de hacer deploy.

## Deploy

```bash
# Configurar variables de entorno
export PRIVATE_KEY=0x...
export USDT_TOKEN_ADDRESS=0x...
export EURT_TOKEN_ADDRESS=0x...
export INITIAL_RATE=1100000  # Opcional, default: 1.10

# Deploy
forge script script/DeployExchangeRateOracle.s.sol --rpc-url http://localhost:8545 --broadcast
```

## Variables de Entorno

- `PRIVATE_KEY`: Clave privada para firmar transacciones
- `USDT_TOKEN_ADDRESS`: Dirección del contrato USDToken
- `EURT_TOKEN_ADDRESS`: Dirección del contrato EURToken
- `INITIAL_RATE`: Rate inicial (opcional, default: 1,100,000 = 1.10)

## Límites de Rate

- **Mínimo**: 0.8 (800,000 en 6 decimales)
- **Máximo**: 1.5 (1,500,000 en 6 decimales)

Estos límites previenen valores extremos que podrían indicar un error o manipulación.

## Validez del Rate

El rate se considera válido si tiene menos de 24 horas desde la última actualización. Esto asegura que el rate esté relativamente actualizado para las conversiones.

