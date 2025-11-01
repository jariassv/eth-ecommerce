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

# 3. Deploy USDToken
print_info "Deployando USDToken..."
cd stablecoin/sc
if [ ! -f "out/USDToken.sol/USDToken.json" ]; then
    forge build
fi
forge script script/DeployUSDToken.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 || print_error "Error en deploy de USDToken"
USD_TOKEN_ADDRESS=$(cast call $(grep "USDToken deployed at:" anvil-*.log | tail -1 | awk '{print $NF}') "symbol()" --rpc-url http://localhost:8545 2>/dev/null || echo "0x...")
cd ../..
print_success "USDToken desplegado en: $USD_TOKEN_ADDRESS"

# 4. Deploy EURToken (opcional)
print_info "Deployando EURToken..."
cd stablecoin/sc
if [ ! -f "out/EURToken.sol/EURToken.json" ]; then
    forge build
fi
forge script script/DeployEURToken.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 || print_error "Error en deploy de EURToken"
EUR_TOKEN_ADDRESS=$(cast call $(grep "EURToken deployed at:" anvil-*.log | tail -1 | awk '{print $NF}') "symbol()" --rpc-url http://localhost:8545 2>/dev/null || echo "0x...")
cd ../..
print_success "EURToken desplegado en: $EUR_TOKEN_ADDRESS"

# 5. Deploy Ecommerce
print_info "Deployando Ecommerce..."
cd sc-ecommerce
if [ ! -f "out/Ecommerce.sol/Ecommerce.json" ]; then
    forge build
fi
forge script script/DeployEcommerce.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 || print_error "Error en deploy de Ecommerce"
ECOMMERCE_ADDRESS=$(cast call $(grep "Ecommerce deployed at:" anvil-*.log | tail -1 | awk '{print $NF}') "name()" --rpc-url http://localhost:8545 2>/dev/null || echo "0x...")
cd ..
print_success "Ecommerce desplegado en: $ECOMMERCE_ADDRESS"

# 6. Actualizar variables de entorno (placeholder)
print_info "Variables de entorno - Actualizar manualmente:"
echo "USD_TOKEN_ADDRESS=$USD_TOKEN_ADDRESS"
echo "EUR_TOKEN_ADDRESS=$EUR_TOKEN_ADDRESS"
echo "ECOMMERCE_ADDRESS=$ECOMMERCE_ADDRESS"

# 7. Iniciar aplicaciones Next.js (comentado hasta que estén configuradas)
print_info "Para iniciar las aplicaciones web:"
echo "  1. cd stablecoin/compra-stableboin && npm run dev"
echo "  2. cd stablecoin/pasarela-de-pago && npm run dev"
echo "  3. cd web-admin && npm run dev"
echo "  4. cd web-customer && npm run dev"

print_success "Deploy completo finalizado!"
print_info "Anvil corriendo en: http://localhost:8545"
print_info "Ctrl+C para detener Anvil"

# Wait for user to stop
trap "kill $ANVIL_PID" EXIT
wait $ANVIL_PID

