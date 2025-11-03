# Web Admin - Panel de Administración

Panel de administración para gestionar empresas, productos y facturas en el e-commerce blockchain.

## 🚀 URLs Disponibles

- **Puerto**: `6003`
- **URL Base**: `http://localhost:6003`

### Rutas Principales

1. **`/`** - Página principal
   - Si tienes empresa registrada: Redirige automáticamente a `/company/[id]`
   - Si eres owner del contrato: Muestra opción para registrar empresa
   - Si no tienes empresa: Muestra mensaje informativo

2. **`/register`** - Registrar nueva empresa (Solo Owner del Contrato)
   - Requiere: Ser el propietario del contrato Ecommerce
   - Permite: Registrar una empresa para cualquier dirección Ethereum

3. **`/company/[id]`** - Panel de gestión de empresa
   - Requiere: Ser el owner de la empresa (address debe coincidir)
   - Tabs disponibles:
     - **Productos**: Crear, editar y gestionar productos
     - **Facturas**: Ver historial de facturas de la empresa

## 📋 Funcionalidades

### Gestión de Empresas
- ✅ Registro de empresas (solo owner del contrato)
- ✅ Validación de permisos
- ✅ Visualización de información de empresa

### Gestión de Productos
- ✅ Crear productos con imágenes IPFS
- ✅ Editar precio y stock
- ✅ Activar/desactivar productos
- ✅ Visualización en cards

### Gestión de Facturas
- ✅ Ver todas las facturas de la empresa
- ✅ Estado de pago (Pagada/Pendiente)
- ✅ Información de transacciones blockchain

## 🔧 Configuración

### Variables de Entorno (.env.local)

```env
# Blockchain Configuration
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:6003

# IPFS Configuration (Pinata) - OPCIONAL
# NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
```

### IPFS (Pinata)

Para subir imágenes de productos a IPFS, necesitas:

1. Crear cuenta en [Pinata](https://pinata.cloud)
2. Generar un JWT token
3. Agregarlo a `.env.local` como `NEXT_PUBLIC_PINATA_JWT`

**Nota**: Sin el JWT, no podrás subir imágenes, pero el resto de funcionalidades funcionará.

## 🎯 Flujo de Uso

### Como Owner del Contrato

1. Conectar wallet (debe ser la dirección owner del contrato)
2. Ir a `/register` para registrar una nueva empresa
3. Especificar:
   - Dirección de la empresa (puede ser cualquier dirección)
   - Nombre de la empresa
   - Tax ID
4. Después del registro, serás redirigido a `/company/[id]`

### Como Owner de Empresa

1. Conectar wallet con la dirección de la empresa registrada
2. Automáticamente se redirige a `/company/[id]`
3. Gestionar productos y ver facturas

## 🔐 Seguridad

- **Registro de empresas**: Solo el owner del contrato puede registrar
- **Gestión de empresa**: Solo el owner de la empresa puede gestionar sus productos y ver sus facturas
- Validaciones tanto en frontend como en smart contract

## 📦 Instalación

```bash
cd web-admin
npm install
npm run dev
```

## 🧪 Testing

1. Asegúrate de que Anvil está corriendo
2. Ejecuta `./restart-all.sh` desde la raíz del proyecto
3. Accede a `http://localhost:6003`
4. Conecta tu wallet MetaMask
