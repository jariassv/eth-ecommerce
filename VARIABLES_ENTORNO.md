# 🔧 Variables de Entorno - Guía de Configuración

Este documento describe todas las variables de entorno necesarias para el proyecto.

## 📋 Resumen General

Las variables de entorno se configuran automáticamente por el script `restart-all.sh` para las direcciones de contratos. Sin embargo, algunas variables opcionales requieren configuración manual.

## 🔐 Variables por Aplicación

### 1. Compra Stablecoin (`stablecoin/compra-stableboin/.env.local`)

#### Requeridas (Configuradas automáticamente)
```bash
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...  # Configurado por restart-all.sh
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...   # Configurado por restart-all.sh
NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=0x...   # Configurado por restart-all.sh
NEXT_PUBLIC_RPC_URL=http://localhost:8545     # Configurado por restart-all.sh
NEXT_PUBLIC_CHAIN_ID=31337                    # Configurado por restart-all.sh
```

#### Opcionales (Configuración manual)
```bash
# Stripe - Requerido para compra de tokens
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URLs de las aplicaciones
NEXT_PUBLIC_APP_URL=http://localhost:6001
```

**Cómo obtener las keys de Stripe:**
1. Ve a https://dashboard.stripe.com/test/apikeys
2. Copia la "Publishable key" → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. Copia la "Secret key" → `STRIPE_SECRET_KEY`
4. Para webhooks, configura el endpoint en Stripe Dashboard y copia el secret → `STRIPE_WEBHOOK_SECRET`

### 2. Pasarela de Pago (`stablecoin/pasarela-de-pago/.env.local`)

#### Requeridas (Configuradas automáticamente)
```bash
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...  # Configurado por restart-all.sh
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...   # Configurado por restart-all.sh
NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=0x...   # Configurado por restart-all.sh
NEXT_PUBLIC_RPC_URL=http://localhost:8545     # Configurado por restart-all.sh
NEXT_PUBLIC_CHAIN_ID=31337                    # Configurado por restart-all.sh
```

#### Opcionales
```bash
NEXT_PUBLIC_APP_URL=http://localhost:6002
```

### 3. Web Admin (`web-admin/.env.local`)

#### Requeridas (Configuradas automáticamente)
```bash
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...  # Configurado por restart-all.sh
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...   # Configurado por restart-all.sh
NEXT_PUBLIC_RPC_URL=http://localhost:8545     # Configurado por restart-all.sh
NEXT_PUBLIC_CHAIN_ID=31337                    # Configurado por restart-all.sh
```

#### Opcionales (Configuración manual)
```bash
# IPFS/Pinata - Requerido para subir imágenes de productos
NEXT_PUBLIC_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# URL de la aplicación
NEXT_PUBLIC_APP_URL=http://localhost:6003
```

**Cómo obtener el JWT de Pinata:**
1. Ve a https://app.pinata.cloud/
2. Crea una cuenta o inicia sesión
3. Ve a "API Keys" → "New Key"
4. Activa permisos "Admin"
5. Copia el JWT → `NEXT_PUBLIC_PINATA_JWT`

**Nota:** Sin esta variable, puedes crear productos pero no podrás subir imágenes a IPFS.

### 4. Web Customer (`web-customer/.env.local`)

#### Requeridas (Configuradas automáticamente)
```bash
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...  # Configurado por restart-all.sh
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...   # Configurado por restart-all.sh
NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=0x...   # Configurado por restart-all.sh
NEXT_PUBLIC_ORACLE_API_URL=http://localhost:3001  # Configurado por restart-all.sh
NEXT_PUBLIC_RPC_URL=http://localhost:8545     # Configurado por restart-all.sh
NEXT_PUBLIC_CHAIN_ID=31337                    # Configurado por restart-all.sh
```

#### Opcionales
```bash
NEXT_PUBLIC_APP_URL=http://localhost:6004
NEXT_PUBLIC_PAYMENT_GATEWAY_URL=http://localhost:6002
```

### 5. Oracle API (`oracle/api/.env`)

#### Requeridas (Configuradas automáticamente)
```bash
RPC_URL=http://localhost:8545                 # Configurado por restart-all.sh
EXCHANGE_RATE_ORACLE_ADDRESS=0x...            # Configurado por restart-all.sh
PORT=3001                                     # Configurado por restart-all.sh
NODE_ENV=development                          # Configurado por restart-all.sh
```

### 6. Oracle Scripts (`oracle/scripts/.env`)

#### Requeridas (Configuradas automáticamente)
```bash
RPC_URL=http://localhost:8545                 # Configurado por restart-all.sh
EXCHANGE_RATE_ORACLE_ADDRESS=0x...            # Configurado por restart-all.sh
PRIVATE_KEY=0x...                             # Private key del owner del contrato Oracle
RATE_UPDATE_THRESHOLD=0.1                     # Umbral de diferencia en % para actualizar (default: 0.1%)
```

**Nota:** El `PRIVATE_KEY` debe ser del owner del contrato `ExchangeRateOracle` para poder actualizar el rate.

## 🔄 Configuración Automática

El script `restart-all.sh` configura automáticamente:

1. ✅ Direcciones de contratos (USDToken, EURToken, Ecommerce)
2. ✅ RPC URL (http://localhost:8545)
3. ✅ Chain ID (31337)
4. ✅ URLs de aplicaciones

**No necesitas configurar estas variables manualmente** si usas el script.

## ⚙️ Configuración Manual

Si necesitas configurar variables manualmente:

1. **Crea el archivo `.env.local`** en cada directorio de aplicación
2. **Copia las variables** de arriba
3. **Reemplaza los valores** con tus propias keys/configuraciones
4. **Reinicia la aplicación** (`npm run dev`)

## 🔒 Seguridad

### ⚠️ IMPORTANTE

- **NUNCA** subas archivos `.env.local` a Git
- **NUNCA** compartas tus keys privadas
- **Solo usa keys de test** para desarrollo local
- En producción, usa variables de entorno del servidor

### Variables Sensibles

Las siguientes variables son sensibles y deben mantenerse privadas:
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `NEXT_PUBLIC_PINATA_JWT`
- Cualquier private key de blockchain

## 🧪 Testing sin Servicios Externos

Puedes probar el sistema sin configurar Stripe o Pinata:

### Sin Stripe
- ❌ No podrás comprar tokens con tarjeta de crédito
- ✅ Puedes obtener tokens directamente en Anvil (para testing)
- ✅ Puedes usar el sistema de pagos con tokens

### Sin Pinata
- ❌ No podrás subir imágenes a IPFS
- ✅ Puedes crear productos sin imágenes
- ✅ El sistema funcionará normalmente

## 📝 Verificación

Para verificar que las variables están configuradas:

```bash
# Verificar variables en compra-stableboin
cd stablecoin/compra-stableboin
cat .env.local | grep STRIPE

# Verificar variables en web-admin
cd ../../web-admin
cat .env.local | grep PINATA

# Verificar direcciones de contratos
cat .env.local | grep CONTRACT_ADDRESS
```

## 🐛 Solución de Problemas

### Variables no se cargan

1. Verifica que el archivo se llama `.env.local` (no `.env`)
2. Verifica que está en el directorio correcto
3. Reinicia el servidor de Next.js (`Ctrl+C` y `npm run dev`)

### Variables no se actualizan

1. Elimina el archivo `.env.local`
2. Ejecuta `restart-all.sh` nuevamente
3. O edita manualmente el archivo

### Variables de contrato incorrectas

1. Ejecuta `restart-all.sh` para redeployar contratos
2. Verifica que Anvil está corriendo
3. Revisa los logs del script para ver las direcciones correctas

