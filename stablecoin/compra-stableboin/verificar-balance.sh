#!/bin/bash

# Script para verificar balance de tokens directamente

CONTRACT_ADDRESS=$(grep "NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d ' ')

if [ -z "$CONTRACT_ADDRESS" ] || [ "$CONTRACT_ADDRESS" = "0x0000000000000000000000000000000000000000" ]; then
    echo "❌ NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS no está configurada correctamente"
    exit 1
fi

echo "Contrato USDToken: $CONTRACT_ADDRESS"
echo ""
read -p "Ingresa la dirección de tu wallet: " WALLET_ADDRESS

if [ -z "$WALLET_ADDRESS" ]; then
    echo "❌ Dirección de wallet requerida"
    exit 1
fi

echo ""
echo "Verificando balance..."
BALANCE=$(cast call "$CONTRACT_ADDRESS" "balanceOf(address)(uint256)" "$WALLET_ADDRESS" --rpc-url http://localhost:8545 2>/dev/null)

if [ -z "$BALANCE" ]; then
    echo "❌ Error al obtener balance. Verifica:"
    echo "   - Anvil está corriendo"
    echo "   - La dirección del contrato es correcta"
    echo "   - La dirección de wallet es correcta"
else
    # Convertir de unidades base (6 decimales) a USDT
    BALANCE_USDT=$(echo "scale=6; $BALANCE / 1000000" | bc)
    echo "✅ Balance: $BALANCE_USDT USDT"
    echo "   (En unidades base: $BALANCE)"
fi
