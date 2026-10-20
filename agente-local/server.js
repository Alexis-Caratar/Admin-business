// Agente local de impresión. Configuración: npm run configurar (config/agente.json).
const express = require("express");
const { leer } = require("./config/agente");
const agente = require("./socket.client");
const imprimirRoutes = require("./routes/imprimir.routes.js");

const app = express();
app.use(express.json());

// Ping: saber si el agente está en línea y con qué impresoras
app.get("/", (req, res) => res.json({ status: "SERVIDOR AGENTE LOCAL OK", service: "printer-agent", version: agente.VERSION, time: new Date(), estado: agente.estado() }));
app.use("/api", imprimirRoutes);

const PORT = leer().puerto || 4100;
// Solo en este equipo: el servidor es quien manda las impresiones
app.listen(PORT, "127.0.0.1", () => console.log(`Agente listo en http://localhost:${PORT}`));
