import { useEffect } from "react";
import { SITE } from "./siteConfig";

/* Título y descripción: los mismos textos que ya tenía el sitio */
const TITULO =
  "Punto Urbano | Restaurante de Comidas Rápidas, Almuerzos y Cenas en Pasto";

const DESCRIPCION =
  "Punto Urbano en Pasto, Nariño. Restaurante de comidas rápidas, hamburguesas artesanales, almuerzos, cenas, fast food premium, domicilios y bebidas. Disfruta un ambiente moderno y el mejor sabor en Pasto.";

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Manrope:wght@400;500;600;700;800&display=swap";

const hh = (h: number) => `${String(h).padStart(2, "0")}:00`;

/* Datos estructurados de restaurante, solo con información real */
const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: SITE.nombre,
  url: SITE.url,
  telephone: "+573226665512",
  hasMap: SITE.googleMaps,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Cra. 40 #16D-29",
    addressLocality: "Pasto",
    addressRegion: "Nariño",
    addressCountry: "CO",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: SITE.lat,
    longitude: SITE.lng,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      opens: hh(SITE.horario.abre),
      closes: hh(SITE.horario.cierra),
    },
  ],
};

function meta(atributo: "name" | "property", clave: string, contenido: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${atributo}="${clave}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(atributo, clave);
    document.head.appendChild(el);
  }
  el.setAttribute("content", contenido);
}

function enlace(rel: string, href: string, id: string, crossOrigin = false) {
  if (document.getElementById(id)) return;
  const el = document.createElement("link");
  el.id = id;
  el.rel = rel;
  el.href = href;
  if (crossOrigin) el.crossOrigin = "anonymous";
  document.head.appendChild(el);
}

export function useSeo(): void {
  useEffect(() => {
    document.title = TITULO;
    document.documentElement.lang = "es";

    meta("name", "description", DESCRIPCION);
    meta("property", "og:type", "website");
    meta("property", "og:title", TITULO);
    meta("property", "og:description", DESCRIPCION);
    meta("property", "og:url", SITE.url);
    meta("property", "og:locale", "es_CO");

    // Tipografías (ver LEEME: es mejor moverlas a index.html)
    enlace("preconnect", "https://fonts.googleapis.com", "pu-pre-1");
    enlace("preconnect", "https://fonts.gstatic.com", "pu-pre-2", true);
    enlace("stylesheet", FUENTES, "pu-fuentes");

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "pu-json-ld";
    script.text = JSON.stringify(JSON_LD);
    document.getElementById("pu-json-ld")?.remove();
    document.head.appendChild(script);

    return () => script.remove();
  }, []);
}
