# ✅ Checklist de Testing E2E

Este documento proporciona un checklist completo para verificar que todo el sistema funciona correctamente.

## 🚀 Pre-Testing

- [ ] Foundry instalado y funcionando
- [ ] Node.js v18+ instalado
- [ ] MetaMask instalado y configurado
- [ ] Red local configurada en MetaMask (Chain ID 31337)
- [ ] Script `restart-all.sh` ejecutado exitosamente
- [ ] Todas las aplicaciones iniciadas correctamente

## 📱 1. Compra de Tokens (http://localhost:6001)

### Setup
- [ ] Aplicación carga correctamente
- [ ] MetaMask se conecta sin errores
- [ ] Muestra balance de USDT y EURT (debe ser 0 inicialmente)

### Compra de Tokens
- [ ] Selecciona tipo de token (USDT/EURT)
- [ ] Ingresa cantidad válida
- [ ] Click en "Comprar Tokens"
- [ ] Stripe checkout se abre correctamente
- [ ] Pago se completa exitosamente
- [ ] Webhook procesa el pago
- [ ] Tokens aparecen en el balance después del pago
- [ ] Balance se actualiza correctamente

**Nota:** Si Stripe no está configurado, puedes saltarte este paso y usar tokens de prueba directamente.

## 💳 2. Pasarela de Pago (http://localhost:6002)

### Setup
- [ ] Aplicación carga correctamente
- [ ] Puede parsear parámetros de URL (merchant_address, amount, invoice)
- [ ] Muestra información del pago correctamente

### Proceso de Pago
- [ ] Conecta MetaMask correctamente
- [ ] Muestra balance de tokens (USDT/EURT)
- [ ] Verifica que hay suficiente balance
- [ ] Solicita aprobación de tokens si es necesario
- [ ] Aprobación de tokens funciona correctamente
- [ ] Botón "Pagar" está habilitado después de aprobación
- [ ] Pago se procesa correctamente
- [ ] Transacción aparece en MetaMask
- [ ] Redirige a la URL de éxito después del pago

## 🏢 3. Web Admin - Registro de Empresa (http://localhost:6003)

### Setup
- [ ] Aplicación carga correctamente
- [ ] MetaMask se conecta correctamente

### Registro de Empresa
- [ ] Verifica que el usuario es owner del contrato
- [ ] Permite registrar nueva empresa
- [ ] Formulario valida campos requeridos
- [ ] Valida dirección Ethereum correcta
- [ ] Registro se completa exitosamente
- [ ] Redirige a la página de la empresa después del registro
- [ ] Empresa aparece en el dashboard

## 📦 4. Web Admin - Gestión de Productos

### Crear Producto
- [ ] Click en "Agregar Producto"
- [ ] Formulario se abre correctamente
- [ ] Puede ingresar nombre, descripción, precio, stock
- [ ] Puede subir imagen (si Pinata está configurado)
- [ ] Imagen se sube a IPFS correctamente
- [ ] Producto se crea exitosamente
- [ ] Producto aparece en la lista

### Editar Producto
- [ ] Click en "Editar" en un producto
- [ ] Formulario se carga con datos del producto
- [ ] Puede actualizar precio y stock
- [ ] Cambios se guardan correctamente
- [ ] Producto se actualiza en la lista

### Activar/Desactivar Producto
- [ ] Puede activar producto inactivo
- [ ] Puede desactivar producto activo
- [ ] Estado se actualiza correctamente

## 📊 5. Web Admin - Analytics

### Dashboard
- [ ] Tab Analytics se carga correctamente
- [ ] Muestra métricas principales:
  - [ ] Ingresos Totales
  - [ ] Total de Pedidos
  - [ ] Clientes Únicos
  - [ ] Ticket Promedio
- [ ] Gráfico de ventas por período se muestra
- [ ] Gráfico de productos más vendidos se muestra
- [ ] Resumen de facturas se muestra correctamente
- [ ] Resumen de productos activos se muestra correctamente

### Verificación de Datos
- [ ] Métricas se actualizan después de ventas
- [ ] Gráficos muestran datos correctos
- [ ] Sin datos, muestra mensaje apropiado

## 📄 6. Web Admin - Facturas

### Lista de Facturas
- [ ] Tab Facturas se carga correctamente
- [ ] Lista todas las facturas de la empresa
- [ ] Muestra información correcta:
  - [ ] ID de factura
  - [ ] Fecha
  - [ ] Monto total
  - [ ] Estado (Pagada/Pendiente)
  - [ ] Cliente
  - [ ] Cantidad de items
- [ ] Facturas pagadas muestran hash de transacción

## ⭐ 7. Web Admin - Reviews

### Vista de Reviews
- [ ] Tab Reviews se carga correctamente
- [ ] Muestra estadísticas:
  - [ ] Total Reviews
  - [ ] Rating Promedio
  - [ ] Reviews Verificados
  - [ ] Productos con Reviews
- [ ] Distribución de ratings se muestra correctamente
- [ ] Filtros funcionan:
  - [ ] Filtro por producto
  - [ ] Filtro por rating
  - [ ] Filtro por verificación
- [ ] Lista de reviews se muestra correctamente
- [ ] Reviews muestran información completa:
  - [ ] Nombre del producto
  - [ ] Rating con estrellas
  - [ ] Comentario
  - [ ] Fecha
  - [ ] Dirección del cliente
  - [ ] Badge de verificación (si aplica)

## 🛒 8. Web Customer - Tienda (http://localhost:6003)

### Catálogo
- [ ] Aplicación carga correctamente
- [ ] Muestra todos los productos activos
- [ ] Productos se muestran con:
  - [ ] Imagen (desde IPFS o placeholder)
  - [ ] Nombre
  - [ ] Precio
  - [ ] Stock
- [ ] Imágenes se cargan correctamente (con fallback si es necesario)

### Carrito
- [ ] Puede agregar productos al carrito
- [ ] Carrito muestra productos agregados
- [ ] Puede actualizar cantidad en el carrito
- [ ] Puede eliminar productos del carrito
- [ ] Total se calcula correctamente
- [ ] Checkout crea factura correctamente
- [ ] Redirige a pasarela de pago con parámetros correctos

### Pedidos
- [ ] Página de pedidos se carga
- [ ] Muestra historial de facturas
- [ ] Muestra estado de cada pedido
- [ ] Información de pedidos es correcta

## 🔄 9. Flujo Completo E2E

### Escenario Completo
1. [ ] Compra tokens (USDT) con Stripe
2. [ ] Registra empresa en Web Admin
3. [ ] Crea productos con imágenes
4. [ ] Navega a Web Customer
5. [ ] Agrega productos al carrito
6. [ ] Completa checkout (crea factura)
7. [ ] Procesa pago en Pasarela de Pago
8. [ ] Verifica que la factura se marca como pagada
9. [ ] Verifica que Analytics se actualiza
10. [ ] Verifica que los productos muestran stock actualizado

## 🐛 Problemas Comunes

### Si algo falla:

1. **Verifica que Anvil está corriendo**
   ```bash
   curl http://localhost:8545
   ```

2. **Verifica que las aplicaciones están corriendo**
   ```bash
   lsof -i :6001  # Compra Stablecoin
   lsof -i :6002  # Pasarela
   lsof -i :6003  # Admin
   lsof -i :6004  # Customer
   ```

3. **Verifica variables de entorno**
   ```bash
   cd web-admin
   cat .env.local
   ```

4. **Revisa logs de consola**
   - Abre DevTools (F12) en cada aplicación
   - Revisa errores en Console
   - Revisa Network tab para requests fallidos

5. **Reinicia todo**
   ```bash
   pkill -f "next dev"
   pkill -f "anvil"
   ./restart-all.sh
   ```

## ✅ Criterios de Éxito

El sistema está funcionando correctamente si:

- ✅ Todas las aplicaciones cargan sin errores
- ✅ MetaMask se conecta correctamente
- ✅ Los contratos se despliegan correctamente
- ✅ Las transacciones se procesan correctamente
- ✅ Los datos se guardan y recuperan del blockchain
- ✅ Las imágenes IPFS se cargan (si están configuradas)
- ✅ Los analytics muestran datos correctos
- ✅ El flujo completo E2E funciona de extremo a extremo

## 📝 Notas de Testing

- **Anvil reinicia el blockchain** cada vez, así que todos los datos se pierden al reiniciar
- **Usa cuentas diferentes** para testing de diferentes roles (owner, empresa, cliente)
- **Las imágenes IPFS pueden tardar** en propagarse, usa el sistema de fallback
- **Stripe usa modo test**, no se procesan pagos reales

