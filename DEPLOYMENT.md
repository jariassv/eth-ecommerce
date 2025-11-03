# 🚀 Guía de Deployment - E-Commerce Blockchain

Esta guía explica cómo desplegar y ejecutar el sistema completo de e-commerce blockchain.

## 📋 Requisitos Previos

### Software Necesario

1. **Node.js** v18.x o superior
   ```bash
   node --version  # Debe ser >= 18.0.0
   ```

2. **npm** o **yarn**
   ```bash
   npm --version
   ```

3. **Foundry** (para smart contracts)
   ```bash
   # Instalar Foundry
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   
   # Verificar instalación
   forge --version
   anvil --version
   cast --version
   ```

4. **Git**
   ```bash
   git --version
   ```

5. **MetaMask** (extensión del navegador)
   - Instalar desde [metamask.io](https://metamask.io)

### Servicios Externos (Opcionales)

1. **Stripe** (para compra de tokens)
   - Cuenta en [stripe.com](https://stripe.com)
   - API keys para desarrollo

2. **Pinata** (para IPFS)
   - Cuenta en [pinata.cloud](https://pinata.cloud)
   - JWT token para subir imágenes

## 🔧 Configuración Inicial

### 1. Clonar el Repositorio

```bash
git clone <repo-url>
cd 03-ECOMMERCE
```

### 2. Configurar MetaMask

1. Instalar MetaMask en tu navegador
2. Crear o importar una wallet
3. Configurar red local:
   - **Network Name**: Localhost 8545
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

4. Importar cuentas de Anvil:
   - Usar las private keys que Anvil genera (ver `restart-all.sh`)
   - La cuenta 0 es el owner por defecto

### 3. Variables de Entorno

El script `restart-all.sh` configura automáticamente las variables de entorno básicas. Sin embargo, para funcionalidades adicionales, necesitas configurar:

#### Stripe (Opcional - para compra de tokens)

Edita `stablecoin/compra-stableboin/.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### IPFS/Pinata (Opcional - para imágenes)

Edita `web-admin/.env.local`:
```bash
NEXT_PUBLIC_PINATA_JWT=tu_jwt_token_aqui
```

## 🚀 Deployment Automático

### Opción 1: Script Completo (Recomendado)

El script `restart-all.sh` automatiza todo el proceso:

```bash
chmod +x restart-all.sh
./restart-all.sh
```

Este script:
1. ✅ Detiene aplicaciones anteriores
2. ✅ Inicia Anvil (blockchain local)
3. ✅ Deploy USDToken
4. ✅ Deploy EURToken
5. ✅ Deploy Ecommerce
6. ✅ Actualiza variables de entorno en todas las apps
7. ✅ Instala dependencias (si es necesario)
8. ✅ Inicia todas las aplicaciones Next.js

### Opción 2: Deployment Manual

Si prefieres hacerlo paso a paso:

#### Paso 1: Iniciar Anvil

```bash
anvil --accounts 10 --balance 10000
```

#### Paso 2: Deploy Smart Contracts

En una nueva terminal:

```bash
# Deploy USDToken
cd stablecoin/sc
forge script script/DeployUSDToken.s.sol:DeployUSDToken --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy EURToken
forge script script/DeployEURToken.s.sol:DeployEURToken --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy Ecommerce
cd ../../sc-ecommerce
forge script script/DeployEcommerce.s.sol:DeployEcommerce --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

#### Paso 3: Configurar Variables de Entorno

Copia las direcciones de los contratos a los archivos `.env.local` de cada aplicación.

#### Paso 4: Instalar Dependencias e Iniciar Apps

```bash
# Compra Stablecoin
cd stablecoin/compra-stableboin
npm install
npm run dev

# Pasarela de Pago
cd ../pasarela-de-pago
npm install
npm run dev

# Web Admin
cd ../../web-admin
npm install
npm run dev

# Web Customer
cd ../web-customer
npm install
npm run dev
```

## 🌐 URLs de las Aplicaciones

Después del deployment, accede a:

| Aplicación | URL | Descripción |
|------------|-----|-------------|
| Anvil | http://localhost:8545 | Blockchain local |
| Compra Stablecoin | http://localhost:6001 | Compra tokens con Stripe |
| Pasarela de Pago | http://localhost:6002 | Pagos con tokens |
| Web Admin | http://localhost:6003 | Panel de administración |
| Web Customer | http://localhost:6004 | Tienda online |

## ✅ Verificación del Deployment

### 1. Verificar Anvil

```bash
curl http://localhost:8545 -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

Debería retornar un número de bloque.

### 2. Verificar Smart Contracts

Abre MetaMask y verifica que:
- La red local está conectada
- Tienes ETH en la cuenta (10000 ETH por defecto en Anvil)
- Los contratos están desplegados (ver direcciones en la consola)

### 3. Verificar Aplicaciones Web

1. Abre cada URL en el navegador
2. Conecta MetaMask cuando se solicite
3. Verifica que las aplicaciones cargan correctamente

## 🧪 Testing del Flujo Completo

### Flujo E2E Recomendado

1. **Compra de Tokens** (http://localhost:6001)
   - Conecta MetaMask
   - Selecciona cantidad y tipo de token (USDT/EURT)
   - Completa el pago con Stripe
   - Verifica que los tokens aparecen en tu wallet

2. **Registro de Empresa** (http://localhost:6003)
   - Conecta MetaMask con la cuenta owner
   - Registra una nueva empresa
   - Verifica que la empresa aparece en el dashboard

3. **Crear Productos** (http://localhost:6003)
   - Ve a la página de la empresa
   - Agrega productos con imágenes (IPFS)
   - Verifica que los productos se guardan correctamente

4. **Comprar Productos** (http://localhost:6004)
   - Navega a la tienda
   - Agrega productos al carrito
   - Completa el checkout
   - Verifica que se crea la factura

5. **Procesar Pago** (http://localhost:6002)
   - Aproba tokens si es necesario
   - Completa el pago
   - Verifica que la factura se marca como pagada

6. **Ver Analytics** (http://localhost:6003)
   - Ve al tab Analytics
   - Verifica que las métricas se actualizan
   - Revisa gráficos de ventas

7. **Gestionar Reviews** (http://localhost:6003)
   - Ve al tab Reviews
   - Verifica que las reviews aparecen (si hay)
   - Prueba los filtros

## 🐛 Solución de Problemas

### Anvil no inicia

```bash
# Verificar que el puerto 8545 está libre
lsof -i :8545

# Si hay un proceso, detenerlo
kill -9 <PID>
```

### Contratos no se despliegan

- Verifica que Anvil está corriendo
- Verifica que la private key es correcta
- Revisa los logs de Forge

### Aplicaciones no cargan

- Verifica que todas las dependencias están instaladas (`npm install`)
- Verifica que las variables de entorno están configuradas
- Revisa la consola del navegador para errores
- Verifica que MetaMask está conectado

### Imágenes IPFS no cargan

- Verifica que `NEXT_PUBLIC_PINATA_JWT` está configurado
- Revisa que el hash IPFS se guardó correctamente
- Prueba con diferentes gateways IPFS (hay fallback automático)

### Errores de wallet

- Verifica que MetaMask está instalado
- Verifica que la red local está configurada (Chain ID 31337)
- Verifica que estás usando la cuenta correcta
- Intenta recargar la página

## 🔄 Reiniciar el Sistema

Para reiniciar todo:

```bash
# Detener todos los procesos
pkill -f "next dev"
pkill -f "anvil"

# Ejecutar el script nuevamente
./restart-all.sh
```

## 📝 Notas Importantes

1. **Anvil reinicia el blockchain** cada vez que se inicia, así que todos los contratos y datos se pierden.

2. **Para producción**, necesitarás:
   - Una red blockchain real (mainnet, testnet)
   - Variables de entorno seguras
   - HTTPS configurado
   - Webhooks de Stripe configurados correctamente

3. **Las private keys en el script son solo para desarrollo**. NUNCA uses estas keys en producción.

4. **El script `restart-all.sh`** está diseñado para desarrollo local. Para producción, usa un proceso de deployment más robusto.

## 🎯 Próximos Pasos

- [ ] Configurar CI/CD
- [ ] Agregar más tests E2E
- [ ] Documentar APIs
- [ ] Configurar monitoreo
- [ ] Preparar deployment a testnet

