// Envía bytes a una impresora USB o de red (IP:9100).
const net = require("net");

let USB = null;
try { USB = require("@node-escpos/usb-adapter"); } catch { /* sin soporte USB en este equipo */ }

function usb(imp, datos) {
  return new Promise((resolve, reject) => {
    if (!USB) return reject(new Error("Soporte USB no instalado"));
    let device;
    try { device = new USB(Number(imp.vendorId), Number(imp.productId)); } catch (e) { return reject(e); }
    device.open((err) => {
      if (err) return reject(err);
      device.write(datos, (e) => {
        if (e) return reject(e);
        // Pequeña espera para que el buffer salga antes de cerrar
        setTimeout(() => device.close(() => resolve()), 300);
      });
    });
  });
}

function red(imp, datos) {
  return new Promise((resolve, reject) => {
    const s = net.createConnection({ host: imp.host, port: Number(imp.puerto) || 9100 });
    s.setTimeout(8000);
    s.on("connect", () => s.end(datos));
    s.on("close", (hadError) => (hadError ? null : resolve()));
    s.on("timeout", () => { s.destroy(); reject(new Error(`Sin respuesta de ${imp.host}`)); });
    s.on("error", reject);
  });
}

const enviar = (imp, datos) => (imp.tipo === "red" ? red(imp, datos) : usb(imp, datos));

// USB conectadas ahora (para el asistente y el estado)
function usbDetectadas() {
  if (!USB) return [];
  try {
    return (USB.findPrinter() || []).map((d) => ({ vendorId: d.deviceDescriptor.idVendor, productId: d.deviceDescriptor.idProduct }));
  } catch { return []; }
}

module.exports = { enviar, usbDetectadas };
