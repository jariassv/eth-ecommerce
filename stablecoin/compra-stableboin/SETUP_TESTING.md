# Guía Paso a Paso para Testing

Esta guía te ayudará a configurar y probar la aplicación de compra de tokens.

## Prerrequisitos

- Foundry instalado (anvil, forge)
- Node.js v18+ instalado
- Cuenta de Stripe (gratuita)
- MetaMask instalado en el navegador
- ngrok instalado (para webhook local)

## Paso 1: Levantar Blockchain Local (Anvil)

Abre una terminal y ejecuta:

```bash
# Desde la raíz del proyecto
cd /home/jarias/Documentos/CodeCrypto/05-EthereumPractice/03-ECOMMERCE

# Iniciar Anvil en una terminal
anvil
```

**Importante:** Anvil mostrará información importante:
- RPC URL: `http://127.0.0.1:8545`
- Cuentas con fondos (10 cuentas)
- **PRIVATE KEY** de la primera cuenta (la usarás como OWNER_PRIVATE_KEY)

**Ejemplo de salida:**
```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

Wallet
==================
Mnemonic: test test test test test test test test test test test junk
Base HD Path: m/44'/60'/0'/0/{account_index}
```

**Guarda esta información:**
- La dirección de la cuenta 0 será el OWNER del contrato
- La private key será tu `OWNER_PRIVATE_KEY`
- La cuenta 1 o 2 será tu cuenta de prueba en MetaMask

---

## Paso 2: Desplegar Contrato USDToken

Abre una **nueva terminal** (deja Anvil corriendo):

```bash
# Desde la raíz del proyecto
cd /home/jarias/Documentos/CodeCrypto/05-EthereumPractice/03-ECOMMERCE

# Ir al directorio del contrato
cd stablecoin/sc

# Opción 1: Usar el script helper (más fácil)
# Reemplaza con la private key de la cuenta 0 de Anvil
./deploy-local.sh 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Opción 2: Deploy manual
forge script script/DeployUSDToken.s.sol \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  -vvv
```

**Guarda la dirección del contrato desplegado** (aparecerá en la salida):
```
USDToken deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Nota:** El script también hace mint de 1M USDT a la cuenta deployer (owner), lo cual está bien para testing.

---

## Paso 3: Configurar MetaMask

1. Abre MetaMask en tu navegador
2. Haz clic en la red actual y selecciona "Agregar red"
3. Configura una nueva red local:
   - **Nombre de la red:** Localhost 8545
   - **Nueva URL de RPC:** http://127.0.0.1:8545
   - **ID de cadena:** 31337
   - **Símbolo de moneda:** ETH
   - **URL del explorador de bloques:** (dejar en blanco)

4. Importa una cuenta de prueba:
   - Haz clic en el ícono de cuenta → "Importar cuenta"
   - Ingresa la **private key** de la cuenta 1 o 2 de Anvil
   - Esta será tu cuenta de cliente para comprar tokens

---

## Paso 4: Configurar Stripe

1. **Crear cuenta en Stripe:**
   - Ve a https://dashboard.stripe.com/register
   - Crea una cuenta (modo de prueba)

2. **Obtener API Keys:**
   - Ve a https://dashboard.stripe.com/test/apikeys
   - Copia:
     - **Publishable key** (empieza con `pk_test_`)
     - **Secret key** (empieza con `sk_test_`)

3. **Instalar Stripe CLI (opcional pero recomendado):**
   ```bash
   # En macOS con Homebrew
   brew install stripe/stripe-cli/stripe
   
   # En Linux
   wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_X.X.X_linux_x86_64.tar.gz
   tar -xzf stripe_X.X.X_linux_x86_64.tar.gz
   sudo mv stripe /usr/local/bin
   ```

4. **Instalar ngrok:**
   ```bash
   # Descarga desde https://ngrok.com/download
   # O con npm:
   npm install -g ngrok
   ```

---

## Paso 5: Configurar ngrok para Webhook Local

Abre una **nueva terminal**:

```bash
# Iniciar ngrok apuntando al puerto 3000
ngrok http 3000
```

**Guarda la URL de ngrok** (ejemplo: `https://abc123.ngrok.io`)

---

## Paso 6: Configurar Webhook en Stripe

Tienes dos opciones:

### Opción A: Usando Stripe CLI (Recomendado para desarrollo)

En una **nueva terminal**:

```bash
# Autenticar Stripe CLI
stripe login

# Escuchar webhooks localmente (esto forwardea eventos a tu localhost:3000)
stripe listen --forward-to localhost:3000/api/webhook
```

Esto mostrará un **webhook signing secret** (empieza con `whsec_`). **Guárdalo.**

### Opción B: Usando ngrok (Para testing más realista)

1. Ve a https://dashboard.stripe.com/test/webhooks
2. Haz clic en "Agregar endpoint"
3. Configura:
   - **URL del endpoint:** `https://tu-url-ngrok.ngrok.io/api/webhook`
   - **Descripción:** Testing local
   - **Eventos a escuchar:** Selecciona `payment_intent.succeeded`
4. Haz clic en "Agregar endpoint"
5. Copia el **Signing secret** del webhook (empieza con `whsec_`)

---

## Paso 7: Configurar Variables de Entorno

Ve al directorio de la app:

```bash
cd stablecoin/compra-stableboin
```

Crea el archivo `.env.local`:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus valores:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_tu_publishable_key_aqui
STRIPE_SECRET_KEY=sk_test_tu_secret_key_aqui
STRIPE_WEBHOOK_SECRET=whsec_tu_webhook_secret_aqui

# Blockchain Configuration
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Contract Owner Private Key
OWNER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**⚠️ IMPORTANTE:**
- Reemplaza `NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS` con la dirección real del contrato desplegado
- Reemplaza `OWNER_PRIVATE_KEY` con la private key de la cuenta 0 de Anvil (la que desplegó el contrato)
- Reemplaza las claves de Stripe con tus claves reales

---

## Paso 8: Verificar que el Owner tiene Permisos

Verifica que la cuenta owner es efectivamente el owner del contrato:

```bash
cd stablecoin/sc

# Verificar owner del contrato (ajusta la dirección del contrato)
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "owner()(address)" \
  --rpc-url http://localhost:8545
```

Debería retornar la dirección de la cuenta 0 de Anvil.

---

## Paso 9: Levantar la Aplicación Next.js

En el directorio de la app:

```bash
cd stablecoin/compra-stableboin

# Instalar dependencias (si no lo has hecho)
npm install

# Levantar en modo desarrollo
npm run dev
```

La aplicación estará en `http://localhost:3000`

---

## Paso 10: Testing del Flujo Completo

### 10.1 Preparación

1. **Abre la aplicación:** http://localhost:3000
2. **Conecta MetaMask:**
   - Asegúrate de estar en la red "Localhost 8545"
   - Haz clic en "Conectar MetaMask"
   - Acepta la conexión

### 10.2 Compra de Tokens

1. **Ingresa cantidad:**
   - Escribe un monto (ej: `10` para comprar 10 USDT)
   - Haz clic en "Comprar 10 USDT"

2. **Completa el pago:**
   - Se abrirá el formulario de Stripe
   - Usa una tarjeta de prueba:
     - **Tarjeta:** `4242 4242 4242 4242`
     - **Fecha:** Cualquier fecha futura (ej: 12/25)
     - **CVC:** Cualquier 3 dígitos (ej: 123)
     - **ZIP:** Cualquier código postal (ej: 12345)

3. **Confirma el pago:**
   - Haz clic en "Pagar"
   - Espera a que se procese

### 10.3 Verificar Mint de Tokens

Después del pago, verifica que los tokens fueron acuñados:

```bash
# Ver balance de tokens (ajusta las direcciones)
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
  "balanceOf(address)(uint256)" \
  0x70997970C51812dc3A010C7d01b50e0d17dc79C8 \
  --rpc-url http://localhost:8545

# Esto retornará el balance en unidades base (6 decimales)
# Para convertir: balance / 1000000
```

O en MetaMask:
1. Agrega el token personalizado:
   - Dirección del contrato: `0x5FbDB2315678afecb367f032d93F642f64180aa3`
   - Símbolo: `USDT`
   - Decimales: `6`
2. Verás tu balance actualizado

---

## Tarjetas de Prueba de Stripe

| Tarjeta | Descripción |
|---------|-------------|
| `4242 4242 4242 4242` | Pago exitoso |
| `4000 0025 0000 3155` | Requiere autenticación 3D Secure |
| `4000 0000 0000 9995` | Pago rechazado |

Fecha: Cualquier fecha futura  
CVC: Cualquier 3 dígitos

---

## Troubleshooting

### Error: "STRIPE_SECRET_KEY no está configurada"
- Verifica que `.env.local` existe y tiene las variables correctas
- Reinicia el servidor de desarrollo

### Error: "OWNER_PRIVATE_KEY no configurada"
- Verifica que `.env.local` tiene `OWNER_PRIVATE_KEY`
- Debe ser la private key de la cuenta que desplegó el contrato

### Error: "Invalid contract address"
- Verifica que `NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS` es correcta
- Asegúrate de haber desplegado el contrato

### Webhook no funciona
- Si usas Stripe CLI: verifica que `stripe listen` está corriendo
- Si usas ngrok: verifica que ngrok está corriendo y la URL está actualizada en Stripe Dashboard
- Verifica que `STRIPE_WEBHOOK_SECRET` es correcto

### MetaMask no se conecta
- Verifica que Anvil está corriendo
- Verifica que MetaMask está en la red correcta (Localhost 8545)
- Verifica que la Chain ID es 31337

### Tokens no se acuñan
- Verifica los logs del servidor Next.js (deberías ver mensajes del webhook)
- Verifica que el webhook está recibiendo eventos en Stripe Dashboard
- Verifica que la cuenta owner tiene permisos de mint
- Verifica los logs de Anvil para ver si hay transacciones fallidas

---

## Checklist Final

Antes de probar, verifica:

- [ ] Anvil está corriendo en el puerto 8545
- [ ] Contrato USDToken está desplegado
- [ ] MetaMask está configurado con la red local
- [ ] Stripe está configurado (API keys obtenidas)
- [ ] Webhook está configurado (Stripe CLI o ngrok)
- [ ] `.env.local` está configurado correctamente
- [ ] Next.js está corriendo en el puerto 3000
- [ ] MetaMask tiene una cuenta importada de Anvil

---

¡Listo para probar! 🚀

