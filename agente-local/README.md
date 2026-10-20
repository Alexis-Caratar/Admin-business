# Agente local de impresión (v2)

Imprime facturas, comandas y pedidos web en las impresoras térmicas de **cualquier punto de venta**.
El formato del ticket (ancho, textos, QR, consumidor final) se configura en el admin; el agente solo imprime.

## Instalar en un punto de venta

1. **Requisitos:** Node 24. En Windows, para impresoras USB instala el controlador con `Intalador_windows/zadig-2.9.exe` (WinUSB).
2. En el admin: **Negocios > Editar > Impresión > "Instalar en un punto de venta"**. Copia el **servidor** y el **token**.
3. En esta carpeta:
   ```bash
   npm install
   npm run configurar   # pega servidor y token, nombra el punto (Caja 1, Cocina…) y elige las impresoras
   npm start            # o ./start.sh (lo reinicia si se cae)
   ```
4. El punto aparece en el admin en "Agentes de impresión". Usa **Probar factura / Probar comanda**.

## Impresoras

- **USB:** el asistente las detecta (`npm run impresoras` muestra vendor/product).
- **Red (IP:9100):** típicas de cocina; se agregan en el asistente con su IP.
- Cada impresora tiene un uso: **facturas**, **comandas** o **ambas**. Un negocio puede tener varios puntos
  (por ejemplo Caja con la de facturas y Cocina con la de comandas): cada ticket sale en el punto que tenga ese uso.
- Si la impresora imprime mal las tildes, deja "quitar tildes" en **s** (por defecto).

## Configuración

Queda en `config/agente.json` (no se sube al repositorio: tiene el token). Si no existe, el agente usa el `.env`
antiguo (`WS_BACKEND_URL`, `AGENT_TOKEN`, `VENDOR_ID`, `PRODUCT_ID`).

## Token

Al generar un token nuevo en el admin, los anteriores dejan de funcionar (el agente lo avisa en consola).
Vuelve a ejecutar `npm run configurar` y pega el nuevo.

## Compatibilidad

El agente v2 confirma cada impresión (la caja muestra si se imprimió o no). Sigue entendiendo los mensajes del
formato anterior. Un agente antiguo sigue imprimiendo con el servidor nuevo, pero sin confirmación.
