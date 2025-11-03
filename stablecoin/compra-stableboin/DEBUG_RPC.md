# Debug: Error "unsupported protocol /api/rpc"

## Pasos para resolver

1. **Detener el servidor Next.js completamente:**
   ```bash
   pkill -f "next dev"
   ```

2. **Limpiar cache de Next.js:**
   ```bash
   rm -rf .next
   ```

3. **Limpiar cache del navegador:**
   - Abre DevTools (F12)
   - Click derecho en el botón de refresh
   - Selecciona "Vaciar caché y volver a cargar de manera forzada" (o "Empty Cache and Hard Reload")

4. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```

5. **Verificar en la consola del navegador:**
   - Busca el mensaje: `🌐 Usando API route como proxy para RPC`
   - Si NO ves este mensaje, el código viejo todavía está en cache
   - Si ves el mensaje pero aún hay error, revisa la pestaña Network en DevTools

## Verificar que el código correcto esté cargado

En la consola del navegador, ejecuta:
```javascript
// Esto debería mostrar la función sin usar JsonRpcProvider
console.log(window.location.origin);
```

Si el error persiste después de estos pasos, el problema podría estar en:
- Cache del navegador que no se limpió
- Hot reload de Next.js que no detectó los cambios
- Algún otro archivo que esté importando ethers.js incorrectamente

