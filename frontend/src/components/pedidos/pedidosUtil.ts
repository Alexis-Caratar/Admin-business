/* Constantes, aviso sonoro y tiempo real compartidos por el cajero y el módulo Pedidos */
import { useCallback, useEffect, useRef, useState } from "react";
import { listarPedidos, mensajeError } from "../../api/pedidos";
import type { EstadoPago, EstadoPedido, PedidoResumen } from "../../api/pedidos";

export const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const hora = (f: string) => new Date(f).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
export const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

export const ESTADOS: Record<EstadoPedido, { label: string; color: string; accion?: string }> = {
  PENDIENTE: { label: "Pendiente", color: "#F59E0B" },
  CONFIRMADO: { label: "Confirmado", color: "#2563EB", accion: "Confirmar y facturar" },
  EN_PREPARACION: { label: "En preparación", color: "#7C3AED", accion: "Iniciar preparación" },
  LISTO: { label: "Listo", color: "#0891B2", accion: "Marcar listo" },
  EN_CAMINO: { label: "En camino", color: "#DB2777", accion: "Enviar (en camino)" },
  ENTREGADO: { label: "Entregado", color: "#16A34A", accion: "Marcar entregado" },
  CANCELADO: { label: "Cancelado", color: "#64748B", accion: "Cancelar pedido" },
};

export const PAGOS: Record<EstadoPago, { label: string; color: "success" | "warning" | "error" | "default" | "info" }> = {
  PENDIENTE: { label: "Pago pendiente", color: "warning" },
  APROBADO: { label: "Pagado", color: "success" },
  RECHAZADO: { label: "Pago rechazado", color: "error" },
  ANULADO: { label: "Pago anulado", color: "default" },
  REEMBOLSO_PENDIENTE: { label: "Reembolso pendiente", color: "error" },
};

export const METODOS_COBRO = ["EFECTIVO", "NEQUI", "DAVIPLATA", "TARJETA", "TRANSFERENCIA"];

/* Aviso sonoro corto al llegar un pedido nuevo */
export function sonar() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // el navegador puede bloquear audio sin interacción previa
  }
}

/* ================================================================
 * Tiempo real: WebSocket autenticado con reconexión
 * La BD es la fuente de verdad: cada evento solo provoca una recarga.
 * ================================================================ */
export function useEventosPedidos(alEvento: (evento: string, id: number) => void) {
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
        ws?.send(JSON.stringify({ tipo: "register_frontend", token: localStorage.getItem("token") }));
        callback.current("reconectado", 0); // recupera lo que llegó sin conexión
      };
      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.tipo === "pedido_evento") callback.current(msg.evento, msg.id_pedido);
      };
      ws.onclose = () => {
        setConectado(false);
        if (cerrado) return;
        temporizador = window.setTimeout(conectar, espera);
        espera = Math.min(espera * 2, 30_000);
      };
    };
    conectar();
    return () => {
      cerrado = true;
      window.clearTimeout(temporizador);
      ws?.close();
    };
  }, []);

  return conectado;
}


/* ================================================================
 * Pedidos en curso del negocio, en vivo (lo usa el cajero).
 * Recarga con cada evento del WebSocket y cada 30 s como respaldo.
 * ================================================================ */
export function usePedidosEnCurso() {
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevos, setNuevos] = useState<Set<number>>(new Set());
  const [aviso, setAviso] = useState<string | null>(null);
  const [recarga, setRecarga] = useState(0);
  // false = el negocio no tiene activo el módulo Pedidos (Admin > Negocios > módulos)
  const [disponible, setDisponible] = useState(true);

  const cargar = useCallback(async () => {
    try {
      setPedidos(await listarPedidos({ pendientes: "1" }));
      setError(null);
      setDisponible(true);
    } catch (e) {
      const r = (e as { response?: { status?: number; data?: { modulo_inactivo?: string } } })?.response;
      if (r?.status === 403 && r.data?.modulo_inactivo) { setDisponible(false); setPedidos([]); }
      else setError(mensajeError(e));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const inicial = window.setTimeout(cargar, 0);
    // Sin el módulo se revisa cada 5 minutos por si lo activan
    const t = window.setInterval(cargar, disponible ? 30_000 : 300_000);
    return () => { window.clearTimeout(inicial); window.clearInterval(t); };
  }, [cargar, disponible]);

  const conectado = useEventosPedidos(useCallback((evento: string, id: number) => {
    if (evento === "pedido_nuevo") {
      setNuevos((s) => new Set(s).add(id));
      setAviso("¡Nuevo pedido web!");
      sonar();
    } else if (evento === "pago_confirmado") setAviso("Pago en línea confirmado");
    else if (evento === "pago_rechazado") setAviso("Un pago en línea fue rechazado");
    cargar();
    setRecarga((v) => v + 1);
  }, [cargar]));

  const marcarVisto = useCallback((id: number) => setNuevos((s) => { const n = new Set(s); n.delete(id); return n; }), []);

  return {
    pedidos, cargando, error, conectado, nuevos, aviso, recarga, cargar, marcarVisto, disponible,
    cerrarAviso: () => setAviso(null),
    // Lo que necesita atención del cajero: por confirmar
    porConfirmar: pedidos.filter((p) => p.estado === "PENDIENTE").length,
  };
}

export type PedidosEnCurso = ReturnType<typeof usePedidosEnCurso>;

/* Degradados del proyecto (CajaMetricas): ícono, círculo decorativo y botones */
export const GRADIENTES = {
  azul: "linear-gradient(135deg,#2563eb,#60a5fa)",
  verde: "linear-gradient(135deg,#16a34a,#4ade80)",
  rojo: "linear-gradient(135deg,#dc2626,#f87171)",
  ambar: "linear-gradient(135deg,#d97706,#fbbf24)",
  violeta: "linear-gradient(135deg,#7c3aed,#a78bfa)",
  pizarra: "linear-gradient(135deg,#0f172a,#475569)",
} as const;
export type Gradiente = keyof typeof GRADIENTES;

/* Botones del proyecto: redondeados, sin mayúsculas */
export const botonPrincipal = {
  borderRadius: 3, textTransform: "none", fontWeight: 700, px: 2.5,
  background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 8px 20px rgba(37,99,235,.20)",
  "&:hover": { background: "linear-gradient(135deg,#1D4ED8,#2563EB)" },
} as const;
export const botonSecundario = {
  borderRadius: 3, textTransform: "none", fontWeight: 600, borderColor: "#CBD5E1", color: "#475569",
  "&:hover": { bgcolor: "#F8FAFC", borderColor: "#94A3B8" },
} as const;

/* Campos compactos del proyecto */
export const campo = {
  "& .MuiOutlinedInput-root": {
    borderRadius: 3, background: "#FFFFFF", fontSize: 13,
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#93C5FD" },
    "&.Mui-focused fieldset": { borderColor: "#2563EB", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontSize: 13 },
} as const;

/** Botón principal del proyecto (degradado azul, redondeado, sin mayúsculas) */
export const sxBotonPrincipal = {
  borderRadius: 3, fontWeight: 700, textTransform: "none", px: 2.5, height: 42,
  background: "linear-gradient(135deg,#2563EB,#3B82F6)", boxShadow: "0 8px 20px rgba(37,99,235,.20)",
  "&:hover": { background: "linear-gradient(135deg,#1D4ED8,#2563EB)" },
} as const;
