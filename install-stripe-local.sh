#!/bin/bash
# Instalar Stripe CLI localmente (sin sudo)

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🔧 Instalando Stripe CLI localmente...${NC}"

# Crear directorio bin local si no existe
BIN_DIR="$HOME/.local/bin"
mkdir -p "$BIN_DIR"

# Descargar última versión
echo "Descargando Stripe CLI..."
LATEST_VERSION=$(curl -s https://api.github.com/repos/stripe/stripe-cli/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

echo "Versión: $LATEST_VERSION"

# Descargar binario
TEMP_FILE="/tmp/stripe-cli-${LATEST_VERSION}.tar.gz"
wget -q "https://github.com/stripe/stripe-cli/releases/latest/download/stripe_${LATEST_VERSION}_linux_x86_64.tar.gz" -O "$TEMP_FILE"

# Extraer
echo "Extrayendo..."
tar -xzf "$TEMP_FILE" -C /tmp

# Mover a directorio local
mv /tmp/stripe "$BIN_DIR/"

# Hacer ejecutable
chmod +x "$BIN_DIR/stripe"

# Limpiar
rm -f "$TEMP_FILE"

# Verificar
if [ -f "$BIN_DIR/stripe" ]; then
    echo -e "${GREEN}✅ Stripe CLI instalado en: $BIN_DIR/stripe${NC}"
    "$BIN_DIR/stripe" --version
    
    # Verificar si está en PATH
    if [[ ":$PATH:" != *":$BIN_DIR:"* ]]; then
        echo -e "${YELLOW}⚠️  Agregar a PATH: export PATH=\"\$PATH:$BIN_DIR\"${NC}"
        echo -e "${YELLOW}   O agregar a ~/.bashrc: echo 'export PATH=\"\$PATH:$BIN_DIR\"' >> ~/.bashrc${NC}"
    fi
else
    echo -e "${YELLOW}❌ Error en la instalación${NC}"
    exit 1
fi
