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

## 🔧 Instalación

### 1. Instalar Foundry

```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar instalación
forge --version
anvil --version
cast --version
```

### 2. Clonar y configurar

```bash
git clone <repo-url>
cd 03-ECOMMERCE

# Configurar variables de entorno en cada app (ver .env.example)
# Configurar Stripe keys
# Configurar IPFS keys
```

### 3. Deploy completo

```bash
chmod +x restart-all.sh
./restart-all.sh
```

Este script:
1. Detiene aplicaciones anteriores
2. Inicia Anvil (blockchain local)
3. Deploy USDToken
4. Deploy EURToken
5. Deploy Ecommerce
6. Actualiza variables de entorno
7. Inicia todas las aplicaciones

## 🎯 Puertos

- Anvil: `http://localhost:8545`
- Compra Stablecoin: `http://localhost:6001`
- Pasarela de Pago: `http://localhost:6002`
- Web Admin: `http://localhost:6003`
- Web Customer: `http://localhost:6004`

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

Ver [PROYECTO_ESTUDIANTE.md](./PROYECTO_ESTUDIANTE.md) para documentación completa del proyecto:
- Plan de trabajo por etapas
- Guías de diseño UI/UX
- Arquitectura de contratos
- Solución de problemas
- Buenas prácticas

## 🔒 Seguridad

- Contratos auditados con Foundry tests
- Coverage mínimo 80%
- Validaciones exhaustivas
- OpenZeppelin para contratos base

## 📝 Licencia

[Tu licencia aquí]

## 👥 Contribuidores

[Tu nombre/información]

## 📧 Contacto

[Tu contacto]

