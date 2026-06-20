const USB = require("@node-escpos/usb-adapter");

async function testPrinter() {
  try {
    const printers = USB.findPrinter();

    console.log("Impresoras encontradas:");
    console.log(printers);

    if (!printers || printers.length === 0) {
      console.log("❌ No se encontró ninguna impresora USB");
      return;
    }

    const printerInfo = printers[0];

    console.log("Vendor ID:", printerInfo.deviceDescriptor.idVendor);
    console.log("Product ID:", printerInfo.deviceDescriptor.idProduct);

    const device = new USB(
      printerInfo.deviceDescriptor.idVendor,
      printerInfo.deviceDescriptor.idProduct
    );

    device.open((err) => {
      if (err) {
        console.error("❌ Error al abrir impresora:");
        console.error(err);
        return;
      }

      console.log("✅ Impresora abierta correctamente");
    });

  } catch (error) {
    console.error("❌ Error general:");
    console.error(error);
  }
}

testPrinter();