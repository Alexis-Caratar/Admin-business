/*
 * Sitio web dinámico. Ningún dato del negocio está escrito aquí: todo llega
 * del backend (tablas negocios, negocios_horarios y negocios_sitio) y se
 * edita en Admin > Negocios > Sitio web.
 */
import { createContext, useContext } from "react";

export type Red = { nombre: string; url: string };

export type Foto = {
  src: string;
  /** Versiones por ancho, para que el móvil no descargue la foto grande */
  srcSet?: string;
  alt: string;
  /** Proporción dentro del mosaico */
  forma?: "normal" | "alta" | "ancha";
};

export type Horario = { dia_semana: number; hora_apertura: string; hora_cierre: string };

/*
 * Vocabulario de la web según el tipo de negocio (tabla tipos_negocio).
 * Un restaurante dice "La carta" y "plato"; un supermercado "Nuestros
 * productos" y "producto". Estos son los valores de respaldo (genéricos).
 */
export const TEXTOS_GENERICOS = {
  seccion_catalogo: "Productos",
  titulo_catalogo: "Nuestros productos",
  subtitulo_catalogo: "Precios y disponibilidad actualizados directamente desde nuestro sistema.",
  ver_catalogo: "Ver productos",
  item: "producto",
  items: "productos",
  pedir_item: "Pedir este producto",
  pedir_linea: "Comprar en línea",
  pedir_corto: "Comprar",
  tienda_titulo: "Compra en línea",
  tienda_subtitulo: "Elige tus productos, paga en línea o al recibir, y sigue tu compra en tiempo real.",
  buscar: "Buscar un producto",
  a_elegir: "Elige una opción",
  adiciones: "Complementos",
  carrito: "Tu carrito",
  domicilio: "Envío a domicilio",
  recoger: "Recoger en la tienda",
  preparacion: "Alistando tu pedido",
  aviso_preparacion: "Alistamos tu pedido cuando se confirma el pago.",
  nosotros_etiqueta: "Nosotros",
  contacto_etiqueta: "Contacto",
  contacto_titulo: "¿Te ayudamos?",
  contacto_texto: "Escríbenos y te respondemos por WhatsApp o por teléfono.",
  galeria_titulo: "Galería",
  catalogo_error: "No pudimos cargar los productos en este momento",
  pedir_catalogo: "Pedir información",
  pedir_catalogo_wa: "¿me comparten el catálogo?",
  whatsapp_cta: "Escríbenos por WhatsApp",
  sin_items: "Por ahora no hay productos disponibles en línea.",
};
export type Textos = typeof TEXTOS_GENERICOS;

export type Sitio = {
  id: number;
  urlNegocio: string;
  dominio: string | null;
  nombre: string;
  razonSocial: string;
  nit: string | null;
  tipo: string | null;
  /** Código en tipos_negocio (restaurante, supermercado, tecnologia…) */
  tipoNegocio: string;
  textos: Textos;
  /** "carta" = lista estilo menú; "cuadricula" = tarjetas de producto */
  vistaCatalogo: "carta" | "cuadricula";
  /** Íconos de la sección Nosotros (nombres; ver Nosotros.tsx) */
  iconos: string[];
  /** Tipo de schema.org para Google */
  schemaTipo: string;
  descripcion: string | null;
  logo: string | null;
  direccion: string | null;
  ciudad: string | null;
  telefono: string | null;
  telefonoLink: string | null;
  whatsapp: string | null;
  correo: string | null;
  lat: number | null;
  lng: number | null;
  googleMaps: string | null;
  horarios: Horario[];
  /** "Lunes a sábado · 7:00 a.m. – 4:00 p.m." */
  horarioTexto: string;
  eslogan: string | null;
  frases: string[];
  hero: Foto | null;
  nosotrosTitulo: string | null;
  nosotrosTexto: string | null;
  nosotrosItems: { titulo: string; texto: string; foto: Foto | null }[];
  franja: Foto | null;
  franjaTexto: string | null;
  galeria: Foto[];
  servicios: string | null;
  redes: Red[];
  mensajeWhatsapp: string;
  seoTitulo: string;
  seoDescripcion: string;
  tema: "dark" | "light";
  mostrarFotosDeProductos: boolean;
  tiendaActiva: boolean;
  /** Ruta base del sitio: "" con dominio propio, "/punto-urbano" sin él */
  base: string;
  /** URL pública absoluta (SEO) */
  url: string;
  menuUrl: string;
};

export const API = String(import.meta.env.VITE_apiurl ?? "").trim().replace(/\/$/, "");

/* ------------------------------------------------------------------
 * Fotos: a las de Unsplash se les generan versiones por ancho
 * ------------------------------------------------------------------ */
function aFoto(f: { src?: string; alt?: string; forma?: string } | null | undefined): Foto | null {
  if (!f?.src) return null;
  const forma = f.forma === "alta" || f.forma === "ancha" ? f.forma : undefined;
  let srcSet: string | undefined;
  if (/^https:\/\/images\.unsplash\.com\//.test(f.src) && /[?&]w=\d+/.test(f.src)) {
    srcSet = [600, 1200, 1800].map((w) => `${f.src!.replace(/([?&]w=)\d+/, `$1${w}`)} ${w}w`).join(", ");
  }
  return { src: f.src, srcSet, alt: f.alt ?? "", forma };
}

/* ------------------------------------------------------------------
 * Horarios (hora de Colombia)
 * ------------------------------------------------------------------ */
const NOMBRES_DIA = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0];

function hora12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const sufijo = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

const capitalizar = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

/** Agrupa días seguidos con el mismo horario: "Lunes a sábado · 7:00 a.m. – 4:00 p.m." */
export function textoHorario(horarios: Horario[]): string {
  if (!horarios.length) return "";
  const rangosDe = (d: number) =>
    horarios.filter((h) => h.dia_semana === d).map((h) => `${hora12(h.hora_apertura)} – ${hora12(h.hora_cierre)}`).join(" y ");
  const grupos: { dias: number[]; texto: string }[] = [];
  for (const d of ORDEN_SEMANA) {
    const texto = rangosDe(d);
    if (!texto) continue;
    const ultimo = grupos[grupos.length - 1];
    const anterior = ultimo?.dias[ultimo.dias.length - 1];
    if (ultimo && ultimo.texto === texto && ORDEN_SEMANA.indexOf(anterior!) === ORDEN_SEMANA.indexOf(d) - 1) ultimo.dias.push(d);
    else grupos.push({ dias: [d], texto });
  }
  return grupos.map((g) => {
    const dias = g.dias.length === 1 ? NOMBRES_DIA[g.dias[0]]
      : g.dias.length === 2 ? `${NOMBRES_DIA[g.dias[0]]} y ${NOMBRES_DIA[g.dias[1]]}`
      : `${NOMBRES_DIA[g.dias[0]]} a ${NOMBRES_DIA[g.dias[g.dias.length - 1]]}`;
    return `${capitalizar(dias)} · ${g.texto}`;
  }).join(" | ");
}

/** Día (0-6) y minutos del día en Colombia */
function ahoraColombia(ahora: Date): { dia: number; minutos: number } {
  try {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota", weekday: "short", hour: "numeric", minute: "numeric", hour12: false,
    }).formatToParts(ahora);
    const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const wd = partes.find((p) => p.type === "weekday")?.value ?? "";
    const h = Number(partes.find((p) => p.type === "hour")?.value) % 24;
    const m = Number(partes.find((p) => p.type === "minute")?.value);
    if (wd in dias && !Number.isNaN(h)) return { dia: dias[wd], minutos: h * 60 + m };
  } catch {
    // Sin soporte de zona horaria: se usa la hora del dispositivo.
  }
  return { dia: ahora.getDay(), minutos: ahora.getHours() * 60 + ahora.getMinutes() };
}

const aMinutos = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** ¿Está abierto ahora? Mismo criterio que el backend (rangos que pasan de medianoche incluidos) */
export function estadoHorario(horarios: Horario[], ahora: Date = new Date()): { abierto: boolean; texto: string } {
  if (!horarios.length) return { abierto: true, texto: "" };
  const { dia, minutos } = ahoraColombia(ahora);
  const ayer = (dia + 6) % 7;

  for (const h of horarios) {
    const a = aMinutos(h.hora_apertura), c = aMinutos(h.hora_cierre);
    const hoyNormal = a < c && h.dia_semana === dia && minutos >= a && minutos < c;
    const nocturno = a > c && ((h.dia_semana === dia && minutos >= a) || (h.dia_semana === ayer && minutos < c));
    if (hoyNormal || nocturno) return { abierto: true, texto: `Abierto ahora · cierra a las ${hora12(h.hora_cierre)}` };
  }

  // Próxima apertura en los siguientes 7 días
  for (let i = 0; i < 7; i++) {
    const d = (dia + i) % 7;
    const proximo = horarios
      .filter((h) => h.dia_semana === d && (i > 0 || aMinutos(h.hora_apertura) > minutos))
      .sort((x, y) => aMinutos(x.hora_apertura) - aMinutos(y.hora_apertura))[0];
    if (proximo) {
      const cuando = i === 0 ? "hoy" : i === 1 ? "mañana" : `el ${NOMBRES_DIA[d]}`;
      return { abierto: false, texto: `Cerrado ahora · abre ${cuando} a las ${hora12(proximo.hora_apertura)}` };
    }
  }
  return { abierto: false, texto: "Cerrado ahora" };
}

/** Horario de hoy en texto corto, para la barra superior */
export function horarioDeHoy(horarios: Horario[], ahora: Date = new Date()): string {
  const { dia } = ahoraColombia(ahora);
  const hoy = horarios.filter((h) => h.dia_semana === dia);
  return hoy.length ? `Hoy ${hoy.map((h) => `${hora12(h.hora_apertura)} – ${hora12(h.hora_cierre)}`).join(" y ")}` : "Hoy cerrado";
}

/* ------------------------------------------------------------------
 * Adaptador: respuesta de /api/sitio → lo que usan los componentes
 * ------------------------------------------------------------------ */
export type RespuestaSitio = {
  negocio: {
    id: number; url_negocio: string; dominio: string | null; nombre: string; razon_social: string;
    nit: string | null; tipo: string | null; direccion: string | null; ciudad: string | null; telefono: string | null;
    whatsapp: string | null; correo: string | null; descripcion: string | null; logo: string | null; tipo_negocio: string;
    latitud: number | null; longitud: number | null; google_maps_url: string | null;
  };
  horarios: Horario[];
  sitio: {
    eslogan: string | null; frases: string[]; imagen_portada: Foto | null; nosotros_titulo: string | null; nosotros_texto: string | null;
    nosotros_items: { titulo: string; texto: string; foto: Foto | null }[]; imagen_franja: Foto | null; franja_texto: string | null;
    galeria: Foto[]; servicios: string | null; redes: Red[]; mensaje_whatsapp: string | null;
    seo_titulo: string | null; seo_descripcion: string | null; tema: "dark" | "light"; mostrar_fotos_productos: boolean;
  };
  tienda: { activa: boolean };
  perfil: { vista_catalogo?: "carta" | "cuadricula"; schema?: string; iconos?: string[]; textos?: Partial<Textos> };
};

export function adaptarSitio(r: RespuestaSitio, conDominio: boolean): Sitio {
  const { negocio: n, sitio: s } = r;
  const tel = (n.telefono ?? "").replace(/\D/g, "");
  const base = conDominio ? "" : `/${n.url_negocio}`;
  const origen = typeof window !== "undefined" ? window.location.origin : "";
  return {
    id: n.id,
    urlNegocio: n.url_negocio,
    dominio: n.dominio,
    nombre: n.nombre,
    razonSocial: n.razon_social,
    nit: n.nit,
    tipo: n.tipo,
    tipoNegocio: n.tipo_negocio,
    textos: { ...TEXTOS_GENERICOS, ...(r.perfil?.textos ?? {}) },
    vistaCatalogo: r.perfil?.vista_catalogo === "carta" ? "carta" : "cuadricula",
    iconos: r.perfil?.iconos ?? [],
    schemaTipo: r.perfil?.schema ?? "LocalBusiness",
    descripcion: n.descripcion,
    logo: n.logo,
    direccion: n.direccion,
    ciudad: n.ciudad,
    telefono: n.telefono,
    telefonoLink: tel ? `tel:+${tel.length === 10 ? `57${tel}` : tel}` : null,
    whatsapp: n.whatsapp,
    correo: n.correo,
    lat: n.latitud,
    lng: n.longitud,
    googleMaps: n.google_maps_url,
    horarios: r.horarios,
    horarioTexto: textoHorario(r.horarios),
    eslogan: s.eslogan,
    frases: s.frases ?? [],
    hero: aFoto(s.imagen_portada),
    nosotrosTitulo: s.nosotros_titulo,
    nosotrosTexto: s.nosotros_texto,
    nosotrosItems: (s.nosotros_items ?? []).map((i) => ({ ...i, foto: aFoto(i.foto) })),
    franja: aFoto(s.imagen_franja),
    franjaTexto: s.franja_texto,
    galeria: (s.galeria ?? []).map(aFoto).filter((f): f is Foto => f !== null),
    servicios: s.servicios,
    redes: s.redes ?? [],
    mensajeWhatsapp: s.mensaje_whatsapp || `Hola ${n.nombre}, quiero hacer un pedido.`,
    seoTitulo: s.seo_titulo || n.nombre,
    seoDescripcion: s.seo_descripcion || n.descripcion || "",
    tema: s.tema,
    mostrarFotosDeProductos: s.mostrar_fotos_productos,
    tiendaActiva: r.tienda.activa,
    base,
    url: conDominio ? `https://${n.dominio}` : `${origen}${base}`,
    menuUrl: (import.meta.env.VITE_MENU_URL as string | undefined) ?? `${API}/tienda/${n.url_negocio}/catalogo`,
  };
}

/* ------------------------------------------------------------------
 * Contexto
 * ------------------------------------------------------------------ */
export const ContextoSitio = createContext<Sitio | null>(null);

export function useSitio(): Sitio {
  const s = useContext(ContextoSitio);
  if (!s) throw new Error("useSitio debe usarse dentro de <SitioProvider>");
  return s;
}

export function waLink(sitio: Pick<Sitio, "whatsapp">, mensaje?: string): string {
  const base = `https://wa.me/${sitio.whatsapp ?? ""}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export function irA(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const reducido = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
}
