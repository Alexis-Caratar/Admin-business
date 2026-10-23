// Publicidad (/api/publicidad): recursos del negocio, carta del día y diseños guardados.
import axios from "./axios";

const datos = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

export type Recursos = {
  negocio: { nombre: string; logo: string | null; telefono: string | null; whatsapp: string | null; direccion: string | null; ciudad: string | null };
  fotos: { url: string; titulo: string }[];
  carta: { platos: string[]; acompanamientos: string[] };
};
export type Diseno = { id: number; plantilla: "menu" | "promo"; nombre: string; datos: Record<string, unknown>; updated_at: string };

export const apiRecursos = () => datos<Recursos>(axios.get("/publicidad/recursos"));
export const apiDisenos = () => datos<Diseno[]>(axios.get("/publicidad"));
export const apiGuardarDiseno = (d: { id?: number; plantilla: "menu" | "promo"; nombre: string; datos: object }) =>
  datos<Diseno>(d.id ? axios.put(`/publicidad/${d.id}`, d) : axios.post("/publicidad", d));
export const apiBorrarDiseno = (id: number) => datos<{ ok: boolean }>(axios.delete(`/publicidad/${id}`));
