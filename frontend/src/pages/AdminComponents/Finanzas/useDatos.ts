/* Carga de datos con estado de carga/error y recarga (los estados cambian al llegar la respuesta) */
import { useCallback, useEffect, useRef, useState } from "react";
import { errorDe } from "../../../api/finanzas";

export function useDatos<T>(cargar: () => Promise<T>, deps: unknown[]) {
  const [datos, setDatos] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const vez = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(cargar, deps);
  const recargar = useCallback(() => {
    const n = ++vez.current;
    return fn().then(
      (d) => { if (n === vez.current) { setDatos(d); setError(null); setCargando(false); } },
      (e) => { if (n === vez.current) { setError(errorDe(e, "No se pudieron cargar los datos").mensaje); setCargando(false); } },
    );
  }, [fn]);
  useEffect(() => {
    const t = window.setTimeout(recargar, 0);
    return () => window.clearTimeout(t);
  }, [recargar]);
  return { datos, error, cargando, recargar };
}
