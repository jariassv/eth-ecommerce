# Oracle Scripts - Actualización de Rate

Scripts para actualizar el rate de conversión del oráculo desde APIs externas.

## Descripción

Estos scripts permiten:
- Obtener el rate EUR/USD desde una API externa
- Actualizar el rate en el contrato `ExchangeRateOracle`
- Validar que el rate esté en rangos razonables
- Solo actualizar si la diferencia es significativa

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
PRIVATE_KEY=0x...
RATE_UPDATE_THRESHOLD=0.1
```

## Uso

### Obtener Rate (solo lectura)

```bash
npm run fetch-rate
```

Obtiene el rate EUR/USD desde la API externa y muestra el resultado.

### Actualizar Rate

```bash
npm run update-rate
```

1. Obtiene el rate actual del contrato
2. Obtiene el nuevo rate desde la API externa
3. Compara ambos rates
4. Solo actualiza si la diferencia es >= `RATE_UPDATE_THRESHOLD` (default: 0.1%)
5. Envía la transacción para actualizar el rate

## Variables de Entorno

- `RPC_URL`: URL del RPC de la blockchain (default: http://localhost:8545)
- `EXCHANGE_RATE_ORACLE_ADDRESS`: Dirección del contrato ExchangeRateOracle (requerido)
- `PRIVATE_KEY`: Private key del owner del contrato (requerido)
- `RATE_UPDATE_THRESHOLD`: Umbral de diferencia en porcentaje para actualizar (default: 0.1%)

## Automatización

### Cron Job (Linux/Mac)

Para ejecutar el script cada 6 horas:

```bash
# Editar crontab
crontab -e

# Agregar línea (cada 6 horas)
0 */6 * * * cd /path/to/oracle/scripts && npm run update-rate >> /var/log/oracle-update.log 2>&1
```

### Systemd Timer (Linux)

Crear un servicio systemd para ejecutar periódicamente.

### Windows Task Scheduler

Crear una tarea programada en Windows Task Scheduler.

## Notas

- El script solo actualiza si la diferencia es >= al umbral configurado
- El rate se valida antes de actualizar (debe estar entre 0.8 y 1.5)
- Se requiere que el wallet sea el owner del contrato Oracle
- El script usa la API gratuita de exchangerate-api.com (no requiere API key para EUR/USD)

## Seguridad

⚠️ **IMPORTANTE**: 
- Nunca compartas tu `PRIVATE_KEY`
- Usa un wallet separado solo para el oráculo
- Considera usar un hardware wallet o wallet con múltiples firmas para producción
- Monitorea las transacciones regularmente

