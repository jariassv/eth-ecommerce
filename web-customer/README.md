# Web Customer - Tienda Online

Aplicación Next.js para que clientes compren productos usando tokens USDT en blockchain.

## 🚀 Características

- ✅ Catálogo de productos con imágenes IPFS
- ✅ Carrito de compras persistente en blockchain
- ✅ Checkout con redirección a pasarela de pagos
- ✅ Historial de compras (facturas)
- ✅ Integración con MetaMask
- ✅ Visualización de balance USDT

## 📋 Requisitos Previos

- Node.js v18.x o superior
- MetaMask instalado en el navegador
- Contrato Ecommerce desplegado
- Contrato USDToken desplegado
- Anvil u otra blockchain local corriendo

## 🔧 Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El archivo `.env.local` se crea automáticamente al ejecutar `restart-all.sh` desde la raíz del proyecto.

Variables requeridas:
```env
# Blockchain Configuration
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:6003
NEXT_PUBLIC_PAYMENT_GATEWAY_URL=http://localhost:6002
```

## 🏃 Ejecutar la aplicación

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:6003`

### Producción

```bash
npm run build
npm start
```

## 🔄 Flujo de Compra

1. **Navegar Productos**: Ver catálogo sin necesidad de wallet
2. **Conectar Wallet**: Conectar MetaMask para agregar al carrito
3. **Agregar al Carrito**: Seleccionar productos y cantidades
4. **Ver Carrito**: Revisar items y total
5. **Checkout**: Crear invoice en blockchain
6. **Redirigir a Pasarela**: Pagar con tokens USDT
7. **Ver Pedidos**: Historial de facturas en `/orders`

## 📁 Estructura del Proyecto

```
web-customer/
├── app/
│   ├── api/
│   │   └── rpc/              # Proxy RPC
│   ├── cart/                 # Página de carrito
│   ├── orders/               # Página de órdenes
│   ├── page.tsx              # Página principal (catálogo)
│   └── layout.tsx
├── components/
│   ├── Header.tsx            # Header con navegación y wallet
│   └── ProductCard.tsx       # Card de producto
├── hooks/
│   ├── useWallet.ts          # Hook para MetaMask
│   └── useEcommerce.ts       # Hook para contrato Ecommerce
├── lib/
│   ├── contracts.ts          # ABI y tipos TypeScript
│   └── ethers.ts             # Utilidades blockchain
└── .env.local                # Variables de entorno
```

## 🖼️ IPFS para Imágenes

Las imágenes de productos se almacenan en IPFS. La aplicación usa Cloudflare IPFS Gateway para mostrar las imágenes.

Para subir imágenes a IPFS en producción:
- Usar Pinata o Infura IPFS
- Obtener el hash IPFS
- Guardarlo en el producto al crearlo (en web-admin)

Gateway usado: `https://cloudflare-ipfs.com/ipfs/{hash}`

## 🧪 Testing

### Pruebas Locales

1. Asegúrate de que Anvil esté corriendo
2. Deploy los contratos usando `restart-all.sh`
3. Agrega productos desde web-admin
4. Navega a `http://localhost:6003`
5. Conecta wallet y prueba el flujo completo

## 🔒 Seguridad

- ✅ Validación de direcciones de wallet
- ✅ Verificación de stock antes de agregar al carrito
- ✅ Validación de permisos en blockchain
- ✅ Manejo seguro de transacciones

## 📝 Notas

- Esta es una aplicación de prueba/demostración
- El carrito se persiste en blockchain
- Se requiere wallet conectada para agregar productos al carrito
- Los productos sin imagen usan un placeholder
