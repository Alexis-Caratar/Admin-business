const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config();
require("./socket.client");

const imprimirRoutes = require("./routes/imprimir.routes.js");

const app = express();
const PORT = 4100;

app.use(bodyParser.json());

//ruta principal que hace ping y se sabe si esta en linea
app.get("/", (req, res) => {
    res.json({status: " SERVIDOR AGENTE LOCAL OK",service: "printer-agent",time: new Date()});});

// 🔹 Rutas
app.use("/api", imprimirRoutes);

app.listen(PORT, () => {
  console.log(`
🤖 Servidor listo
🌐 http://localhost:${PORT}
  `);
});