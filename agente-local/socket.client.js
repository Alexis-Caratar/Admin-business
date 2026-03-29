const WebSocket = require("ws");
const dotenv = require("dotenv");
dotenv.config();
const { imprimirFactura,imprimirComanda } = require("./services/imprimir.service.js");

let ws;

function initWS() {
  ws = new WebSocket(process.env.WS_BACKEND_URL);
  ws.on("open", () => {
    console.log("Conectado al backend WebSocket");
    // Registrarse como agente de impresión
    ws.send(JSON.stringify({
      tipo: "register_agent",
      isPrintAgent: true
    }));
  });

  ws.on("message", async (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      // Cuando llegue la orden de impresión
      if (data.tipo === "imprimir_venta") {
        try {
          const result = await imprimirFactura(data.payload);
          console.log("Factura impresa correctamente:", result);
        } catch (err) {
          console.error("Error al imprimir factura:", err);
        }
      }
        //cuando llegan orden de comandas
       if (data.tipo === "imprimir_comanda") {
        try {
          const result = await imprimirComanda(data.payload);
          console.log("Factura impresa correctamente:", result);
        } catch (err) {
          console.error("Error al imprimir factura:", err);
        }
      }

    } catch (err) {
      console.error("Error procesando mensaje WS:", err);
    }
  });

  ws.on("close", () => {
    console.log("Conexión cerrada, reintentando en 5s...");
    setTimeout(initWS, 5000);
  });

  ws.on("error", (err) => {
    console.error("Error WS:", err);
  });
}

// Iniciamos la conexión
initWS();