# Debug: Problema con Balance No Actualizado

Si completaste la transacción pero no ves el balance actualizado, sigue estos pasos para debuggear:

---

## 🔍 Paso 1: Verificar que el Webhook Recibió el Evento

### En la terminal donde corre `stripe listen`:

Deberías ver algo como:
```
2025-11-03 10:30:15   --> payment_intent.succeeded [evt_xxx]
2025-11-03 10:30:15  <-- [200] POST http://localhost:3000/api/webhook [evt_xxx]
```

**Si NO ves esto:**
- El webhook no está recibiendo eventos
- Verifica que `stripe listen` está corriendo
- Verifica que Next.js está corriendo en puerto 3000

---

## 🔍 Paso 2: Verificar Logs de Next.js

### En la terminal donde corre `npm run dev`:

Deberías ver logs del webhook cuando se procesa el pago:

```
POST /api/webhook 200 in 1234ms
```

O si hay errores:
```
Error minting tokens: ...
```

**Busca mensajes de error o warnings**

---

## 🔍 Paso 3: Verificar Variables de Entorno

```bash
cd stablecoin/compra-stableboin
cat .env.local | grep -E "USDTOKEN|OWNER|RPC"
```

Verifica:
- ✅ `NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS` está configurada
- ✅ `OWNER_PRIVATE_KEY` está configurada
- ✅ `NEXT_PUBLIC_RPC_URL` es correcta (http://localhost:8545)

---

## 🔍 Paso 4: Verificar que el Owner tiene Permisos

```bash
cd stablecoin/sc

# Reemplaza CONTRACT_ADDRESS con tu dirección
cast call CONTRACT_ADDRESS "owner()(address)" \
  --rpc-url http://localhost:8545

# Debe retornar la dirección que corresponde a OWNER_PRIVATE_KEY
```

---

## 🔍 Paso 5: Verificar Balance Directamente

```bash
cd stablecoin/sc

# Reemplaza CONTRACT_ADDRESS y WALLET_ADDRESS
cast call CONTRACT_ADDRESS \
  "balanceOf(address)(uint256)" \
  WALLET_ADDRESS \
  --rpc-url http://localhost:8545

# El resultado está en unidades base (6 decimales)
# Divide entre 1000000 para obtener el valor en USDT
```

---

## 🔍 Paso 6: Verificar Transacciones en Anvil

Si tienes Anvil corriendo, deberías ver transacciones cuando se procesa el mint.

**En la terminal de Anvil**, deberías ver logs de transacciones cuando el webhook intenta hacer mint.

---

## 🔍 Paso 7: Probar el Webhook Manualmente

Puedes probar que el webhook funciona usando Stripe CLI:

```bash
# En una terminal separada
stripe trigger payment_intent.succeeded
```

Esto enviará un evento de prueba. Deberías ver:
- El evento en `stripe listen`
- El webhook procesándose en Next.js
- Un intento de mint

---

## ❌ Errores Comunes

### Error: "OWNER_PRIVATE_KEY no configurada"
**Solución:** Verifica que `.env.local` tiene `OWNER_PRIVATE_KEY` configurada

### Error: "Invalid contract address"
**Solución:** Verifica que `NEXT_PUBLIC_USDTOKEN_CONTRACT_ADDRESS` es correcta

### Error: "Insufficient funds for gas"
**Solución:** El owner account en Anvil necesita ETH para gas

### Error: "Webhook signature verification failed"
**Solución:** Verifica que `STRIPE_WEBHOOK_SECRET` es correcto

### Error: "Transaction reverted"
**Solución:** Verifica que la cuenta owner tiene permisos de mint

---

## ✅ Checklist de Verificación

- [ ] `stripe listen` está corriendo
- [ ] Next.js está corriendo (`npm run dev`)
- [ ] Anvil está corriendo
- [ ] Contrato USDToken está desplegado
- [ ] `.env.local` tiene todas las variables configuradas
- [ ] El webhook recibe eventos (visto en `stripe listen`)
- [ ] No hay errores en los logs de Next.js
- [ ] La cuenta owner tiene permisos de mint

---

## 🔧 Comandos Útiles para Debug

```bash
# Ver balance de una wallet
cast call CONTRACT_ADDRESS "balanceOf(address)(uint256)" WALLET_ADDRESS --rpc-url http://localhost:8545

# Ver owner del contrato
cast call CONTRACT_ADDRESS "owner()(address)" --rpc-url http://localhost:8545

# Ver últimas transacciones en Anvil
# (se ven en la terminal donde corre Anvil)

# Probar webhook manualmente
stripe trigger payment_intent.succeeded

# Ver eventos de Stripe
stripe events list --limit 5
```

---

¡Usa estos pasos para identificar dónde está el problema!

