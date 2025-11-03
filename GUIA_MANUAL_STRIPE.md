# Guía Manual: Configurar Stripe Paso a Paso

Esta guía te llevará paso a paso para configurar Stripe manualmente.

---

## 📋 Paso 1: Crear Cuenta en Stripe

### 1.1. Abrir el sitio de Stripe

Abre tu navegador y ve a:
```
https://dashboard.stripe.com/register
```

### 1.2. Completar el registro

1. Ingresa tu **email**
2. Ingresa una **contraseña**
3. Haz clic en **"Create account"** o **"Crear cuenta"**

### 1.3. Verificar email

1. Revisa tu correo
2. Haz clic en el enlace de verificación que Stripe te envió
3. Completa cualquier información adicional que pida

### ✅ Verificación
- Deberías estar en el **Stripe Dashboard**
- Deberías ver "Test mode" o "Modo de prueba" en la esquina superior

---

## 📋 Paso 2: Obtener API Keys

### 2.1. Ir a la sección de API Keys

En el dashboard de Stripe:

1. Haz clic en **"Developers"** en el menú lateral izquierdo
2. Haz clic en **"API keys"**

O directamente ve a:
```
https://dashboard.stripe.com/test/apikeys
```

### 2.2. Obtener Publishable Key

1. En la sección **"Standard keys"** verás:
   - **Publishable key** (visible)
   - **Secret key** (oculta)

2. La **Publishable key** empieza con `pk_test_`
   - Debería ser visible directamente
   - Si está oculta, haz clic en **"Reveal test key"**
   - **Copia esta clave completa**

### 2.3. Obtener Secret Key

1. En la misma página, busca **"Secret key"**
2. Está oculta por seguridad (aparece como `sk_test_...`)
3. Haz clic en el botón **"Reveal test key"**
4. **Copia esta clave completa**

### ✅ Verificación
Deberías tener dos claves copiadas:
- `pk_test_...` (publishable key)
- `sk_test_...` (secret key)

**⚠️ IMPORTANTE:** Guárdalas en un lugar seguro temporalmente, las necesitarás después.

---

## 📋 Paso 3: Instalar Stripe CLI

### 3.1. Descargar Stripe CLI

1. Abre tu navegador
2. Ve a la página de releases de Stripe CLI:
   ```
   https://github.com/stripe/stripe-cli/releases/latest
   ```

3. Busca el archivo para Linux:
   - Nombre: `stripe_X.X.X_linux_x86_64.tar.gz`
   - Ejemplo: `stripe_1.32.0_linux_x86_64.tar.gz`

4. Haz clic derecho en el archivo → **"Save link as..."** o **"Guardar enlace como..."**
5. Descárgalo en tu carpeta de Descargas

### 3.2. Abrir Terminal

Abre una terminal en tu sistema.

### 3.3. Navegar a la carpeta de Descargas

```bash
cd ~/Downloads
```

(O la carpeta donde descargaste el archivo)

### 3.4. Verificar el archivo descargado

```bash
ls -lh stripe_*.tar.gz
```

Deberías ver el archivo que descargaste.

### 3.5. Extraer el archivo

```bash
tar -xzf stripe_*.tar.gz
```

Esto extraerá el ejecutable `stripe`.

### 3.6. Verificar que se extrajo

```bash
ls -lh stripe
```

Deberías ver el archivo `stripe` (ejecutable).

### 3.7. Mover Stripe CLI a un lugar del PATH

**Opción A: Mover a /usr/local/bin (requiere sudo):**

```bash
sudo mv stripe /usr/local/bin/
```

Te pedirá tu contraseña de administrador.

**Opción B: Mover a directorio local (sin sudo):**

```bash
mkdir -p ~/.local/bin
mv stripe ~/.local/bin/
```

Luego agrega a tu PATH (temporalmente):
```bash
export PATH="$PATH:$HOME/.local/bin"
```

O permanentemente (agrega a ~/.bashrc):
```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.bashrc
source ~/.bashrc
```

### 3.8. Verificar instalación

```bash
stripe --version
```

Deberías ver algo como:
```
stripe version 1.32.0
```

### ✅ Verificación
Si ves la versión, Stripe CLI está instalado correctamente.

---

## 📋 Paso 4: Autenticar Stripe CLI

### 4.1. Iniciar login

En la terminal, ejecuta:

```bash
stripe login
```

### 4.2. Autorizar en el navegador

1. Se abrirá automáticamente tu navegador
2. Si no se abre, copia la URL que aparece en la terminal
3. Verás una página de Stripe pidiendo autorización
4. Haz clic en **"Allow access"** o **"Permitir acceso"**

### 4.3. Confirmación

Después de autorizar:
1. El navegador mostrará "Success! You are authenticated"
2. La terminal mostrará un mensaje de éxito

### ✅ Verificación
Deberías ver un mensaje como:
```
Done! The Stripe CLI is configured for tu-email@ejemplo.com
```

---

## 📋 Paso 5: Configurar Webhook Local

### 5.1. Abrir una nueva terminal

Abre una **segunda terminal** (deja la anterior abierta si la necesitas).

### 5.2. Ir al directorio del proyecto (opcional)

```bash
cd /home/jarias/Documentos/CodeCrypto/05-EthereumPractice/03-ECOMMERCE
```

### 5.3. Iniciar Stripe Listen

Ejecuta:

```bash
stripe listen --forward-to localhost:3000/api/webhook
```

### 5.4. Copiar el Webhook Secret

Verás algo como:

```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**⚠️ IMPORTANTE:** Copia completamente el valor que empieza con `whsec_...`

Ejemplo:
```
whsec_1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
```

### 5.5. Mantener la terminal abierta

**DEJA ESTA TERMINAL CORRIENDO** mientras desarrollas. Esta terminal está forwardeando los eventos de Stripe a tu aplicación local.

### ✅ Verificación
La terminal debería mostrar:
```
> Ready! Your webhook signing secret is whsec_...
```

Y debería quedarse esperando eventos.

---

## 📋 Paso 6: Configurar .env.local

### 6.1. Ir al directorio de la aplicación

Abre una **nueva terminal** (o usa la primera si no la necesitas) y ejecuta:

```bash
cd /home/jarias/Documentos/CodeCrypto/05-EthereumPractice/03-ECOMMERCE/stablecoin/compra-stableboin
```

### 6.2. Verificar si existe .env.local

```bash
ls -la .env.local
```

Si no existe, créalo desde el ejemplo:

```bash
cp .env.local.example .env.local
```

### 6.3. Abrir .env.local en un editor

**Opción A: Usar nano (más fácil):**

```bash
nano .env.local
```

**Opción B: Usar vim:**

```bash
vim .env.local
```

**Opción C: Usar VS Code (si lo tienes):**

```bash
code .env.local
```

### 6.4. Buscar las líneas de Stripe

Busca estas líneas en el archivo:

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

### 6.5. Actualizar Publishable Key

Reemplaza:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
```

Por:
```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_TU_CLAVE_AQUI
```

(Reemplaza `TU_CLAVE_AQUI` con el valor que copiaste en el Paso 2.2)

### 6.6. Actualizar Secret Key

Reemplaza:
```env
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

Por:
```env
STRIPE_SECRET_KEY=sk_test_TU_CLAVE_AQUI
```

(Reemplaza `TU_CLAVE_AQUI` con el valor que copiaste en el Paso 2.3)

### 6.7. Actualizar Webhook Secret

Reemplaza:
```env
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

Por:
```env
STRIPE_WEBHOOK_SECRET=whsec_TU_CLAVE_AQUI
```

(Reemplaza `TU_CLAVE_AQUI` con el valor que copiaste en el Paso 5.4)

### 6.8. Guardar y salir

**En nano:**
1. Presiona `Ctrl + X`
2. Presiona `Y` para confirmar
3. Presiona `Enter` para guardar

**En vim:**
1. Presiona `Esc`
2. Escribe `:wq`
3. Presiona `Enter`

**En VS Code:**
1. Haz clic en `File` → `Save` o `Ctrl + S`
2. Cierra el archivo

### 6.9. Verificar que se guardaron los valores

```bash
grep "STRIPE" .env.local
```

Deberías ver tus tres claves configuradas (sin los valores completos por seguridad).

### ✅ Verificación
Las tres variables deberían tener valores que empiezan con:
- `pk_test_...`
- `sk_test_...`
- `whsec_...`

---

## 📋 Paso 7: Verificar Configuración Completa

### 7.1. Verificar archivo .env.local

```bash
cd /home/jarias/Documentos/CodeCrypto/05-EthereumPractice/03-ECOMMERCE/stablecoin/compra-stableboin
cat .env.local | grep -E "STRIPE|WEBHOOK"
```

Deberías ver las 3 variables configuradas.

### 7.2. Verificar que Stripe CLI está corriendo

En la terminal donde ejecutaste `stripe listen`, debería mostrar:
```
> Ready! Your webhook signing secret is whsec_...
```

### 7.3. Verificar que las variables están en el archivo

```bash
# Verificar que no están vacías
grep -v "^#" .env.local | grep -E "STRIPE|WEBHOOK" | grep -v "your.*here" | grep -v "example"
```

Deberías ver 3 líneas con tus valores reales.

---

## ✅ Configuración Completada

¡Felicidades! Stripe está configurado. Ahora puedes:

1. **Ejecutar restart-all.sh:**
   ```bash
   cd /home/jarias/Documentos/CodeCrypto/05-EthereumPractice/03-ECOMMERCE
   ./restart-all.sh
   ```

2. **Cuando pregunte si quieres iniciar la app, responde `s`**

3. **Abrir en el navegador:**
   ```
   http://localhost:3000
   ```

4. **Probar con tarjeta de prueba:**
   - Tarjeta: `4242 4242 4242 4242`
   - Fecha: `12/25` (cualquier fecha futura)
   - CVC: `123` (cualquier 3 dígitos)
   - ZIP: `12345` (cualquier código postal)

---

## 🔧 Troubleshooting

### Problema: "stripe: command not found"
**Solución:**
- Verifica que Stripe CLI está en tu PATH: `which stripe`
- Si no, agrega `~/.local/bin` a tu PATH: `export PATH="$PATH:$HOME/.local/bin"`

### Problema: "Webhook signature verification failed"
**Solución:**
- Verifica que `stripe listen` está corriendo
- Verifica que copiaste el `whsec_...` correcto en `.env.local`
- Reinicia Next.js después de cambiar `.env.local`

### Problema: "STRIPE_SECRET_KEY no está configurada"
**Solución:**
- Verifica que `.env.local` existe: `ls -la .env.local`
- Verifica que las claves están configuradas: `grep STRIPE .env.local`
- Reinicia el servidor Next.js

### Problema: Stripe CLI no abre el navegador
**Solución:**
- Copia la URL que aparece en la terminal
- Pégalo manualmente en tu navegador
- Completa la autorización

---

## 📝 Resumen de Comandos

```bash
# 1. Instalar Stripe CLI
cd ~/Downloads
tar -xzf stripe_*.tar.gz
sudo mv stripe /usr/local/bin/
stripe --version

# 2. Autenticar
stripe login

# 3. Configurar webhook (en terminal separada)
stripe listen --forward-to localhost:3000/api/webhook

# 4. Actualizar .env.local
cd /home/jarias/Documentos/CodeCrypto/05-EthereumPractice/03-ECOMMERCE/stablecoin/compra-stableboin
nano .env.local
# Actualizar las 3 variables de Stripe

# 5. Verificar
grep "STRIPE" .env.local
```

---

¡Listo para probar! 🚀

