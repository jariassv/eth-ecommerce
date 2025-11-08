#!/bin/bash

# Script para debuggear problemas con el webhook

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}🔍 Debug: Verificando configuración del webhook...${NC}"
echo ""

# Verificar que .env.local existe
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ .env.local no existe${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.local existe${NC}"

# Cargar variables
source .env.local 2>/dev/null || true

RPC_URL_VALUE="${NEXT_PUBLIC_RPC_URL:-${RPC_URL:-http://localhost:8545}}"
APP_URL_VALUE="${NEXT_PUBLIC_APP_URL:-http://localhost:6001}"
BUY_TOKENS_URL_VALUE="${NEXT_PUBLIC_BUY_TOKENS_URL:-$APP_URL_VALUE}"
WEBHOOK_ENDPOINT="${BUY_TOKENS_URL_VALUE%/}/api/webhook"

# Verificar variables críticas
echo ""
echo -e "${YELLOW}Verificando variables de entorno:${NC}"

if [ -z "$NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS no configurada${NC}"
else
    echo -e "${GREEN}✅ NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS: ${NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS:0:10}...${NC}"
fi

if [ -z "$OWNER_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ OWNER_PRIVATE_KEY no configurada${NC}"
else
    echo -e "${GREEN}✅ OWNER_PRIVATE_KEY configurada${NC}"
fi

if [ -z "$STRIPE_WEBHOOK_SECRET" ]; then
    echo -e "${RED}❌ STRIPE_WEBHOOK_SECRET no configurada${NC}"
else
    echo -e "${GREEN}✅ STRIPE_WEBHOOK_SECRET configurada${NC}"
fi

if [ -z "$NEXT_PUBLIC_RPC_URL" ]; then
    echo -e "${YELLOW}⚠️  NEXT_PUBLIC_RPC_URL no configurada, usando default${NC}"
else
    echo -e "${GREEN}✅ NEXT_PUBLIC_RPC_URL: $NEXT_PUBLIC_RPC_URL${NC}"
fi

# Verificar que Anvil está corriendo
echo ""
echo -e "${YELLOW}Verificando Anvil:${NC}"
if curl -s "$RPC_URL_VALUE" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Anvil está corriendo${NC}"
else
    echo -e "${RED}❌ Anvil NO está corriendo en $RPC_URL_VALUE${NC}"
    echo -e "${YELLOW}💡 Inicia Anvil: anvil${NC}"
fi

# Verificar que el contrato existe
if [ ! -z "$NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" ]; then
    echo ""
    echo -e "${YELLOW}Verificando contrato USDToken:${NC}"
    
    # Intentar verificar el owner del contrato
    if command -v cast &> /dev/null; then
        OWNER=$(cast call "$NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" "owner()(address)" --rpc-url "$RPC_URL_VALUE" 2>/dev/null)
        
        if [ ! -z "$OWNER" ]; then
            echo -e "${GREEN}✅ Contrato desplegado, owner: ${OWNER:0:10}...${NC}"
        else
            echo -e "${RED}❌ No se pudo verificar el contrato${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  cast no disponible para verificar contrato${NC}"
    fi
fi

# Verificar procesos corriendo
echo ""
echo -e "${YELLOW}Verificando procesos:${NC}"

if pgrep -f "stripe listen" > /dev/null; then
    echo -e "${GREEN}✅ stripe listen está corriendo${NC}"
else
    echo -e "${RED}❌ stripe listen NO está corriendo${NC}"
    echo -e "${YELLOW}💡 Ejecuta: stripe listen --forward-to $WEBHOOK_ENDPOINT${NC}"
fi

if pgrep -f "next dev" > /dev/null; then
    echo -e "${GREEN}✅ Next.js está corriendo${NC}"
else
    echo -e "${RED}❌ Next.js NO está corriendo${NC}"
    echo -e "${YELLOW}💡 Ejecuta: npm run dev${NC}"
fi

if pgrep -f "anvil" > /dev/null; then
    echo -e "${GREEN}✅ Anvil está corriendo${NC}"
else
    echo -e "${RED}❌ Anvil NO está corriendo${NC}"
fi

echo ""
echo -e "${YELLOW}📋 Próximos pasos para debug:${NC}"
echo "1. Verifica los logs de Next.js (terminal donde corre npm run dev)"
echo "2. Verifica los eventos en stripe listen"
echo "3. Verifica los logs de Anvil para transacciones"
echo "4. Ver balance directamente con cast:"
echo "   cast call \$CONTRACT_ADDRESS \"balanceOf(address)(uint256)\" \$WALLET_ADDRESS --rpc-url $RPC_URL_VALUE"

