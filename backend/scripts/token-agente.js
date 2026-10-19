// Genera el token del agente local de impresión de un negocio.
// Uso: node scripts/token-agente.js <id_negocio>
// Copiar el resultado en AGENT_TOKEN del .env del agente-local.
// Para revocar todos los tokens hay que cambiar JWT_SECRET.
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const id_negocio = Number(process.argv[2]);
if (!id_negocio) {
  console.error("Uso: node scripts/token-agente.js <id_negocio>");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("Falta JWT_SECRET en el .env");
  process.exit(1);
}

console.log(jwt.sign({ tipo: "agente_impresion", id_negocio }, process.env.JWT_SECRET));
