# Cómo Obtener STRIPE_WEBHOOK_SECRET

Hay dos métodos para obtener el `STRIPE_WEBHOOK_SECRET`:

---

## Método 1: Usando Stripe CLI (Recomendado para Desarrollo Local) ✅

Este es el método más fácil para desarrollo local.

### Paso 1: Asegúrate de tener Stripe CLI instalado y autenticado

```bash
# Verificar que Stripe CLI está instalado
stripe --version

# Si no está autenticado, autenticar
stripe login
```

### Paso 2: Iniciar Stripe Listen

En una terminal, ejecuta:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

### Paso 3: Copiar el Webhook Secret

Inmediatamente después de ejecutar el comando, verás algo como esto:

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

**El valor que empieza con `whsec_...` es tu `STRIPE_WEBHOOK_SECRET`**

Ejemplo completo:
```
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### Paso 4: Usar el Secret

1. **Copia el valor completo** que aparece después de `whsec_`
2. **Agrégalo a tu `.env.local`**:

```bash
cd stablecoin/compra-stableboin
nano .env.local
```

Y actualiza la línea:
```env
STRIPE_WEBHOOK_SECRET=whsec_tu_valor_completo_aqui
```

### Paso 5: Mantener la Terminal Abierta

**IMPORTANTE:** Debes mantener esa terminal corriendo mientras desarrollas. 

Si cierras la terminal o detienes `stripe listen`, necesitarás:
- Ejecutar `stripe listen` de nuevo
- Obtener un NUEVO `whsec_...` (puede ser diferente)
- Actualizar `.env.local` con el nuevo valor

### ✅ Ventajas del Método 1:
- ✅ Muy fácil de configurar
- ✅ No necesitas configurar nada en el dashboard
- ✅ Perfecto para desarrollo local
- ✅ Automático - no necesitas ngrok

### ⚠️ Nota Importante:
Cada vez que ejecutas `stripe listen`, puede generar un nuevo webhook secret. Usa siempre el último que aparece en la terminal.

---

## Método 2: Usando ngrok + Dashboard de Stripe (Para Testing Más Realista)

Este método es útil si quieres simular un entorno más parecido a producción.

### Paso 1: Instalar ngrok

```bash
# Opción 1: Con npm
npm install -g ngrok

# Opción 2: Descarga manual desde https://ngrok.com/download
```

### Paso 2: Iniciar tu aplicación Next.js

```bash
cd stablecoin/compra-stableboin
npm run dev
```

La app debe estar corriendo en `http://localhost:3000`

### Paso 3: Iniciar ngrok

En una terminal separada:

```bash
ngrok http 3000
```

Verás algo como:
```
Forwarding    https://abc123.ngrok.io -> http://localhost:3000
```

**Copia la URL de ngrok** (ejemplo: `https://abc123.ngrok.io`)

### Paso 4: Configurar Webhook en Stripe Dashboard

1. **Abre tu navegador** y ve a:
   ```
   https://dashboard.stripe.com/test/webhooks
   ```

2. **Haz clic en "Add endpoint"** o "Agregar endpoint"

3. **Configura el endpoint:**
   - **Endpoint URL:** `https://tu-url-ngrok.ngrok.io/api/webhook`
     (reemplaza con tu URL de ngrok del Paso 3)
   - **Description:** "Testing local - Compra tokens"
   - **Events to send:** Selecciona `payment_intent.succeeded`
   - Haz clic en **"Add endpoint"**

4. **Obtener el Webhook Secret:**
   - En la lista de webhooks, haz clic en el endpoint que acabas de crear
   - Busca la sección **"Signing secret"**
   - Haz clic en el botón **"Reveal"** o "Revelar"
   - **Copia el valor completo** que empieza con `whsec_...`

### Paso 5: Actualizar .env.local

```bash
cd stablecoin/compra-stableboin
nano .env.local
```

Agrega:
```env
STRIPE_WEBHOOK_SECRET=whsec_tu_valor_copiado_del_dashboard
```

### ✅ Ventajas del Método 2:
- ✅ Más parecido a producción
- ✅ Puedes ver eventos en el dashboard de Stripe
- ✅ Útil para debugging

### ⚠️ Desventajas:
- ❌ Requiere mantener ngrok corriendo
- ❌ Si cambia la URL de ngrok, debes actualizar el webhook en el dashboard
- ❌ Más pasos de configuración

---

## 🎯 Recomendación

**Para desarrollo local, usa el Método 1 (Stripe CLI)**:
- Es más simple
- Funciona inmediatamente
- No necesitas configurar nada en el dashboard

**Para testing más avanzado, usa el Método 2 (ngrok)**:
- Si necesitas ver eventos en el dashboard
- Si quieres simular un entorno más real

---

## 📝 Ejemplo Completo - Método 1

```bash
# 1. Terminal 1: Iniciar Stripe Listen
stripe listen --forward-to localhost:3000/api/webhook

# Verás:
# > Ready! Your webhook signing secret is whsec_abc123def456...

# 2. Terminal 2: Actualizar .env.local
cd stablecoin/compra-stableboin
nano .env.local

# Agregar/actualizar:
STRIPE_WEBHOOK_SECRET=whsec_abc123def456...

# 3. Guardar y salir (Ctrl+X, Y, Enter)

# 4. Verificar
grep "STRIPE_WEBHOOK_SECRET" .env.local
```

---

## ❓ Problemas Comunes

### "No veo el whsec_..."
**Solución:**
- Asegúrate de que `stripe listen` está corriendo
- Verifica que no hay errores en la terminal
- Espera a que aparezca el mensaje "Ready!"

### "El webhook secret cambió"
**Solución:**
- Es normal si detienes y reinicias `stripe listen`
- Simplemente copia el nuevo valor y actualiza `.env.local`

### "Webhook signature verification failed"
**Solución:**
- Verifica que copiaste el `whsec_...` completo (debe tener ~64 caracteres)
- Asegúrate de que `stripe listen` está corriendo
- Reinicia Next.js después de cambiar `.env.local`

---

## ✅ Checklist Final

- [ ] Stripe CLI instalado
- [ ] `stripe login` ejecutado
- [ ] `stripe listen` corriendo en una terminal
- [ ] Webhook secret copiado (whsec_...)
- [ ] `.env.local` actualizado con el secret
- [ ] Next.js reiniciado (si estaba corriendo)

¡Listo! 🚀

