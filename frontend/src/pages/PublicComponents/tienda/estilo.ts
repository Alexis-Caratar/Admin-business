/*
 * Piezas visuales de la tienda (estilo minimalista): botones tipo píldora,
 * tarjetas blancas con radio amplio, títulos con interletra ajustada.
 * Los colores salen de las variables del tema (`T`), así funcionan en claro y oscuro.
 */
import { T } from "../landing/tokens";

const base = {
  borderRadius: 999,
  px: 2.75,
  py: 1.25,
  minHeight: 44,
  fontFamily: T.body,
  fontWeight: 500,
  fontSize: 16,
  letterSpacing: "-0.01em",
  textTransform: "none",
  boxShadow: "none",
  transition: "background-color .2s ease, color .2s ease, border-color .2s ease, transform .15s ease",
  "&:active": { transform: "scale(0.97)" },
  "&.Mui-disabled": { opacity: 0.45 },
} as const;

/** Botón principal: azul sólido */
export const btnPrimario = {
  ...base,
  bgcolor: T.accent,
  color: T.accentInk,
  "&:hover": { bgcolor: T.accentHover, boxShadow: "none" },
  "&.Mui-disabled": { bgcolor: T.accent, color: T.accentInk, opacity: 0.4 },
} as const;

/** Botón secundario: contorno fino */
export const btnSecundario = {
  ...base,
  color: T.accent,
  bgcolor: "transparent",
  border: `1px solid ${T.accent}`,
  "&:hover": { bgcolor: `color-mix(in srgb, ${T.accent} 8%, transparent)` },
} as const;

/** Botón gris suave (acciones menores) */
export const btnSuave = {
  ...base,
  color: T.text,
  bgcolor: T.wash,
  "&:hover": { bgcolor: `color-mix(in srgb, ${T.text} 10%, transparent)` },
} as const;

/** Enlace azul con flecha ("Ver todo ›") */
export const enlace = {
  color: T.accent,
  fontSize: 15,
  fontWeight: 400,
  textDecoration: "none",
  cursor: "pointer",
  "&:hover": { textDecoration: "underline" },
} as const;

/** Títulos grandes: peso 600, interletra negativa */
export const titulo = (xs: number, md: number) => ({
  fontFamily: T.display,
  fontWeight: 600,
  fontSize: { xs, md },
  lineHeight: 1.08,
  letterSpacing: "-0.025em",
  color: T.text,
}) as const;

/** Tarjeta blanca con sombra suave que crece al pasar el cursor */
export const tarjeta = {
  bgcolor: T.surface,
  borderRadius: "18px",
  boxShadow: `0 4px 18px ${T.shadow}`,
  transition: "box-shadow .4s cubic-bezier(.22,1,.36,1), transform .4s cubic-bezier(.22,1,.36,1)",
  "&:hover": { boxShadow: `0 12px 36px ${T.shadow}` },
} as const;

/** Etiqueta naranja sobre el nombre ("Nuevo", "-20 %") */
export const etiquetaNaranja = { fontSize: 12, fontWeight: 600, color: T.warn, letterSpacing: "0" } as const;
