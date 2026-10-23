// Permisos efectivos del usuario para mostrar u ocultar acciones en la interfaz.
// Ocultar un botón no es seguridad: el backend valida cada operación igual.
import { useEffect, useState } from "react";
import { apiMisPermisos, type MisPermisos } from "../api/permisos";

let cache: Promise<MisPermisos> | null = null;
let token: string | null = null;

const cargar = () => {
  const actual = localStorage.getItem("token");
  if (!cache || token !== actual) {
    token = actual;
    cache = apiMisPermisos().catch((e) => { cache = null; throw e; });
  }
  return cache;
};

export function usePermisos() {
  const [p, setP] = useState<MisPermisos | null>(null);
  useEffect(() => {
    let vivo = true;
    cargar().then((r) => { if (vivo) setP(r); }).catch(() => { if (vivo) setP({ admin_sistema: false, perfil: null, modulos: {} }); });
    return () => { vivo = false; };
  }, []);
  const tiene = (permiso: string | string[]) => {
    if (!p) return false;
    if (p.admin_sistema) return true;
    return ([] as string[]).concat(permiso).some((x) => { const [m, a] = x.split("."); return p.modulos[m]?.includes(a) ?? false; });
  };
  return { listo: p !== null, permisos: p, tiene };
}
