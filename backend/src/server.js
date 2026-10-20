// server.js
import http from "http";
import dotenv from "dotenv";
import app from "./app.js";
import { initWebSockets } from "./websockets.js";
import { conciliarPagosPendientes } from "./services/tienda.service.js";
import { enviarPendientes } from "./services/notificaciones/whatsapp.service.js";

dotenv.config();
const PORT = process.env.PORT || 4000;

const server = http.createServer(app);

// Inicializamos WebSocket
initWebSockets(server);

// Pagos en línea: se consulta a Wompi cada 30 s por los que siguen pendientes
const conciliar = () => conciliarPagosPendientes().catch((e) => console.error("Conciliador de pagos:", e.message));
setInterval(conciliar, 30_000).unref();
setTimeout(conciliar, 5_000).unref();

// Avisos de WhatsApp: reintenta los que fallaron (Meta caída, sin conexión…)
setInterval(() => enviarPendientes().catch((e) => console.error("WhatsApp:", e.message)), 60_000).unref();

server.listen(PORT, "0.0.0.0", () => {
  console.log(`
🚀🚀🚀 Servidor listo para despegar 🚀🚀🚀
🌐 Escuchando en la red local en el puerto ${PORT} 
💻 Accesible desde cualquier dispositivo conectado localmente
  `);
});