/*
 * Estante horizontal: fila deslizable con "imán" por tarjeta, botones
 * anterior/siguiente en escritorio y desplazamiento táctil en celular.
 */
import { Children, useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { T } from "../landing/tokens";
import { titulo as estiloTitulo } from "./estilo";
import { Aparecer } from "./Animaciones";

/** "Destacados." en negro + subtítulo gris en la misma línea */
export function TituloSeccion({ titulo, subtitulo, id }: { titulo: string; subtitulo?: string; id?: string }) {
  return (
    <Typography id={id} component="h2" sx={{ ...estiloTitulo(24, 32), maxWidth: 820 }}>
      {titulo}{subtitulo && <Box component="span" sx={{ color: T.muted }}> {subtitulo}</Box>}
    </Typography>
  );
}

export default function Estante({ titulo, subtitulo, id, ancho = { xs: 240, md: 290 }, children }: {
  titulo: string; subtitulo?: string; id: string; ancho?: { xs: number; md: number }; children: ReactNode;
}) {
  const fila = useRef<HTMLDivElement | null>(null);
  const reducido = useReducedMotion();
  const [bordes, setBordes] = useState({ inicio: true, fin: false });

  const medir = useCallback(() => {
    const el = fila.current;
    if (!el) return;
    setBordes({ inicio: el.scrollLeft <= 4, fin: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    const el = fila.current;
    if (!el) return;
    const o = new ResizeObserver(medir);
    o.observe(el);
    return () => o.disconnect();
  }, [medir]);

  const mover = (dir: number) => {
    const el = fila.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reducido ? "auto" : "smooth" });
  };

  const items = Children.toArray(children);
  return (
    <Box component="section" aria-labelledby={id} sx={{ mt: { xs: 5, md: 8 } }}>
      <TituloSeccion id={id} titulo={titulo} subtitulo={subtitulo} />
      <Box ref={fila} onScroll={medir} role="list"
        sx={{
          display: "flex", gap: { xs: 1.75, md: 2.5 }, overflowX: "auto", scrollSnapType: "x mandatory", overscrollBehaviorX: "contain",
          mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, pt: 3, pb: 4, scrollPaddingInline: { xs: 16, sm: 24 },
          scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" },
        }}>
        {items.map((hijo, i) => (
          <Box key={i} role="listitem" sx={{ flex: "0 0 auto", width: ancho, scrollSnapAlign: "start" }}>
            <Aparecer retraso={Math.min(i, 6) * 0.05}>{hijo}</Aparecer>
          </Box>
        ))}
      </Box>
      {items.length > 2 && (
        <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ display: { xs: "none", md: "flex" }, mt: -1 }}>
          {[-1, 1].map((d) => (
            <IconButton key={d} onClick={() => mover(d)} disabled={d < 0 ? bordes.inicio : bordes.fin} aria-label={d < 0 ? "Anterior" : "Siguiente"}
              sx={{ width: 36, height: 36, bgcolor: T.wash, color: T.text, transition: "background-color .2s ease, opacity .2s ease",
                "&:hover": { bgcolor: `color-mix(in srgb, ${T.text} 12%, transparent)` }, "&.Mui-disabled": { opacity: 0.35, color: T.text } }}>
              {d < 0 ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          ))}
        </Stack>
      )}
    </Box>
  );
}
