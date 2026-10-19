/*
 * Sistema de temas de la página pública de Punto Urbano.
 *
 *  - `themes.dark` / `themes.light`: los valores reales de cada tema.
 *  - `T`: lo que usan los componentes. Cada color es una variable CSS
 *    (`var(--pu-bg)`, …), así que al cambiar de tema toda la página se
 *    actualiza sola, sin volver a renderizar cada componente.
 *  - Tipografías, radios y tamaños no dependen del tema.
 */

export type ThemeMode = "dark" | "light";

export type ThemeTokens = {
  bg: string;
  surface: string;
  surface2: string;
  line: string;
  text: string;
  /** Texto secundario con más peso que `muted` */
  text2: string;
  muted: string;
  accent: string;
  accentHover: string;
  /** Texto sobre el acento */
  accentInk: string;
  /** Bordes de botones y chips */
  soft: string;
  /** Relleno muy leve (hover, esqueletos de carga) */
  wash: string;
  /** Indicador apagado ("cerrado") */
  off: string;
  /** Fondo de la barra de navegación al bajar */
  navBg: string;
  /** Paneles translúcidos sobre el mapa */
  glass: string;
  glassHover: string;
  /** Velo sobre la foto del inicio, para que el título se lea */
  heroOverlay: string;
  /** Trama de calles del inicio (cuando no hay foto) */
  pattern: string;
  shadow: string;
  /** Avisos (por ejemplo, ubicación no disponible) */
  warn: string;
};

export const themes: Record<ThemeMode, ThemeTokens> = {
  dark: {
    bg: "#0a0a0a",
    surface: "#141414",
    surface2: "#1c1c1c",
    line: "rgba(255,255,255,0.10)",
    text: "#f5f5f4",
    text2: "#d4d4d4",
    muted: "#a3a3a3",
    accent: "#22c55e",
    accentHover: "#4ade80",
    accentInk: "#04130a",
    soft: "rgba(255,255,255,0.28)",
    wash: "rgba(255,255,255,0.06)",
    off: "#737373",
    navBg: "rgba(10,10,10,0.82)",
    glass: "rgba(10,10,10,0.88)",
    glassHover: "rgba(38,38,38,0.95)",
    heroOverlay:
      "linear-gradient(90deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 55%, rgba(10,10,10,0.35) 100%)",
    pattern: "rgba(255,255,255,0.05)",
    shadow: "rgba(0,0,0,0.5)",
    warn: "#fbbf24",
  },
  light: {
    bg: "#f7f3ea",
    surface: "#efe9dc",
    surface2: "#e3dbc9",
    line: "rgba(26,23,20,0.10)",
    text: "#1a1714",
    text2: "#3d3832",
    muted: "#665f55",
    accent: "#15803d",
    accentHover: "#116932",
    accentInk: "#ffffff",
    soft: "rgba(26,23,20,0.28)",
    wash: "rgba(26,23,20,0.06)",
    off: "#9a9388",
    navBg: "rgba(247,243,234,0.86)",
    glass: "rgba(247,243,234,0.92)",
    glassHover: "rgba(227,219,201,0.97)",
    heroOverlay:
      "linear-gradient(90deg, rgba(247,243,234,0.95) 0%, rgba(247,243,234,0.8) 55%, rgba(247,243,234,0.5) 100%)",
    pattern: "rgba(26,23,20,0.07)",
    shadow: "rgba(26,23,20,0.22)",
    warn: "#92400e",
  },
};

export const THEME_STORAGE_KEY = "punto-urbano-theme";
export const DEFAULT_THEME: ThemeMode = "dark";

export function getThemeTokens(mode: ThemeMode): ThemeTokens {
  return themes[mode];
}

const CLAVES = Object.keys(themes.dark) as (keyof ThemeTokens)[];

/** { "--pu-bg": "#0a0a0a", … } para aplicar un tema como variables CSS */
export function cssVars(mode: ThemeMode): Record<string, string> {
  const tokens = themes[mode];
  return CLAVES.reduce<Record<string, string>>((vars, clave) => {
    vars[`--pu-${clave}`] = tokens[clave];
    return vars;
  }, {});
}

/* Lo que no cambia con el tema */
export const fonts = {
  display: '"Barlow Condensed", "Arial Narrow", Impact, sans-serif',
  body: '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif',
} as const;

/* Texto sobre fotos con velo oscuro: igual en los dos temas */
export const FOTO = {
  texto: "#f5f5f4",
  acento: "#22c55e",
  velo: "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.8) 100%)",
} as const;

/** Tokens activos: referencias a las variables CSS del tema elegido */
export const T: Record<keyof ThemeTokens, string> & typeof fonts = {
  ...CLAVES.reduce((refs, clave) => {
    refs[clave] = `var(--pu-${clave})`;
    return refs;
  }, {} as Record<keyof ThemeTokens, string>),
  ...fonts,
};

const btnBase = {
  borderRadius: 999,
  px: 3.5,
  py: 1.4,
  minHeight: 48,
  fontFamily: T.body,
  fontWeight: 800,
  fontSize: 15,
  textTransform: "none",
  boxShadow: "none",
  transition:
    "transform .2s ease, background-color .2s ease, border-color .2s ease",
} as const;

export const btnPrimario = {
  ...btnBase,
  bgcolor: T.accent,
  color: T.accentInk,
  "&:hover": {
    bgcolor: T.accentHover,
    boxShadow: "none",
    transform: "translateY(-2px)",
  },
} as const;

export const btnSecundario = {
  ...btnBase,
  color: T.text,
  border: `1px solid ${T.soft}`,
  "&:hover": {
    borderColor: T.text,
    bgcolor: T.wash,
    transform: "translateY(-2px)",
  },
} as const;

/* Estilos globales de la landing: foco visible, cambio de tema suave y movimiento reducido */
export const estilosRaiz = {
  bgcolor: T.bg,
  color: T.text,
  fontFamily: T.body,
  minHeight: "100vh",
  overflowX: "hidden",
  "& section": { scrollMarginTop: "72px" },
  "& a:focus-visible, & button:focus-visible": {
    outline: `2px solid ${T.accent}`,
    outlineOffset: "3px",
  },
  // Solo durante el cambio de tema: transición de colores en toda la página
  "&.pu-cambiando, &.pu-cambiando *": {
    transition:
      "background-color .35s ease, color .35s ease, border-color .35s ease, fill .35s ease !important",
  },
  "@media (prefers-reduced-motion: reduce)": {
    "& *, &.pu-cambiando, &.pu-cambiando *": {
      animationDuration: "0.01ms !important",
      transitionDuration: "0.01ms !important",
    },
  },
} as const;
