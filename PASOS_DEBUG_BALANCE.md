# Pasos para Debuggear Balance No Actualizado

## 🔍 Verificación Paso a Paso

### 1. Verificar Logs de Next.js

En la terminal donde corre `npm run dev`, busca estos mensajes después de hacer una compra:

#### ✅ Si TODO funciona correctamente, verás:
```
📨 Evento recibido: payment_intent.succeeded
💳 Payment Intent metadata: { walletAddress: '0x...', tokenAmount: '10', tokenType: 'USDT' }
📋 Datos extraídos: { walletAddress: '0x...', tokenAmount: 10, contractAddress: '0x...' }
Intentando acuñar tokens: { walletAddress: '0x...', tokenAmount: 10, contractAddress: '0x...' }
✅ Tokens acuñados exitosamente: { walletAddress: '0x...', tokenAmount: 10, txHash: '0x...' }
```

#### ❌ Si hay ERROR, verás:
```
📨 Evento recibido: payment_intent.succeeded
💳 Payment Intent metadata: { ... }
❌ Error minting tokens: [mensaje del error]
Error message: [detalles del error]
Error stack: [stack trace]
```

### 2. Verificar Balance Directamente

```bash
cd stablecoin/sc

# Obtener dirección del contrato desde .env.local
CONTRACT=$(grep "NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS" ../compra-stableboin/.env.local | cut -d '=' -f2)

# Reemplaza WALLET_ADDRESS con tu dirección de wallet
cast call $CONTRACT "balanceOf(address)(uint256)" WALLET_ADDRESS --rpc-url http://localhost:8545
```

**El resultado está en unidades base (6 decimales).**
Para convertir a USDT: `resultado / 1000000`

### 3. Verificar Transacciones en Anvil

En la terminal de Anvil, cuando se procesa un pago, deberías ver:
- Transacciones de mint
- Gas usado
- Estado (success/failure)

### 4. Verificar Metadata del Payment Intent

El webhook necesita estos datos en el metadata del payment intent:
- `walletAddress`: Dirección de la wallet del cliente
- `tokenAmount`: Cantidad de tokens a acuñar

Si estos datos no están presentes, el webhook fallará con "Datos incompletos en el pago".

## 🔧 Soluciones Comunes

### Problema: "Faltan datos en el payment intent"

**Causa:** El metadata no se está pasando correctamente al crear el Payment Intent.

**Solución:** Verifica que `create-payment-intent` está recibiendo `walletAddress` correctamente.

### Problema: "Error minting tokens: execution reverted"

**Causa:** 
- La cuenta owner no tiene permisos de mint
- No hay suficiente gas
- Dirección del contrato incorrecta

**Solución:**
```bash
# Verificar owner del contrato
cast call CONTRACT_ADDRESS "owner()(address)" --rpc-url http://localhost:8545

# Debe coincidir con la dirección derivada de OWNER_PRIVATE_KEY
```

### Problema: "Error minting tokens: insufficient funds for gas"

**Causa:** La cuenta owner no tiene suficiente ETH para gas.

**Solución:** Asegúrate de que Anvil está corriendo y la cuenta tiene fondos.

### Problema: Balance se actualiza en blockchain pero no en el frontend

**Solución:** 
- He agregado auto-refresh cada 5 segundos
- El balance debería actualizarse automáticamente
- Si no, recarga la página

## 📝 Checklist de Verificación

Haz una compra de prueba y verifica:

- [ ] Stripe listen muestra el evento `payment_intent.succeeded`
- [ ] Stripe listen muestra respuesta `[200]` del webhook
- [ ] Next.js logs muestran `📨 Evento recibido`
- [ ] Next.js logs muestran `💳 Payment Intent metadata` con datos correctos
- [ ] Next.js logs muestran `✅ Tokens acuñados exitosamente` O `❌ Error`
- [ ] Anvil muestra una transacción de mint
- [ ] El balance en blockchain es correcto (verificado con cast)
- [ ] El balance en el frontend se actualiza (auto-refresh cada 5 seg)

## 🚨 Si Nada Funciona

1. **Comparte los logs completos de Next.js** después de hacer una compra
2. **Comparte el output de:**
   ```bash
   cd stablecoin/compra-stableboin
   ./debug-webhook.sh
   ```
3. **Comparte el resultado de verificar balance:**
   ```bash
   ./verificar-balance.sh
   ```

Esto ayudará a identificar exactamente dónde está el problema.

