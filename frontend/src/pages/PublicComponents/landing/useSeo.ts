import { useEffect } from "react";
import { useSitio } from "./siteConfig";
import type { Sitio } from "./siteConfig";

const FUENTES =
  "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Manrope:wght@400;500;600;700;800&display=swap";

const DIAS_SCHEMA = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

/* Datos estructurados (schema.org), solo con lo que está registrado en la base */
function jsonLd(sitio: Sitio) {
  return {
    "@context": "https://schema.org",
    "@type": sitio.schemaTipo, // según el tipo de negocio: Restaurant, GroceryStore, ElectronicsStore…
    name: sitio.nombre,
    legalName: sitio.razonSocial,
    taxID: sitio.nit ?? undefined,
    url: sitio.url,
    telephone: sitio.telefonoLink?.replace("tel:", "") ?? undefined,
    email: sitio.correo ?? undefined,
    hasMap: sitio.googleMaps ?? undefined,
    image: sitio.logo ?? undefined,
    address: sitio.direccion
      ? { "@type": "PostalAddress", streetAddress: sitio.direccion, addressLocality: sitio.ciudad ?? undefined, addressCountry: "CO" }
      : undefined,
    geo: sitio.lat !== null && sitio.lng !== null ? { "@type": "GeoCoordinates", latitude: sitio.lat, longitude: sitio.lng } : undefined,
    openingHoursSpecification: sitio.horarios.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIAS_SCHEMA[h.dia_semana],
      opens: h.hora_apertura,
      closes: h.hora_cierre,
    })),
  };
}

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
  const sitio = useSitio();
  useEffect(() => {
    document.title = sitio.seoTitulo;
    document.documentElement.lang = "es";

    meta("name", "description", sitio.seoDescripcion);
    meta("property", "og:type", "website");
    meta("property", "og:title", sitio.seoTitulo);
    meta("property", "og:description", sitio.seoDescripcion);
    meta("property", "og:url", sitio.url);
    meta("property", "og:locale", "es_CO");

    // Tipografías (ver LEEME: es mejor moverlas a index.html)
    enlace("preconnect", "https://fonts.googleapis.com", "pu-pre-1");
    enlace("preconnect", "https://fonts.gstatic.com", "pu-pre-2", true);
    enlace("stylesheet", FUENTES, "pu-fuentes");

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "pu-json-ld";
    script.text = JSON.stringify(jsonLd(sitio));
    document.getElementById("pu-json-ld")?.remove();
    document.head.appendChild(script);

    return () => script.remove();
  }, [sitio]);
}
