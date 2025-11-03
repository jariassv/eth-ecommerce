#!/bin/bash

# Script para deployar USDToken en Anvil local
# Uso: ./deploy-local.sh [PRIVATE_KEY]

set -e

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Si se pasa la private key como argumento, usarla
if [ -z "$1" ]; then
    echo -e "${YELLOW}Uso: ./deploy-local.sh <PRIVATE_KEY>${NC}"
    echo -e "${YELLOW}Ejemplo: ./deploy-local.sh 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80${NC}"
    exit 1
fi

PRIVATE_KEY=$1
RPC_URL="http://localhost:8545"

echo -e "${GREEN}🚀 Deployando USDToken a Anvil local...${NC}"
echo ""

# Deploy usando forge script
export PRIVATE_KEY
forge script script/DeployUSDToken.s.sol \
    --rpc-url $RPC_URL \
    --broadcast \
    --private-key $PRIVATE_KEY \
    -vvv

echo ""
echo -e "${GREEN}✅ Deploy completado!${NC}"
echo ""
echo -e "${YELLOW}📝 Recuerda:${NC}"
echo "  - Copia la dirección del contrato desplegado"
echo "  - Úsala en NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS"
echo "  - Usa la misma PRIVATE_KEY en OWNER_PRIVATE_KEY"

