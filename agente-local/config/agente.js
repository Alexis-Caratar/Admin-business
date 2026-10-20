// Configuración del agente de este punto de venta.
// Se guarda en config/agente.json (créalo con: npm run configurar).
// Si no existe, se usa el .env antiguo (WS_BACKEND_URL, AGENT_TOKEN, VENDOR_ID, PRODUCT_ID).
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const ARCHIVO = path.join(__dirname, "agente.json");

const desdeEnv = () => ({
  servidor: (process.env.WS_BACKEND_URL || "").trim(),
  token: (process.env.AGENT_TOKEN || "").trim(),
  punto: process.env.PUNTO_VENTA || "Caja principal",
  puerto: Number(process.env.PORT) || 4100,
  quitar_tildes: true,
  impresoras: process.env.VENDOR_ID && process.env.PRODUCT_ID
    ? [{ nombre: "Caja principal", rol: "todo", tipo: "usb", vendorId: Number(process.env.VENDOR_ID), productId: Number(process.env.PRODUCT_ID) }]
    : [],
});

function leer() {
  if (fs.existsSync(ARCHIVO)) {
    const c = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    return { puerto: 4100, quitar_tildes: true, impresoras: [], ...c, origen: "agente.json" };
  }
  return { ...desdeEnv(), origen: ".env" };
}

function guardar(config) {
  const { origen, ...datos } = config;
  void origen;
  fs.writeFileSync(ARCHIVO, JSON.stringify(datos, null, 2), "utf8");
}

module.exports = { leer, guardar, ARCHIVO };
