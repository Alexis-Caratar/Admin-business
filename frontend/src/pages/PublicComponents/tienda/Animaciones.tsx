/*
 * Piezas animadas de la tienda. Todas respetan "reducir movimiento" del sistema.
 */
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { AnimatePresence, animate, motion, useReducedMotion } from "framer-motion";
import { Box } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { T } from "../landing/tokens";

/** Número que se anima al cambiar (precios y totales) */
export function NumeroAnimado({ valor, formato }: { valor: number; formato: (n: number) => string }) {
  const reducido = useReducedMotion();
  const [mostrado, setMostrado] = useState(valor);
  const anterior = useRef(valor);
  useEffect(() => {
    if (reducido) { anterior.current = valor; return; }
    const control = animate(anterior.current, valor, { duration: 0.45, ease: "easeOut", onUpdate: (v) => setMostrado(Math.round(v)) });
    anterior.current = valor;
    return () => control.stop();
  }, [valor, reducido]);
  return <span style={{ fontVariantNumeric: "tabular-nums" }}>{formato(reducido ? valor : mostrado)}</span>;
}

/** Punto de "en vivo" que pulsa */
export function PuntoVivo({ color = T.accent, tam = 10 }: { color?: string; tam?: number }) {
  const reducido = useReducedMotion();
  return (
    <Box component="span" aria-hidden sx={{ position: "relative", display: "inline-flex", width: tam, height: tam, flexShrink: 0 }}>
      {!reducido && (
        <motion.span
          style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }}
          animate={{ scale: [1, 2.4], opacity: [0.55, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
        />
      )}
      <span style={{ position: "relative", width: tam, height: tam, borderRadius: "50%", background: color }} />
    </Box>
  );
}

/** Tarjeta seleccionable (entrega, pago, opciones del producto) */
export function TarjetaSeleccion({ activa, onClick, icono, titulo, detalle, extra, tipo = "radio", deshabilitada = false }: {
  activa: boolean; onClick: () => void; icono?: ReactNode; titulo: ReactNode; detalle?: ReactNode; extra?: ReactNode;
  tipo?: "radio" | "check"; deshabilitada?: boolean;
}) {
  const reducido = useReducedMotion();
  return (
    <motion.div whileTap={reducido || deshabilitada ? undefined : { scale: 0.98 }} style={{ height: "100%" }}>
      <Box
        component="button"
        type="button"
        role={tipo}
        aria-checked={activa}
        disabled={deshabilitada}
        onClick={onClick}
        sx={{
          width: "100%", height: "100%", textAlign: "left", cursor: deshabilitada ? "not-allowed" : "pointer", font: "inherit", color: T.text,
          display: "flex", alignItems: "center", gap: 1.5, p: 1.6, borderRadius: 3,
          bgcolor: activa ? `color-mix(in srgb, ${T.accent} 12%, ${T.surface})` : T.surface,
          border: `1.5px solid ${activa ? T.accent : T.line}`,
          boxShadow: activa ? `0 0 0 4px color-mix(in srgb, ${T.accent} 15%, transparent)` : "none",
          opacity: deshabilitada ? 0.5 : 1,
          transition: "border-color .2s ease, background-color .2s ease, box-shadow .2s ease",
          "&:hover": deshabilitada ? undefined : { borderColor: activa ? T.accent : T.soft },
          "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 },
        }}
      >
        {icono && (
          <Box sx={{ width: 40, height: 40, borderRadius: 2.5, display: "grid", placeItems: "center", flexShrink: 0, color: activa ? T.accentInk : T.text, bgcolor: activa ? T.accent : T.wash, transition: "all .2s ease" }}>
            {icono}
          </Box>
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ fontWeight: 600, fontSize: 15, fontFamily: T.body }}>{titulo}</Box>
          {detalle && <Box sx={{ fontSize: 13, color: T.muted, fontFamily: T.body, mt: 0.2 }}>{detalle}</Box>}
        </Box>
        {extra}
        <Box sx={{
          width: 22, height: 22, flexShrink: 0, display: "grid", placeItems: "center",
          borderRadius: tipo === "radio" ? "50%" : 1.2, border: `2px solid ${activa ? T.accent : T.soft}`, bgcolor: activa ? T.accent : "transparent", transition: "all .2s ease",
        }}>
          <AnimatePresence>
            {activa && (
              <motion.span key="ok" initial={reducido ? false : { scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} style={{ display: "flex" }}>
                <CheckIcon sx={{ fontSize: 15, color: T.accentInk }} />
              </motion.span>
            )}
          </AnimatePresence>
        </Box>
      </Box>
    </motion.div>
  );
}

/** Confeti de celebración (pago aprobado, pedido entregado) */
export function Confeti({ activo }: { activo: boolean }) {
  const reducido = useReducedMotion();
  const [piezas] = useState(() =>
    Array.from({ length: 46 }, (_, i) => ({
      id: i,
      x: (Math.random() - 0.5) * 760,
      y: -(200 + Math.random() * 380),
      giro: (Math.random() - 0.5) * 720,
      color: ["#22c55e", "#facc15", "#3b82f6", "#f97316", "#ec4899", "#a855f7"][i % 6],
      ancho: 6 + Math.random() * 6,
      retraso: Math.random() * 0.15,
    }))
  );
  if (reducido) return null;
  return (
    <AnimatePresence>
      {activo && (
        <Box aria-hidden sx={{ position: "fixed", left: "50%", top: "45%", width: 0, height: 0, zIndex: 2000, pointerEvents: "none" }}>
          {piezas.map((p) => (
            <motion.span
              key={p.id}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{ x: p.x, y: [0, p.y, p.y + 520], opacity: [1, 1, 0], rotate: p.giro }}
              transition={{ duration: 1.9, delay: p.retraso, ease: [0.2, 0.7, 0.3, 1] }}
              style={{ position: "absolute", width: p.ancho, height: p.ancho * 1.6, background: p.color, borderRadius: 2 }}
            />
          ))}
        </Box>
      )}
    </AnimatePresence>
  );
}

/** Contenedor que aparece al entrar en pantalla (lista escalonada) */
export function Aparecer({ children, retraso = 0 }: { children: ReactNode; retraso?: number }) {
  const reducido = useReducedMotion();
  if (reducido) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: retraso, ease: [0.22, 1, 0.36, 1] }}
      style={{ height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
