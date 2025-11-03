#!/bin/bash
# Script para instalar Stripe CLI en Fedora

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Instalando Stripe CLI...${NC}"

# Descargar última versión
echo "Descargando Stripe CLI..."
LATEST_VERSION=$(curl -s https://api.github.com/repos/stripe/stripe-cli/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

echo "Versión más reciente: $LATEST_VERSION"

# Descargar binario
wget -q "https://github.com/stripe/stripe-cli/releases/latest/download/stripe_${LATEST_VERSION}_linux_x86_64.tar.gz" -O /tmp/stripe-cli.tar.gz

# Extraer
echo "Extrayendo..."
tar -xzf /tmp/stripe-cli.tar.gz -C /tmp

# Mover a /usr/local/bin (requiere sudo)
echo "Instalando en /usr/local/bin (se pedirá contraseña sudo)..."
sudo mv /tmp/stripe /usr/local/bin/

# Limpiar
rm -f /tmp/stripe-cli.tar.gz

# Verificar
if command -v stripe &> /dev/null; then
    echo -e "${GREEN}✅ Stripe CLI instalado correctamente${NC}"
    stripe --version
else
    echo -e "${YELLOW}⚠️  Instalación completada pero stripe no está en PATH${NC}"
fi
