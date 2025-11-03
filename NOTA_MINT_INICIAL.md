# Nota sobre el Mint Inicial de Tokens

## ⚠️ Importante

Cuando se despliega el contrato `USDToken` por primera vez, **automáticamente se acuñan 1,000,000 USDT al deployer**.

## 📋 Detalles

- **Archivo**: `stablecoin/sc/script/DeployUSDToken.s.sol`
- **Línea 26**: `usdt.mint(deployer, INITIAL_MINT);`
- **Cantidad inicial**: `INITIAL_MINT = 1_000_000 * 10 ** 6` (1 millón de USDT)

## ✅ Esto es Normal

Este comportamiento es **intencional** y está diseñado para:
1. Proveer liquidez inicial al sistema
2. Permitir pruebas del sistema de pagos
3. Facilitar el desarrollo y testing

## 🔍 Cómo Verificar

Si ves un saldo de 1,000,000 USDT (o más) en tu wallet después de un deploy:
- Esto es **esperado** si eres el deployer
- El deployer es la cuenta que ejecuta el script (por defecto, la cuenta 0 de Anvil)

## 🚫 No es un Error

Este saldo **NO es un error** ni un valor hardcodeado en el frontend. Es parte del deployment normal del contrato.

## 💡 Si No Quieres el Mint Inicial

Si deseas deshabilitar el mint inicial, comenta la línea 26 en `DeployUSDToken.s.sol`:

```solidity
// usdt.mint(deployer, INITIAL_MINT);
```

