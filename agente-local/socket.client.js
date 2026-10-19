const WebSocket = require("ws");
const dotenv = require("dotenv");
dotenv.config();
const { imprimirFactura,imprimirComanda,getPrinterStatus } = require("./services/imprimir.service.js");

let ws;
let intervaloEstado;

function initWS() {
  ws = new WebSocket(process.env.WS_BACKEND_URL);
 ws.on("open", () => {
  console.log("Conectado al backend WebSocket");
  // AGENT_TOKEN se genera en el backend con: node scripts/token-agente.js <id_negocio>
  ws.send(JSON.stringify({
    tipo: "register_agent",
    token: process.env.AGENT_TOKEN
  }));

  clearInterval(intervaloEstado); // evitar intervalos duplicados al reconectar
  intervaloEstado = setInterval(async () => {  // estado impresora cada minuto
    const status = await getPrinterStatus();
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({tipo: "estado_impresora",payload: status}));
    }
  }, 60000);
});

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());

      if (data.tipo === "imprimir_venta") {  // Cuando llegue la orden de impresión
        try {
          /*const status = await getPrinterStatus();
          if (!status.ok) {
            ws.send(JSON.stringify({tipo: "error_impresora",message: "Impresora no disponible"})); return;
          }
          */
          const result = await imprimirFactura(data.payload);
        } catch (err) {
          console.error("Error al imprimir factura:", err);
        }
      }
        
       if (data.tipo === "imprimir_comanda") {//cuando llegan orden de comandas
        try {
        /*const status = await getPrinterStatus();
        if (!status.ok) {
          ws.send(JSON.stringify({tipo: "error_impresora",message: "Impresora no disponible"})); return;
        }
        */
        const result = await imprimirComanda(data.payload);        
        } catch (err) {
          console.error("Error al imprimir comanda:", err);
        }
      }

    } catch (err) {
      console.error("Error procesando mensaje WS:", err);
    }
  });

  ws.on("close", () => {
    clearInterval(intervaloEstado);
    console.log("Conexión cerrada, reintentando en 5s...");
    setTimeout(initWS, 5000);
  });

  ws.on("error", (err) => {
    console.error("Error WS:", err);
  });
}

// Iniciamos la conexión
initWS();