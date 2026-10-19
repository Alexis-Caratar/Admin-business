import { useRef, useState } from "react";
import type { KeyboardEvent, MouseEvent } from "react";
import { Box, IconButton, Popover } from "@mui/material";
import PaletteOutlinedIcon from "@mui/icons-material/PaletteOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { T, themes } from "./tokens";
import type { ThemeMode } from "./tokens";
import { useTema } from "./Tema";

const OPCIONES: { mode: ThemeMode; nombre: string; detalle: string }[] = [
  { mode: "dark", nombre: "Oscuro", detalle: "Fondo negro, texto claro" },
  { mode: "light", nombre: "Claro", detalle: "Fondo crema, texto oscuro" },
];

/* Miniatura de la página con los colores reales de cada tema */
function Miniatura({ mode }: { mode: ThemeMode }) {
  const c = themes[mode];
  return (
    <Box
      aria-hidden
      sx={{
        width: "100%",
        height: 74,
        borderRadius: 1.5,
        overflow: "hidden",
        bgcolor: c.bg,
        border: `1px solid ${c.soft}`,
        display: "grid",
        gridTemplateRows: "1fr 22px",
      }}
    >
      <Box sx={{ p: 1, display: "grid", alignContent: "center", gap: "5px" }}>
        <Box sx={{ display: "flex", alignItems: "flex-end", gap: "3px" }}>
          <Box sx={{ width: 34, height: 7, borderRadius: 1, bgcolor: c.text }} />
          <Box
            sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: c.accent }}
          />
        </Box>
        <Box sx={{ width: 52, height: 4, borderRadius: 1, bgcolor: c.muted }} />
        <Box
          sx={{ width: 30, height: 10, borderRadius: 999, bgcolor: c.accent }}
        />
      </Box>
      <Box
        sx={{
          bgcolor: c.surface,
          borderTop: `1px solid ${c.line}`,
          display: "flex",
          alignItems: "center",
          gap: "4px",
          px: 1,
        }}
      >
        <Box sx={{ flex: 1, height: 4, borderRadius: 1, bgcolor: c.surface2 }} />
        <Box sx={{ width: 14, height: 4, borderRadius: 1, bgcolor: c.accent }} />
      </Box>
    </Box>
  );
}

/* Las dos opciones, como grupo de selección único (se usa también en el menú móvil) */
export function OpcionesDeTema() {
  const { mode, setMode } = useTema();
  const botones = useRef<(HTMLButtonElement | null)[]>([]);

  const alTeclear = (e: KeyboardEvent, indice: number) => {
    const avanzar = e.key === "ArrowRight" || e.key === "ArrowDown";
    const volver = e.key === "ArrowLeft" || e.key === "ArrowUp";
    if (!avanzar && !volver) return;

    e.preventDefault();
    const siguiente =
      (indice + (avanzar ? 1 : -1) + OPCIONES.length) % OPCIONES.length;
    setMode(OPCIONES[siguiente].mode);
    botones.current[siguiente]?.focus();
  };

  return (
    <Box
      role="radiogroup"
      aria-label="Tema de la página"
      sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.2 }}
    >
      {OPCIONES.map((o, i) => {
        const activo = mode === o.mode;
        return (
          <Box
            key={o.mode}
            component="button"
            type="button"
            role="radio"
            aria-checked={activo}
            tabIndex={activo ? 0 : -1}
            ref={(el: HTMLButtonElement | null) => {
              botones.current[i] = el;
            }}
            onClick={() => setMode(o.mode)}
            onKeyDown={(e: KeyboardEvent) => alTeclear(e, i)}
            sx={{
              display: "grid",
              gap: 1,
              p: 1,
              textAlign: "left",
              cursor: "pointer",
              borderRadius: 2.5,
              border: "2px solid",
              borderColor: activo ? T.accent : T.line,
              bgcolor: activo ? T.wash : "transparent",
              color: T.text,
              fontFamily: T.body,
              transition: "border-color .2s ease, background-color .2s ease",
              "&:hover": { borderColor: activo ? T.accent : T.soft },
              "&:focus-visible": {
                outline: `2px solid ${T.accent}`,
                outlineOffset: "3px",
              },
            }}
          >
            <Miniatura mode={o.mode} />

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                minHeight: 22,
              }}
            >
              <Box component="span" sx={{ fontWeight: 800, fontSize: 14 }}>
                {o.nombre}
              </Box>
              {activo && (
                <CheckCircleIcon
                  aria-hidden
                  sx={{ fontSize: 20, color: T.accent }}
                />
              )}
            </Box>

            <Box component="span" sx={{ fontSize: 12, color: T.muted }}>
              {o.detalle}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/* Botón con icono en la barra de navegación que abre el panel de temas */
export default function ThemeSelector() {
  const [ancla, setAncla] = useState<HTMLElement | null>(null);
  const abierto = ancla !== null;

  return (
    <>
      <IconButton
        onClick={(e: MouseEvent<HTMLElement>) => setAncla(e.currentTarget)}
        aria-label="Cambiar el tema de la página"
        aria-haspopup="dialog"
        aria-expanded={abierto}
        sx={{
          color: T.text,
          border: `1px solid ${abierto ? T.accent : T.line}`,
          width: 42,
          height: 42,
          "&:hover": { bgcolor: T.wash },
        }}
      >
        <PaletteOutlinedIcon fontSize="small" />
      </IconButton>

      <Popover
        open={abierto}
        anchorEl={ancla}
        onClose={() => setAncla(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        sx={{
          "& .MuiPopover-paper": {
            mt: 1.2,
            p: 2,
            width: 320,
            maxWidth: "calc(100vw - 32px)",
            borderRadius: 4,
            bgcolor: T.surface,
            color: T.text,
            backgroundImage: "none",
            border: `1px solid ${T.line}`,
            boxShadow: `0 20px 50px ${T.shadow}`,
          },
        }}
      >
        <Box
          component="p"
          sx={{
            m: 0,
            mb: 1.5,
            fontFamily: T.body,
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: T.muted,
          }}
        >
          Tema de la página
        </Box>
        <OpcionesDeTema />
      </Popover>
    </>
  );
}
