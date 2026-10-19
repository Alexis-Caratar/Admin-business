/*
 * Datos reales del restaurante. Todo lo que se muestra en la página
 * sale de aquí o del backend: no hay datos inventados.
 */

export type Red = { nombre: string; url: string };

export type Foto = {
  src: string;
  /** Versiones por ancho, para que el móvil no descargue la foto grande */
  srcSet?: string;
  alt: string;
  /** Proporción dentro del mosaico */
  forma?: "normal" | "alta" | "ancha";
};

/*
 * FOTOS DE BANCO (Unsplash, licencia libre para uso comercial).
 * Son imágenes de ambiente, NO fotos de tu local ni de tus platos.
 * Cuando tengas las tuyas, reemplaza cada `stock(...)` por
 *   { src: miFoto, alt: "Descripción" }
 */
const UNSPLASH = "https://images.unsplash.com/photo-";

function stock(id: string, alt: string, forma?: Foto["forma"]): Foto {
  const url = (w: number) =>
    `${UNSPLASH}${id}?auto=format&fit=crop&w=${w}&q=70`;
  return {
    src: url(1200),
    srcSet: [600, 1200, 1800].map((w) => `${url(w)} ${w}w`).join(", "),
    alt,
    forma,
  };
}

export const SITE = {
  nombre: "Punto Urbano",
  url: "https://puntourbano.co",
  ciudad: "Pasto, Nariño",
  direccion: "Cra. 40 #16D-29, Pasto, Nariño",
  lat: 1.223392,
  lng: -77.2862206,
  telefono: "322 6665512",
  telefonoLink: "tel:+573226665512",
  whatsapp: "573226665512",
  googleMaps: "https://maps.app.goo.gl/ZxZo7wb9VQ38qcht6",

  /** Lunes (1) a sábado (6), de 7:00 a 16:00, hora de Colombia */
  horario: {
    dias: [1, 2, 3, 4, 5, 6],
    abre: 7,
    cierra: 16,
    texto: "Lunes a sábado · 7:00 a.m. – 4:00 p.m.",
  },

  /** Carta en línea. Se puede cambiar con VITE_MENU_URL en el .env */
  menuUrl:
    (import.meta.env.VITE_MENU_URL as string | undefined) ??
    "https://api.puntourbano.co/api/cajero/productos/1",

  /**
   * Las imágenes guardadas hoy en el sistema vienen de otros sitios web
   * (no son fotos de tus platos). Déjalo en false hasta que subas las
   * tuyas; con true la carta muestra la miniatura de cada plato.
   */
  mostrarFotosDeProductos: false,

  /** PENDIENTE: agrega tus redes. Si está vacío, no se muestra nada. */
  redes: [
    // { nombre: "Instagram", url: "https://instagram.com/tu_usuario" },
  ] as Red[],

  /** Fondo del inicio. Con null se muestra la trama de calles. */
  hero: stock(
    "1571091718767-18b5b1457add",
    "Hamburguesa con queso sobre una mesa de madera oscura"
  ) as Foto | null,

  /** Tres fotos de la sección "Nuestro restaurante" */
  nosotros: [
    stock("1558030089-02acba3c214e", "Carne a la parrilla sobre las brasas"),
    stock("1772693471187-6e7d364f99ee", "Pollo a la plancha con arroz y vegetales"),
    stock("1691775755067-a9807ac8939c", "Taza de café recién servido"),
  ] as Foto[],

  /** Franja de foto a todo el ancho, entre el menú y la galería */
  franja: stock(
    "1708388464878-5df2d66b758e",
    "Parrilla encendida con comida"
  ) as Foto | null,

  /** Mosaico de la galería. Vacío = la sección no aparece. */
  galeria: [
    stock("1550547660-d9450f859349", "Hamburguesa servida en tabla de madera", "ancha"),
    stock("1527598041828-aea5d622f3a8", "Desayuno con huevos y tocineta", "alta"),
    stock("1784902540562-9b048bde9ace", "Pollo a la parrilla con arroz y papas"),
    stock("1617319683252-027deeba5fd5", "Vaso de jugo de naranja"),
    stock("1551782450-a2132b4ba21d", "Hamburguesa con papas a la francesa"),
    stock("1646908499080-e412060bcfe2", "Taza de café con granos sobre la mesa"),
    stock("1529262365544-55d1707e64e6", "Carne asándose en la parrilla", "ancha"),
    stock("1603532232030-69a8264a71f4", "Fruta picada junto a una taza de café"),
  ] as Foto[],
};

export function waLink(mensaje?: string): string {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

export function irA(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const reducido = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  el.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
}

const DIAS: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function hora12(h: number): string {
  const sufijo = h < 12 ? "a.m." : "p.m.";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:00 ${sufijo}`;
}

/** ¿Está abierto ahora mismo? Siempre calculado con la hora de Colombia. */
export function estadoHorario(ahora: Date = new Date()): {
  abierto: boolean;
  texto: string;
} {
  const { dias, abre, cierra } = SITE.horario;
  let dia = ahora.getDay();
  let hora = ahora.getHours();

  try {
    const partes = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Bogota",
      weekday: "short",
      hour: "numeric",
      hour12: false,
    }).formatToParts(ahora);
    const wd = partes.find((p) => p.type === "weekday")?.value ?? "";
    const hr = Number(partes.find((p) => p.type === "hour")?.value);
    if (wd in DIAS && !Number.isNaN(hr)) {
      dia = DIAS[wd];
      hora = hr % 24;
    }
  } catch {
    // Sin soporte de zona horaria: se usa la hora del dispositivo.
  }

  const abreHoy = dias.includes(dia);

  if (abreHoy && hora >= abre && hora < cierra) {
    return {
      abierto: true,
      texto: `Abierto ahora · cierra a las ${hora12(cierra)}`,
    };
  }

  let cuando = "hoy";
  if (!(abreHoy && hora < abre)) {
    cuando = dias.includes((dia + 1) % 7) ? "mañana" : "el lunes";
  }

  return {
    abierto: false,
    texto: `Cerrado ahora · abre ${cuando} a las ${hora12(abre)}`,
  };
}
