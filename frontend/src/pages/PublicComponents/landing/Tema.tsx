import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  cssVars,
  estilosRaiz,
  fonts,
  getThemeTokens,
} from "./tokens";
import type { ThemeMode, ThemeTokens } from "./tokens";

type ContextoTema = {
  mode: ThemeMode;
  /** Valores reales del tema activo (para mapas, canvas, etc.) */
  tokens: ThemeTokens;
  setMode: (mode: ThemeMode) => void;
};

const Contexto = createContext<ContextoTema | null>(null);

// En el servidor no existe useLayoutEffect; en el navegador evita el parpadeo
const useEfectoAntesDePintar =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function leerTemaGuardado(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const guardado = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (guardado === "dark" || guardado === "light") return guardado;
  } catch {
    // Almacenamiento bloqueado: se usa el tema por defecto.
  }
  return DEFAULT_THEME;
}

/*
 * Envuelve la página pública: lee la preferencia guardada, aplica el tema
 * como variables CSS y lo entrega también a los componentes de MUI.
 */
export function TemaPuntoUrbano({ children }: { children: ReactNode }) {
  // Se lee de inmediato, así el primer pintado ya sale con el tema correcto
  const [mode, setModeState] = useState<ThemeMode>(leerTemaGuardado);
  const [cambiando, setCambiando] = useState(false);
  const temporizador = useRef<number | null>(null);

  const tokens = getThemeTokens(mode);
  const vars = useMemo(() => cssVars(mode), [mode]);

  const modoActual = useRef(mode);
  modoActual.current = mode;

  const setMode = useCallback((nuevo: ThemeMode) => {
    if (modoActual.current === nuevo) return;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nuevo);
    } catch {
      // Sin almacenamiento: el cambio vale para esta visita.
    }

    // Activa la transición de colores solo mientras dura el cambio
    setCambiando(true);
    if (temporizador.current !== null) {
      window.clearTimeout(temporizador.current);
    }
    temporizador.current = window.setTimeout(() => setCambiando(false), 450);

    setModeState(nuevo);
  }, []);

  // Las variables van también en <html> para que lleguen a menús y paneles
  // flotantes, que MUI dibuja fuera del contenedor de la página.
  useEfectoAntesDePintar(() => {
    const raiz = document.documentElement;
    Object.entries(vars).forEach(([clave, valor]) =>
      raiz.style.setProperty(clave, valor)
    );
    const esquemaAnterior = raiz.style.colorScheme;
    raiz.style.colorScheme = mode;

    return () => {
      Object.keys(vars).forEach((clave) => raiz.style.removeProperty(clave));
      raiz.style.colorScheme = esquemaAnterior;
    };
  }, [vars, mode]);

  useEffect(
    () => () => {
      if (temporizador.current !== null) {
        window.clearTimeout(temporizador.current);
      }
    },
    []
  );

  const temaMui = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: tokens.accent,
            dark: mode === "dark" ? tokens.accent : tokens.accentHover,
            light: mode === "dark" ? tokens.accentHover : tokens.accent,
            contrastText: tokens.accentInk,
          },
          background: { default: tokens.bg, paper: tokens.surface },
          text: { primary: tokens.text, secondary: tokens.muted },
          divider: tokens.line,
        },
        typography: { fontFamily: fonts.body },
      }),
    [mode, tokens]
  );

  const valor = useMemo(
    () => ({ mode, tokens, setMode }),
    [mode, tokens, setMode]
  );

  return (
    <Contexto.Provider value={valor}>
      <ThemeProvider theme={temaMui}>
        <Box
          className={cambiando ? "pu-cambiando" : undefined}
          data-tema={mode}
          sx={{ ...estilosRaiz, ...vars }}
        >
          {children}
        </Box>
      </ThemeProvider>
    </Contexto.Provider>
  );
}

export function useTema(): ContextoTema {
  const ctx = useContext(Contexto);
  if (!ctx) {
    throw new Error("useTema debe usarse dentro de <TemaPuntoUrbano>");
  }
  return ctx;
}
