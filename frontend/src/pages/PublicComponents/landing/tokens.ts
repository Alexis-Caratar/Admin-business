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

/*
 * Estilo "tienda": limpio y minimalista (inspirado en tiendas premium):
 * fondos gris muy claro / negro, superficies blancas, texto casi negro,
 * un solo acento azul y tipografía del sistema.
 */
export const themesTienda: Record<ThemeMode, ThemeTokens> = {
  light: {
    bg: "#f5f5f7",
    surface: "#ffffff",
    surface2: "#fafafc",
    line: "rgba(0,0,0,0.09)",
    text: "#1d1d1f",
    text2: "#424245",
    muted: "#6e6e73",
    accent: "#0071e3",
    accentHover: "#0062c4",
    accentInk: "#ffffff",
    soft: "rgba(0,0,0,0.18)",
    wash: "rgba(0,0,0,0.04)",
    off: "#86868b",
    navBg: "rgba(245,245,247,0.78)",
    glass: "rgba(255,255,255,0.86)",
    glassHover: "rgba(255,255,255,0.96)",
    heroOverlay: "linear-gradient(180deg, rgba(245,245,247,0) 0%, rgba(245,245,247,0.9) 100%)",
    pattern: "rgba(0,0,0,0.05)",
    shadow: "rgba(0,0,0,0.10)",
    warn: "#b64400",
  },
  dark: {
    bg: "#000000",
    surface: "#1c1c1e",
    surface2: "#2c2c2e",
    line: "rgba(255,255,255,0.12)",
    text: "#f5f5f7",
    text2: "#d2d2d7",
    muted: "#a1a1a6",
    accent: "#0a84ff",
    accentHover: "#409cff",
    accentInk: "#ffffff",
    soft: "rgba(255,255,255,0.24)",
    wash: "rgba(255,255,255,0.06)",
    off: "#6e6e73",
    navBg: "rgba(22,22,23,0.8)",
    glass: "rgba(28,28,30,0.88)",
    glassHover: "rgba(44,44,46,0.96)",
    heroOverlay: "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.9) 100%)",
    pattern: "rgba(255,255,255,0.05)",
    shadow: "rgba(0,0,0,0.6)",
    warn: "#ff9f0a",
  },
};

export const THEME_STORAGE_KEY = "punto-urbano-theme";
export const DEFAULT_THEME: ThemeMode = "dark";

export function getThemeTokens(mode: ThemeMode): ThemeTokens {
  return themes[mode];
}

const CLAVES = Object.keys(themes.dark) as (keyof ThemeTokens)[];

/** { "--pu-bg": "#0a0a0a", … } para aplicar un tema como variables CSS */
export function cssVars(mode: ThemeMode, paleta = themes, fuentes: Fuentes = fonts): Record<string, string> {
  const tokens = paleta[mode];
  const vars = CLAVES.reduce<Record<string, string>>((v, clave) => {
    v[`--pu-${clave}`] = tokens[clave];
    return v;
  }, {});
  vars["--pu-font-display"] = fuentes.display;
  vars["--pu-font-body"] = fuentes.body;
  return vars;
}

export type Fuentes = { display: string; body: string };

/* Tipografías de la página pública (la tienda usa `fontsTienda`) */
export const fonts: Fuentes = {
  display: '"Barlow Condensed", "Arial Narrow", Impact, sans-serif',
  body: '"Manrope", system-ui, -apple-system, "Segoe UI", sans-serif',
};

/* Tipografía del sistema: SF Pro en Apple, Inter / Segoe / Roboto en el resto */
const SISTEMA = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
export const fontsTienda: Fuentes = { display: SISTEMA, body: SISTEMA };

/* Texto sobre fotos con velo oscuro: igual en los dos temas */
export const FOTO = {
  texto: "#f5f5f4",
  acento: "#22c55e",
  velo: "linear-gradient(180deg, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.8) 100%)",
} as const;

/** Tokens activos: referencias a las variables CSS del tema elegido */
export const T: Record<keyof ThemeTokens, string> & Fuentes = {
  ...CLAVES.reduce((refs, clave) => {
    refs[clave] = `var(--pu-${clave})`;
    return refs;
  }, {} as Record<keyof ThemeTokens, string>),
  // Las tipografías también son variables: cada página elige las suyas
  display: `var(--pu-font-display, ${fonts.display})`,
  body: `var(--pu-font-body, ${fonts.body})`,
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
  // clip (no hidden): corta el desborde sin romper las barras position: sticky
  overflowX: "clip",
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
