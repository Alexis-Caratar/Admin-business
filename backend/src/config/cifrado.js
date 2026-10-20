// Cifrado de secretos guardados en la base (AES-256-GCM).
// Clave: CONFIG_SECRET del .env (cualquier texto largo; se deriva a 32 bytes).
// Si falta, se deriva de JWT_SECRET para no romper instalaciones existentes,
// pero conviene definirla: cambiar JWT_SECRET haría ilegibles los secretos.
import crypto from "crypto";

let avisado = false;
const clave = () => {
  const base = process.env.CONFIG_SECRET || process.env.JWT_SECRET;
  if (!base) throw new Error("Falta CONFIG_SECRET en el .env para cifrar las credenciales");
  if (!process.env.CONFIG_SECRET && !avisado) {
    avisado = true;
    console.warn("CONFIG_SECRET no está definido: las credenciales se cifran con una clave derivada de JWT_SECRET.");
  }
  return crypto.createHash("sha256").update(`pu-config:${base}`).digest();
};

// "v1.<iv>.<tag>.<datos>" en base64url
export const cifrar = (texto) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", clave(), iv);
  const datos = Buffer.concat([c.update(String(texto), "utf8"), c.final()]);
  return ["v1", iv, c.getAuthTag(), datos].map((x) => (typeof x === "string" ? x : x.toString("base64url"))).join(".");
};

export const descifrar = (valor) => {
  if (!valor) return "";
  try {
    const [v, iv, tag, datos] = String(valor).split(".");
    if (v !== "v1") return "";
    const d = crypto.createDecipheriv("aes-256-gcm", clave(), Buffer.from(iv, "base64url"));
    d.setAuthTag(Buffer.from(tag, "base64url"));
    return Buffer.concat([d.update(Buffer.from(datos, "base64url")), d.final()]).toString("utf8");
  } catch {
    // Clave cambiada o dato alterado: se trata como no configurado
    console.error("No se pudo descifrar una credencial guardada (¿cambió CONFIG_SECRET?)");
    return "";
  }
};
