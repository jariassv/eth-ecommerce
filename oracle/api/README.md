# Oracle API - REST API para Consultar Rate

API REST para consultar el rate de cambio del oráculo de multimoneda.

## Descripción

Esta API proporciona endpoints para consultar el rate de conversión entre EURT y USDT desde el contrato `ExchangeRateOracle` desplegado en la blockchain.

## Características

- Consulta del rate actual
- Información completa del rate (validez, última actualización)
- Conversión de montos entre USDT y EURT
- Manejo de errores robusto
- CORS habilitado para frontend

## Instalación

```bash
npm install
```

## Configuración

1. Copiar el archivo `.env.example` a `.env`:
```bash
cp .env.example .env
```

2. Configurar las variables de entorno en `.env`:
```env
RPC_URL=http://localhost:8545
EXCHANGE_RATE_ORACLE_ADDRESS=0x...
PORT=3001
NODE_ENV=development
```

## Uso

### Desarrollo
```bash
npm run dev
```

### Producción
```bash
npm start
```

La API estará disponible en `http://localhost:3001` (o el puerto configurado).

## Endpoints

### GET /health
Health check del servidor.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/rate
Obtener el rate actual de conversión.

**Response:**
```json
{
  "success": true,
  "rate": "1100000",
  "rateDecimal": 1.1,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### GET /api/rate/info
Obtener información completa del rate.

**Response:**
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

### POST /api/convert
Convertir un monto entre USDT y EURT.

**Request Body:**
```json
{
  "from": "USDT",
  "to": "EURT",
  "amount": "100000000"
}
```

**Response:**
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

## Variables de Entorno

- `RPC_URL`: URL del RPC de la blockchain (default: http://localhost:8545)
- `EXCHANGE_RATE_ORACLE_ADDRESS`: Dirección del contrato ExchangeRateOracle (requerido)
- `PORT`: Puerto del servidor (default: 3001)
- `NODE_ENV`: Entorno de ejecución (development/production)

## Notas

- Los montos se manejan en 6 decimales (ej: 100000000 = 100.000000)
- El rate se almacena en 6 decimales (ej: 1100000 = 1.10)
- La API consulta directamente el contrato en la blockchain, no cachea valores

