const escpos = require("@node-escpos/core");
const USB = require("@node-escpos/usb-adapter");

const { formatCOP, line, center, twoCols } = require("../utils/formatter");
const printers = require("../config/printers");

async function imprimirFactura(data) {
  
  const { negocio, venta, productos, printerName } = data;

  // 🔹 Seleccionar impresora
  const selected = printers[printerName] || printers["caja1"];

  if (!selected || !selected.vendorId || !selected.productId) {
    throw new Error("Impresora no configurada correctamente");
  }

  return new Promise((resolve, reject) => {
    const device = new USB(selected.vendorId, selected.productId);

    device.open(async (error) => {
      if (error) return reject(error);

      const printer = new escpos.Printer(device, {
        encoding: "GB18030"
      });

      try {
        // 🔥 RESET
        await printer.raw(Buffer.from([0x1B, 0x40]));

        // HEADER
        printer.raw(Buffer.from([0x1B, 0x61, 0x01]));
        printer.raw(Buffer.from([0x1B, 0x45, 0x01]));
        printer.size(1, 1);

        await printer.text(negocio.nombre);
        printer.style("normal");

        await printer.text(`NIT: ${negocio.nit}`);
        await printer.text(`${negocio.direccion}`);
        await printer.text(`${negocio.ciudad}`);
        await printer.text(`TEL: ${negocio.telefono}`);

        await printer.text(line());

        // FACTURA
        printer.raw(Buffer.from([0x1B, 0x61, 0x00]));
        await printer.text(`Factura: ${venta.numero_factura}`);
        await printer.text(`Fecha venta: ${venta.fecha_completa}`);
        await printer.text(`Fecha impresion: ${venta.fecha_impresion}`);
        await printer.text(`Vendedor: ${venta.nombre_vendedor}`);

        await printer.text(line());

        // CLIENTE
        await printer.text(`CEDULA/NIT: ${venta.identificacion_cliente || "2222222222"}`);
        await printer.text(`Cliente: ${venta.nombre_completo || "Consumidor final"}`);
        await printer.text(`Tel: ${venta.telefono || ""}`);
        await printer.text(`Email: ${venta.email || ""}`);

        await printer.text(line());

        // DETALLE
        await printer.text("DETALLE VENTA");

        for (const p of productos) {
          await printer.style("b");
          await printer.text(p.nombre);
          await printer.style("normal");

          await printer.text(
            twoCols(
              `${p.cantidad} x ${formatCOP(p.precio_unitario)}`,
              formatCOP(p.subtotal)
            )
          );
        }

        await printer.text(line());

        // TOTALES
        await printer.text(twoCols("Subtotal", formatCOP(venta.venta_total)));
        await printer.text(twoCols("Descuento", formatCOP(venta.descuento || 0)));

        await printer.style("b");
        await printer.text(twoCols("TOTAL", formatCOP(venta.venta_total)));
        await printer.style("normal");

        await printer.text(line());

        // PAGO
        await printer.text(`Pago: ${venta.metodo_pago}`);
        await printer.text(`Recibido: ${formatCOP(venta.monto_recibido )}`);
        await printer.text(`Cambio: ${formatCOP(venta.cambio || 0)}`);

        await printer.text(line());

        // QR
        const qrText = `Factura:${venta.numero_factura}-Total:${venta.venta_total}`;

        await printer.align("center");

        const storeQR = Buffer.from([
          0x1D, 0x28, 0x6B,
          qrText.length + 3, 0x00,
          0x31, 0x50, 0x30,
          ...Buffer.from(qrText)
        ]);

        const printQR = Buffer.from([
          0x1D, 0x28, 0x6B,
          0x03, 0x00,
          0x31, 0x51, 0x30
        ]);

        await printer.raw(storeQR);
        await printer.raw(printQR);

        await printer.text("Escanea la carta");

        await printer.text("\nGracias por tu compra!");
        await printer.text("Vuelve pronto");
        await printer.text(line());

        // ✂️ CORTE PROFESIONAL (RECOMENDADO)
        await printer.feed(3);
        await printer.raw(Buffer.from([0x1D, 0x56, 0x00]));

        await printer.close();

        resolve({
          status: "OK IMPRESION CON EXITO",
          printer: selected.nombre
        });

      } catch (err) {
        reject(err);
      }
    });
  });
}

async function imprimirComanda(data) {
  
  const { negocio, mesa, usuario,productos, printerName,fecha,nota } = data;

  // 🔹 Seleccionar impresora
  const selected = printers[printerName] || printers["caja1"];

  if (!selected || !selected.vendorId || !selected.productId) {
    throw new Error("Impresora no configurada correctamente");
  }

  return new Promise((resolve, reject) => {
    const device = new USB(selected.vendorId, selected.productId);

    device.open(async (error) => {
      if (error) return reject(error);

      const printer = new escpos.Printer(device, {
        encoding: "GB18030"
      });

      try {
        // 🔥 RESET
        await printer.raw(Buffer.from([0x1B, 0x40]));

        // HEADER
        printer.raw(Buffer.from([0x1B, 0x61, 0x01]));
        printer.raw(Buffer.from([0x1B, 0x45, 0x01]));
        printer.size(1, 1);

        await printer.text(negocio.nombre);
        printer.style("normal");

        await printer.text(`${negocio.direccion}`);
        await printer.text(`${negocio.ciudad}`);
        await printer.text(`TEL: ${negocio.telefono}`);

        await printer.text(line());

        // FACTURA
        printer.raw(Buffer.from([0x1B, 0x61, 0x00]));
        await printer.text(`fecha venta: ${fecha}`);
        await printer.text(`Mesero: ${usuario.nombre}`);
        await printer.text(`MESA: ${mesa.nombre}`);
        await printer.text(line());

        // DETALLE
      await printer.text("DETALLE COMANDA");
      await printer.text(line()); 

      for (const p of productos) {
        await printer.style("b"); 
        await printer.text(`${p.cantidad} x ${p.nombre}`);
        await printer.style("normal"); 
        await printer.text(""); 
      }

      await printer.text(line()); // línea final separadora

        await printer.text(line());

        // NOTA
         await printer.text(`nota: ${nota}`);
        await printer.style("normal");
        await printer.text(line());
        await printer.text("EN PREPARACION");
        await printer.text(line());

        // ✂️ CORTE PROFESIONAL (RECOMENDADO)
        await printer.feed(3);
        await printer.raw(Buffer.from([0x1D, 0x56, 0x00]));

        await printer.close();

        resolve({
          status: "OK IMPRESION CON EXITO",
          printer: selected.nombre
        });

      } catch (err) {
        reject(err);
      }
    });
  });
}

module.exports = { imprimirFactura,imprimirComanda };