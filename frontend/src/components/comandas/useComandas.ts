/* Tiempo real de comandas y mesas: WebSocket existente con reconexión.
 * La BD es la fuente de verdad: cada evento solo provoca una recarga por la API,
 * y al reconectarse se recupera lo que llegó sin conexión. */
import { useCallback, useEffect, useRef, useState } from "react";
import { apiComandas, apiMesasComandas, errorDe, type ComandaResumen, type MesaEstado } from "../../api/comandas";
import { sonar } from "../pedidos/pedidosUtil";

export function useEventosComandas(alEvento: (evento: string, id: number) => void, conMesas = false) {
  const [conectado, setConectado] = useState(false);
  const callback = useRef(alEvento);
  useEffect(() => { callback.current = alEvento; }, [alEvento]);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let espera = 1000;
    let temporizador: number | undefined;
    let cerrado = false;
    const conectar = () => {
      ws = new WebSocket(import.meta.env.VITE_WS_URL);
      ws.onopen = () => {
        espera = 1000;
        setConectado(true);
        const token = localStorage.getItem("token");
        ws?.send(JSON.stringify({ tipo: "register_frontend", token }));
        if (conMesas) ws?.send(JSON.stringify({ tipo: "suscribirse_mesas", token }));
        callback.current("reconectado", 0);
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.tipo === "comanda_evento") callback.current(msg.evento, msg.id_comanda);
        else if (msg.tipo === "mesas") callback.current("mesas", 0);
      };
      ws.onclose = () => {
        setConectado(false);
        if (cerrado) return;
        temporizador = window.setTimeout(conectar, espera);
        espera = Math.min(espera * 2, 30_000);
      };
    };
    conectar();
    return () => { cerrado = true; window.clearTimeout(temporizador); ws?.close(); };
  }, [conMesas]);
  return conectado;
}

// Comandas pendientes (abiertas o en cobro) para la caja: aviso al llegar una nueva
export function useComandasPendientes() {
  const [comandas, setComandas] = useState<ComandaResumen[]>([]);
  const [disponible, setDisponible] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);

  const cargar = useCallback(async () => {
    try {
      setComandas(await apiComandas({ pendientes: "1" }));
      setDisponible(true); setError(null);
    } catch (e) {
      const er = errorDe(e);
      if (er.status === 403) { setDisponible(false); setComandas([]); } else setError(er.mensaje);
    }
  }, []);

  useEffect(() => {
    const t0 = window.setTimeout(cargar, 0);
    const t = window.setInterval(cargar, disponible ? 30_000 : 300_000);
    return () => { window.clearTimeout(t0); window.clearInterval(t); };
  }, [cargar, disponible]);

  const conectado = useEventosComandas(useCallback((evento: string) => {
    if (evento === "comanda_nueva") { setAviso("¡Nueva comanda de un mesero!"); sonar(); }
    else if (evento === "comanda_actualizada") setAviso("Un mesero agregó productos a una comanda");
    if (evento !== "mesas") { cargar(); setRecarga((v) => v + 1); }
  }, [cargar]));

  return { comandas, disponible, error, aviso, limpiarAviso: () => setAviso(null), conectado, recarga, recargar: cargar };
}

// Mesas con su estado real (mesero): se actualiza con cada evento
export function useMesasEnVivo() {
  const [mesas, setMesas] = useState<MesaEstado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const cargar = useCallback(async () => {
    try { setMesas(await apiMesasComandas()); setError(null); }
    catch (e) { setError(errorDe(e).mensaje); }
    finally { setCargando(false); }
  }, []);
  useEffect(() => {
    const t0 = window.setTimeout(cargar, 0);
    const t = window.setInterval(cargar, 30_000);
    return () => { window.clearTimeout(t0); window.clearInterval(t); };
  }, [cargar]);
  // "version" sube con cada evento: las vistas abiertas (una comanda, mis comandas) se recargan con ella
  const [version, setVersion] = useState(0);
  const conectado = useEventosComandas(useCallback(() => { cargar(); setVersion((v) => v + 1); }, [cargar]), true);
  return { mesas, error, cargando, conectado, version, recargar: cargar };
}
