/*
 * Dibuja las piezas de publicidad en un lienzo de 1080×1920 (estado de WhatsApp).
 * Todo ocurre en el navegador; las fotos del negocio llegan por el proxy de la API
 * (mismo origen) para que el lienzo se pueda exportar a PNG.
 */
import axios from "../../../api/axios";

export const ANCHO = 1080;
export const ALTO = 1920;

export type SeccionMenu = { titulo: string; items: string[]; separador: boolean };
export type DatosMenu = {
  titulo: string; fondo: string | null; usarLogo: boolean; secciones: SeccionMenu[];
  domicilios: string; telefono: string; frase: string; direccion: string;
  acento: string; texto: string; logoFondo: string; opacidad: number;
};
export type DatosPromo = {
  etiqueta: string; titulo: string; subtitulo: string; destacado: string; descripcion: string; condiciones: string;
  telefono: string; direccion: string; fondo: string | null; usarLogo: boolean; acento: string; tema: "oscuro" | "claro";
};

/* ---------------- Fuentes (Google Fonts) ---------------- */
let fuentes: Promise<void> | null = null;
export const cargarFuentes = () => {
  if (!fuentes) {
    fuentes = (async () => {
      if (!document.getElementById("fuentes-publicidad")) {
        const l = document.createElement("link");
        l.id = "fuentes-publicidad"; l.rel = "stylesheet";
        l.href = "https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Montserrat:wght@500;700;800;900&display=swap";
        document.head.appendChild(l);
        await new Promise((r) => { l.onload = r; l.onerror = r; setTimeout(r, 4000); });
      }
      await Promise.all(["400 40px Quicksand", "500 40px Quicksand", "600 40px Quicksand", "700 40px Quicksand", "500 40px Montserrat", "700 40px Montserrat", "800 40px Montserrat", "900 40px Montserrat"]
        .map((f) => document.fonts.load(f).catch(() => null)));
    })();
  }
  return fuentes;
};

/* ---------------- Imágenes ---------------- */
const cache = new Map<string, Promise<HTMLImageElement | null>>();
export const cargarImagen = (src: string | null | undefined): Promise<HTMLImageElement | null> => {
  if (!src) return Promise.resolve(null);
  if (!cache.has(src)) {
    cache.set(src, (async () => {
      let url = src;
      if (!/^(data|blob):/.test(src)) {
        // Foto del negocio por el proxy de la API (evita el bloqueo de CORS del lienzo)
        const r = await axios.get("/publicidad/imagen", { params: { url: src }, responseType: "blob" }).catch(() => null);
        if (!r) return null;
        url = URL.createObjectURL(r.data);
      }
      return new Promise<HTMLImageElement | null>((ok) => {
        const img = new Image();
        img.onload = () => ok(img); img.onerror = () => ok(null);
        img.src = url;
      });
    })().catch(() => null));
  }
  return cache.get(src)!;
};

/* ---------------- Utilidades de dibujo ---------------- */
type Ctx = CanvasRenderingContext2D;
const ICONO_TEL = "M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02z";
const ICONO_PIN = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7m0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5";

const icono = (c: Ctx, d: string, x: number, y: number, tam: number, color: string) => {
  c.save(); c.translate(x, y); c.scale(tam / 24, tam / 24); c.fillStyle = color; c.fill(new Path2D(d)); c.restore();
};
const cubrir = (c: Ctx, img: HTMLImageElement, x: number, y: number, w: number, h: number) => {
  const s = Math.max(w / img.width, h / img.height);
  const iw = img.width * s, ih = img.height * s;
  c.drawImage(img, x + (w - iw) / 2, y + (h - ih) / 2, iw, ih);
};
const rect = (c: Ctx, x: number, y: number, w: number, h: number, r: number) => {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
};
// Parte un texto en renglones que caben en el ancho
export const partir = (c: Ctx, texto: string, ancho: number) => {
  const salida: string[] = [];
  for (const parrafo of String(texto ?? "").split(/\n/)) {
    let linea = "";
    for (const p of parrafo.split(/\s+/).filter(Boolean)) {
      const prueba = linea ? `${linea} ${p}` : p;
      if (c.measureText(prueba).width <= ancho || !linea) linea = prueba; else { salida.push(linea); linea = p; }
    }
    salida.push(linea);
  }
  return salida;
};
const linea = (c: Ctx, x1: number, x2: number, y: number, color: string, grosor = 3) => {
  c.save(); c.strokeStyle = color; c.lineWidth = grosor; c.setLineDash([12, 8]); c.beginPath(); c.moveTo(x1, y); c.lineTo(x2, y); c.stroke(); c.restore();
};
const centrado = (c: Ctx, t: string, y: number, font: string, color: string, x = ANCHO / 2) => {
  c.font = font; c.fillStyle = color; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillText(t, x, y);
};
const circuloLogo = (c: Ctx, logo: HTMLImageElement | null, cx: number, cy: number, r: number, fondo: string, aro: string, nombre: string) => {
  c.save();
  c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fillStyle = fondo; c.fill();
  c.lineWidth = 6; c.strokeStyle = aro; c.stroke();
  c.beginPath(); c.arc(cx, cy, r - 4, 0, Math.PI * 2); c.clip();
  // El logo llena el círculo (los logos redondos con fondo blanco quedan sin esquinas)
  if (logo) cubrir(c, logo, cx - r, cy - r, r * 2, r * 2);
  else {
    const iniciales = nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
    centrado(c, iniciales || "★", cy + r * 0.28, `700 ${Math.round(r * 0.8)}px Quicksand`, aro, cx);
  }
  c.restore();
};

/* ---------------- Plantilla: Menú del día ---------------- */
export async function dibujarMenu(canvas: HTMLCanvasElement, d: DatosMenu, nombreNegocio: string, logoUrl: string | null) {
  await cargarFuentes();
  const [fondo, logo] = await Promise.all([cargarImagen(d.fondo), d.usarLogo ? cargarImagen(logoUrl) : Promise.resolve(null)]);
  canvas.width = ANCHO; canvas.height = ALTO;
  const c = canvas.getContext("2d")!;
  // Fondo: foto o degradado
  if (fondo) cubrir(c, fondo, 0, 0, ANCHO, ALTO);
  else { const g = c.createLinearGradient(0, 0, ANCHO, ALTO); g.addColorStop(0, "#3b2a14"); g.addColorStop(1, "#0E4A36"); c.fillStyle = g; c.fillRect(0, 0, ANCHO, ALTO); }
  // Tarjeta crema translúcida
  const tx = 162, tw = 756, th = ALTO - 80;
  c.save(); rect(c, tx, -30, tw, th + 30, 26); c.fillStyle = `rgba(255, 249, 238, ${d.opacidad})`; c.fill(); c.restore();
  // Logo
  circuloLogo(c, logo, ANCHO / 2, 175, 135, d.logoFondo, "#C9A45C", nombreNegocio);
  const oscuro = mezclar(d.acento, "#000000", 0.25);

  // Contenido (se reduce si no cabe)
  const bloques = (k: number) => {
    const t = (n: number) => Math.round(n * k);
    const b: { alto: number; dibujar: (y: number) => void }[] = [];
    c.font = `700 ${t(88)}px Quicksand`;
    let tamTitulo = t(88);
    while (tamTitulo > t(50) && d.titulo.toUpperCase().split(/\s+/).some((p) => { c.font = `700 ${tamTitulo}px Quicksand`; return c.measureText(p).width > tw - 60; })) tamTitulo -= 4;
    c.font = `700 ${tamTitulo}px Quicksand`;
    const lineasTitulo = partir(c, d.titulo.toUpperCase(), tw - 60);
    b.push({ alto: lineasTitulo.length * tamTitulo * 1.09 + t(20), dibujar: (y) => lineasTitulo.forEach((l, i) => centrado(c, l, y + tamTitulo * 0.91 + i * tamTitulo * 1.09, `700 ${tamTitulo}px Quicksand`, d.acento)) });
    for (const s of d.secciones) {
      const items = s.items.map((i) => i.trim()).filter(Boolean);
      if (!s.titulo.trim() && !items.length) continue;
      c.font = `400 ${t(46)}px Quicksand`;
      const filas = items.flatMap((i) => partir(c, i.toUpperCase(), tw - 80));
      const alto = (s.titulo.trim() ? t(58) : 0) + filas.length * t(54) + (s.separador ? t(26) : 0) + t(34);
      b.push({ alto, dibujar: (y) => {
        let yy = y;
        if (s.titulo.trim()) { centrado(c, s.titulo.toUpperCase(), yy + t(44), `700 ${t(42)}px Quicksand`, oscuro); yy += t(58); }
        filas.forEach((f) => { centrado(c, f, yy + t(44), `400 ${t(46)}px Quicksand`, d.texto); yy += t(54); });
        if (s.separador) linea(c, tx + 56, tx + tw - 56, yy + t(16), d.texto);
      } });
    }
    return b;
  };
  const pie = (k: number) => {
    const t = (n: number) => Math.round(n * k);
    c.font = `400 ${t(46)}px Quicksand`;
    const dir = d.direccion.split(/\n/).map((l) => l.trim()).filter(Boolean);
    const alto = (d.domicilios ? t(74) : 0) + (d.telefono ? t(76) : 0) + (d.frase ? t(66) : 0) + (dir.length ? t(84) + dir.length * t(56) : 0);
    return { alto, dibujar: (y: number) => {
      let yy = y;
      if (d.domicilios) {
        centrado(c, d.domicilios.toUpperCase(), yy + t(44), `700 ${t(42)}px Quicksand`, oscuro);
        c.font = `700 ${t(42)}px Quicksand`; const w = Math.min(c.measureText(d.domicilios.toUpperCase()).width * 0.45, 200);
        linea(c, ANCHO / 2 - w / 2, ANCHO / 2 + w / 2, yy + t(66), d.texto, 3); yy += t(74);
      }
      if (d.telefono) {
        c.font = `500 ${t(52)}px Quicksand`; const w = c.measureText(d.telefono).width; const tam = t(52);
        const x0 = ANCHO / 2 - (w + tam + 10) / 2;
        icono(c, ICONO_TEL, x0, yy + t(14), tam, oscuro);
        c.textAlign = "left"; c.fillStyle = d.texto; c.fillText(d.telefono, x0 + tam + 10, yy + t(58)); yy += t(76);
      }
      if (d.frase) { centrado(c, d.frase, yy + t(50), `400 ${t(46)}px Quicksand`, d.texto); yy += t(66); }
      if (dir.length) {
        icono(c, ICONO_PIN, ANCHO / 2 - t(30), yy + t(10), t(60), oscuro); yy += t(84);
        dir.forEach((l) => { centrado(c, l, yy + t(44), `400 ${t(46)}px Quicksand`, d.texto); yy += t(56); });
      }
    } };
  };
  const inicio = 340, fin = th - 40;
  let k = 1;
  for (; k > 0.55; k -= 0.04) {
    const total = bloques(k).reduce((a, b) => a + b.alto, 0) + pie(k).alto + 40;
    if (total <= fin - inicio) break;
  }
  const bs = bloques(k), p = pie(k);
  const usado = bs.reduce((a, b) => a + b.alto, 0) + p.alto;
  const hueco = Math.max(0, (fin - inicio - usado) / (bs.length + 1));   // reparte el aire sobrante
  let y = inicio;
  for (const b of bs) { b.dibujar(y); y += b.alto + Math.min(hueco, 40); }
  p.dibujar(Math.max(y + Math.min(hueco, 60), fin - p.alto));
}

/* ---------------- Plantilla: Promoción ---------------- */
export async function dibujarPromo(canvas: HTMLCanvasElement, d: DatosPromo, nombreNegocio: string, logoUrl: string | null) {
  await cargarFuentes();
  const [fondo, logo] = await Promise.all([cargarImagen(d.fondo), d.usarLogo ? cargarImagen(logoUrl) : Promise.resolve(null)]);
  canvas.width = ANCHO; canvas.height = ALTO;
  const c = canvas.getContext("2d")!;
  const oscuro = d.tema === "oscuro";
  const tinta = oscuro ? "#FFFFFF" : "#0F172A";
  const suave = oscuro ? "rgba(255,255,255,.82)" : "rgba(15,23,42,.75)";
  if (fondo) cubrir(c, fondo, 0, 0, ANCHO, ALTO);
  else { const g = c.createLinearGradient(0, 0, ANCHO, ALTO); g.addColorStop(0, mezclar(d.acento, "#000000", 0.55)); g.addColorStop(1, "#0F172A"); c.fillStyle = g; c.fillRect(0, 0, ANCHO, ALTO); }
  const v = c.createLinearGradient(0, 0, 0, ALTO);
  if (oscuro) { v.addColorStop(0, "rgba(0,0,0,.35)"); v.addColorStop(0.45, "rgba(0,0,0,.55)"); v.addColorStop(1, "rgba(0,0,0,.88)"); }
  else { v.addColorStop(0, "rgba(255,255,255,.55)"); v.addColorStop(0.5, "rgba(255,255,255,.80)"); v.addColorStop(1, "rgba(255,255,255,.92)"); }
  c.fillStyle = v; c.fillRect(0, 0, ANCHO, ALTO);
  // Marco con el color de la promoción
  c.save(); c.strokeStyle = d.acento; c.lineWidth = 10; rect(c, 40, 40, ANCHO - 80, ALTO - 80, 40); c.stroke(); c.restore();

  // Logo y nombre
  circuloLogo(c, logo, ANCHO / 2, 220, 110, oscuro ? "#FFFFFF" : "#0F172A", d.acento, nombreNegocio);
  centrado(c, nombreNegocio.toUpperCase(), 390, `700 40px Montserrat`, suave);

  let y = 500;
  // Etiqueta (cinta inclinada)
  if (d.etiqueta.trim()) {
    c.save(); c.font = `900 50px Montserrat`;
    const w = c.measureText(d.etiqueta.toUpperCase()).width + 90;
    c.translate(ANCHO / 2, y + 45); c.rotate(-0.05);
    rect(c, -w / 2, -45, w, 90, 45); c.fillStyle = d.acento; c.fill();
    c.fillStyle = mezclar(d.acento, "#000000", 0.7); c.textAlign = "center"; c.fillText(d.etiqueta.toUpperCase(), 0, 18);
    c.restore(); y += 150;
  }
  // Título (lo más grande que quepa en 3 renglones)
  let tam = 170, lineas: string[] = [];
  for (; tam > 70; tam -= 6) {
    c.font = `900 ${tam}px Montserrat`;
    lineas = partir(c, d.titulo.toUpperCase(), ANCHO - 180);
    if (lineas.length <= 3 && lineas.every((l) => c.measureText(l).width <= ANCHO - 180)) break;   // también cada palabra larga
  }
  lineas.forEach((l) => { centrado(c, l, y + tam * 0.9, `900 ${tam}px Montserrat`, tinta); y += tam * 1.02; });
  y += 20;
  if (d.subtitulo.trim()) {
    c.font = `800 66px Montserrat`;
    partir(c, d.subtitulo, ANCHO - 200).forEach((l) => { centrado(c, l, y + 60, `800 66px Montserrat`, d.acento); y += 76; });
    y += 20;
  }
  // Destacado: precio u oferta en una pastilla grande
  if (d.destacado.trim()) {
    c.font = `900 120px Montserrat`;
    const w = Math.min(c.measureText(d.destacado).width + 120, ANCHO - 200);
    c.save(); rect(c, ANCHO / 2 - w / 2, y + 10, w, 170, 85); c.fillStyle = d.acento; c.fill(); c.restore();
    centrado(c, d.destacado, y + 140, `900 120px Montserrat`, mezclar(d.acento, "#000000", 0.75));
    y += 220;
  }
  if (d.descripcion.trim()) {
    c.font = `500 48px Montserrat`;
    partir(c, d.descripcion, ANCHO - 220).slice(0, 5).forEach((l) => { centrado(c, l, y + 50, `500 48px Montserrat`, tinta); y += 62; });
  }
  // Pie: condiciones, teléfono y dirección
  let yp = ALTO - 120;
  const dir = d.direccion.split(/\n/).map((l) => l.trim()).filter(Boolean).join(" · ");
  if (dir) {
    c.font = `500 38px Montserrat`; const w = c.measureText(dir).width; const x0 = ANCHO / 2 - (w + 50) / 2;
    icono(c, ICONO_PIN, x0, yp - 36, 42, d.acento); c.textAlign = "left"; c.fillStyle = suave; c.fillText(dir, x0 + 50, yp); yp -= 70;
  }
  if (d.telefono.trim()) {
    c.font = `800 54px Montserrat`; const w = c.measureText(d.telefono).width; const x0 = ANCHO / 2 - (w + 66) / 2;
    icono(c, ICONO_TEL, x0, yp - 48, 54, d.acento); c.textAlign = "left"; c.fillStyle = tinta; c.fillText(d.telefono, x0 + 66, yp); yp -= 80;
  }
  if (d.condiciones.trim()) {
    c.font = `500 32px Montserrat`;
    const ls = partir(c, d.condiciones, ANCHO - 240).slice(0, 3).reverse();
    ls.forEach((l) => { centrado(c, l, yp, `500 32px Montserrat`, suave); yp -= 42; });
  }
}

// Mezcla dos colores #rrggbb (p = cuánto del segundo)
export function mezclar(a: string, b: string, p: number) {
  const h = (x: string) => [1, 3, 5].map((i) => parseInt(x.slice(i, i + 2), 16));
  const [r1, g1, b1] = h(/^#[0-9a-f]{6}$/i.test(a) ? a : "#888888"), [r2, g2, b2] = h(b);
  const m = (x: number, y: number) => Math.round(x + (y - x) * p).toString(16).padStart(2, "0");
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
}

export const aPNG = (canvas: HTMLCanvasElement) => new Promise<Blob>((ok, mal) => canvas.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo crear la imagen"))), "image/png"));
