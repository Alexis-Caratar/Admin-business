import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { Box, Button, Container, Typography } from "@mui/material";
import { FOTO, T, btnPrimario } from "./tokens";
import { SITE, irA } from "./siteConfig";
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

  if (!SITE.franja) return null;

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
        src={SITE.franja.src}
        srcSet={SITE.franja.srcSet}
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
            Buen ambiente, buena música y el mejor sabor
            <Box component="span" sx={{ color: FOTO.acento }}>
              .
            </Box>
          </Typography>

          <Button onClick={() => irA("menu")} sx={{ ...btnPrimario, mt: 3 }}>
            Ver el menú
          </Button>
        </Reveal>
      </Container>
    </Box>
  );
}
