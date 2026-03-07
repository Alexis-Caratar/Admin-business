// server.js
import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { initWebSockets } from "./websockets.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Inicializamos WebSocket
initWebSockets(server);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀🚀🚀 Servidor listo para despegar 🚀🚀🚀
🌐 Escuchando en la red local en el puerto ${PORT} 
💻 Accesible desde cualquier dispositivo conectado localmente
  `);
});