# Smart Contracts - Tokens Multi-moneda

Contratos ERC20 para USDToken y EURToken con funcionalidad de mint/burn.

## Contratos

### USDToken
Token ERC20 que representa dólares digitales (1 USDT = 1 USD)
- Símbolo: USDT
- Decimales: 6
- Owner: puede hacer mint y burn

### EURToken
Token ERC20 que representa euros digitales (1 EURT = 1 EUR)
- Símbolo: EURT
- Decimales: 6
- Owner: puede hacer mint y burn

## Funcionalidades

- `mint(address to, uint256 amount)`: Crear nuevos tokens (solo owner)
- `burn(address from, uint256 amount)`: Quemar tokens (solo owner)
- `transfer(address to, uint256 amount)`: Transferir tokens
- `approve(address spender, uint256 amount)`: Aprobar gasto
- `transferFrom(address from, address to, uint256 amount)`: Transferir aprobados

## Testing

```bash
# Ejecutar todos los tests
forge test

# Ejecutar con logs detallados
forge test -vvv

# Ejecutar un test específico
forge test --match-test test_Deploy -vv
```

## Deploy

### Local (Anvil)

```bash
# Iniciar Anvil
anvil

# Deploy USDToken
forge script script/DeployUSDToken.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Deploy EURToken
forge script script/DeployEURToken.s.sol --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Coverage

```bash
# Generar reporte de coverage
forge coverage --report lcov
```

## Estructura

```
stablecoin/sc/
├── src/
│   ├── USDToken.sol
│   └── EURToken.sol
├── test/
│   ├── USDToken.t.sol
│   └── EURToken.t.sol
├── script/
│   ├── DeployUSDToken.s.sol
│   └── DeployEURToken.s.sol
├── foundry.toml
└── README.md
```

## Tests Implementados

- ✅ Deploy del contrato
- ✅ Mint por owner
- ✅ Mint por no-owner (revert)
- ✅ Transferencia de tokens
- ✅ Aprobaciones y transferFrom
- ✅ Burn por owner
- ✅ Validaciones de balance insuficiente
- ✅ Múltiples mints
- ✅ Múltiples burns
