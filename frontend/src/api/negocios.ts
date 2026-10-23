import axios from "./axios";
import type { Negocio } from "../types";

export const getNegocios = async () => {
  const { data } = await axios.get<Negocio[]>("/negocios");
  return data;
};

export const optenerNegocios = async (id: number) => {
  const { data } = await axios.get<Negocio[]>(`/negocios/${id}`);
  return data;
};

export const crearNegocio = async (payload: Partial<Negocio>) => {
  const { data } = await axios.post("/negocios", payload);
  return data;
};

export const actualizarNegocio = async (id: number, payload: Partial<Negocio>) => {
  const { data } = await axios.put(`/negocios/${id}`, payload);
  return data;
};

export const eliminarNegocio = async (id: number) => {
  await axios.delete(`/negocios/${id}`);
};

export const getMenusempresaTotal = async () => {
  try {
    const { data } = await axios.post(`/negocios/menusnegocio`);    
    return data;
  } catch (error) {
    console.error(`Error llamar menusnegocio /usuarios`, error);
    throw error;
  }
};


export const getMenusEmpresa= async (idNegocio:number) => {
  try {
    const { data } = await axios.get(`/negocios/menus_usuario/${idNegocio}`);    
    return data;
  } catch (error) {
    console.error(`Error llamaer negocios /negocios/:`, error);
    throw error;
  }
};

export const asignarMenuEmpresa = async (id: number, id_menu: number[]) => {
  try {
    const { data } = await axios.post(`/negocios/menus_usuariocrear`, {
      id,
      id_menu
    });

    return data;
  } catch (error) {
    console.error(`Error llamar negocios /negocios/${id}:`, error);
    throw error;
  }
};

/* ---------------- Sitio web del negocio ---------------- */
export type FotoSitio = { src: string; alt: string; forma?: "normal" | "alta" | "ancha" };
export type HorarioSitio = { dia_semana: number; hora_apertura: string; hora_cierre: string };

export type SitioNegocio = {
  id: number;
  nombre: string; nit: string | null; direccion: string | null; ciudad: string | null; telefono: string | null; correo: string | null;
  url_negocio: string; dominio: string | null; whatsapp: string | null;
  latitud: number | null; longitud: number | null; google_maps_url: string | null;
  horarios: HorarioSitio[];
  publicado: boolean; nombre_publico: string | null; eslogan: string | null; frases: string[];
  imagen_portada: FotoSitio | null; nosotros_titulo: string | null; nosotros_texto: string | null;
  nosotros_items: { titulo: string; texto: string; foto: FotoSitio | null }[];
  imagen_franja: FotoSitio | null; franja_texto: string | null; galeria: FotoSitio[]; servicios: string | null; redes: { nombre: string; url: string }[];
  mensaje_whatsapp: string | null; seo_titulo: string | null; seo_descripcion: string | null;
  tema: "dark" | "light"; mostrar_fotos_productos: boolean;
  tienda_activa: boolean; tienda_permite_domicilio: boolean; tienda_permite_recoger: boolean; tienda_permite_contraentrega: boolean;
  tienda_costo_domicilio: number; tienda_domicilio_gratis_desde: number; tienda_pedido_minimo: number; tienda_requiere_caja_abierta: boolean;
};

export const getSitioNegocio = async (id: number) => {
  const { data } = await axios.get<{ data: SitioNegocio }>(`/negocios/${id}/sitio`);
  return data.data;
};

export const guardarSitioNegocio = async (id: number, s: SitioNegocio) => {
  const { data } = await axios.put<{ data: SitioNegocio }>(`/negocios/${id}/sitio`, {
    negocio: { url_negocio: s.url_negocio, dominio: s.dominio, whatsapp: s.whatsapp, latitud: s.latitud, longitud: s.longitud, google_maps_url: s.google_maps_url },
    horarios: s.horarios,
    sitio: s,
  });
  return data.data;
};

/** Sitio por defecto de un negocio nuevo (se guarda después de crearlo) */
export const sitioVacio = (): SitioNegocio => ({
  id: 0, nombre: "", nit: null, direccion: null, ciudad: null, telefono: null, correo: null,
  url_negocio: "", dominio: null, whatsapp: null, latitud: null, longitud: null, google_maps_url: null,
  horarios: [1, 2, 3, 4, 5, 6].map((d) => ({ dia_semana: d, hora_apertura: "08:00", hora_cierre: "17:00" })),
  publicado: false, nombre_publico: null, eslogan: null, frases: [], imagen_portada: null,
  nosotros_titulo: null, nosotros_texto: null, nosotros_items: [], imagen_franja: null, franja_texto: null, galeria: [],
  servicios: null, redes: [], mensaje_whatsapp: null, seo_titulo: null, seo_descripcion: null,
  tema: "dark", mostrar_fotos_productos: false,
  tienda_activa: false, tienda_permite_domicilio: true, tienda_permite_recoger: true, tienda_permite_contraentrega: true,
  tienda_costo_domicilio: 0, tienda_domicilio_gratis_desde: 0, tienda_pedido_minimo: 0, tienda_requiere_caja_abierta: true,
});

/** Texto → url_negocio ("Punto Urbano" → "punto-urbano") mientras se escribe */
export const slugNegocio = (t: string) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "");

/* ---------------- Tipos de negocio (tabla tipos_negocio) ---------------- */
export type SugeridosTipo = {
  frases?: string[]; nosotros_titulo?: string; nosotros_texto?: string;
  nosotros_items?: { titulo: string; texto: string }[]; franja_texto?: string; servicios?: string;
  mensaje_whatsapp?: string; seo_titulo?: string; seo_descripcion?: string;
};
export type TipoNegocio = { codigo: string; nombre: string; perfil: { vista_catalogo: string; sugeridos?: SugeridosTipo; textos?: Record<string, string> } };

export const getTiposNegocio = async () => {
  const { data } = await axios.get<{ data: TipoNegocio[] }>("/tipos-negocio");
  return data.data;
};

/** Contenido sugerido del tipo aplicado al sitio ({nombre} y {ciudad} reemplazados) */
export const aplicarSugeridos = (s: SitioNegocio, tipo: TipoNegocio, nombre: string, ciudad: string | null): SitioNegocio => {
  const g = tipo.perfil.sugeridos ?? {};
  const llenar = (v?: string) => (v ? v.replaceAll("{nombre}", nombre).replaceAll("{ciudad}", ciudad || "tu ciudad") : null);
  return {
    ...s,
    frases: (g.frases ?? []).map((f) => llenar(f) ?? ""),
    nosotros_titulo: llenar(g.nosotros_titulo),
    nosotros_texto: llenar(g.nosotros_texto),
    // Conserva las fotos ya cargadas en cada punto
    nosotros_items: (g.nosotros_items ?? []).map((it, i) => ({ titulo: it.titulo, texto: it.texto, foto: s.nosotros_items[i]?.foto ?? null })),
    franja_texto: llenar(g.franja_texto),
    servicios: llenar(g.servicios),
    mensaje_whatsapp: llenar(g.mensaje_whatsapp),
    seo_titulo: llenar(g.seo_titulo),
    seo_descripcion: llenar(g.seo_descripcion),
  };
};

/* ---------------- Pagos (Wompi), WhatsApp y ajustes de la tienda ---------------- */
export type SecretoGuardado = { guardado: boolean; final: string | null };
export type IntegracionesNegocio = {
  wompi: {
    entorno: "pruebas" | "produccion"; public_key: string;
    integrity_secret: SecretoGuardado; events_secret: SecretoGuardado; private_key: SecretoGuardado;
    origen: "negocio" | "servidor" | "ninguno"; habilitado: boolean; puede_conciliar: boolean; entorno_activo: string | null; webhook: string;
  };
  whatsapp: {
    phone_number_id: string; api_version: string; idioma: string; token: SecretoGuardado;
    origen: "negocio" | "servidor" | "ninguno"; habilitado: boolean;
  };
  tienda: { url_retorno: string; validar_horario: boolean };
  servidor: { wompi: string | null; whatsapp: boolean; url_publica: string | null; validar_horario: boolean };
};
/** Lo que se envía al guardar. Secretos: texto = reemplaza, "" u omitido = se conserva, null = se borra */
export type CambiosIntegraciones = Partial<{
  wompi_entorno: "pruebas" | "produccion"; wompi_public_key: string | null;
  wompi_integrity_secret: string | null; wompi_events_secret: string | null; wompi_private_key: string | null;
  whatsapp_token: string | null; whatsapp_phone_number_id: string | null; whatsapp_api_version: string | null; whatsapp_idioma: string | null;
  tienda_url_retorno: string | null; tienda_validar_horario: boolean;
}>;

export const obtenerIntegraciones = async (id: number) => {
  const { data } = await axios.get<{ data: IntegracionesNegocio }>(`/negocios/${id}/integraciones`);
  return data.data;
};
export const guardarIntegraciones = async (id: number, cambios: CambiosIntegraciones) => {
  const { data } = await axios.put<{ data: IntegracionesNegocio }>(`/negocios/${id}/integraciones`, cambios);
  return data.data;
};
export const probarIntegracion = async (id: number, tipo: "wompi" | "whatsapp", cambios: CambiosIntegraciones) => {
  const { data } = await axios.post<{ data: { ok: boolean; mensaje: string } }>(`/negocios/${id}/integraciones/probar/${tipo}`, cambios);
  return data.data;
};

/* ---------------- Impresión: formato de tickets y agente local ---------------- */
export type ConfigImpresion = {
  ancho_caracteres: 32 | 42 | 48; encabezado: string | null; pie: string | null; mostrar_qr: boolean;
  qr_contenido: "tienda" | "factura" | "texto"; qr_texto: string | null; qr_leyenda: string | null;
  documento_consumidor: string; imprimir_comanda_al_vender: boolean; copias_comanda: number;
  factura_al_cobrar: "preguntar" | "siempre" | "nunca";   // qué hace la caja con la factura al cobrar
};
export type AgenteConectado = {
  punto: string; protocolo: number; version: string | null; conectado_desde: string | null;
  impresoras: { nombre: string; rol: string; tipo?: string; conectada?: boolean | null }[];
  estado: { status?: string; message?: string } | null;
};
export type ImpresionNegocio = { config: ConfigImpresion; url_tienda: string; vista_previa: string; agentes: AgenteConectado[]; ws_url: string };

export const obtenerImpresion = async (id: number) => (await axios.get<{ data: ImpresionNegocio }>(`/negocios/${id}/impresion`)).data.data;
export const guardarImpresion = async (id: number, c: Partial<ConfigImpresion>) => (await axios.put<{ data: ImpresionNegocio }>(`/negocios/${id}/impresion`, c)).data.data;
export const tokenAgente = async (id: number) => (await axios.post<{ data: { token: string; version: number; ws_url: string } }>(`/negocios/${id}/impresion/token`)).data.data;
export const pruebaImpresion = async (id: number, rol: "factura" | "comanda") =>
  (await axios.post<{ data: { ok: boolean; mensaje: string } }>(`/negocios/${id}/impresion/prueba`, { rol })).data.data;
