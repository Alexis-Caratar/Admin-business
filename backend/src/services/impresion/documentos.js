// Tickets (factura, comanda, pedido, prueba) armados en el servidor.
// El agente local solo "dibuja" estas líneas; el navegador las usa para imprimir
// desde el celular o el computador cuando no hay agente. Así el formato es el
// mismo en todos los puntos de venta y se cambia desde el admin, no en el agente.
//
// Documento: { tipo, rol: "factura" | "comanda", ancho, copias, lineas: [...] }
// Líneas:
//   { t: "texto", v, a: "c" | "i" | "d", b (negrita), g (grande) }
//   { t: "cols", i, d, b }        dos columnas (texto a la izquierda, valor a la derecha)
//   { t: "sep" }                  separador
//   { t: "qr", v }                código QR
//   { t: "vacio" }                línea en blanco

const cop = (n) => "$" + Math.round(Number(n || 0)).toLocaleString("es-CO");

// Parte un texto en renglones del ancho del papel (sin cortar palabras si se puede)
export const partir = (texto, ancho) => {
  const salida = [];
  for (const original of String(texto ?? "").split(/\r?\n/)) {
    // La sangría inicial ("  + adición") se conserva en todos los renglones
    const sangria = /^\s*/.exec(original)[0].slice(0, Math.floor(ancho / 3));
    const parrafo = original.trim();
    const inicio = salida.length;
    ancho -= sangria.length;
    let linea = "";
    for (const palabra of parrafo.split(/\s+/).filter(Boolean)) {
      if ((linea + " " + palabra).trim().length <= ancho) linea = (linea + " " + palabra).trim();
      else {
        if (linea) salida.push(linea);
        // Palabra más larga que el papel: se corta
        let p = palabra;
        while (p.length > ancho) { salida.push(p.slice(0, ancho)); p = p.slice(ancho); }
        linea = p;
      }
    }
    salida.push(linea);
    for (let k = inicio; k < salida.length; k++) salida[k] = sangria + salida[k];
    ancho += sangria.length;
  }
  return salida;
};

class Ticket {
  constructor(ancho) { this.ancho = ancho; this.lineas = []; }
  texto(v, { a = "i", b = false, g = false } = {}) {
    // En letra grande caben la mitad de caracteres
    for (const l of partir(v, g ? Math.floor(this.ancho / 2) : this.ancho)) this.lineas.push({ t: "texto", v: l, a, b, g });
    return this;
  }
  cols(i, d, b = false) {
    const der = String(d ?? "");
    const max = Math.max(1, this.ancho - der.length - 1);
    const izq = partir(i, max);
    izq.slice(0, -1).forEach((l) => this.lineas.push({ t: "texto", v: l, a: "i", b }));
    this.lineas.push({ t: "cols", i: izq.at(-1) ?? "", d: der, b });
    return this;
  }
  sep() { this.lineas.push({ t: "sep" }); return this; }
  vacio() { this.lineas.push({ t: "vacio" }); return this; }
  qr(v) { if (v) this.lineas.push({ t: "qr", v: String(v).slice(0, 300) }); return this; }
}

const encabezado = (tk, n, cfg, { nit = true } = {}) => {
  tk.texto(n.nombre ?? "", { a: "c", b: true, g: true });
  if (nit && n.nit) tk.texto(`NIT: ${n.nit}`, { a: "c" });
  if (n.direccion) tk.texto(n.direccion, { a: "c" });
  if (n.ciudad) tk.texto(n.ciudad, { a: "c" });
  if (n.telefono) tk.texto(`Tel: ${n.telefono}`, { a: "c" });
  if (cfg.encabezado) tk.texto(cfg.encabezado, { a: "c" });
  tk.sep();
};

const pie = (tk, cfg, qr) => {
  if (cfg.mostrar_qr && qr) {
    tk.vacio().qr(qr);
    if (cfg.qr_leyenda) tk.texto(cfg.qr_leyenda, { a: "c" });
  }
  if (cfg.pie) tk.vacio().texto(cfg.pie, { a: "c" });
};

const documento = (tipo, rol, tk, copias = 1) => ({ tipo, rol, ancho: tk.ancho, copias, lineas: tk.lineas });

/* ------------------------------------------------------------------ */
export const facturaDocumento = ({ negocio, cfg, venta, productos, qrTienda }) => {
  const tk = new Ticket(cfg.ancho_caracteres);
  encabezado(tk, negocio, cfg);
  tk.texto(`Factura: ${venta.numero_factura ?? ""}`, { b: true });
  if (venta.fecha_completa) tk.texto(`Fecha: ${venta.fecha_completa}`);
  if (venta.fecha_impresion) tk.texto(`Impreso: ${venta.fecha_impresion}`);
  if (venta.nombre_vendedor) tk.texto(`Atendió: ${venta.nombre_vendedor}`);
  if (venta.mesa) tk.texto(`Mesa: ${venta.mesa}`);
  tk.sep();
  tk.texto(`CC/NIT: ${venta.identificacion_cliente || cfg.documento_consumidor}`);
  tk.texto(`Cliente: ${venta.nombre_completo?.trim() || "Consumidor final"}`);
  if (venta.telefono) tk.texto(`Tel: ${venta.telefono}`);
  if (venta.email) tk.texto(`Email: ${venta.email}`);
  tk.sep();
  for (const p of productos) {
    tk.texto(p.nombre, { b: true });
    tk.cols(`  ${Number(p.cantidad)} x ${cop(p.precio_unitario)}`, cop(p.subtotal));
  }
  tk.sep();
  const descuento = Number(venta.descuento || 0);
  if (descuento > 0) {
    tk.cols("Subtotal", cop(Number(venta.venta_total) + descuento));
    tk.cols("Descuento", `-${cop(descuento)}`);
  }
  tk.cols("TOTAL", cop(venta.venta_total), true);
  tk.sep();
  if (venta.metodo_pago) tk.texto(`Pago: ${venta.metodo_pago}`);
  if (Number(venta.monto_recibido) > 0) tk.cols("Recibido", cop(venta.monto_recibido));
  if (Number(venta.cambio) > 0) tk.cols("Cambio", cop(venta.cambio));
  if (venta.nota) tk.texto(`Nota: ${venta.nota}`);
  tk.sep();
  const qr = cfg.qr_contenido === "factura" ? `Factura:${venta.numero_factura}-Total:${Math.round(Number(venta.venta_total))}`
    : cfg.qr_contenido === "texto" ? cfg.qr_texto : qrTienda;
  pie(tk, cfg, qr);
  return documento("factura", "factura", tk);
};

export const comandaDocumento = ({ negocio, cfg, numero, fecha, mesero, mesa, productos, nota, estado = "EN PREPARACIÓN" }) => {
  const tk = new Ticket(cfg.ancho_caracteres);
  tk.texto(negocio.nombre ?? "", { a: "c", b: true });
  tk.texto("COMANDA", { a: "c", b: true, g: true });
  tk.sep();
  if (mesa) tk.texto(`MESA: ${mesa}`, { b: true, g: true });
  if (numero) tk.texto(`Factura/orden: ${numero}`);
  if (fecha) tk.texto(`Fecha: ${fecha}`);
  if (mesero) tk.texto(`Atendió: ${mesero}`);
  tk.sep();
  for (const p of productos) tk.texto(`${Number(p.cantidad)} x ${p.nombre}`, { b: !String(p.nombre).startsWith(" ") });
  tk.sep();
  if (nota) tk.texto(`Nota: ${nota}`, { b: true }).sep();
  tk.texto(estado, { a: "c", b: true });
  return documento("comanda", "comanda", tk, cfg.copias_comanda);
};

export const pedidoDocumento = ({ negocio, cfg, pedido, fecha }) => {
  const tk = new Ticket(cfg.ancho_caracteres);
  tk.texto(negocio.nombre ?? "", { a: "c", b: true });
  tk.texto(`PEDIDO WEB ${pedido.codigo}`, { a: "c", b: true, g: true });
  tk.texto(pedido.tipo_entrega === "DOMICILIO" ? "DOMICILIO" : "RECOGE EN EL LOCAL", { a: "c", b: true });
  tk.sep();
  if (fecha) tk.texto(`Fecha: ${fecha}`);
  tk.texto(`Cliente: ${pedido.nombre_cliente}`);
  tk.texto(`Tel: ${pedido.telefono}`);
  if (pedido.tipo_entrega === "DOMICILIO") {
    tk.texto(`Dir: ${pedido.direccion ?? ""}${pedido.barrio ? `, ${pedido.barrio}` : ""}`);
    if (pedido.referencias) tk.texto(`Ref: ${pedido.referencias}`);
  }
  tk.sep();
  for (const i of pedido.items) {
    tk.cols(`${i.cantidad} x ${i.nombre}`, cop(i.subtotal), true);
    for (const a of i.adicionales ?? []) tk.cols(`   + ${a.nombre}`, cop(a.subtotal));
  }
  tk.sep();
  if (Number(pedido.costo_domicilio) > 0) tk.cols("Domicilio", cop(pedido.costo_domicilio));
  tk.cols("TOTAL", cop(pedido.total), true);
  tk.texto(pedido.metodo_pago === "EN_LINEA" ? "PAGADO EN LÍNEA" : pedido.estado_pago === "APROBADO" ? "PAGADO" : "COBRAR AL ENTREGAR", { a: "c", b: true });
  if (pedido.observacion) tk.sep().texto(`Obs: ${pedido.observacion}`, { b: true });
  return documento("pedido", "comanda", tk, cfg.copias_comanda);
};

export const pruebaDocumento = ({ negocio, cfg, qrTienda, rol = "factura" }) => {
  const tk = new Ticket(cfg.ancho_caracteres);
  encabezado(tk, negocio, cfg);
  tk.texto("PRUEBA DE IMPRESIÓN", { a: "c", b: true, g: true });
  tk.texto(`Papel: ${cfg.ancho_caracteres} caracteres`, { a: "c" });
  tk.texto(`Impresora de ${rol}`, { a: "c" });
  tk.sep().cols("Producto de ejemplo", cop(12500)).cols("TOTAL", cop(12500), true).sep();
  pie(tk, cfg, cfg.qr_contenido === "texto" ? cfg.qr_texto : qrTienda);
  return documento("prueba", rol, tk);
};

/* Texto plano del ticket (vista previa y respaldo) */
export const comoTexto = (doc) => doc.lineas.map((l) => {
  const w = doc.ancho;
  if (l.t === "sep") return "-".repeat(w);
  if (l.t === "vacio") return "";
  if (l.t === "qr") return "[QR]".padStart(Math.floor((w + 4) / 2)).padEnd(w);
  if (l.t === "cols") return l.i + " ".repeat(Math.max(1, w - l.i.length - l.d.length)) + l.d;
  const v = l.v;
  if (l.a === "c") return " ".repeat(Math.max(0, Math.floor((w - v.length * (l.g ? 2 : 1)) / (l.g ? 4 : 2)))) + v;
  if (l.a === "d") return v.padStart(w);
  return v;
}).join("\n");
