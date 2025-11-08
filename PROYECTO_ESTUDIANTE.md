# Proyecto E-Commerce con Blockchain y Stablecoins

## Descripción General

Este proyecto es un sistema completo de e-commerce basado en blockchain que integra:
- Creación y gestión de una stablecoin (USDToken)
- Compra de stablecoins con tarjeta de crédito (Stripe)
- Pasarela de pagos con criptomonedas
- Smart contracts para gestión de comercio electrónico
- Aplicación web de administración para empresas
- Aplicación web para clientes finales

## Arquitectura del Proyecto

```
30_eth_database_ecommerce/
├── stablecoin/
│   ├── sc/                          # Smart Contract USDToken
│   ├── compra-stableboin/           # App para comprar tokens con Stripe
│   └── pasarela-de-pago/            # Pasarela de pagos con tokens
├── sc-ecommerce/                    # Smart Contract E-commerce
├── web-admin/                       # Panel de administración
├── web-customer/                    # Tienda online para clientes
└── restart-all.sh                   # Script de deploy completo
```

## Requisitos Previos

### Software Necesario
- **Node.js**: v18.x o superior
- **npm** o **yarn**: Gestor de paquetes
- **Foundry**: Para desarrollo de smart contracts
- **Git**: Control de versiones
- **MetaMask**: Extension del navegador
- **Cuenta de Stripe**: Para pruebas de pagos

### Instalación de Foundry
```bash
# Instalar Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Verificar instalación
forge --version
anvil --version
cast --version
```

### Configuración Inicial
1. Clonar el repositorio
2. Instalar dependencias en cada aplicación
3. Configurar variables de entorno
4. Iniciar blockchain local (Anvil)
5. Deployar contratos
6. Ejecutar aplicaciones

### Estructura de Cuentas Recomendada
Para pruebas locales, usa diferentes cuentas de MetaMask:
- **Cuenta 1**: Propietario de contratos (deployer)
- **Cuenta 2**: Empresa/comerciante
- **Cuenta 3**: Cliente/comprador
- **Cuenta 4+**: Clientes adicionales para pruebas

---

## Plan de Trabajo por Etapas

### Gestión de Git
- **Repositorio**: Cada etapa será una rama separada en GitHub
- **Estrategia**: Feature branches → Merge a `develop` → Pull Request a `main`
- **Commits**: Cada funcionalidad completa será un commit significativo
- **Testing**: Cada etapa debe ser testable antes de continuar

### Etapas del Proyecto

#### **Etapa 1: Setup del Proyecto Base**
**Rama**: `01-setup-proyecto`

**Objetivo**: Configurar la estructura base del proyecto y herramientas de desarrollo

**Entregables**:
1. ✅ Estructura de directorios creada
2. ✅ Configuración de Git y `.gitignore`
3. ✅ Documento PROYECTO_ESTUDIANTE.md actualizado
4. ✅ Configuración de Foundry
5. ✅ Configuración básica de Next.js
6. ✅ Variables de entorno de ejemplo

**Commits sugeridos**:
- `feat: agregar estructura de directorios del proyecto`
- `docs: actualizar PROYECTO_ESTUDIANTE.md con funcionalidades bonus`
- `config: agregar configuración de Foundry`
- `config: setup inicial de Next.js para apps frontend`

**Testing**: Verificar que las configuraciones funcionan correctamente

---

#### **Etapa 2: Smart Contracts - Tokens**
**Rama**: `02-smart-contracts-tokens`

**Objetivo**: Implementar USDToken y EURToken con tests completos

**Entregables**:
1. ✅ Contrato USDToken implementado
2. ✅ Contrato EURToken implementado
3. ✅ Tests unitarios completos (>80% coverage)
4. ✅ Scripts de deploy
5. ✅ Deploy en Anvil verificado

**Commits sugeridos**:
- `feat: implementar contrato USDToken ERC20`
- `feat: implementar contrato EURToken ERC20`
- `test: agregar tests unitarios para USDToken`
- `test: agregar tests unitarios para EURToken`
- `feat: agregar script de deploy para tokens`
- `docs: documentar APIs de los contratos de tokens`

**Testing**: `forge test` debe pasar todos los tests

---

#### **Etapa 3: Smart Contract - E-commerce Core**
**Rama**: `03-smart-contract-ecommerce-core`

**Objetivo**: Implementar funcionalidad principal del e-commerce (sin reviews)

**Entregables**:
1. ✅ Librerías: CompanyLib, ProductLib, CartLib, InvoiceLib, PaymentLib
2. ✅ Contrato Ecommerce principal
3. ✅ Tests unitarios para cada librería
4. ✅ Tests de integración para flujo completo
5. ✅ Script de deploy del contrato Ecommerce

**Commits sugeridos**:
- `feat: implementar CompanyLib para gestión de empresas`
- `feat: implementar ProductLib con control de stock`
- `feat: implementar CartLib para carritos de compra`
- `feat: implementar InvoiceLib para facturas`
- `feat: implementar PaymentLib con USDToken`
- `feat: implementar contrato Ecommerce principal`
- `test: agregar tests unitarios para librerías`
- `test: agregar tests de integración E2E`
- `feat: agregar script de deploy para Ecommerce`

**Testing**: Todos los tests deben pasar, coverage >80%

---

#### **Etapa 4: Smart Contract - Reviews y Analytics**
**Rama**: `04-smart-contract-reviews-analytics`

**Objetivo**: Implementar sistema de reviews y contadores para analytics

**Entregables**:
1. ✅ Librería ReviewLib implementada
2. ✅ Funciones de analytics agregadas
3. ✅ Tests para sistema de reviews
4. ✅ Validación de compra para reviews verificados

**Commits sugeridos**:
- `feat: implementar ReviewLib para gestión de reviews`
- `feat: agregar funciones de analytics (totalSales, etc)`
- `feat: implementar validación de reviews verificados`
- `test: agregar tests para ReviewLib`
- `docs: documentar sistema de reviews y analytics`

**Testing**: Tests de reviews y validaciones deben pasar

---

#### **Etapa 5: App de Compra de Tokens**
**Rama**: `05-app-compra-tokens`

**Objetivo**: Aplicación para comprar USDT/EURT con Stripe

**Entregables**:
1. ✅ Setup Next.js + Stripe
2. ✅ Conexión con MetaMask
3. ✅ UI de compra de tokens
4. ✅ Backend: Payment Intent y mint de tokens
5. ✅ Webhook de Stripe configurado
6. ✅ Testing con tarjetas de prueba

**Commits sugeridos**:
- `feat: setup Next.js app para compra de tokens`
- `feat: agregar integración con Stripe`
- `feat: implementar UI de compra de tokens`
- `feat: agregar backend API para Payment Intent`
- `feat: implementar webhook de Stripe para mint`
- `test: verificar compra de tokens con Stripe`

**Testing**: Comprar tokens con tarjeta de prueba y verificar mint

---

#### **Etapa 6: Pasarela de Pagos**
**Rama**: `06-pasarela-pagos`

**Objetivo**: Pasarela para procesar pagos con tokens

**Entregables**:
1. ✅ Setup Next.js pasarela
2. ✅ UI de pasarela de pago
3. ✅ Integración con contratos
4. ✅ Aprobación de tokens + processPayment
5. ✅ Redirección y manejo de estados

**Commits sugeridos**:
- `feat: setup Next.js pasarela de pagos`
- `feat: implementar UI de pasarela`
- `feat: agregar lógica de aprobación de tokens`
- `feat: implementar processPayment en blockchain`
- `feat: agregar redirección post-pago`
- `test: verificar flujo completo de pago`

**Testing**: Pago completo desde tienda hasta confirmación

---

#### **Etapa 7: Web Customer - Core**
**Rama**: `07-web-customer-core`

**Objetivo**: Tienda online básica (catálogo, carrito, checkout)

**Entregables**:
1. ✅ Setup Next.js web-customer
2. ✅ Integración con IPFS para imágenes
3. ✅ Catálogo de productos
4. ✅ Carrito de compras
5. ✅ Checkout y creación de invoice
6. ✅ Historial de compras

**Commits sugeridos**:
- `feat: setup Next.js web-customer`
- `feat: integrar IPFS para imágenes`
- `feat: implementar catálogo de productos`
- `feat: agregar carrito de compras`
- `feat: implementar checkout y creación de invoice`
- `feat: agregar historial de compras`
- `style: aplicar paleta de colores e-commerce`
- `test: verificar flujo completo de compra`

**Testing**: Navegación, agregar al carrito, checkout exitoso

---

#### **Etapa 8: Web Customer - Reviews**
**Rama**: `08-web-customer-reviews`

**Objetivo**: Sistema de reviews para clientes

**Entregables**:
1. ✅ UI para dejar reviews
2. ✅ Validación de compra previa
3. ✅ Visualización de ratings promedio
4. ✅ Lista de reviews con filtros
5. ✅ Indicadores de reviews verificados

**Commits sugeridos**:
- `feat: implementar UI para dejar reviews`
- `feat: agregar validación de compra`
- `feat: implementar visualización de ratings`
- `feat: agregar filtros y búsqueda de reviews`
- `test: verificar sistema completo de reviews`

**Testing**: Dejar review, verificar que requiere compra previa

---

#### **Etapa 9: Web Admin - Core**
**Rama**: `09-web-admin-core`

**Objetivo**: Panel de administración básico

**Entregables**:
1. ✅ Setup Next.js web-admin
2. ✅ Gestión de empresas
3. ✅ Gestión de productos con IPFS
4. ✅ Gestión de facturas
5. ✅ Conexión con MetaMask
6. ✅ Validación de permisos

**Commits sugeridos**:
- `feat: setup Next.js web-admin`
- `feat: implementar gestión de empresas`
- `feat: agregar gestión de productos con IPFS`
- `feat: implementar gestión de facturas`
- `feat: agregar validación de permisos`
- `style: aplicar UI profesional admin`

**Testing**: Registrar empresa, agregar productos, ver facturas

---

#### **Etapa 10: Web Admin - Analytics Dashboard**
**Rama**: `10-web-admin-analytics`

**Objetivo**: Dashboard de analytics con gráficos

**Entregables**:
1. ✅ Integración Recharts/Chart.js
2. ✅ Dashboard con métricas
3. ✅ Gráficos de ventas
4. ✅ Productos más vendidos
5. ✅ Total de ingresos
6. ✅ Métricas de clientes

**Commits sugeridos**:
- `feat: integrar librería de gráficos`
- `feat: implementar dashboard principal`
- `feat: agregar gráfico de ventas por período`
- `feat: implementar top productos vendidos`
- `feat: agregar métricas de ingresos y clientes`
- `test: verificar cálculos de analytics`

**Testing**: Generar ventas y verificar que las métricas se actualizan

---

#### **Etapa 11: Web Admin - Reviews Management**
**Rama**: `11-web-admin-reviews`

**Objetivo**: Panel de gestión de reviews para empresas

**Entregables**:
1. ✅ Vista de reviews por producto
2. ✅ Moderación de reviews
3. ✅ Estadísticas de ratings
4. ✅ Filtros y búsqueda

**Commits sugeridos**:
- `feat: agregar vista de reviews en admin`
- `feat: implementar moderación de reviews`
- `feat: agregar estadísticas de ratings`
- `test: verificar gestión de reviews`

**Testing**: Ver reviews, estadísticas correctas

---

#### **Etapa 12: Integración Completa y Scripts**
**Rama**: `12-integracion-completa`

**Objetivo**: Script de deploy automatizado y testing E2E

**Entregables**:
1. ✅ Script `restart-all.sh` funcional
2. ✅ Variables de entorno actualizadas
3. ✅ Testing del flujo completo
4. ✅ Documentación de deployment
5. ✅ README completo

**Commits sugeridos**:
- `feat: crear script restart-all.sh`
- `config: actualizar variables de entorno`
- `test: testing E2E flujo completo`
- `docs: agregar README con instrucciones`
- `docs: documentar proceso de deployment`

**Testing**: Ejecutar `restart-all.sh` y verificar todo funciona

---

#### **Etapa 13: Polish y Optimizaciones**
**Rama**: `13-polish-optimizaciones`

**Objetivo**: Mejoras finales, optimizaciones y bug fixes

**Entregables**:
1. ✅ Optimización de gas en contratos
2. ✅ Performance optimization frontend
3. ✅ UI/UX polish
4. ✅ Accessibility improvements
5. ✅ Bug fixes
6. ✅ Lighthouse score >90

**Commits sugeridos**:
- `perf: optimizar gas en contratos`
- `perf: optimizar performance frontend`
- `style: mejorar UI/UX y accesibilidad`
- `fix: corregir bugs encontrados`
- `test: agregar tests faltantes`

**Testing**: Lighthouse audit, verificar coverage >80%

---

#### **Etapa 14: Finalización**
**Rama**: `14-finalizacion`

**Objetivo**: Documentación final y entrega

**Entregables**:
1. ✅ Documentación técnica completa
2. ✅ Video demo
3. ✅ Reporte de tests
4. ✅ Capturas de pantalla
5. ✅ Pull Request a main

**Commits sugeridos**:
- `docs: finalizar documentación técnica`
- `docs: agregar capturas y demo video link`
- `chore: preparar release final`
- `docs: crear CHANGELOG.md`

**Entrega**: Pull Request revisado y mergeado

---

### Estrategia de Ramas Git

```
main (protegida)
  └─ develop (rama de desarrollo)
      ├─ 01-setup-proyecto
      ├─ 02-smart-contracts-tokens
      ├─ 03-smart-contract-ecommerce-core
      ├─ 04-smart-contract-reviews-analytics
      ├─ 05-app-compra-tokens
      ├─ 06-pasarela-pagos
      ├─ 07-web-customer-core
      ├─ 08-web-customer-reviews
      ├─ 09-web-admin-core
      ├─ 10-web-admin-analytics
      ├─ 11-web-admin-reviews
      ├─ 12-integracion-completa
      ├─ 13-polish-optimizaciones
      └─ 14-finalizacion
```

### Testing Continuo

Cada etapa debe incluir:
- **Unit Tests**: Funciones individuales
- **Integration Tests**: Componentes juntos
- **E2E Tests**: Flujos completos de usuario
- **Manual Testing**: Verificación visual y funcional

---

## Tecnologías Utilizadas

### Blockchain y Smart Contracts
- **Solidity**: Lenguaje para smart contracts
- **Foundry/Forge**: Framework de desarrollo y testing
- **Anvil**: Blockchain local para desarrollo
- **Ethers.js v6**: Librería para interactuar con Ethereum

### Frontend
- **Next.js 15**: Framework React con App Router
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos
- **MetaMask**: Wallet de criptomonedas

### Pagos
- **Stripe**: Procesamiento de pagos fiat
- **ERC20**: Estándar de token para USDToken
- **Multi-moneda**: Soporte para múltiples stablecoins

### Almacenamiento Descentralizado
- **IPFS**: Almacenamiento de imágenes de productos

### Analytics
- **Recharts/Chart.js**: Gráficos y visualización de datos
- **Event tracking**: Métricas de blockchain

---

## Guías de Diseño UI/UX

### Paleta de Colores para E-Commerce

Para crear una interfaz profesional, moderna y llamativa, se recomienda la siguiente paleta:

#### Paleta Principal (Modo Claro)
```css
--primary: #6366f1;        /* Indigo vibrante - Botones principales, links */
--primary-dark: #4f46e5;   /* Hover states */
--primary-light: #818cf8;  /* Estados activos */

--secondary: #10b981;      /* Verde esmeralda - Éxito, acciones confirmadas */
--secondary-dark: #059669;
--secondary-light: #34d399;

--accent: #f59e0b;         /* Ámbar - Alertas, destaque */
--accent-dark: #d97706;
--accent-light: #fbbf24;

--neutral: #64748b;        /* Slate - Textos secundarios */
--neutral-dark: #475569;
--neutral-light: #94a3b8;

--background: #ffffff;      /* Blanco - Fondo principal */
--surface: #f8fafc;        /* Gris muy claro - Cards, superficies */
--border: #e2e8f0;         /* Límites sutiles */

--text-primary: #1e293b;   /* Texto principal */
--text-secondary: #64748b; /* Texto secundario */
--text-disabled: #cbd5e1;  /* Texto deshabilitado */

--error: #ef4444;          /* Rojo - Errores, cancelaciones */
--warning: #f59e0b;        /* Amarillo - Advertencias */
--success: #10b981;        /* Verde - Éxito */
--info: #3b82f6;          /* Azul - Información */
```

#### Paleta Modo Oscuro
```css
--primary: #818cf8;
--primary-dark: #6366f1;
--primary-light: #a5b4fc;

--secondary: #34d399;
--secondary-dark: #10b981;

--background: #0f172a;     /* Azul muy oscuro */
--surface: #1e293b;        /* Azul oscuro */
--border: #334155;

--text-primary: #f1f5f9;   /* Blanco suave */
--text-secondary: #cbd5e1;
```

### Principios de Diseño

#### 1. Jerarquía Visual
- Usar tamaños de fuente claramente diferenciados
- Emplear peso de fuente (font-weight) para destacar elementos importantes
- Espaciado consistente usando sistema de 8px (8, 16, 24, 32, 48, 64...)

#### 2. Componentes Clave

**Botones Primarios**
- Color: `primary` (#6366f1)
- Padding: `px-6 py-3`
- Border radius: `rounded-lg`
- Shadow: `shadow-lg shadow-indigo-500/50`
- Hover: `hover:scale-105 transition-transform`

**Cards de Productos**
- Background: `surface` (#f8fafc)
- Border: `1px solid border`
- Border radius: `rounded-xl`
- Shadow: `shadow-md`
- Hover: `hover:shadow-xl transition-shadow`

**Formularios**
- Input: border `border-gray-300`, focus `ring-2 ring-primary`
- Labels: texto pequeño, color `text-secondary`
- Estados de error: border rojo `border-error`, mensaje en `text-error`

**Badges y Tags**
- Disponible: `bg-secondary/10 text-secondary`
- Agotado: `bg-neutral/10 text-neutral`
- Nuevo: `bg-accent/10 text-accent-dark`

#### 3. Micro-interacciones
- Transiciones suaves (200-300ms) en hover states
- Loading spinners animados durante transacciones
- Feedback visual inmediato en acciones del usuario
- Animaciones de "slide-in" para modales y dropdowns

#### 4. Responsive Design
- Mobile-first approach
- Breakpoints estándar: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid adaptable: 1 columna móvil, 2-3 tablet, 4+ desktop
- Navigation: hamburger menu en móvil, sidebar en desktop

#### 5. Accesibilidad
- Contraste mínimo 4.5:1 para texto normal
- Contraste 3:1 para elementos grandes
- Navegación por teclado completa
- ARIA labels en elementos interactivos
- Focus states visibles en todos los elementos

### Componentes Específicos del Proyecto

#### Card de Producto
```jsx
- Imagen del producto (aspect-ratio: 16/9)
- Título del producto (truncate a 2 líneas)
- Precio en destaque (text-xl font-bold text-primary)
- Badge de stock/estado
- Botón "Agregar al carrito" (full-width)
- Hover effect: imagen zoom suave
```

#### Carrito de Compras
```jsx
- Icono de carrito con badge de cantidad
- Drawer/Modal deslizante desde la derecha
- Lista de productos con thumbnails
- Botones +/- para cantidades
- Total destacado en la parte inferior
- Botón "Proceder al pago" sticky
```

#### Pasarela de Pago
```jsx
- Header con logo y proceso (steps)
- Card central con detalles del pago
- Lista de items con cantidades
- Total grande y claro
- Botones de acción prominentes
- Estados de carga durante transacciones blockchain
- Mensajes de éxito con check animado
```

#### Panel de Admin
```jsx
- Sidebar fijo con navegación
- Dashboard con estadísticas en cards
- Tablas responsive con datos de productos/ventas
- Formularios con validación en tiempo real
- Toasts para notificaciones
- Modales de confirmación antes de acciones críticas
```

---

## Parte 1: Smart Contracts - Sistema de Tokens Multi-moneda

### Objetivo
Crear tokens ERC20 que representen múltiples stablecoins digitales (USD, EUR) con capacidad de intercambio.

### Ubicación
`stablecoin/sc/src/`

### Tokens a Implementar

#### 1. USDToken (1 USDT = 1 USD)
```solidity
contract USDToken is ERC20 {
    address public owner;
    function mint(address to, uint256 amount) external onlyOwner
    function decimals() public pure returns (uint8) { return 6; }
}
```

#### 2. EURToken (1 EURT = 1 EUR) - Opcional
```solidity
contract EURToken is ERC20 {
    address public owner;
    function mint(address to, uint256 amount) external onlyOwner
    function decimals() public pure returns (uint8) { return 6; }
}
```

### Tareas del Estudiante

1. **Implementar contratos de tokens**
   - USDToken como token principal
   - Heredar de OpenZeppelin ERC20
   - Configurar decimales en 6
   - Implementar función `mint` con control de acceso
   - Agregar eventos para auditoría
   - (Opcional) EURToken para multi-moneda

2. **Escribir tests**
   - Test de deploy para cada token
   - Test de mint por owner
   - Test de mint por no-owner (debe fallar)
   - Test de transferencias entre cuentas
   - Test de intercambio entre tokens (si aplica)

3. **Scripts de deploy**
   - Crear script `DeployUSDToken.s.sol`
   - (Opcional) Crear script `DeployEURToken.s.sol`
   - Deployar en red local (Anvil)
   - Hacer mint inicial de 1,000,000 tokens para cada uno

### Comandos Útiles
```bash
# Compilar
forge build

# Tests
forge test
forge test -vvv  # Con logs detallados

# Deploy local (USDToken)
forge script script/DeployUSDToken.s.sol --rpc-url http://localhost:8545 --broadcast

# Verificar balance
cast call DIRECCION_TOKEN "balanceOf(address)(uint256)" DIRECCION_CUENTA --rpc-url http://localhost:8545
```

---

## Parte 2: Aplicación de Compra de Stablecoins

### Objetivo
Permitir a usuarios comprar USDTokens usando tarjeta de crédito (Stripe).

### Ubicación
`stablecoin/compra-stableboin/`

### Flujo del Usuario
1. Usuario conecta MetaMask
2. Ingresa cantidad de tokens a comprar (ej: 100 USD = 100 USDT)
3. Paga con tarjeta de crédito vía Stripe
4. Backend hace mint de tokens a la wallet del usuario

### Componentes Principales

#### Frontend (Next.js)
```typescript
// Componente de compra
export default function USDTokenPurchase() {
  // 1. Conectar MetaMask
  // 2. Crear Payment Intent con Stripe
  // 3. Mostrar formulario de pago
  // 4. Al completar pago → mint tokens
}
```

#### Backend (API Routes)
```typescript
// /api/create-payment-intent
// Crear intención de pago en Stripe

// /api/mint-tokens
// Hacer mint de tokens después de pago exitoso
```

### Tareas del Estudiante

1. **Setup de Stripe**
   - Crear cuenta de prueba en Stripe
   - Obtener API keys (publishable y secret)
   - Configurar webhooks

2. **Implementar Frontend**
   - Componente de conexión MetaMask
   - Formulario para ingresar cantidad
   - Integración con Stripe Elements
   - Mostrar balance de tokens

3. **Implementar Backend**
   - Endpoint para crear Payment Intent
   - Endpoint para mint de tokens
   - Webhook para confirmar pagos
   - Seguridad: validar que el pago fue exitoso antes de mint

4. **Testing**
   - Usar tarjetas de prueba de Stripe
   - Verificar que tokens se acreditan correctamente
   - Probar manejo de errores

### Variables de Entorno
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
WALLET_PRIVATE_KEY=0x... # Para hacer mint desde backend
```

---

## Parte 3: Pasarela de Pagos

### Objetivo
Permitir pagos con USDTokens entre clientes y comerciantes.

### Ubicación
`stablecoin/pasarela-de-pago/`

### Flujo de Pago
1. Usuario es redirigido desde tienda con datos de pago
2. Conecta MetaMask
3. Confirma monto y destinatario
4. Aprueba transferencia de tokens
5. Se ejecuta pago a través del contrato Ecommerce
6. Redirige de vuelta a la tienda

### Parámetros URL
```
http://localhost:6002/?
  merchant_address=0x...      # Dirección del comerciante
  amount=100.50              # Monto en USD
  invoice=INV-001            # ID de factura
  date=2025-10-15            # Fecha
  redirect=http://...        # URL de retorno
```

### Tareas del Estudiante

1. **Implementar UI de Pago**
   - Mostrar detalles del pago
   - Botón para conectar MetaMask
   - Verificar saldo suficiente
   - Mostrar estado de transacción

2. **Integración con Smart Contracts**
   - Aprobar gasto de tokens al contrato Ecommerce
   - Llamar a `processPayment` del contrato
   - Esperar confirmación de transacción
   - Actualizar estado de invoice

3. **Manejo de Errores**
   - Saldo insuficiente → mostrar link para comprar tokens
   - Rechazo de transacción
   - Timeout de red

4. **Redirección**
   - Redirigir automáticamente después de pago exitoso
   - Pasar parámetros de resultado al comercio

---

## Parte 4: Smart Contract E-commerce

### Objetivo
Gestionar empresas, productos, carritos de compra e invoices en blockchain.

### Ubicación
`sc-ecommerce/src/Ecommerce.sol`

### Arquitectura
```
Ecommerce.sol (Contrato principal)
├── CompanyLib.sol        # Gestión de empresas
├── ProductLib.sol        # Gestión de productos
├── CustomerLib.sol       # Gestión de clientes
├── CartLib.sol          # Carrito de compras
├── InvoiceLib.sol       # Facturas
└── PaymentLib.sol       # Procesamiento de pagos
```

### Estructuras de Datos

#### Company
```solidity
struct Company {
    uint256 companyId;
    string name;
    address companyAddress;  // Wallet donde recibe pagos
    string taxId;
    bool isActive;
}
```

#### Product
```solidity
struct Product {
    uint256 productId;
    uint256 companyId;
    string name;
    string description;
    uint256 price;           // En centavos de dólar (6 decimals)
    uint256 stock;
    string ipfsImageHash;    // IPFS hash de la imagen principal
    string[] ipfsAdditionalImages; // Imágenes adicionales en IPFS
    uint256 totalSales;      // Contador de ventas para analytics
    bool isActive;
}
```

#### Review
```solidity
struct Review {
    uint256 reviewId;
    uint256 productId;
    address customerAddress;
    uint256 rating;          // 1-5 estrellas
    string comment;
    uint256 timestamp;
    bool isVerified;         // Verificado que compró el producto
}
```

#### Invoice
```solidity
struct Invoice {
    uint256 invoiceId;
    uint256 companyId;
    address customerAddress;
    uint256 totalAmount;
    uint256 timestamp;
    bool isPaid;
    bytes32 paymentTxHash;
}
```

### Funciones Principales

```solidity
// Empresas
function registerCompany(string name, string taxId) returns (uint256)
function getCompany(uint256 companyId) returns (Company)

// Productos
function addProduct(companyId, name, description, price, stock) returns (uint256)
function updateProduct(productId, price, stock)
function getAllProducts() returns (Product[])

// Carrito
function addToCart(uint256 productId, uint256 quantity)
function getCart(address customer) returns (CartItem[])
function clearCart(address customer)

// Invoices
function createInvoice(address customer, uint256 companyId) returns (uint256)
function processPayment(address customer, uint256 amount, uint256 invoiceId)
function getInvoice(uint256 invoiceId) returns (Invoice)

// Reviews
function addReview(uint256 productId, uint256 rating, string comment) returns (uint256)
function getProductReviews(uint256 productId) returns (Review[])
function getProductAverageRating(uint256 productId) returns (uint256)
```

### Tareas del Estudiante

1. **Implementar Librerías**
   - CompanyLib: CRUD de empresas
   - ProductLib: CRUD de productos con control de stock
   - CartLib: Agregar/quitar productos, calcular total
   - InvoiceLib: Crear facturas desde carrito
   - PaymentLib: Procesar pagos con USDToken

2. **Implementar Contrato Principal**
   - Integrar todas las librerías
   - Controles de acceso (solo owner de empresa puede modificar)
   - Eventos para cada operación importante
   - Validaciones de negocio

3. **Tests Completos**
   - Test de registro de empresa
   - Test de agregar producto
   - Test de flujo completo: agregar al carrito → crear invoice → pagar
   - Test de control de stock
   - Test de permisos

4. **Optimizaciones**
   - Usar mapping para búsquedas O(1)
   - Minimizar storage writes
   - Gas optimization

---

## Parte 5: Web Admin (Panel de Administración)

### Objetivo
Panel para que empresas gestionen productos, vean facturas y clientes con una interfaz profesional y moderna.

### Ubicación
`web-admin/`

### Funcionalidades

#### 1. Gestión de Empresas
- Registrar nueva empresa
- Ver lista de empresas
- Editar información de empresa

#### 2. Gestión de Productos
- Agregar producto (nombre, precio, stock, imagen)
- Editar producto
- Activar/desactivar producto
- Ver stock disponible

#### 3. Gestión de Facturas
- Ver todas las facturas de la empresa
- Filtrar por estado (pagada/pendiente)
- Ver detalles de cada factura
- Ver transacción en blockchain

#### 4. Clientes
- Ver lista de clientes
- Historial de compras por cliente

### Componentes Principales

```typescript
// Conexión de Wallet
function WalletConnect() {
  // Conectar MetaMask
  // Mostrar dirección y balance
}

// Registro de Empresa
function CompanyRegistration() {
  // Formulario para registrar empresa
  // Solo si wallet conectada no tiene empresa
}

// Lista de Productos
function ProductList({ companyId }) {
  // Cargar productos del contrato
  // Botones para editar/eliminar
}

// Formulario de Producto
function ProductForm({ companyId, productId? }) {
  // Agregar o editar producto
  // Upload de imagen a IPFS
}
```

### Tareas del Estudiante

1. **Setup del Proyecto**
   - Configurar Next.js con TypeScript
   - Instalar Ethers.js y dependencias
   - Configurar Tailwind CSS
   - Setup de variables de entorno
   - Configurar IPFS (Pinata o Infura)

2. **Implementar Hooks**
   - `useWallet`: Gestión de conexión MetaMask
   - `useContract`: Instanciar contratos
   - `useCompany`: Datos de empresa
   - `useProducts`: Lista de productos
   - `useIPFS`: Upload de imágenes a IPFS

3. **Implementar Páginas**
   - `/`: Dashboard principal con analytics
   - `/companies`: Lista y registro de empresas
   - `/company/[id]`: Detalle de empresa con tabs
   - `/company/[id]/products`: Gestión de productos
   - `/company/[id]/invoices`: Lista de facturas
   - `/company/[id]/analytics`: Dashboard de métricas
   - `/company/[id]/reviews`: Gestión de reviews

4. **Dashboard de Analytics**
   - Gráficos de ventas (Recharts o Chart.js)
   - Productos más vendidos
   - Total de ingresos en USDT
   - Gráfico de ventas por período
   - Métricas de clientes

5. **Integración con IPFS**
   - Componente de upload de imágenes
   - Preview de imágenes antes de subir
   - Subida de múltiples imágenes
   - Gestión de imágenes en IPFS

6. **Validaciones**
   - Solo owner de empresa puede editar
   - Validar que wallet esté conectada
   - Validar red correcta (localhost/31337)
   - Manejo de errores de transacciones

7. **UX/UI**
   - Dark mode support
   - Responsive design
   - Loading states
   - Mensajes de éxito/error
   - Confirmaciones antes de transacciones
   - Paleta de colores profesional para e-commerce
   - Diseño moderno y llamativo

---

## Parte 6: Web Customer (Tienda Online)

### Objetivo
Tienda online donde clientes compran productos con USDTokens con una experiencia de usuario moderna y atractiva.

### Ubicación
`web-customer/`

### Funcionalidades

#### 1. Catálogo de Productos
- Ver todos los productos disponibles
- Filtrar por empresa
- Ver precio y stock
- Agregar al carrito

#### 2. Carrito de Compras
- Ver productos en carrito
- Modificar cantidades
- Ver total
- Proceder al pago

#### 3. Checkout
- Crear invoice desde carrito
- Redirigir a pasarela de pago
- Limpiar carrito después de crear invoice

#### 4. Mis Facturas
- Ver historial de compras
- Ver estado de pago
- Ver detalles de cada factura

### Flujo de Compra

```
1. Usuario navega productos
   ↓
2. Agrega productos al carrito
   ↓
3. Va a /cart y hace checkout
   ↓
4. Se crea Invoice en blockchain
   ↓
5. Carrito se limpia
   ↓
6. Redirige a pasarela de pago
   ↓
7. Usuario paga con tokens
   ↓
8. Regresa a /orders (invoices)
   ↓
9. Ve invoice marcada como "Paid"
```

### Componentes Principales

```typescript
// Lista de Productos
function ProductsPage() {
  // Cargar productos (sin necesidad de wallet)
  // Botón "Add to Cart" (requiere wallet)
}

// Carrito
function CartPage() {
  // Mostrar items del carrito
  // Calcular total
  // Botón "Checkout" → crear invoice
}

// Mis Facturas
function OrdersPage() {
  // Cargar facturas del cliente
  // Mostrar estado (Paid/Pending)
  // Ver detalles
}
```

### Tareas del Estudiante

1. **Implementar Catálogo**
   - Cargar productos sin wallet (read-only)
   - Diseño de tarjetas de producto
   - Paginación o infinite scroll
   - Sistema de búsqueda/filtros
   - Visualización de imágenes desde IPFS

2. **Implementar Carrito**
   - Hook `useCart` para gestión de estado
   - Agregar/quitar/actualizar productos
   - Persistencia en blockchain
   - Calcular total

3. **Implementar Checkout**
   - Agrupar items por empresa
   - Crear invoice llamando al contrato
   - Esperar confirmación de transacción
   - Construir URL de pasarela de pago
   - Limpiar carrito
   - Redirigir a pasarela

4. **Implementar Historial**
   - Cargar invoices del usuario
   - Mostrar detalles de cada invoice
   - Indicador visual de estado (Paid/Pending)
   - Link a transacción en blockchain

5. **Sistema de Reviews**
   - Formulario para dejar review después de compra
   - Validar que el producto fue comprado
   - Mostrar rating promedio en cards de producto
   - Lista de reviews en página de detalle
   - Filtros por rating
   - Indicador de review verificado

6. **Optimizaciones**
   - Cache de productos
   - Optimistic updates en carrito
   - Loading skeletons
   - Error boundaries
   - Lazy loading de imágenes IPFS

---

## Parte 7: Integración Completa

### Script de Deploy Automatizado

El archivo `restart-all.sh` automatiza todo el proceso:

```bash
#!/bin/bash

# 1. Detener aplicaciones anteriores
# 2. Iniciar Anvil (blockchain local)
# 3. Deploy USDToken
# 4. Deploy Ecommerce
# 5. Actualizar variables de entorno
# 6. Iniciar todas las aplicaciones
```

### Variables de Entorno por Aplicación

#### compra-stableboin
```env
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

#### pasarela-de-pago
```env
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
```

#### web-admin
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
```

#### web-customer
```env
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=0x...
```

### Puertos de las Aplicaciones
- Anvil: `http://localhost:8545`
- Compra Stablecoin: `http://localhost:6001`
- Pasarela de Pago: `http://localhost:6002`
- Web Admin: `http://localhost:6003`
- Web Customer: `http://localhost:6003`

---

## Parte 8: Testing del Sistema Completo

### Escenario de Prueba Completo

1. **Setup Inicial**
   ```bash
   # Iniciar todo el sistema
   ./restart-all.sh

   # Obtener addresses de los contratos desplegados
   # (se muestran al final del script)
   ```

2. **Comprar Tokens**
   - Ir a `http://localhost:6001`
   - Conectar MetaMask
   - Comprar 1000 USDT con tarjeta de prueba
   - Verificar balance en MetaMask

3. **Registrar Empresa (Admin)**
   - Ir a `http://localhost:6003`
   - Conectar con cuenta de empresa
   - Registrar empresa "Mi Tienda"
   - Agregar productos:
     - Producto A: $10, Stock: 100
     - Producto B: $25, Stock: 50

4. **Comprar Productos (Customer)**
   - Ir a `http://localhost:6003`
   - Ver catálogo de productos
   - Conectar wallet de cliente
   - Agregar Producto A (qty: 2) al carrito
   - Agregar Producto B (qty: 1) al carrito
   - Ir a carrito
   - Hacer checkout → crea invoice
   - Redirige a pasarela de pago

5. **Pagar en Pasarela**
   - Ver detalles del pago ($45)
   - Conectar MetaMask (cuenta cliente)
   - Verificar saldo suficiente
   - Confirmar pago
   - Aprobar gasto de tokens
   - Confirmar transacción processPayment
   - Ver confirmación de pago exitoso

6. **Verificar Invoice**
   - Redirige a `http://localhost:6003/orders`
   - Ver invoice marcada como "Paid"
   - Ver detalles de la compra

7. **Verificar Empresa (Admin)**
   - Volver a `http://localhost:6003`
   - Ver invoice en panel de empresa
   - Verificar balance de tokens recibidos
   - Ver stock actualizado:
     - Producto A: 98
     - Producto B: 49

### Tareas del Estudiante

1. **Documentar Pruebas**
   - Crear documento con capturas de pantalla
   - Documentar cada paso del flujo
   - Anotar hashes de transacciones
   - Verificar estados en blockchain

2. **Testing de Errores**
   - Intentar pagar sin saldo
   - Intentar agregar producto sin wallet
   - Intentar modificar producto de otra empresa
   - Producto sin stock

3. **Testing de Edge Cases**
   - Múltiples productos de diferentes empresas
   - Cancelar pago en pasarela
   - Cambiar de cuenta en MetaMask
   - Recarga de página durante proceso

---

## Solución de Problemas Comunes

### Problemas con Smart Contracts

#### Error: "Nonce too high"
**Causa**: MetaMask está intentando usar un nonce mayor que el actual en la blockchain.

**Solución**:
```bash
# Resetear nonce en MetaMask
# Settings > Advanced > Reset Account
```

#### Error: "Insufficient funds for gas"
**Causa**: La cuenta no tiene suficiente ETH para pagar gas.

**Solución**:
```bash
# Fundear cuenta desde Anvil
cast send DIRECCION_CUENTA --value 10ether --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://localhost:8545
```

#### Error: "Contract not deployed"
**Causa**: El contrato no está desplegado o la dirección es incorrecta.

**Solución**:
- Verificar que `restart-all.sh` se ejecutó correctamente
- Comprobar dirección del contrato en la consola
- Verificar variables de entorno en `.env`

#### Tests fallan con "fork not found"
**Causa**: Fork de blockchain no configurado.

**Solución**:
```bash
# Verificar configuración de foundry.toml
# Para tests locales, no se necesita fork
forge test --skip-fork
```

### Problemas con Frontend

#### MetaMask no se conecta
**Causa**: Aplicación no está ejecutándose en el puerto correcto o MetaMask no está instalado.

**Solución**:
1. Verificar que MetaMask esté instalado
2. Verificar que la app esté corriendo en `localhost`
3. Refrescar la página
4. Verificar consola del navegador para errores

#### Error: "Network mismatch"
**Causa**: MetaMask está conectado a una red diferente.

**Solución**:
1. Agregar red local a MetaMask:
   - Network Name: `Localhost 8545`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`
2. Cambiar a la red correcta en MetaMask

#### La transacción se queda "pending" indefinidamente
**Causa**: Anvil se quedó sin fondos o no está funcionando.

**Solución**:
```bash
# Reiniciar Anvil
pkill anvil
anvil --accounts 10

# Ejecutar restart-all.sh
./restart-all.sh
```

#### Variables de entorno no funcionan
**Causa**: Archivos `.env.local` no están siendo leídos o formato incorrecto.

**Solución**:
1. Verificar que el archivo se llama `.env.local` (no `.env`)
2. Verificar formato: `NEXT_PUBLIC_VARIABLE=valor` (sin comillas)
3. Reiniciar servidor de desarrollo
4. Verificar que las variables comienzan con `NEXT_PUBLIC_` para variables del cliente

#### Build de Next.js falla
**Causa**: Errores de TypeScript, dependencias faltantes, o problemas de memoria.

**Solución**:
```bash
# Limpiar cache y reinstalar
rm -rf .next node_modules package-lock.json
npm install

# Si hay errores de memoria en build
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build
```

### Problemas con Stripe

#### Error: "Invalid API key"
**Causa**: API keys incorrectas o no configuradas.

**Solución**:
1. Verificar dashboard de Stripe
2. Copiar claves de Test Mode
3. Actualizar `.env.local`
4. Reiniciar servidor

#### El webhook no se ejecuta
**Causa**: Webhook no configurado o endpoint incorrecto.

**Solución**:
1. Usar Stripe CLI para testing local:
```bash
stripe listen --forward-to localhost:6001/api/webhooks/stripe
```

2. Copiar webhook signing secret a `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### Payment Intent falla
**Causa**: Cantidad incorrecta o configuración del Payment Intent mal formada.

**Solución**:
- Verificar que la cantidad esté en centavos para Stripe
- Verificar moneda configurada (USD)
- Revisar logs en Stripe Dashboard

### Problemas con Integración

#### Los tokens no se acreditan después del pago
**Causa**: Webhook no confirmado o mint no ejecutado.

**Solución**:
1. Verificar logs del webhook
2. Verificar que el `WALLET_PRIVATE_KEY` sea correcto
3. Verificar que el contrato USDToken permite mint
4. Revisar logs en consola del servidor

#### Error al redirigir a pasarela de pago
**Causa**: URL mal formada o parámetros faltantes.

**Solución**:
- Verificar que todos los parámetros necesarios estén presentes
- Verificar formato de `amount` (number, no string)
- Verificar que `redirect` URL sea válida

#### Carrito se vacía sin crear invoice
**Causa**: Error en la transacción de createInvoice o falta de aprobación.

**Solución**:
1. Verificar balance de tokens del usuario
2. Verificar que se aprobó el gasto al contrato Ecommerce
3. Revisar logs de consola del navegador
4. Verificar gas limit adecuado

### Comandos de Debugging

```bash
# Ver logs de Anvil en tiempo real
anvil --verbose

# Ver balance de una cuenta
cast balance DIRECCION --rpc-url http://localhost:8545

# Ver nonce de una cuenta
cast nonce DIRECCION --rpc-url http://localhost:8545

# Obtener logs de un evento
cast logs --rpc-url http://localhost:8545 "event EventName(...)" desde_bloque hasta_bloque

# Decodificar calldata de una transacción
cast 4byte-decode CALLDATA

# Ver storage de un contrato
cast storage DIRECCION slot --rpc-url http://localhost:8545

# Inspeccionar transacción fallida
cast run TX_HASH --rpc-url http://localhost:8545

# Limpiar todo y empezar de nuevo
./restart-all.sh
```

### Recursos de Ayuda

- **Discord/Foro**: Comunidad de Foundry
- **Stack Overflow**: Etiquetas `solidity`, `nextjs`, `metamask`
- **Documentación**: Ver sección "Recursos Adicionales"
- **Logs**: Siempre revisar consola del navegador y terminal

---

## Recursos Adicionales

### Documentación
- [Solidity Docs](https://docs.soliditylang.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Ethers.js v6](https://docs.ethers.org/v6/)
- [Next.js Docs](https://nextjs.org/docs)
- [Stripe Docs](https://stripe.com/docs)

### Herramientas
- [Remix IDE](https://remix.ethereum.org/) - IDE online para Solidity
- [MetaMask](https://metamask.io/) - Wallet de criptomonedas
- [IPFS](https://ipfs.io/) - Almacenamiento descentralizado

### Comandos Útiles

```bash
# Foundry
forge build                    # Compilar contratos
forge test                     # Ejecutar tests
forge test -vvv               # Tests con logs detallados
forge fmt                      # Formatear código
forge clean                    # Limpiar builds

# Anvil
anvil                          # Iniciar blockchain local
anvil --accounts 10           # Con 10 cuentas precargadas

# Cast (interactuar con contratos)
cast call ADDRESS "functionName()" --rpc-url http://localhost:8545
cast send ADDRESS "functionName(args)" --private-key 0x... --rpc-url http://localhost:8545

# Next.js
npm run dev                    # Iniciar dev server
npm run build                  # Build para producción
npm run start                  # Ejecutar build
```

---

## Mejoras y Buenas Prácticas del Proyecto

### 1. Seguridad

#### Smart Contracts
- ✅ Usar OpenZeppelin para contratos base probados
- ✅ Implementar controles de acceso (Ownable, AccessControl)
- ✅ Validar todas las entradas (require statements)
- ✅ Prevenir reentrancy con checks-effects-interactions
- ✅ Usar SafeMath o versiones de Solidity ≥0.8 con overflow checks
- ✅ Emitir eventos para auditoría de transacciones
- ✅ Documentar decisiones de diseño en comentarios NatSpec

#### Frontend
- ✅ Nunca exponer private keys en código
- ✅ Validar entrada del usuario antes de enviar a blockchain
- ✅ Implementar rate limiting en APIs
- ✅ Usar HTTPS en producción
- ✅ Sanitizar inputs para prevenir XSS
- ✅ Verificar firmas de transacciones antes de mostrar como confirmadas

### 2. Optimización de Gas

#### Smart Contracts
- Empaquetar variables struct para reducir storage slots
- Usar `uint256` en vez de `uint8` en loops (gas más barato)
- Caché variables de storage en memoria cuando se usen múltiples veces
- Emitir eventos solo con datos necesarios
- Usar `unchecked` blocks donde overflow/underflow es imposible
- Preferir arrays fijos sobre dinámicos cuando sea posible
- Usar `calldata` en vez de `memory` para parámetros de lectura

#### Ejemplo:
```solidity
// ❌ Ineficiente
for (uint8 i = 0; i < products.length; i++) {
    total += products[i].price;
}

// ✅ Optimizado
uint256 length = products.length;
for (uint256 i = 0; i < length; ++i) {
    total += products[i].price;
}
```

### 3. Manejo de Errores

#### Frontend
- Mostrar mensajes de error descriptivos al usuario
- Implementar retry logic para transacciones fallidas
- Manejar diferentes tipos de errores (user rejection, network error, etc.)
- Usar Error Boundaries en React para prevenir crashes
- Registrar errores en servicio de logging (Sentry, LogRocket)

#### Ejemplo de manejo:
```typescript
try {
  const tx = await contract.processPayment(...);
  await tx.wait();
  showSuccess("Pago procesado exitosamente");
} catch (error: any) {
  if (error.code === 4001) {
    showError("Transacción rechazada por el usuario");
  } else if (error.code === -32603) {
    showError("Error en la red. Intenta nuevamente.");
  } else {
    showError("Error inesperado: " + error.message);
  }
}
```

### 4. Testing

#### Smart Contracts
- Coverage mínimo del 80%
- Tests unitarios para cada función
- Tests de integración para flujos completos
- Tests de fuzzing para funciones críticas
- Tests de gas para optimización
- Tests de seguridad (reentrancy, overflows, etc.)

#### Frontend
- Tests unitarios para componentes clave
- Tests de integración para flujos de usuario
- Tests E2E para flujo completo de compra
- Mocks de contratos para tests aislados
- Snapshot testing para UI

### 5. Performance

#### Frontend
- Usar lazy loading para componentes pesados
- Implementar paginación o infinite scroll
- Optimizar imágenes (WebP, lazy loading)
- Cachear datos de blockchain cuando sea posible
- Usar React.memo para componentes que no cambian frecuentemente
- Implementar Service Workers para offline support
- Code splitting por rutas

#### Blockchain
- Indexar eventos para búsquedas rápidas (The Graph, Moralis)
- Usar multicall para múltiples lecturas
- Batch transacciones cuando sea posible
- Usar eventos en vez de storage para datos no críticos

### 6. Documentación

#### Código
- Comentarios NatSpec para todas las funciones públicas
- README con instrucciones claras de setup
- Documentación de arquitectura
- Diagramas de flujo de datos
- API documentation generada automáticamente

#### Documentación de usuario
- Guía de instalación paso a paso
- Capturas de pantalla de la UI
- Demo en video
- FAQ de problemas comunes
- Changelog de versiones

### 7. DevOps y Deployment

#### Scripts de automatización
- `restart-all.sh`: Deploy completo del sistema
- Scripts de verificación de contratos
- Scripts de actualización de variables de entorno
- Health checks para todos los servicios

#### CI/CD
- GitHub Actions para tests automatizados
- Deploy automático en staging
- Verificación de contratos en deployment
- Notificaciones de errores en Slack/Discord

### 8. Mejoras Adicionales

#### Funcionalidades
- Sistema de notificaciones push
- Email notifications para eventos importantes
- Dashboard de analytics para empresas
- Sistema de reviews y ratings
- Programa de fidelidad con NFTs
- Multi-wallet support (WalletConnect, Coinbase Wallet)
- Token gating para productos exclusivos

#### Técnicas
- IPFS para almacenamiento de imágenes
- The Graph para indexación de eventos
- Layer 2 para reducir fees (Polygon, Arbitrum)
- Multi-chain support
- ENS integration para nombres legibles
- Metadatos NFT para productos únicos

### 9. Monitoreo y Analytics

#### Smart Contracts
- Event tracking con The Graph
- Gas usage monitoring
- Security audits periódicos
- Upgrade patterns para contratos proxy

#### Frontend
- User analytics (Google Analytics, Mixpanel)
- Error tracking (Sentry)
- Performance monitoring (Web Vitals)
- User session recordings (Hotjar, FullStory)

### 10. Checklist de Pre-Deploy

- [ ] Todos los tests pasando
- [ ] Coverage > 80%
- [ ] No console.logs en código de producción
- [ ] Variables de entorno configuradas
- [ ] Contratos verificados en explorers
- [ ] SEO básico implementado
- [ ] Favicon y metadata configurados
- [ ] 404 y error pages personalizadas
- [ ] Loading states en todas las pantallas
- [ ] Responsive design verificado
- [ ] Accesibilidad básica verificada
- [ ] Performance auditado (Lighthouse > 90)

---

## Evaluación del Proyecto

### Criterios de Evaluación

1. **Smart Contracts (30%)**
   - Implementación correcta de ERC20
   - Arquitectura de librerías
   - Tests completos
   - Optimización de gas
   - Seguridad y validaciones

2. **Integración Blockchain (20%)**
   - Conexión con MetaMask
   - Manejo de transacciones
   - Manejo de errores
   - Eventos y logs

3. **Funcionalidad (25%)**
   - Todas las features funcionando
   - Flujo completo de compra
   - Gestión de estado
   - Persistencia de datos

4. **UX/UI (15%)**
   - Diseño intuitivo
   - Responsive
   - Loading states
   - Mensajes claros

5. **Documentación (10%)**
   - README completo
   - Comentarios en código
   - Documentación de API
   - Guía de usuario

---

## Entregables

1. **Código Fuente**
   - Repositorio Git con todo el código
   - Commits significativos
   - Branches organizadas

2. **Documentación**
   - README con instrucciones de instalación
   - Diagramas de arquitectura
   - Documentación de contratos
   - Guía de usuario

3. **Demo**
   - Video demo (5-10 minutos)
   - Presentación del proyecto
   - Explicación de decisiones técnicas

4. **Tests**
   - Coverage mínimo 80%
   - Tests de integración
   - Reporte de tests

---

## Extensiones Opcionales (Bonus)

1. **Multi-moneda** ✅ (Integrado)
   - Agregar más stablecoins (USDT, EURT)
   - Exchange entre monedas
   - Selector de moneda en UI

2. **Sistema de Reviews** ✅ (Integrado)
   - Clientes pueden dejar reseñas
   - Rating de productos (1-5 estrellas)
   - Verificación de compra
   - Analytics de reviews

3. **Programa de Fidelidad**
   - NFTs como recompensas
   - Descuentos para clientes frecuentes
   - Sistema de puntos

4. **Marketplace Multi-vendor** ✅ (Ya implementado)
   - Múltiples empresas en una plataforma
   - Comisiones de plataforma

5. **Notificaciones**
   - Email cuando se crea invoice
   - Push notifications para pagos
   - Webhooks para eventos

6. **Analytics Dashboard** ✅ (Integrado)
   - Gráficos de ventas
   - Productos más vendidos
   - Métricas de negocio
   - Exportación de datos

7. **IPFS Integration** ✅ (Integrado)
   - Almacenamiento descentralizado de imágenes
   - Múltiples imágenes por producto
   - Optimización de carga

---

## Conclusión

Este proyecto integra múltiples tecnologías modernas:
- Blockchain y Smart Contracts
- DeFi (stablecoins)
- Pagos tradicionales (Stripe)
- Full-stack web development
- TypeScript y React

Al completarlo, el estudiante tendrá experiencia práctica en:
- Desarrollo de smart contracts seguros
- Integración con wallets de criptomonedas
- Desarrollo de DApps
- Arquitectura de aplicaciones descentralizadas
- Testing en blockchain
- UX para aplicaciones crypto

¡Éxito con el proyecto! 🚀
