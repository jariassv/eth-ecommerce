# E-Commerce con Blockchain y Stablecoins

Sistema completo de e-commerce descentralizado integrando blockchain, stablecoins, pagos tradicionales y aplicaciones web modernas.

## 🚀 Características Principales

- **Tokens Multi-moneda**: USDToken y EURToken (ERC20)
- **Compra de Tokens**: Integración con Stripe para compra de stablecoins
- **Pasarela de Pagos**: Pagos con tokens entre clientes y comerciantes
- **Smart Contracts**: E-commerce completo en blockchain con reviews y analytics
- **Web Admin**: Panel de administración con dashboard de analytics
- **Web Customer**: Tienda online moderna con reviews
- **IPFS**: Almacenamiento descentralizado de imágenes

## 📁 Arquitectura

```
30_eth_database_ecommerce/
├── stablecoin/
│   ├── sc/                          # Smart Contracts de tokens
│   ├── compra-stableboin/           # App para comprar tokens con Stripe
│   └── pasarela-de-pago/            # Pasarela de pagos con tokens
├── sc-ecommerce/                    # Smart Contract E-commerce
├── web-admin/                       # Panel de administración
├── web-customer/                    # Tienda online para clientes
└── restart-all.sh                   # Script de deploy completo
```

## 🛠️ Tecnologías

### Blockchain
- Solidity
- Foundry/Forge
- Anvil (blockchain local)
- Ethers.js v6

### Frontend
- Next.js 15
- TypeScript
- Tailwind CSS
- MetaMask

### Pagos
- Stripe
- ERC20 Tokens
- Multi-moneda support

### Almacenamiento
- IPFS (Pinata/Infura)

### Analytics
- Recharts/Chart.js

## 📋 Requisitos Previos

- Node.js v18.x o superior
- npm o yarn
- Foundry (ver instalación abajo)
- Git
- MetaMask (extensión del navegador)
- Cuenta de Stripe (para pruebas)

## 🔧 Instalación Rápida

### 1. Instalar Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar instalación
forge --version
anvil --version
cast --version
```

### 2. Clonar y Deploy

```bash
git clone <repo-url>
cd 03-ECOMMERCE

# Dar permisos al script
chmod +x restart-all.sh

# Deploy completo (automatizado)
./restart-all.sh
```

El script `restart-all.sh` automatiza todo:
1. ✅ Detiene aplicaciones anteriores
2. ✅ Inicia Anvil (blockchain local en puerto 8545)
3. ✅ Deploy USDToken y EURToken
4. ✅ Deploy contrato Ecommerce
5. ✅ Configura variables de entorno automáticamente
6. ✅ Instala dependencias de todas las apps
7. ✅ Inicia todas las aplicaciones Next.js

### 3. Configurar MetaMask

1. Instalar MetaMask desde [metamask.io](https://metamask.io)
2. Configurar red local:
   - **Network Name**: Localhost 8545
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
3. Importar cuenta de Anvil (usar private key del script)

### 4. Configuración Opcional

#### Stripe (para compra de tokens)

Edita `stablecoin/compra-stableboin/.env.local`:
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### IPFS/Pinata (para imágenes de productos)

Edita `web-admin/.env.local`:
```bash
NEXT_PUBLIC_PINATA_JWT=tu_jwt_token_aqui
```

Obtén tu JWT en [pinata.cloud](https://pinata.cloud)

📖 **Para más detalles, consulta [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🎯 Puertos

- Anvil: `http://localhost:8545`
- Compra Stablecoin: `http://localhost:6001`
- Pasarela de Pago: `http://localhost:6002`
- Web Admin: `http://localhost:6003`
- Web Customer: `http://localhost:6003`

## 🧪 Testing

### Smart Contracts

```bash
cd stablecoin/sc
forge test
forge test -vvv  # Con logs detallados

cd ../../sc-ecommerce
forge test
```

### Aplicaciones Web

```bash
cd web-customer
npm test

cd ../web-admin
npm test
```

## 📚 Documentación

- **[DEPLOYMENT.md](./DEPLOYMENT.md)**: Guía completa de deployment y configuración
- **[VARIABLES_ENTORNO.md](./VARIABLES_ENTORNO.md)**: Guía de variables de entorno
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)**: Checklist completo de testing E2E
- **[PROYECTO_ESTUDIANTE.md](./PROYECTO_ESTUDIANTE.md)**: Documentación técnica del proyecto
  - Plan de trabajo por etapas
  - Guías de diseño UI/UX
  - Arquitectura de contratos
  - Solución de problemas
  - Buenas prácticas

### Documentación por Componente

- [Web Admin README](./web-admin/README.md): Panel de administración
- [Web Customer README](./web-customer/README.md): Tienda online
- [Pasarela de Pago README](./stablecoin/pasarela-de-pago/README.md): Sistema de pagos
- [Compra Stablecoin README](./stablecoin/compra-stableboin/README.md): Compra de tokens

## 🔒 Seguridad

- Contratos auditados con Foundry tests
- Coverage mínimo 80%
- Validaciones exhaustivas
- OpenZeppelin para contratos base

## 🎯 Flujo de Trabajo Completo

1. **Compra de Tokens** → http://localhost:6001
   - Compra USDT/EURT con tarjeta de crédito vía Stripe

2. **Registro de Empresa** → http://localhost:6003
   - El owner del contrato registra empresas
   - Cada empresa puede gestionar sus productos

3. **Crear Productos** → http://localhost:6003
   - Agregar productos con imágenes (IPFS)
   - Gestionar stock y precios

4. **Comprar Productos** → http://localhost:6003
   - Navegar catálogo
   - Agregar al carrito
   - Crear factura

5. **Procesar Pago** → http://localhost:6002
   - Aprobar tokens
   - Completar pago
   - Verificar transacción

6. **Analytics y Reviews** → http://localhost:6003
   - Ver métricas de ventas
   - Gestionar reviews de productos

## 📝 Licencia

Este proyecto es parte de un curso educativo sobre desarrollo blockchain.

## 👥 Autor

Desarrollado como proyecto educativo de e-commerce blockchain.

## 📧 Soporte

Para problemas o preguntas, revisa:
- [DEPLOYMENT.md](./DEPLOYMENT.md) para problemas de deployment
- [PROYECTO_ESTUDIANTE.md](./PROYECTO_ESTUDIANTE.md) para documentación técnica
- Issues en el repositorio para reportar bugs

