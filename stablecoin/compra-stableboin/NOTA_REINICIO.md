# ⚠️ IMPORTANTE: Reiniciar Next.js después de cambiar variables de entorno

## Problema

Las variables de entorno que empiezan con `NEXT_PUBLIC_` solo se cargan cuando Next.js **inicia**. Si cambias estas variables en `.env.local`, necesitas **reiniciar** el servidor de desarrollo.

## Solución

Si agregaste o cambiaste `NEXT_PUBLIC_EURTOKEN_CONTRACT_ADDRESS`:

1. **Detén el servidor Next.js** (Ctrl+C en la terminal donde corre `npm run dev`)

2. **Reinicia el servidor**:
   ```bash
   npm run dev
   ```

3. **Recarga la página** en el navegador (F5 o Ctrl+R)

## Verificar que está funcionando

Abre la consola del navegador (F12) y deberías ver:
- `🔄 Refrescando balances para: 0x...`
- `   USDT Contract: 0x5FbDB2315678afecb367f032d93F642f64180aa3`
- `   EURT Contract: 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0`
- `💰 Balance USDT obtenido: X.XX`
- `💰 Balance EURT obtenido: X.XX`

Si ves `NO CONFIGURADO` en algún contrato, significa que la variable de entorno no está cargada correctamente y necesitas reiniciar Next.js.

