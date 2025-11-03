# Cómo Ver/Recuperar el Webhook Secret desde el CLI

Si ejecutaste `stripe listen` pero no viste el mensaje del webhook secret, aquí están las formas de obtenerlo:

---

## Método 1: Ejecutar stripe listen de nuevo (Más Fácil)

El webhook secret se muestra cada vez que inicias `stripe listen`.

### Pasos:

1. **Abre una terminal nueva**

2. **Ejecuta:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

3. **Verás el mensaje inmediatamente:**
   ```
   > Ready! Your webhook signing secret is whsec_abc123def456...
   ```

4. **Copia el valor completo que aparece después de `whsec_`**

5. **Si ya tenías stripe listen corriendo**, detén el anterior (Ctrl+C) y usa este nuevo

---

## Método 2: Verificar procesos corriendo

Si crees que `stripe listen` está corriendo pero no ves la terminal:

### Verificar:

```bash
ps aux | grep "stripe listen"
```

Si aparece, puedes:
- Ver el PID del proceso
- Matarlo: `kill <PID>`
- Ejecutar `stripe listen` de nuevo para ver el secret

---

## Método 3: Ver logs o historial

Si ejecutaste `stripe listen` recientemente, el secret puede estar en:

### Ver historial de comandos:

```bash
history | grep "stripe listen"
```

Esto te mostrará los comandos que ejecutaste, pero **no** mostrará el secret (por seguridad).

---

## Método 4: Ejecutar sin forward (solo para ver el secret)

Puedes ejecutar `stripe listen` solo para obtener el secret sin hacer forward:

```bash
stripe listen
```

Verás:
```
> Ready! Your webhook signing secret is whsec_...
```

Luego puedes detenerlo (Ctrl+C) y ejecutar con el forward cuando lo necesites.

---

## Método 5: Ver webhooks en el Dashboard (si usas ngrok)

Si estás usando el método de ngrok + Dashboard:

1. Ve a: https://dashboard.stripe.com/test/webhooks
2. Haz clic en tu endpoint
3. En "Signing secret", haz clic en "Reveal"
4. Copia el valor

---

## ✅ Solución Recomendada

**La forma más fácil es ejecutar `stripe listen` de nuevo:**

```bash
# 1. Asegúrate de estar autenticado
stripe login  # Si es necesario

# 2. Ejecutar listen
stripe listen --forward-to localhost:3000/api/webhook

# 3. Ver el secret (aparece inmediatamente)
# > Ready! Your webhook signing secret is whsec_...

# 4. Copiar el whsec_... completo

# 5. Actualizar .env.local
cd stablecoin/compra-stableboin
nano .env.local
# Agregar: STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📝 Nota Importante

- Cada vez que ejecutas `stripe listen`, **puede** generar un nuevo secret
- Si tienes múltiples instancias corriendo, usa el secret de la última que iniciaste
- Si cambias el secret, **actualiza `.env.local`** y **reinicia Next.js**

---

## 🔍 Verificar que el Secret está configurado

Después de actualizar `.env.local`:

```bash
cd stablecoin/compra-stableboin
grep "STRIPE_WEBHOOK_SECRET" .env.local
```

Deberías ver:
```
STRIPE_WEBHOOK_SECRET=whsec_abc123def456...
```

Si ves `whsec_your_webhook_secret_here` o está vacío, necesitas actualizarlo.

---

¡Listo! 🚀

