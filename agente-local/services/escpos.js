// Convierte el ticket que manda el servidor (líneas) en bytes ESC/POS.
// No depende de la marca: funciona con impresoras térmicas compatibles con Epson.
const ESC = 0x1b, GS = 0x1d;

const sinTildes = (t) => String(t)
  .normalize("NFD").replace(/[̀-ͯ]/g, "")
  .replace(/[ñ]/g, "n").replace(/[Ñ]/g, "N").replace(/[¡¿]/g, "")
  .replace(/[^\x20-\x7e]/g, "");

function construir(documento, { quitar_tildes = true } = {}) {
  const ancho = Number(documento.ancho) || 32;
  const partes = [];
  const bytes = (...b) => partes.push(Buffer.from(b));
  const texto = (t) => {
    // Con tildes: página de códigos Windows-1252 (ESC t 16), la soportan casi todas
    const limpio = quitar_tildes ? sinTildes(t) : String(t);
    partes.push(Buffer.from(limpio + "\n", quitar_tildes ? "ascii" : "latin1"));
  };

  bytes(ESC, 0x40); // reiniciar
  if (!quitar_tildes) bytes(ESC, 0x74, 16);
  for (const l of documento.lineas || []) {
    if (l.t === "sep") { bytes(ESC, 0x61, 0); texto("-".repeat(ancho)); continue; }
    if (l.t === "vacio") { texto(""); continue; }
    if (l.t === "cols") {
      bytes(ESC, 0x61, 0, ESC, 0x45, l.b ? 1 : 0);
      const i = String(l.i || ""), d = String(l.d || "");
      texto(i + " ".repeat(Math.max(1, ancho - i.length - d.length)) + d);
      bytes(ESC, 0x45, 0);
      continue;
    }
    if (l.t === "qr") {
      const datos = Buffer.from(quitar_tildes ? sinTildes(l.v) : String(l.v), "latin1");
      bytes(ESC, 0x61, 1);
      bytes(GS, 0x28, 0x6b, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00); // modelo 2
      bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x43, 0x06);       // tamaño del módulo
      bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x45, 0x31);       // corrección M
      const n = datos.length + 3;
      partes.push(Buffer.from([GS, 0x28, 0x6b, n & 0xff, n >> 8, 0x31, 0x50, 0x30]), datos);
      bytes(GS, 0x28, 0x6b, 0x03, 0x00, 0x31, 0x51, 0x30);       // imprimir
      texto("");
      continue;
    }
    // texto
    bytes(ESC, 0x61, l.a === "c" ? 1 : l.a === "d" ? 2 : 0);
    bytes(ESC, 0x45, l.b ? 1 : 0);
    bytes(GS, 0x21, l.g ? 0x11 : 0x00);
    texto(l.v ?? "");
    bytes(GS, 0x21, 0x00, ESC, 0x45, 0);
  }
  bytes(ESC, 0x61, 0);
  bytes(ESC, 0x64, 4);       // avanzar papel
  bytes(GS, 0x56, 0x00);     // corte
  return Buffer.concat(partes);
}

module.exports = { construir, sinTildes };
