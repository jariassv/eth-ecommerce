#!/bin/bash

# Script para deploy completo del E-Commerce con Blockchain
# Autor: Tu Nombre
# Fecha: 2025

set -e  # Exit on error

echo "🚀 Iniciando deploy completo del E-Commerce Blockchain..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir con colores
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Configuración de logs
LOG_ROOT="$(pwd)/logs"
RUN_ID=$(date +%Y%m%d-%H%M%S)
mkdir -p "$LOG_ROOT"

# Helper para obtener ruta de log por servicio
log_file() {
    local service="$1"
    local dir="$LOG_ROOT/$service"
    mkdir -p "$dir"
    echo "$dir/${service}-${RUN_ID}.log"
}

# Puertos base
COMPRA_PORT=6001
PASA_PORT=6002
CUSTOMER_PORT=6003
ADMIN_PORT=6004
ORACLE_API_PORT=6005

# 1. Detener aplicaciones anteriores
print_info "Deteniendo aplicaciones anteriores..."
pkill -f "next dev" || true
pkill -f "node.*oracle/api" || true
pkill -f "anvil" || true
sleep 2
print_success "Aplicaciones anteriores detenidas"

# 2. Iniciar Anvil
ANVIL_LOG=$(log_file "anvil")
print_info "Iniciando Anvil (blockchain local)... (log: $ANVIL_LOG)"
anvil --accounts 10 --balance 10000 > "$ANVIL_LOG" 2>&1 &
ANVIL_PID=$!
sleep 3
print_success "Anvil iniciado (PID: $ANVIL_PID)"

# Configurar private key (cuenta 0 de Anvil por defecto)
PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
# Guardar PRIVATE_KEY para uso posterior (para .env.local)
OWNER_PRIVATE_KEY="$PRIVATE_KEY"

# 3. Deploy USDToken
print_info "Deployando USDToken..."
cd stablecoin/sc
if [ ! -f "out/USDToken.sol/USDToken.json" ]; then
    forge build
fi
export PRIVATE_KEY
DEPLOY_OUTPUT=$(forge script script/DeployUSDToken.s.sol --rpc-url http://localhost:8545 --broadcast --private-key $PRIVATE_KEY -vvv 2>&1)
# Extraer dirección del contrato desplegado
USD_TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "USDToken deployed at:" | tail -1 | sed -n 's/.*USDToken deployed at: \(0x[a-fA-F0-9]\{40\}\).*/\1/p')
if [ -z "$USD_TOKEN_ADDRESS" ]; then
    # Fallback: buscar cualquier dirección en las últimas líneas del output
    USD_TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -iE "0x[a-fA-F0-9]{40}" | tail -1 | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)
fi
if [ -z "$USD_TOKEN_ADDRESS" ]; then
    print_error "No se pudo obtener la dirección del contrato USDToken"
    exit 1
fi
cd ../..
print_success "USDToken desplegado en: $USD_TOKEN_ADDRESS"

# 4. Deploy EURToken
print_info "Deployando EURToken..."
cd stablecoin/sc
if [ ! -f "out/EURToken.sol/EURToken.json" ]; then
    forge build
fi
export PRIVATE_KEY
DEPLOY_OUTPUT=$(forge script script/DeployEURToken.s.sol --rpc-url http://localhost:8545 --broadcast --private-key $PRIVATE_KEY -vvv 2>&1)
EUR_TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "EURToken deployed at:" | tail -1 | sed -n 's/.*EURToken deployed at: \(0x[a-fA-F0-9]\{40\}\).*/\1/p')
if [ -z "$EUR_TOKEN_ADDRESS" ]; then
    EUR_TOKEN_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -iE "0x[a-fA-F0-9]{40}" | tail -1 | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)
fi
if [ -z "$EUR_TOKEN_ADDRESS" ]; then
    print_error "No se pudo obtener la dirección del contrato EURToken"
    exit 1
fi
cd ../..
print_success "EURToken desplegado en: $EUR_TOKEN_ADDRESS"

# 5. Deploy ExchangeRateOracle
print_info "Deployando ExchangeRateOracle..."
cd oracle/sc
if [ ! -f "out/ExchangeRateOracle.sol/ExchangeRateOracle.json" ]; then
    forge build
fi
export PRIVATE_KEY
export USDT_TOKEN_ADDRESS=$USD_TOKEN_ADDRESS
export EURT_TOKEN_ADDRESS=$EUR_TOKEN_ADDRESS
# Nota: El script de deploy espera USDT_TOKEN_ADDRESS y EURT_TOKEN_ADDRESS (con T)
# Rate inicial: 1.10 USD por EUR (1,100,000 en 6 decimales)
export INITIAL_RATE=1100000
DEPLOY_OUTPUT=$(forge script script/DeployExchangeRateOracle.s.sol --rpc-url http://localhost:8545 --broadcast --private-key $PRIVATE_KEY -vvv 2>&1)
ORACLE_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "ExchangeRateOracle deployed at:" | tail -1 | sed -n 's/.*ExchangeRateOracle deployed at: \(0x[a-fA-F0-9]\{40\}\).*/\1/p')
if [ -z "$ORACLE_ADDRESS" ]; then
    ORACLE_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -iE "0x[a-fA-F0-9]{40}" | tail -1 | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)
fi
if [ -z "$ORACLE_ADDRESS" ]; then
    print_error "No se pudo obtener la dirección del contrato ExchangeRateOracle"
    exit 1
fi
cd ../..
print_success "ExchangeRateOracle desplegado en: $ORACLE_ADDRESS"

# 6. Deploy Ecommerce
print_info "Deployando Ecommerce..."
cd sc-ecommerce
if [ ! -f "out/Ecommerce.sol/Ecommerce.json" ]; then
    forge build
fi
export PRIVATE_KEY
export USDTOKEN_ADDRESS=$USD_TOKEN_ADDRESS
export EURTOKEN_ADDRESS=$EUR_TOKEN_ADDRESS
export EXCHANGE_RATE_ORACLE_ADDRESS=$ORACLE_ADDRESS
DEPLOY_OUTPUT=$(forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast --private-key $PRIVATE_KEY -vvv 2>&1)
ECOMMERCE_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "Ecommerce deployed at:" | tail -1 | sed -n 's/.*Ecommerce deployed at: \(0x[a-fA-F0-9]\{40\}\).*/\1/p')
if [ -z "$ECOMMERCE_ADDRESS" ]; then
    ECOMMERCE_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -iE "0x[a-fA-F0-9]{40}" | tail -1 | grep -oE "0x[a-fA-F0-9]{40}" | tail -1)
fi
if [ -z "$ECOMMERCE_ADDRESS" ]; then
    print_error "No se pudo obtener la dirección del contrato Ecommerce"
    exit 1
fi
unset PRIVATE_KEY
unset USDTOKEN_ADDRESS
unset EURTOKEN_ADDRESS
unset EXCHANGE_RATE_ORACLE_ADDRESS
unset INITIAL_RATE
cd ..
print_success "Ecommerce desplegado en: $ECOMMERCE_ADDRESS"

# 6. Configurar .env.local para compra-stableboin
print_info "Configurando .env.local para compra-stableboin..."
COMPRA_ENV_FILE="stablecoin/compra-stableboin/.env.local"
COMPRA_ENV_EXAMPLE="stablecoin/compra-stableboin/.env.local.example"

# Crear .env.local si no existe, basado en .env.local.example
if [ ! -f "$COMPRA_ENV_FILE" ]; then
    if [ -f "$COMPRA_ENV_EXAMPLE" ]; then
        cp "$COMPRA_ENV_EXAMPLE" "$COMPRA_ENV_FILE"
        print_info "Creado $COMPRA_ENV_FILE desde .env.local.example"
    else
        # Crear archivo básico si no hay ejemplo
        cat > "$COMPRA_ENV_FILE" << EOF
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Blockchain Configuration
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=
NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:$COMPRA_PORT
NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT

# Contract Owner Private Key
OWNER_PRIVATE_KEY=
EOF
        print_info "Creado $COMPRA_ENV_FILE básico"
    fi
fi

# Actualizar valores en .env.local
print_info "Actualizando direcciones de contratos en .env.local..."
sed -i.bak "s|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=$USD_TOKEN_ADDRESS|g" "$COMPRA_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=$EUR_TOKEN_ADDRESS|g" "$COMPRA_ENV_FILE"
sed -i.bak "s|OWNER_PRIVATE_KEY=.*|OWNER_PRIVATE_KEY=$OWNER_PRIVATE_KEY|g" "$COMPRA_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://localhost:$COMPRA_PORT|g" "$COMPRA_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_BUY_TOKENS_URL=.*|NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT|g" "$COMPRA_ENV_FILE"
# Agregar variables si no existen
if ! grep -q "NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" "$COMPRA_ENV_FILE"; then
    echo "NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=$USD_TOKEN_ADDRESS" >> "$COMPRA_ENV_FILE"
fi
if ! grep -q "NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS" "$COMPRA_ENV_FILE"; then
    echo "NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=$EUR_TOKEN_ADDRESS" >> "$COMPRA_ENV_FILE"
fi
if ! grep -q "NEXT_PUBLIC_BUY_TOKENS_URL" "$COMPRA_ENV_FILE"; then
    echo "NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT" >> "$COMPRA_ENV_FILE"
fi
rm -f "${COMPRA_ENV_FILE}.bak" 2>/dev/null || true

print_success "Variables de entorno actualizadas en $COMPRA_ENV_FILE"
print_info "⚠️  IMPORTANTE: Verifica y completa las claves de Stripe manualmente:"
print_info "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
print_info "   - STRIPE_SECRET_KEY"
print_info "   - STRIPE_WEBHOOK_SECRET"

# 6b. Configurar .env.local para pasarela-de-pago
print_info "Configurando .env.local para pasarela-de-pago..."
PASARELA_ENV_FILE="stablecoin/pasarela-de-pago/.env.local"
PASARELA_ENV_EXAMPLE="stablecoin/pasarela-de-pago/.env.local.example"

# Crear .env.local si no existe
if [ ! -f "$PASARELA_ENV_FILE" ]; then
    if [ -f "$PASARELA_ENV_EXAMPLE" ]; then
        cp "$PASARELA_ENV_EXAMPLE" "$PASARELA_ENV_FILE"
        print_info "Creado $PASARELA_ENV_FILE desde .env.local.example"
    else
        cat > "$PASARELA_ENV_FILE" << EOF
# Blockchain Configuration
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:$PASA_PORT
NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT
EOF
        print_info "Creado $PASARELA_ENV_FILE básico"
    fi
fi

# Actualizar valores en .env.local de pasarela
print_info "Actualizando direcciones de contratos en .env.local de pasarela..."
sed -i.bak "s|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=$USD_TOKEN_ADDRESS|g" "$PASARELA_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=$EUR_TOKEN_ADDRESS|g" "$PASARELA_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS|g" "$PASARELA_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://localhost:$PASA_PORT|g" "$PASARELA_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_BUY_TOKENS_URL=.*|NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT|g" "$PASARELA_ENV_FILE"
# Agregar variables si no existen
if ! grep -q "NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS" "$PASARELA_ENV_FILE"; then
    echo "NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=$EUR_TOKEN_ADDRESS" >> "$PASARELA_ENV_FILE"
fi
if ! grep -q "NEXT_PUBLIC_BUY_TOKENS_URL" "$PASARELA_ENV_FILE"; then
    echo "NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT" >> "$PASARELA_ENV_FILE"
fi
rm -f "${PASARELA_ENV_FILE}.bak" 2>/dev/null || true

print_success "Variables de entorno actualizadas en $PASARELA_ENV_FILE"

# 6c. Configurar .env.local para web-customer
print_info "Configurando .env.local para web-customer..."
CUSTOMER_ENV_FILE="web-customer/.env.local"

# Crear .env.local si no existe
if [ ! -f "$CUSTOMER_ENV_FILE" ]; then
    cat > "$CUSTOMER_ENV_FILE" << EOF
# Blockchain Configuration
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:$CUSTOMER_PORT
NEXT_PUBLIC_PAYMENT_GATEWAY_URL=http://localhost:$PASA_PORT
NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT
EOF
    print_info "Creado $CUSTOMER_ENV_FILE básico"
fi

# Actualizar valores en .env.local de web-customer
print_info "Actualizando direcciones de contratos en .env.local de web-customer..."
sed -i.bak "s|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS|g" "$CUSTOMER_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=$USD_TOKEN_ADDRESS|g" "$CUSTOMER_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=$EUR_TOKEN_ADDRESS|g" "$CUSTOMER_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_ORACLE_API_URL=.*|NEXT_PUBLIC_ORACLE_API_URL=http://localhost:$ORACLE_API_PORT|g" "$CUSTOMER_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://localhost:$CUSTOMER_PORT|g" "$CUSTOMER_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_PAYMENT_GATEWAY_URL=.*|NEXT_PUBLIC_PAYMENT_GATEWAY_URL=http://localhost:$PASA_PORT|g" "$CUSTOMER_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_BUY_TOKENS_URL=.*|NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT|g" "$CUSTOMER_ENV_FILE"
# Agregar variables si no existen
if ! grep -q "NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS" "$CUSTOMER_ENV_FILE"; then
    echo "NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS=$EUR_TOKEN_ADDRESS" >> "$CUSTOMER_ENV_FILE"
fi
if ! grep -q "NEXT_PUBLIC_ORACLE_API_URL" "$CUSTOMER_ENV_FILE"; then
    echo "NEXT_PUBLIC_ORACLE_API_URL=http://localhost:$ORACLE_API_PORT" >> "$CUSTOMER_ENV_FILE"
fi
if ! grep -q "NEXT_PUBLIC_BUY_TOKENS_URL" "$CUSTOMER_ENV_FILE"; then
    echo "NEXT_PUBLIC_BUY_TOKENS_URL=http://localhost:$COMPRA_PORT" >> "$CUSTOMER_ENV_FILE"
fi
rm -f "${CUSTOMER_ENV_FILE}.bak" 2>/dev/null || true

print_success "Variables de entorno actualizadas en $CUSTOMER_ENV_FILE"

# 6d. Configurar .env.local para web-admin
print_info "Configurando .env.local para web-admin..."
ADMIN_ENV_FILE="web-admin/.env.local"

# Crear .env.local si no existe
if [ ! -f "$ADMIN_ENV_FILE" ]; then
    cat > "$ADMIN_ENV_FILE" << EOF
# Blockchain Configuration
NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=
NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=
NEXT_PUBLIC_RPC_URL=http://localhost:8545
NEXT_PUBLIC_CHAIN_ID=31337

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:$ADMIN_PORT

# IPFS Configuration (Pinata)
# NEXT_PUBLIC_PINATA_JWT=your_pinata_jwt_here
EOF
    print_info "Creado $ADMIN_ENV_FILE básico"
fi

# Actualizar valores en .env.local de web-admin
print_info "Actualizando direcciones de contratos en .env.local de web-admin..."
sed -i.bak "s|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_ECOMMERCE_CONTRACT_ADDRESS=$ECOMMERCE_ADDRESS|g" "$ADMIN_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS=$USD_TOKEN_ADDRESS|g" "$ADMIN_ENV_FILE"
sed -i.bak "s|NEXT_PUBLIC_APP_URL=.*|NEXT_PUBLIC_APP_URL=http://localhost:$ADMIN_PORT|g" "$ADMIN_ENV_FILE"
rm -f "${ADMIN_ENV_FILE}.bak" 2>/dev/null || true

print_success "Variables de entorno actualizadas en $ADMIN_ENV_FILE"
print_info "⚠️  OPCIONAL: Configura NEXT_PUBLIC_PINATA_JWT para subir imágenes a IPFS"

# 6e. Configurar .env para Oracle API
print_info "Configurando .env para Oracle API..."
ORACLE_API_ENV_FILE="oracle/api/.env"

# Crear .env si no existe
if [ ! -f "$ORACLE_API_ENV_FILE" ]; then
    cat > "$ORACLE_API_ENV_FILE" << EOF
# RPC URL de la blockchain
RPC_URL=http://localhost:8545

# Dirección del contrato ExchangeRateOracle
EXCHANGE_RATE_ORACLE_ADDRESS=

# Puerto del servidor (default: 6005)
PORT=$ORACLE_API_PORT

# Entorno
NODE_ENV=development
EOF
    print_info "Creado $ORACLE_API_ENV_FILE básico"
fi

# Actualizar valores en .env de Oracle API
print_info "Actualizando direcciones en .env de Oracle API..."
sed -i.bak "s|RPC_URL=.*|RPC_URL=http://localhost:8545|g" "$ORACLE_API_ENV_FILE"
sed -i.bak "s|EXCHANGE_RATE_ORACLE_ADDRESS=.*|EXCHANGE_RATE_ORACLE_ADDRESS=$ORACLE_ADDRESS|g" "$ORACLE_API_ENV_FILE"
sed -i.bak "s|PORT=.*|PORT=$ORACLE_API_PORT|g" "$ORACLE_API_ENV_FILE"
# Agregar variables si no existen
if ! grep -q "EXCHANGE_RATE_ORACLE_ADDRESS" "$ORACLE_API_ENV_FILE"; then
    echo "EXCHANGE_RATE_ORACLE_ADDRESS=$ORACLE_ADDRESS" >> "$ORACLE_API_ENV_FILE"
fi
rm -f "${ORACLE_API_ENV_FILE}.bak" 2>/dev/null || true

print_success "Variables de entorno actualizadas en $ORACLE_API_ENV_FILE"

# 6f. Configurar .env para Oracle Scripts
print_info "Configurando .env para Oracle Scripts..."
ORACLE_SCRIPTS_ENV_FILE="oracle/scripts/.env"

# Crear .env si no existe
if [ ! -f "$ORACLE_SCRIPTS_ENV_FILE" ]; then
    cat > "$ORACLE_SCRIPTS_ENV_FILE" << EOF
# RPC URL de la blockchain
RPC_URL=http://localhost:8545

# Dirección del contrato ExchangeRateOracle
EXCHANGE_RATE_ORACLE_ADDRESS=

# Private key del owner del contrato (para firmar transacciones)
PRIVATE_KEY=$OWNER_PRIVATE_KEY

# Umbral de diferencia para actualizar (en porcentaje, default: 0.1%)
RATE_UPDATE_THRESHOLD=0.1
EOF
    print_info "Creado $ORACLE_SCRIPTS_ENV_FILE básico"
fi

# Actualizar valores en .env de Oracle Scripts
print_info "Actualizando direcciones en .env de Oracle Scripts..."
sed -i.bak "s|RPC_URL=.*|RPC_URL=http://localhost:8545|g" "$ORACLE_SCRIPTS_ENV_FILE"
sed -i.bak "s|EXCHANGE_RATE_ORACLE_ADDRESS=.*|EXCHANGE_RATE_ORACLE_ADDRESS=$ORACLE_ADDRESS|g" "$ORACLE_SCRIPTS_ENV_FILE"
sed -i.bak "s|PRIVATE_KEY=.*|PRIVATE_KEY=$OWNER_PRIVATE_KEY|g" "$ORACLE_SCRIPTS_ENV_FILE"
# Agregar variables si no existen
if ! grep -q "EXCHANGE_RATE_ORACLE_ADDRESS" "$ORACLE_SCRIPTS_ENV_FILE"; then
    echo "EXCHANGE_RATE_ORACLE_ADDRESS=$ORACLE_ADDRESS" >> "$ORACLE_SCRIPTS_ENV_FILE"
fi
if ! grep -q "PRIVATE_KEY" "$ORACLE_SCRIPTS_ENV_FILE"; then
    echo "PRIVATE_KEY=$OWNER_PRIVATE_KEY" >> "$ORACLE_SCRIPTS_ENV_FILE"
fi
rm -f "${ORACLE_SCRIPTS_ENV_FILE}.bak" 2>/dev/null || true

print_success "Variables de entorno actualizadas en $ORACLE_SCRIPTS_ENV_FILE"

# 7. Resumen de direcciones
echo ""
print_info "📋 Resumen de direcciones desplegadas:"
echo "   USD_TOKEN_ADDRESS=$USD_TOKEN_ADDRESS"
echo "   EUR_TOKEN_ADDRESS=$EUR_TOKEN_ADDRESS"
echo "   ORACLE_ADDRESS=$ORACLE_ADDRESS"
echo "   ECOMMERCE_ADDRESS=$ECOMMERCE_ADDRESS"
echo "   OWNER_PRIVATE_KEY=$OWNER_PRIVATE_KEY"
echo ""

# 8. Iniciar aplicaciones Next.js (opcional)
read -p "¿Deseas iniciar las aplicaciones Next.js? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    # Iniciar compra-stableboin
    print_info "Iniciando aplicación de compra de tokens..."
    cd stablecoin/compra-stableboin
    
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependencias..."
        npm install
    fi
    
    COMPRA_LOG=$(log_file "compra-stablecoin")
    print_info "  → Log: $COMPRA_LOG"
    PORT=$COMPRA_PORT npm run dev -- --port $COMPRA_PORT > "$COMPRA_LOG" 2>&1 &
    COMPRA_PID=$!
    echo $COMPRA_PID > /tmp/next-compra-stablecoin.pid
    cd ../..
    
    sleep 3
    
    # Iniciar pasarela-de-pago
    print_info "Iniciando pasarela de pagos..."
    cd stablecoin/pasarela-de-pago
    
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependencias..."
        npm install
    fi
    
    PASARELA_LOG=$(log_file "pasarela")
    print_info "  → Log: $PASARELA_LOG"
    PORT=$PASA_PORT npm run dev -- --port $PASA_PORT > "$PASARELA_LOG" 2>&1 &
    PASARELA_PID=$!
    echo $PASARELA_PID > /tmp/next-pasarela.pid
    cd ../..
    
    sleep 3
    
    # Iniciar web-customer
    print_info "Iniciando web-customer (tienda online)..."
    cd web-customer
    
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependencias..."
        npm install
    fi
    
    CUSTOMER_LOG=$(log_file "web-customer")
    print_info "  → Log: $CUSTOMER_LOG"
    PORT=$CUSTOMER_PORT npm run dev -- --port $CUSTOMER_PORT > "$CUSTOMER_LOG" 2>&1 &
    CUSTOMER_PID=$!
    echo $CUSTOMER_PID > /tmp/next-customer.pid
    cd ..
    
    sleep 3
    
    # Iniciar web-admin
    print_info "Iniciando web-admin (panel de administración)..."
    cd web-admin
    
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependencias..."
        npm install
    fi
    
    ADMIN_LOG=$(log_file "web-admin")
    print_info "  → Log: $ADMIN_LOG"
    PORT=$ADMIN_PORT npm run dev -- --port $ADMIN_PORT > "$ADMIN_LOG" 2>&1 &
    ADMIN_PID=$!
    echo $ADMIN_PID > /tmp/next-admin.pid
    cd ..
    
    sleep 3
    
    # Iniciar Oracle API
    print_info "Iniciando Oracle API..."
    cd oracle/api
    
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependencias..."
        npm install
    fi
    
    ORACLE_API_LOG=$(log_file "oracle-api")
    print_info "  → Log: $ORACLE_API_LOG"
    PORT=$ORACLE_API_PORT npm start > "$ORACLE_API_LOG" 2>&1 &
    ORACLE_API_PID=$!
    echo $ORACLE_API_PID > /tmp/oracle-api.pid
    cd ../..
    
    sleep 3
    
    print_success "Aplicaciones iniciadas:"
    echo "  Compra Stablecoin: http://localhost:$COMPRA_PORT"
    echo "  Pasarela de Pagos: http://localhost:$PASA_PORT"
    echo "  Web Customer: http://localhost:$CUSTOMER_PORT"
    echo "  Web Admin: http://localhost:$ADMIN_PORT"
    echo "  Oracle API: http://localhost:$ORACLE_API_PORT"
else
    print_info "Para iniciar las aplicaciones manualmente:"
    echo "  cd stablecoin/compra-stableboin && PORT=$COMPRA_PORT npm run dev -- --port $COMPRA_PORT"
    echo "  cd stablecoin/pasarela-de-pago && PORT=$PASA_PORT npm run dev -- --port $PASA_PORT"
    echo "  cd web-customer && PORT=$CUSTOMER_PORT npm run dev -- --port $CUSTOMER_PORT"
    echo "  cd web-admin && PORT=$ADMIN_PORT npm run dev -- --port $ADMIN_PORT"
    echo "  cd oracle/api && PORT=$ORACLE_API_PORT npm start"
fi

print_success "Deploy completo finalizado!"
print_info "Anvil corriendo en: http://localhost:8545"
print_info "Ctrl+C para detener Anvil"

# Limpiar procesos al salir
cleanup() {
    print_info "Deteniendo procesos..."
    kill $ANVIL_PID 2>/dev/null || true
    if [ -f /tmp/next-compra-stablecoin.pid ]; then
        COMPRA_PID=$(cat /tmp/next-compra-stablecoin.pid)
        kill $COMPRA_PID 2>/dev/null || true
        rm -f /tmp/next-compra-stablecoin.pid
    fi
    if [ -f /tmp/next-pasarela.pid ]; then
        PASARELA_PID=$(cat /tmp/next-pasarela.pid)
        kill $PASARELA_PID 2>/dev/null || true
        rm -f /tmp/next-pasarela.pid
    fi
    if [ -f /tmp/next-customer.pid ]; then
        CUSTOMER_PID=$(cat /tmp/next-customer.pid)
        kill $CUSTOMER_PID 2>/dev/null || true
        rm -f /tmp/next-customer.pid
    fi
    if [ -f /tmp/next-admin.pid ]; then
        ADMIN_PID=$(cat /tmp/next-admin.pid)
        kill $ADMIN_PID 2>/dev/null || true
        rm -f /tmp/next-admin.pid
    fi
    if [ -f /tmp/oracle-api.pid ]; then
        ORACLE_API_PID=$(cat /tmp/oracle-api.pid)
        kill $ORACLE_API_PID 2>/dev/null || true
        rm -f /tmp/oracle-api.pid
    fi
    print_success "Procesos detenidos"
    exit 0
}

trap cleanup EXIT INT TERM

# Esperar
print_info "Presiona Ctrl+C para detener todos los servicios"
wait $ANVIL_PID

