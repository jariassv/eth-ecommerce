# App de Compra de Stablecoins

Aplicación Next.js para comprar tokens USDToken (USDT) usando tarjeta de crédito a través de Stripe.

## 🚀 Características

- ✅ Conexión con MetaMask
- ✅ Compra de tokens con tarjeta de crédito (Stripe)
- ✅ Acuñación automática de tokens después del pago
- ✅ Interfaz moderna y responsive
- ✅ Seguridad con webhooks de Stripe

## 📋 Requisitos Previos

- Node.js v18.x o superior
- Cuenta de Stripe (para pruebas)
- MetaMask instalado en el navegador
- Contrato USDToken desplegado
- Anvil u otra blockchain local corriendo

## 🔧 Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y configura las siguientes variables:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Blockchain Configuration
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Contract Owner Private Key (para mint via webhook)
OWNER_PRIVATE_KEY=0x...
```

### 3. Configurar Stripe

1. Crea una cuenta en [Stripe Dashboard](https://dashboard.stripe.com)
2. Obtén tus API keys de prueba (publishable y secret)
3. Configura un webhook:
   - URL: `http://localhost:3000/api/webhook` (usar ngrok para desarrollo local)
   - Eventos: `payment_intent.succeeded`
   - Copia el webhook secret

### 4. Desplegar contrato USDToken

Asegúrate de tener el contrato USDToken desplegado y su dirección configurada.

## 🏃 Ejecutar la aplicación

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Producción

```bash
npm run build
npm start
```

## 🔄 Flujo de Compra

1. **Conectar Wallet**: El usuario conecta su wallet MetaMask
2. **Ingresar Cantidad**: El usuario especifica cuántos USDT quiere comprar
3. **Crear Payment Intent**: Se crea un Payment Intent en Stripe con metadata del wallet
4. **Procesar Pago**: El usuario completa el pago con su tarjeta
5. **Webhook**: Stripe notifica al webhook cuando el pago es exitoso
6. **Mint Tokens**: El webhook acuña los tokens automáticamente en el wallet del usuario

## 🧪 Testing

### Tarjetas de Prueba de Stripe

- **Éxito**: `4242 4242 4242 4242`
- **Requiere autenticación**: `4000 0025 0000 3155`
- **Rechazada**: `4000 0000 0000 9995`

Fecha: Cualquier fecha futura  
CVC: Cualquier 3 dígitos

### Probar Webhook Localmente

Para probar el webhook localmente, usa [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Luego configura la URL de ngrok en Stripe Dashboard.

## 📁 Estructura del Proyecto

```
compra-stableboin/
├── app/
│   ├── api/
│   │   ├── create-payment-intent/  # API para crear Payment Intent
│   │   └── webhook/                 # Webhook de Stripe para mint
│   ├── page.tsx                     # Página principal
│   └── layout.tsx
├── components/
│   ├── WalletConnect.tsx            # Componente de conexión MetaMask
│   ├── TokenPurchase.tsx            # Componente de compra
│   └── CheckoutForm.tsx             # Formulario de pago Stripe
├── lib/
│   ├── ethers.ts                    # Utilidades de ethers.js
│   └── stripe.ts                    # Configuración de Stripe
└── .env.local.example               # Ejemplo de variables de entorno
```

## 🔒 Seguridad

- ✅ Validación de direcciones de wallet
- ✅ Verificación de firmas de webhook
- ✅ Validación de montos
- ✅ Manejo seguro de claves privadas
- ✅ Metadata en Payment Intent para trazabilidad

## 📝 Notas

- Esta es una aplicación de prueba/demostración
- Usa solo tarjetas de prueba de Stripe en desarrollo
- El owner del contrato debe tener permisos de mint
- El webhook debe estar configurado correctamente para que funcione el mint automático
