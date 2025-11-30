# E-Commerce Web3 Platform

Plataforma integral de comercio electrónico construida sobre blockchain que combina pagos con stablecoins, on-ramps tradicionales y experiencias de usuario modernas. El sistema habilita a empresas para publicar catálogos con activos multimedia en IPFS, gestionar facturación on-chain con conversión multimoneda y ofrecer a los clientes un checkout Web3 que se integra con Stripe para la compra de tokens.

---

## 1. Visión General

- **Modelos de rol**
  - *Owner del protocolo*: despliega los contratos, habilita empresas y gestiona tokens soportados.
  - *Empresa vendedora*: administra productos e inventario, consulta métricas y atiende reseñas.
  - *Cliente*: navega el catálogo, selecciona moneda (USDT/EURT), paga on-chain y publica reseñas verificadas.
- **Flujos clave**
  1. Conversión fiat → stablecoin mediante Stripe y distribución controlada.
  2. Gestión de catálogo con activos multimedia almacenados en IPFS.
  3. Creación de facturas multimoneda con validación dual en smart contracts.
  4. Pasarela de pago que verifica token, allowance y montos exactos antes de liquidar.
  5. Dashboard administrativo con analytics de ventas, pedidos y feedback.

---

## 2. Arquitectura

```
                              ┌───────────────────────────────┐
                              │          Web Admin (Next)     │
                              │  - Gestión de empresas         │
                              │  - Catálogo & analytics        │
                              └──────────────┬────────────────┘
                                             │
┌────────────────────┐        ┌──────────────▼────────────────┐        ┌────────────────────┐
│ Stripe + Webhooks  │◀──────▶│ Stablecoin On-Ramp (Next)     │◀──────▶│  Wallet del cliente │
│ (USD/EUR tarjeta)  │        │ - Compra USDT/EURT             │        │  (MetaMask u otra)  │
└────────────────────┘        │ - Gestión de webhooks Stripe   │        └────────────────────┘
                              └──────────────┬────────────────┘
                                             │ RPC / JSON APIs
                              ┌──────────────▼────────────────┐
                              │ Pasarela de Pago (Next)       │
                              │ - Lee invoice on-chain         │
                              │ - Verifica token seleccionado  │
                              └──────────────┬────────────────┘
                                             │
                              ┌──────────────▼─────────────────┐
                              │ Web Customer (Next)            │
                              │ - Catálogo multimoneda         │
                              │ - Conversión con oráculo       │
                              └──────────────┬─────────────────┘
                                             │
                          ┌──────────────────▼──────────────────┐
                          │  Smart Contracts (Foundry)          │
                          │  - ExchangeRateOracle               │
                          │  - Ecommerce (cart, invoices,       │
                          │    pagos, reviews)                  │
                          │  - USDToken / EURToken              │
                          └──────────────────┬──────────────────┘
                                             │
                          ┌──────────────────▼──────────────────┐
                          │  Off-chain Services                  │
                          │  - API REST del oráculo (Node.js)   │
                          │  - Scripts de actualización de rate │
                          └─────────────────────────────────────┘
```

---

## 3. Componentes y Responsabilidades

| Componente | Descripción |
|------------|-------------|
| `sc-ecommerce` | Contrato principal con librerías propias para carrito, facturas, pagos multimoneda, conversión on-chain y reseñas verificadas. |
| `stablecoin/sc` | Implementación de USDToken y EURToken (ERC20) usados como medios de pago. |
| `oracle/sc` | `ExchangeRateOracle` con control de rangos (0.8-1.5), vigencia de 24 horas y conversión bidireccional EURT ↔ USDT. |
| `oracle/api` | API REST Express (puerto 6005) que expone el rate para consultas off-chain y frontends. Endpoints: `/api/rate`, `/api/rate/info`, `/api/convert`. |
| `oracle/scripts` | Scripts Node.js/TypeScript para sincronizar el rate con proveedores externos (`update-rate`) y actualización manual (`update-rate-manual`). |
| `stablecoin/compra-stableboin` | Aplicación Next.js que integra Stripe para on-ramp y distribución de tokens. |
| `stablecoin/pasarela-de-pago` | Checkout Web3 que ejecuta `processPayment` garantizando token/monto correctos. |
| `web-customer` | Tienda para clientes con conversión en tiempo real, selector de moneda y reseñas verificadas. |
| `web-admin` | Panel empresarial con métricas, gestión de catálogo (incluyendo carga a IPFS) y flujos operativos. |
| `restart-all.sh` | Script orquestador que limpia procesos, inicia Anvil, despliega contratos y arranca todas las apps. |

---

## 4. Tecnologías Principales

| Capa | Tecnologías |
|------|-------------|
| Blockchain | Solidity · Foundry/Forge · Anvil · OpenZeppelin Contracts · Ethers.js v6 |
| Web & UX | Next.js 15 · React 18 · TypeScript · Tailwind CSS · Zustand · Radix UI |
| Pagos | Stripe (Checkout, Webhooks, CLI) · ERC20 · MetaMask/WalletConnect |
| Datos y almacenamiento | IPFS (Pinata) para imágenes de productos · JSON-RPC · LocalStorage |
| Operaciones | Node.js · npm · bash scripts · Stripe CLI · Git/GitHub |

---

## 5. Inicio Rápido

### 5.1 Prerrequisitos

- Node.js ≥ 18.18 y npm ≥ 9
- Foundry (`curl -L https://foundry.paradigm.xyz | bash && foundryup`)
- Stripe CLI (`./install-stripe-cli.sh` en Linux/macOS)
- MetaMask u otro wallet compatible con EIP-1193
- Cuenta de Stripe (modo test) para habilitar claves y webhooks

### 5.2 Clonado e instalación

```bash
git clone git@github.com:<org>/eth-ecommerce.git
cd 05-EthereumPractice/03-ECOMMERCE

# Dependencias front y servicios
npm install --prefix web-customer
npm install --prefix web-admin
npm install --prefix stablecoin/compra-stableboin
npm install --prefix stablecoin/pasarela-de-pago
npm install --prefix oracle/api
npm install --prefix oracle/scripts

# Dependencias de smart contracts
git submodule update --init --recursive || true
forge install --root sc-ecommerce
forge install --root stablecoin/sc
forge install --root oracle/sc
```

### 5.3 Variables de entorno

Cada paquete incluye plantillas `.env.example` o `.env.local.example` con los valores requeridos:

- `stablecoin/compra-stableboin/.env.local` → claves Stripe test, RPC y direcciones de contratos.
- `stablecoin/pasarela-de-pago/.env.local` → RPC, dirección del contrato Ecommerce y oráculo.
- `web-customer/.env.local` y `web-admin/.env.local` → RPC, tokens soportados, credenciales IPFS.
- `oracle/api/.env` y `oracle/scripts/.env` → RPC, dirección del oráculo, claves de proveedores de FX.

Copie cada plantilla, actualice las variables y mantenga claves sensibles fuera del control de versiones.

### 5.4 Arranque automatizado

```bash
chmod +x restart-all.sh
./restart-all.sh
```

El script detiene procesos previos, inicia Anvil, despliega tokens + oráculo + Ecommerce, actualiza `.env` en cada app y ejecuta los servidores Next.js en los puertos:

- Web Admin: `http://localhost:6003/admin`
- Web Customer: `http://localhost:6004`
- On-Ramp (Stripe): `http://localhost:6001`
- Pasarela de Pago: `http://localhost:6002`
- Oracle API: `http://localhost:6005`
- Anvil RPC: `http://localhost:8545`

### 5.5 Arranque manual (resumen)

1. `anvil --chain-id 31337`
2. Desplegar oráculo: `forge script script/DeployExchangeRateOracle.s.sol --rpc-url <url> --broadcast` (en `oracle/sc`).
3. Desplegar Ecommerce: `forge script script/DeployEcommerce.s.sol --rpc-url <url> --broadcast` (en `sc-ecommerce`).
4. Actualizar las direcciones resultantes en los archivos `.env.local` relevantes.
5. Iniciar Oracle API: `cd oracle/api && npm start` (puerto 6005).
6. Ejecutar `npm run dev` en cada frontend (`web-admin`, `web-customer`, `stablecoin/compra-stableboin`, `stablecoin/pasarela-de-pago`).
7. Lanzar Stripe CLI para webhooks: `stripe listen --forward-to localhost:6001/api/webhook`.

**Nota**: Para más detalles sobre el oráculo (funcionalidades, actualización de rates, endpoints API), consulta [`oracle/README.md`](./oracle/README.md).

---

## 6. Oracle de Tasa de Cambio

El sistema incluye un oráculo completo para gestionar la conversión entre EURT y USDT, permitiendo pagos multimoneda en el e-commerce.

### 6.1 Componentes del Oracle

- **Smart Contract** (`oracle/sc`): `ExchangeRateOracle` que almacena el rate on-chain con validaciones de rango (0.8-1.5) y vigencia temporal (< 24 horas).
- **API REST** (`oracle/api`): Servicio Node.js en puerto 6005 que expone endpoints para consultar el rate y convertir montos.
- **Scripts de Actualización** (`oracle/scripts`): Herramientas para actualizar el rate automáticamente desde APIs externas o manualmente.

### 6.2 Funcionalidades

- **Conversión bidireccional**: EURT → USDT y USDT → EURT usando el rate almacenado.
- **Validación on-chain**: El contrato `Ecommerce` valida que el rate esté actualizado y en rango antes de crear invoices.
- **Consulta off-chain**: Los frontends consultan el rate vía API REST para mostrar conversiones en tiempo real.
- **Actualización controlada**: Solo el owner puede actualizar el rate, previniendo manipulaciones.

### 6.3 Integración en el E-commerce

1. **Creación de Invoice**: Cuando un cliente selecciona EURT como moneda, el contrato `Ecommerce` consulta el oráculo para convertir el total a USDT y fija el rate en la invoice.
2. **Visualización en Frontend**: `web-customer` consulta la API del oráculo para mostrar precios convertidos en tiempo real según la moneda seleccionada.
3. **Validación de Pago**: La pasarela de pago verifica que el token usado coincida con el de la invoice y que el rate sea válido.

### 6.4 Documentación Adicional

Para información detallada sobre configuración, endpoints API, scripts de actualización y troubleshooting, consulta [`oracle/README.md`](./oracle/README.md).

---

## 7. Testing y Calidad

| Área | Comando |
|------|---------|
| Smart contracts Ecommerce | `cd sc-ecommerce && forge test -vvv` |
| Smart contracts Oracle | `cd oracle/sc && forge test` |
| Stablecoin suite | `cd stablecoin/sc && forge test` |
| Frontends Next.js | `npm run lint && npm run test` en cada paquete |
| Scripts/API Oráculo | `npm run test` (cuando esté habilitada la suite) |

Los tests de contratos cubren tolerancias de redondeo, integridad del carrito, compatibilidad retroactiva y flujos multimoneda con congelamiento de rate.

---

## 8. Seguridad y Buenas Prácticas

- Validación dual de totales: el contrato recalcula montos desde el carrito y exige coincidencia (±0.1% o 100 unidades base).
- Conversión on-chain: si el cliente paga en EURT, el contrato convierte usando el oráculo y fija la tasa al crear la invoice.
- Oráculo controlado: solo el owner puede actualizar el rate, que debe permanecer entre 0.8 y 1.5 y con vigencia < 24 h.
- IPFS para medios: se evita almacenar archivos on-chain, pero se conserva un enlace verificable en el catálogo.
- Pasarela de pago: exige que el token usado coincida con la invoice y que exista allowance suficiente antes de transferir.
- Webhooks Stripe firmados: los eventos se validan contra el secreto y se registran en logs para auditoría.

---

## 9. Resolución de Problemas

- **Rate desactualizado**: 
  - Automático: `cd oracle/scripts && npm run update-rate`
  - Manual: `cd oracle/scripts && npm run update-rate-manual 1.10`
  - Verificar que el rate esté en rango válido (0.8 - 1.5) y actualizado (< 24 horas)
  - Ver documentación completa en [`oracle/README.md`](./oracle/README.md)
- **Oracle API no responde**: 
  - Verificar que el servidor esté corriendo: `cd oracle/api && npm start`
  - Confirmar que `RPC_URL` y `EXCHANGE_RATE_ORACLE_ADDRESS` estén correctos en `.env`
  - Revisar logs en `logs/oracle-api/`
- **Fotos que no cargan**: revisar que el JWT de Pinata esté vigente y que el hash IPFS se haya guardado en el producto.
- **Pagos rechazados**: confirmar balance + allowance del token seleccionado y que la invoice se generó con ese token.
- **Webhooks Stripe**: iniciar `stripe listen` y validar `STRIPE_WEBHOOK_SECRET`.

---

## 10. Próximos Pasos

- Integrar feeds descentralizados (Chainlink) para el oráculo.
- Automatizar actualización de rate con cron en infraestructura dedicada.
- Incorporar notificaciones push (webhooks internos o servicios externos) para órdenes completadas.
- Extender soporte de monedas a nuevas stablecoins y convertir dinámicamente.

---

## 11. Licencia y Créditos

Proyecto educativo orientado a prácticas de comercio electrónico Web3. Se distribuye bajo licencia MIT salvo indicación en submódulos específicos. Agradecimientos a la comunidad de OpenZeppelin, Foundry y Stripe por las herramientas que sustentan esta solución.

