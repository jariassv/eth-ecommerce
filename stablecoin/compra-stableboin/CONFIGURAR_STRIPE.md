# Guía: Configurar Stripe para Testing Local

Esta guía te ayudará a configurar Stripe paso a paso para la aplicación de compra de tokens.

## Paso 1: Crear Cuenta en Stripe

1. **Ve a Stripe Dashboard:**
   - Abre tu navegador y visita: https://dashboard.stripe.com/register
   - O si ya tienes cuenta: https://dashboard.stripe.com/login

2. **Registrarse/Iniciar sesión:**
   - Si es nueva cuenta, completa el formulario de registro
   - Usa tu email y crea una contraseña
   - Verifica tu email si es necesario

3. **Activar cuenta de prueba:**
   - Stripe automáticamente te da una cuenta de **modo de prueba (Test Mode)**
   - Puedes alternar entre modo de prueba y modo live con el toggle en la esquina superior

## Paso 2: Obtener API Keys

1. **Ve a la sección de API Keys:**
   - En el dashboard, ve a: **Developers** → **API keys**
   - O directamente: https://dashboard.stripe.com/test/apikeys

2. **Copiar las claves:**
   - **Publishable key** (empieza con `pk_test_...`):
     - Esta es la clave pública, visible en el frontend
     - Haz clic en "Reveal test key" si está oculta
     - Copia el valor completo
   
   - **Secret key** (empieza con `sk_test_...`):
     - Esta es la clave secreta, solo para backend
     - Haz clic en "Reveal test key"
     - Copia el valor completo
     - ⚠️ **NUNCA** compartas esta clave ni la subas a repositorios públicos

## Paso 3: Instalar Stripe CLI (Para Webhooks Locales)

### Opción A: Instalación con Stripe CLI (Recomendado)

**En Linux:**
```bash
# Descargar desde GitHub
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_*_linux_x86_64.tar.gz

# Extraer
tar -xzf stripe_*_linux_x86_64.tar.gz

# Mover a /usr/local/bin
sudo mv stripe /usr/local/bin/

# Verificar instalación
stripe --version
```

**Con npm (si tienes Node.js):**
```bash
npm install -g stripe-cli
```

### Opción B: Instalar desde repositorio (Fedora/Debian)

**Fedora/RHEL:**
```bash
sudo dnf install stripe-cli
```

**Ubuntu/Debian:**
```bash
# Agregar repositorio
echo "deb https://packages.stripe.com/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt-get update
sudo apt-get install stripe
```

### Opción C: Usar ngrok (Alternativa)

Si prefieres usar ngrok en lugar de Stripe CLI:

```bash
# Descargar ngrok
# Opción 1: Con npm
npm install -g ngrok

# Opción 2: Descarga manual desde https://ngrok.com/download
```

## Paso 4: Autenticar Stripe CLI

```bash
# Iniciar login
stripe login

# Esto abrirá tu navegador para autorizar
# Haz clic en "Allow access"
```

Después de autorizar, verás un mensaje de confirmación.

## Paso 5: Configurar Webhook Local

### Método 1: Usando Stripe CLI (Recomendado para desarrollo)

```bash
# En una terminal separada, ejecuta:
stripe listen --forward-to localhost:3000/api/webhook
```

Esto mostrará algo como:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

**Copia el `whsec_xxxxxxxxxxxxx`** - este es tu `STRIPE_WEBHOOK_SECRET`

**Mantén esta terminal corriendo** mientras desarrollas.

### Método 2: Usando ngrok (Para testing más realista)

1. **Iniciar ngrok:**
   ```bash
   ngrok http 3000
   ```
   
   Verás algo como:
   ```
   Forwarding    https://abc123.ngrok.io -> http://localhost:3000
   ```

2. **Configurar webhook en Stripe Dashboard:**
   - Ve a: **Developers** → **Webhooks**
   - O: https://dashboard.stripe.com/test/webhooks
   - Haz clic en **"Add endpoint"**
   
3. **Configurar endpoint:**
   - **Endpoint URL:** `https://tu-url-ngrok.ngrok.io/api/webhook`
     (reemplaza con tu URL de ngrok)
   - **Description:** "Testing local - Compra tokens"
   - **Events to send:** Selecciona `payment_intent.succeeded`
   - Haz clic en **"Add endpoint"**

4. **Obtener Webhook Secret:**
   - En la página del webhook, haz clic en el endpoint creado
   - En la sección "Signing secret", haz clic en **"Reveal"**
   - Copia el valor (empieza con `whsec_...`)

## Paso 6: Actualizar .env.local

1. **Ir al directorio de la app:**
   ```bash
   cd stablecoin/compra-stableboin
   ```

2. **Editar .env.local:**
   ```bash
   # Si no existe, cópialo del ejemplo
   cp .env.local.example .env.local
   
   # Editar con tu editor favorito
   nano .env.local
   # o
   vim .env.local
   # o
   code .env.local  # Si usas VS Code
   ```

3. **Actualizar los valores de Stripe:**
   ```env
   # Stripe Configuration
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_PUBLISHABLE_KEY_AQUI
   STRIPE_SECRET_KEY=sk_test_TU_SECRET_KEY_AQUI
   STRIPE_WEBHOOK_SECRET=whsec_TU_WEBHOOK_SECRET_AQUI
   ```

4. **Guardar el archivo**

## Paso 7: Verificar Configuración

Puedes usar el script de verificación:

```bash
cd stablecoin/compra-stableboin
./quick-start.sh
```

O verificar manualmente:

```bash
# Verificar que las variables están configuradas
grep -E "STRIPE|WEBHOOK" .env.local
```

## Paso 8: Probar la Configuración

1. **Asegúrate de que todo está corriendo:**
   - Anvil corriendo
   - Contratos desplegados
   - Stripe CLI corriendo (si usas método 1) o ngrok (si usas método 2)
   - Next.js corriendo: `npm run dev`

2. **Hacer una compra de prueba:**
   - Ve a http://localhost:3000
   - Conecta MetaMask
   - Intenta comprar tokens
   - Usa tarjeta de prueba: `4242 4242 4242 4242`

3. **Verificar logs:**
   - En la terminal de Stripe CLI deberías ver eventos llegando
   - En la terminal de Next.js deberías ver logs del webhook
   - En Anvil deberías ver la transacción de mint

## Tarjetas de Prueba de Stripe

| Tarjeta | Descripción |
|---------|-------------|
| `4242 4242 4242 4242` | ✅ Pago exitoso |
| `4000 0025 0000 3155` | 🔐 Requiere 3D Secure |
| `4000 0000 0000 9995` | ❌ Pago rechazado |

**Fecha:** Cualquier fecha futura (ej: 12/25)  
**CVC:** Cualquier 3 dígitos (ej: 123)  
**ZIP:** Cualquier código postal (ej: 12345)

## Troubleshooting

### Error: "STRIPE_SECRET_KEY no está configurada"
- Verifica que `.env.local` existe
- Verifica que las variables tienen los valores correctos
- Reinicia el servidor Next.js después de cambiar `.env.local`

### Error: "Webhook signature verification failed"
- Verifica que `STRIPE_WEBHOOK_SECRET` es correcto
- Si usas Stripe CLI, asegúrate de copiar el `whsec_...` que muestra
- Si usas ngrok, verifica que copiaste el secret del dashboard de Stripe

### Webhook no recibe eventos
- Verifica que Stripe CLI está corriendo (`stripe listen`)
- O verifica que ngrok está corriendo y la URL está actualizada en Stripe
- Verifica que Next.js está corriendo en el puerto 3000
- Verifica que la ruta `/api/webhook` es accesible

### Stripe CLI no funciona
- Verifica que hiciste `stripe login`
- Verifica que la instalación es correcta: `stripe --version`
- Intenta reinstalar siguiendo los pasos del Paso 3

## Comandos Útiles

```bash
# Ver eventos de webhook en tiempo real
stripe listen --forward-to localhost:3000/api/webhook

# Ver logs de eventos
stripe events list

# Probar webhook localmente
stripe trigger payment_intent.succeeded

# Verificar instalación
stripe --version

# Ver información de tu cuenta
stripe status
```

## Recursos

- **Stripe Dashboard:** https://dashboard.stripe.com
- **Documentación Stripe CLI:** https://stripe.com/docs/stripe-cli
- **Webhooks Testing:** https://dashboard.stripe.com/test/webhooks
- **API Keys:** https://dashboard.stripe.com/test/apikeys
- **Documentación Testing:** https://stripe.com/docs/testing

---

## Resumen Rápido

1. ✅ Crear cuenta en Stripe
2. ✅ Copiar API keys (publishable y secret)
3. ✅ Instalar Stripe CLI o ngrok
4. ✅ Configurar webhook (CLI o ngrok)
5. ✅ Copiar webhook secret
6. ✅ Actualizar `.env.local`
7. ✅ Probar con tarjeta de prueba

¡Listo para probar! 🚀

