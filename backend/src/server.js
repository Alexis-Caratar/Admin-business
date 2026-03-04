import http from "http";
import { WebSocketServer } from "ws"; // ← así es correcto con ES Modules
import app from "./app.js";
import dotenv from "dotenv";
import CajeroService from "./services/cajero.service.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

const wss = new WebSocketServer({ server }); // ✅ ahora sí funciona

// Función para notificar mesas
export const notificarMesas = async (id_negocio) => {
  const resultado = await CajeroService.mesas(id_negocio);
  const data = JSON.stringify({ tipo: "mesas", mesas: resultado });
console.log("data",data);

  wss.clients.forEach((client) => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(data);
    }
  });
};

// Conexión de clientes
wss.on("connection", (ws) => {
  console.log("Cliente WS conectado");

  ws.send(JSON.stringify({ tipo: "info", mensaje: "Conectado al WS de mesas" }));

  ws.on("message", (msg) => {
    console.log("Mensaje del cliente:", msg.toString());
  });
});


server.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀🚀🚀 Servidor listo para despegar 🚀🚀🚀
🌐 Escuchando en la red local en el puerto ${PORT} 
💻 Accesible desde cualquier dispositivo conectado localmente
        `);
});