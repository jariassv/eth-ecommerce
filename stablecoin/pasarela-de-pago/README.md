# Pasarela de Pagos

Aplicación Next.js para procesar pagos con tokens USDT entre clientes y comerciantes.

## 🚀 Características

- ✅ Conexión con MetaMask
- ✅ Verificación de saldo de tokens
- ✅ Aprobación de tokens al contrato Ecommerce
- ✅ Procesamiento de pagos con `processPayment`
- ✅ Redirección automática después del pago exitoso
- ✅ Manejo de errores robusto

## 📋 Requisitos Previos

- Node.js v18.x o superior
- MetaMask instalado en el navegador
- Contrato USDToken desplegado
- Contrato Ecommerce desplegado
- Anvil u otra blockchain local corriendo

## 🔧 Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.local.example` a `.env.local` y configura las siguientes variables:

```env
# Blockchain Configuration
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:6002
```

**Nota:** Estas variables se configuran automáticamente al ejecutar `restart-all.sh` desde la raíz del proyecto.

## 🏃 Ejecutar la aplicación

### Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:6002`

### Producción

```bash
npm run build
npm start
```

## 🔄 Flujo de Pago

1. **Llegada a la pasarela**: El usuario es redirigido desde la tienda con parámetros URL
2. **Conectar Wallet**: El usuario conecta su wallet MetaMask
3. **Verificar Saldo**: Se verifica que el usuario tenga suficientes tokens
4. **Aprobar Tokens**: Si es necesario, se aprueba el gasto de tokens al contrato Ecommerce
5. **Procesar Pago**: Se ejecuta `processPayment(invoiceId)` en el contrato Ecommerce
6. **Redirección**: Después del pago exitoso, se redirige de vuelta a la tienda

## 📝 Parámetros URL

La pasarela espera los siguientes parámetros en la URL:

```
http://localhost:6002/?
  merchant_address=0x...      # Dirección del comerciante
  amount=100.50              # Monto en USD
  invoice=INV-001            # ID de factura
  date=2025-10-15            # Fecha (opcional)
  redirect=http://...        # URL de retorno (opcional)
```

### Parámetros Requeridos

- `merchant_address`: Dirección Ethereum del comerciante (debe ser válida)
- `amount`: Monto a pagar en USD (debe ser un número positivo)
- `invoice`: ID de la factura (número entero)

### Parámetros Opcionales

- `date`: Fecha de la factura
- `redirect`: URL a la que redirigir después del pago exitoso

## 🧪 Testing

### Pruebas Locales

1. Asegúrate de que Anvil esté corriendo
2. Deploy los contratos USDToken y Ecommerce
3. Crea una factura en el contrato Ecommerce
4. Redirige a la pasarela con los parámetros correctos

### Ejemplo de URL de Prueba

```
http://localhost:6002/?merchant_address=0x1234567890123456789012345678901234567890&amount=100.50&invoice=1&redirect=http://localhost:6004
```

## 🔒 Seguridad

- ✅ Validación de parámetros URL
- ✅ Verificación de direcciones de wallet
- ✅ Validación de saldo suficiente
- ✅ Verificación de allowance antes de pagar
- ✅ Manejo seguro de transacciones blockchain

## 📁 Estructura del Proyecto

```
pasarela-de-pago/
├── app/
│   ├── api/
│   │   └── rpc/              # Proxy RPC para evitar CORS
│   ├── page.tsx              # Página principal
│   └── layout.tsx
├── components/
│   ├── WalletInfo.tsx        # Conexión MetaMask y balance
│   └── PaymentProcessor.tsx  # Procesador de pagos
├── lib/
│   └── ethers.ts             # Utilidades blockchain
└── .env.local                # Variables de entorno
```

## 🐛 Solución de Problemas

### Error: "Saldo insuficiente"

- Verifica que el usuario tenga suficientes tokens USDT
- Compra más tokens en la aplicación de compra de tokens

### Error: "Insufficient allowance"

- La pasarela intentará aprobar tokens automáticamente
- Si falla, verifica que el usuario tenga permisos para aprobar

### Error: "Transacción rechazada"

- El usuario rechazó la transacción en MetaMask
- Asegúrate de tener suficiente ETH para gas

### La pasarela no redirige

- Verifica que el parámetro `redirect` esté presente en la URL
- Si no hay redirect, la pasarela mostrará un mensaje de éxito

## 📝 Notas

- Esta es una aplicación de prueba/demostración
- El pago requiere que el usuario tenga saldo suficiente de tokens
- La aprobación de tokens es necesaria antes del primer pago
- Los pagos se procesan en tiempo real en la blockchain
