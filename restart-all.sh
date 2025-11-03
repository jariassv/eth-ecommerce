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

# 1. Detener aplicaciones anteriores
print_info "Deteniendo aplicaciones anteriores..."
pkill -f "next dev" || true
pkill -f "anvil" || true
sleep 2
print_success "Aplicaciones anteriores detenidas"

# 2. Iniciar Anvil
print_info "Iniciando Anvil (blockchain local)..."
anvil --accounts 10 --balance 10000 &
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

# 5. Deploy Ecommerce
print_info "Deployando Ecommerce..."
cd sc-ecommerce
if [ ! -f "out/Ecommerce.sol/Ecommerce.json" ]; then
    forge build
fi
export PRIVATE_KEY
export USDTOKEN_ADDRESS=$USD_TOKEN_ADDRESS
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
NEXT_PUBLIC_APP_URL=http://localhost:3000

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
rm -f "${COMPRA_ENV_FILE}.bak" 2>/dev/null || true

print_success "Variables de entorno actualizadas en $COMPRA_ENV_FILE"
print_info "⚠️  IMPORTANTE: Verifica y completa las claves de Stripe manualmente:"
print_info "   - NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
print_info "   - STRIPE_SECRET_KEY"
print_info "   - STRIPE_WEBHOOK_SECRET"

# 7. Resumen de direcciones
echo ""
print_info "📋 Resumen de direcciones desplegadas:"
echo "   USD_TOKEN_ADDRESS=$USD_TOKEN_ADDRESS"
echo "   EUR_TOKEN_ADDRESS=$EUR_TOKEN_ADDRESS"
echo "   ECOMMERCE_ADDRESS=$ECOMMERCE_ADDRESS"
echo "   OWNER_PRIVATE_KEY=$OWNER_PRIVATE_KEY"
echo ""

# 8. Iniciar aplicaciones Next.js (opcional)
read -p "¿Deseas iniciar la aplicación de compra de tokens? (s/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_info "Iniciando aplicación de compra de tokens..."
    cd stablecoin/compra-stableboin
    
    # Verificar que node_modules existe
    if [ ! -d "node_modules" ]; then
        print_info "Instalando dependencias..."
        npm install
    fi
    
    print_success "Aplicación disponible en: http://localhost:3000"
    print_info "Presiona Ctrl+C para detener la aplicación"
    npm run dev &
    NEXT_PID=$!
    echo $NEXT_PID > /tmp/next-compra-stablecoin.pid
    cd ../..
    
    # Esperar un poco para que la app inicie
    sleep 5
    
    print_success "Aplicaciones iniciadas:"
    print_info "  - Compra Stablecoin: http://localhost:3000"
else
    print_info "Para iniciar las aplicaciones manualmente:"
    echo "  cd stablecoin/compra-stableboin && npm run dev"
fi

print_success "Deploy completo finalizado!"
print_info "Anvil corriendo en: http://localhost:8545"
print_info "Ctrl+C para detener Anvil"

# Limpiar procesos al salir
cleanup() {
    print_info "Deteniendo procesos..."
    kill $ANVIL_PID 2>/dev/null || true
    if [ -f /tmp/next-compra-stablecoin.pid ]; then
        NEXT_PID=$(cat /tmp/next-compra-stablecoin.pid)
        kill $NEXT_PID 2>/dev/null || true
        rm -f /tmp/next-compra-stablecoin.pid
    fi
    print_success "Procesos detenidos"
    exit 0
}

trap cleanup EXIT INT TERM

# Esperar
print_info "Presiona Ctrl+C para detener todos los servicios"
wait $ANVIL_PID

