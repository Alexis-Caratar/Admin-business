import escpos from 'escpos';
import escposNetwork from 'escpos-network';

escpos.Network = escposNetwork;

// ⚠️ IP de tu impresora
const device = new escpos.Network('192.168.1.50');

const printer = new escpos.Printer(device);

export const imprimirComanda = (venta) => {
  return new Promise((resolve, reject) => {
    device.open(() => {
      try {
        printer
          .align('CT')
          .style('B')
          .size(1, 1)
          .text('*** COMANDA COCINA ***')
          .drawLine()

          .align('LT')
          .style('NORMAL')
          .text(`Mesa: ${venta.id_mesa || 'DOMICILIO'}`)
          .text(`Fecha: ${new Date().toLocaleString()}`)
          .drawLine();

        venta.productos.forEach(p => {
          printer.text(`${p.cantidad} x ${p.id_producto}`);
        });

        printer
          .drawLine()
          .text('*** PREPARAR ***')
          .cut()
          .close();

        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  });
};