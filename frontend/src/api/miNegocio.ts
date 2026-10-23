// Mi negocio (/api/mi-negocio): datos y página web del negocio del usuario, con permiso.
import axios from "./axios";
import type { ConfigImpresion, ImpresionNegocio, SitioNegocio } from "./negocios";

export type MiNegocio = SitioNegocio & { descripcion: string | null; imagen: string | null; tipo: string | null; puede_cambiar_url: boolean };
export type DatosNegocio = Pick<MiNegocio, "nombre" | "descripcion" | "telefono" | "direccion" | "ciudad" | "correo" | "imagen">;

export const apiMiNegocio = async () => (await axios.get<{ data: MiNegocio }>("/mi-negocio")).data.data;
export const apiGuardarDatosNegocio = async (d: DatosNegocio) => (await axios.put<{ data: MiNegocio }>("/mi-negocio/datos", d)).data.data;
export const apiGuardarSitioPropio = async (s: SitioNegocio) => (await axios.put<{ data: SitioNegocio }>("/mi-negocio/sitio", {
  negocio: { url_negocio: s.url_negocio, dominio: s.dominio, whatsapp: s.whatsapp, latitud: s.latitud, longitud: s.longitud, google_maps_url: s.google_maps_url },
  horarios: s.horarios,
  sitio: s,
})).data.data;

// Factura, ticket e impresión del propio negocio (misma forma que Negocios → Impresión)
export const impresionPropia = {
  obtener: async () => (await axios.get<{ data: ImpresionNegocio }>("/mi-negocio/impresion")).data.data,
  guardar: async (c: Partial<ConfigImpresion>) => (await axios.put<{ data: ImpresionNegocio }>("/mi-negocio/impresion", c)).data.data,
  token: async () => (await axios.post<{ data: { token: string; version: number; ws_url: string } }>("/mi-negocio/impresion/token")).data.data,
  prueba: async (rol: "factura" | "comanda") => (await axios.post<{ data: { ok: boolean; mensaje: string } }>("/mi-negocio/impresion/prueba", { rol })).data.data,
};
