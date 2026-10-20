/* Utilidades de la tienda (sin componentes) */
import type { EstadoTienda, PlatoTienda } from "./api";
import { pesos } from "./api";

export const formatear = (n: number) => pesos.format(n);
export const suave = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
export const EASE = [0.22, 1, 0.36, 1] as const;

// Las fotos del sistema solo se muestran si el negocio lo activa (Sitio web > Publicación)
export const fotoDe = (p: Pick<PlatoTienda, "imagenes">, mostrar: boolean) => (mostrar ? p.imagenes[0] : undefined);

export const estimarDomicilio = (tienda: EstadoTienda | null, subtotal: number) => {
  if (!tienda?.entrega.domicilio) return 0;
  const { costo_domicilio, domicilio_gratis_desde } = tienda.entrega;
  return domicilio_gratis_desde && subtotal >= domicilio_gratis_desde ? 0 : costo_domicilio;
};

/** % de descuento real: solo si el precio anterior es mayor que el actual */
export const descuento = (precio: number, anterior?: number | null) =>
  anterior && anterior > precio ? Math.round(((anterior - precio) / anterior) * 100) : 0;

const slug = (t: string) =>
  t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "producto";

/** URL descriptiva del producto: /tienda/p/labial-rojo-153 (el id al final la hace única) */
export const rutaProducto = (base: string, p: Pick<PlatoTienda, "id" | "nombre">) => `${base}/tienda/p/${slug(p.nombre)}-${p.id}`;
export const slugProducto = (p: Pick<PlatoTienda, "id" | "nombre">) => `${slug(p.nombre)}-${p.id}`;
/** "labial-rojo-153" → 153 */
export const idDesdeSlug = (s?: string) => {
  const m = /(\d+)$/.exec(s ?? "");
  return m ? Number(m[1]) : NaN;
};
