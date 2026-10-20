import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Box, Button, Container, Typography } from "@mui/material";
import { FOTO, T, btnPrimario } from "./tokens";
import { irA, useSitio } from "./siteConfig";
import { Reveal } from "./Comunes";

/* Foto a todo el ancho con un desplazamiento suave al hacer scroll */
export default function Franja() {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducido = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  const sitio = useSitio();
  const { franja } = sitio;
  if (!franja) return null;

  return (
    <Box
      ref={ref}
      sx={{
        position: "relative",
        height: { xs: 420, md: 560 },
        overflow: "hidden",
        bgcolor: T.surface2,
        borderTop: `1px solid ${T.line}`,
      }}
    >
      <motion.img
        src={franja.src}
        srcSet={franja.srcSet}
        sizes="100vw"
        alt=""
        loading="lazy"
        decoding="async"
        style={{
          position: "absolute",
          left: 0,
          top: "-12%",
          width: "100%",
          height: "124%",
          objectFit: "cover",
          y: reducido ? 0 : y,
        }}
      />

      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          background: FOTO.velo,
        }}
      />

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "flex-start",
          pb: { xs: 5, md: 8 },
        }}
      >
        <Reveal>
          <Typography
            component="p"
            sx={{
              maxWidth: 900,
              fontFamily: T.display,
              fontWeight: 800,
              textTransform: "uppercase",
              lineHeight: 0.95,
              fontSize: "clamp(2.4rem, 7vw, 5rem)",
              color: FOTO.texto,
            }}
          >
            {sitio.franjaTexto ?? sitio.eslogan ?? sitio.nombre}
            <Box component="span" sx={{ color: FOTO.acento }}>
              .
            </Box>
          </Typography>

          <Button onClick={() => irA("menu")} sx={{ ...btnPrimario, mt: 3 }}>
            {sitio.textos.ver_catalogo}
          </Button>
        </Reveal>
      </Container>
    </Box>
  );
}
