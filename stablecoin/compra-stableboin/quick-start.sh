#!/bin/bash

# Script de inicio rápido para testing
# Este script te ayudará a verificar que todo está configurado correctamente

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔍 Verificando configuración para testing...${NC}"
echo ""

# Verificar que .env.local existe
if [ ! -f ".env.local" ]; then
    echo -e "${RED}❌ Error: .env.local no encontrado${NC}"
    echo -e "${YELLOW}💡 Crea .env.local basándote en .env.local.example${NC}"
    exit 1
fi

echo -e "${GREEN}✅ .env.local encontrado${NC}"

# Verificar variables críticas
source .env.local 2>/dev/null || true
RPC_URL_VALUE="${NEXT_PUBLIC_RPC_URL:-${RPC_URL:-http://localhost:8545}}"

if [ -z "$NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" ]; then
    echo -e "${RED}❌ NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS no configurada${NC}"
    exit 1
fi

if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${RED}❌ STRIPE_SECRET_KEY no configurada${NC}"
    exit 1
fi

if [ -z "$OWNER_PRIVATE_KEY" ]; then
    echo -e "${RED}❌ OWNER_PRIVATE_KEY no configurada${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Variables de entorno críticas configuradas${NC}"

# Verificar que Anvil está corriendo
if ! curl -s "$RPC_URL_VALUE" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Anvil no parece estar corriendo en $RPC_URL_VALUE${NC}"
    echo -e "${YELLOW}💡 Inicia Anvil en otra terminal: anvil${NC}"
else
    echo -e "${GREEN}✅ Anvil está corriendo${NC}"
fi

# Verificar que el contrato está desplegado
if [ ! -z "$NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" ]; then
    echo -e "${GREEN}✅ Dirección del contrato configurada: $NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Configuración básica verificada!${NC}"
echo ""
echo -e "${YELLOW}📋 Checklist de inicio:${NC}"
echo "  [ ] Anvil corriendo en $RPC_URL_VALUE"
echo "  [ ] Contrato USDToken desplegado"
echo "  [ ] MetaMask configurado con red local"
echo "  [ ] Stripe CLI corriendo (stripe listen) o ngrok configurado"
echo "  [ ] Variables de entorno configuradas"
echo ""
echo -e "${GREEN}Para iniciar la app: npm run dev${NC}"

