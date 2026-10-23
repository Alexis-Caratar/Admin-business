// Módulos, perfiles y permisos (/api/permisos). El backend valida todo; esto solo arma la interfaz.
import axios from "./axios";

const datos = <T,>(p: Promise<{ data: { data: T } }>) => p.then((r) => r.data.data);

export type MisPermisos = { admin_sistema: boolean; perfil: string | null; modulos: Record<string, string[]> };
export type Accion = { id: number; codigo: string; nombre: string };
export type ModuloCatalogo = {
  id: number; url: string; nombre: string; descripcion: string | null; icono: string | null; orden: number; grupo: string | null;
  activo: boolean; modulo_sistema: boolean; habilitado: boolean; acciones: Accion[];
};
export type Perfil = { id: number; nombre: string; descripcion: string | null; es_admin: boolean; activo: boolean; acciones: number[]; usuarios: number };
export type UsuarioPerfil = { id: number; email: string; rol: string | null; id_perfil: number | null; perfil: string | null; nombre: string; modulos: string[] };
export type RegistroAuditoria = { id: number; fecha: string; tabla: string; id_registro: number | null; accion: string; antes: unknown; despues: unknown; usuario: string | null };

export const apiMisPermisos = () => datos<MisPermisos>(axios.get("/permisos/mios"));
export const apiCatalogoModulos = () => datos<ModuloCatalogo[]>(axios.get("/permisos/modulos"));
export const apiGuardarModulo = (id: number, d: Partial<ModuloCatalogo>) => datos<ModuloCatalogo>(axios.put(`/permisos/modulos/${id}`, d));
export const apiPerfiles = () => datos<Perfil[]>(axios.get("/permisos/perfiles"));
export const apiGuardarPerfil = (d: Partial<Perfil>) => datos<Perfil>(d.id ? axios.put(`/permisos/perfiles/${d.id}`, d) : axios.post("/permisos/perfiles", d));
export const apiEliminarPerfil = (id: number) => datos<{ ok: boolean }>(axios.delete(`/permisos/perfiles/${id}`));
export const apiUsuariosPerfil = () => datos<UsuarioPerfil[]>(axios.get("/permisos/usuarios"));
export const apiAsignarPerfil = (id_usuario: number, id_perfil: number | null) => datos<{ ok: boolean }>(axios.put(`/permisos/usuarios/${id_usuario}/perfil`, { id_perfil }));
export const apiAuditoria = () => datos<RegistroAuditoria[]>(axios.get("/permisos/auditoria"));
