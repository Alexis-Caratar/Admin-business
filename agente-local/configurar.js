// Asistente de configuración del agente para ESTE punto de venta.
//   npm run configurar
// Pide la dirección del servidor y el token (Admin > Negocios > Impresión),
// detecta las impresoras USB y permite agregar impresoras de red (IP:9100).
const readline = require("readline/promises");
const { leer, guardar, ARCHIVO } = require("./config/agente");
const { usbDetectadas, enviar } = require("./services/salida");
const { construir } = require("./services/escpos");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const preguntar = async (texto, defecto) => {
  const r = (await rl.question(defecto ? `${texto} [${defecto}]: ` : `${texto}: `)).trim();
  return r || defecto || "";
};
const elegirRol = async (nombre) => {
  const r = await preguntar(`  ¿Para qué se usa "${nombre}"? 1 = facturas, 2 = comandas (cocina/barra), 3 = ambas`, "3");
  return { 1: "factura", 2: "comanda" }[r] || "todo";
};

(async () => {
  const actual = leer();
  console.log("\n=== Configuración del agente de impresión ===\n");
  console.log("En Admin > Negocios > Editar > Impresión genera el token y copia la dirección del servidor.\n");

  const servidor = await preguntar("Dirección del servidor (ws://… o wss://…)", actual.servidor);
  const token = await preguntar("Token del agente", actual.token ? "(dejar el actual)" : "");
  const punto = await preguntar("Nombre de este punto de venta", actual.punto || "Caja principal");
  const quitar = await preguntar("¿La impresora imprime mal las tildes? (s/n)", actual.quitar_tildes === false ? "n" : "s");

  const impresoras = [];
  const usb = usbDetectadas();
  console.log(usb.length ? `\nImpresoras USB detectadas: ${usb.length}` : "\nNo se detectaron impresoras USB (en Windows instala el controlador con Zadig: ver readmi).");
  for (const [k, u] of usb.entries()) {
    const usar = await preguntar(`\nUSB ${k + 1} (vendor ${u.vendorId}, product ${u.productId}) ¿usarla? (s/n)`, "s");
    if (usar.toLowerCase() !== "s") continue;
    const nombre = await preguntar("  Nombre", k === 0 ? "Caja" : `Impresora ${k + 1}`);
    impresoras.push({ nombre, rol: await elegirRol(nombre), tipo: "usb", vendorId: u.vendorId, productId: u.productId });
  }
  while ((await preguntar("\n¿Agregar una impresora de red (IP)? (s/n)", "n")).toLowerCase() === "s") {
    const host = await preguntar("  IP de la impresora", "192.168.1.100");
    const puerto = Number(await preguntar("  Puerto", "9100"));
    const nombre = await preguntar("  Nombre", "Cocina");
    impresoras.push({ nombre, rol: await elegirRol(nombre), tipo: "red", host, puerto });
  }
  if (!impresoras.length && actual.impresoras.length) {
    console.log("\nSe conservan las impresoras configuradas antes.");
    impresoras.push(...actual.impresoras);
  }

  const config = {
    servidor, token: token === "(dejar el actual)" ? actual.token : token, punto,
    puerto: actual.puerto || 4100, quitar_tildes: quitar.toLowerCase() !== "n", impresoras,
  };
  guardar(config);
  console.log(`\nGuardado en ${ARCHIVO}`);

  if (impresoras.length && (await preguntar("\n¿Imprimir una página de prueba en cada impresora? (s/n)", "s")).toLowerCase() === "s") {
    for (const imp of impresoras) {
      const doc = { ancho: 32, lineas: [
        { t: "texto", v: punto, a: "c", b: true, g: true }, { t: "sep" },
        { t: "texto", v: `PRUEBA: ${imp.nombre}`, a: "c", b: true }, { t: "texto", v: `Uso: ${imp.rol}`, a: "c" },
        { t: "texto", v: "Ñandú, café, acción", a: "c" }, { t: "sep" },
      ] };
      try { await enviar(imp, construir(doc, { quitar_tildes: config.quitar_tildes })); console.log(`  OK: ${imp.nombre}`); }
      catch (e) { console.log(`  Error en ${imp.nombre}: ${e.message}`); }
    }
  }
  console.log("\nListo. Inicia el agente con: npm start\n");
  rl.close();
})().catch((e) => { console.error(e); rl.close(); process.exit(1); });
