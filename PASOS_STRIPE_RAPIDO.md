# Pasos Rápidos para Configurar Stripe

## 📋 Checklist

- [ ] Crear cuenta en Stripe
- [ ] Obtener API Keys
- [ ] Instalar Stripe CLI
- [ ] Configurar webhook
- [ ] Actualizar .env.local

---

## 🚀 Paso a Paso

### 1. Crear Cuenta en Stripe

Abre tu navegador y ve a:
👉 **https://dashboard.stripe.com/register**

Completa el formulario y verifica tu email.

### 2. Obtener API Keys

Una vez en el dashboard:

1. Ve a: **Developers** → **API keys**
   👉 https://dashboard.stripe.com/test/apikeys

2. Copia estas dos claves:
   - **Publishable key** (pk_test_...)
   - **Secret key** (sk_test_...) - Haz clic en "Reveal"

### 3. Instalar Stripe CLI

En tu terminal, desde la raíz del proyecto:

```bash
# Ejecutar el script de instalación
./install-stripe-cli.sh

# O instalar manualmente con npm (si tienes Node.js):
npm install -g stripe-cli
```

### 4. Autenticar Stripe CLI

```bash
stripe login
```

Esto abrirá tu navegador para autorizar. Haz clic en "Allow access".

### 5. Configurar Webhook Local

En una terminal separada:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

**Guarda el `whsec_xxxxxxxxxxxxx` que aparece** - lo necesitarás para `.env.local`

**Mantén esta terminal corriendo** mientras desarrollas.

### 6. Actualizar .env.local

```bash
cd stablecoin/compra-stableboin

# Editar el archivo
nano .env.local
# o
vim .env.local
```

Actualiza estas líneas:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... (tu publishable key)
STRIPE_SECRET_KEY=sk_test_... (tu secret key)
STRIPE_WEBHOOK_SECRET=whsec_... (el que mostró stripe listen)
```

Guarda y cierra (Ctrl+X, luego Y, luego Enter en nano).

### 7. Verificar

```bash
# Verificar que las claves están configuradas
grep "STRIPE" .env.local
```

Deberías ver tus tres claves configuradas.

---

## ✅ Listo para Probar

1. Ejecuta `./restart-all.sh` (si no lo has hecho)
2. Cuando pregunte, responde `s` para iniciar la app
3. Ve a http://localhost:3000
4. Usa tarjeta de prueba: `4242 4242 4242 4242`

---

## 📚 Más Detalles

Para una guía más completa, ver:
- `stablecoin/compra-stableboin/CONFIGURAR_STRIPE.md`

---

## ❓ Problemas?

### "stripe: command not found"
- Verifica que Stripe CLI está instalado: `which stripe`
- Si no, ejecuta: `./install-stripe-cli.sh`

### "Webhook signature verification failed"
- Verifica que copiaste el `whsec_...` correcto de `stripe listen`
- Asegúrate de que `stripe listen` está corriendo

### "STRIPE_SECRET_KEY no está configurada"
- Verifica que `.env.local` existe y tiene las claves
- Reinicia Next.js después de cambiar `.env.local`

