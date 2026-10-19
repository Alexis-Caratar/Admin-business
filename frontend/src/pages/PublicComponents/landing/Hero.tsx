import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box, Button, Container, Stack } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import { T, btnPrimario, btnSecundario } from "./tokens";
import { SITE, estadoHorario, irA, waLink } from "./siteConfig";
import { Punto } from "./Comunes";

/* Las mismas frases que ya usaba el sitio */
const FRASES = [
  "Restaurante en el corazón de Pasto",
  "Hamburguesas artesanales, carnes y experiencias únicas",
  "Buen ambiente, buena música y el mejor sabor",
  "Donde cada comida se convierte en experiencia",
];

const coordenadas = `${SITE.lat.toFixed(4)}° N · ${Math.abs(SITE.lng).toFixed(
  4
)}° O`;

export default function Hero({ logo }: { logo: string }) {
  const reducido = useReducedMotion();
  const [frase, setFrase] = useState(0);
  const horario = useMemo(() => estadoHorario(), []);

  useEffect(() => {
    if (reducido) return undefined;
    const t = window.setInterval(
      () => setFrase((p) => (p + 1) % FRASES.length),
      3800
    );
    return () => window.clearInterval(t);
  }, [reducido]);

  const entrada = (orden: number) =>
    reducido
      ? {}
      : {
          initial: { opacity: 0, y: 36 },
          animate: { opacity: 1, y: 0 },
          transition: {
            duration: 0.9,
            delay: 0.15 + orden * 0.12,
            ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
          },
        };

  return (
    <Box
      component="section"
      id="inicio"
      sx={{
        position: "relative",
        minHeight: "100vh",
        "@supports (min-height: 100svh)": { minHeight: "100svh" },
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: T.bg,
      }}
    >
      {/* FONDO: tu foto real si existe; si no, una trama de calles */}
      {SITE.hero ? (
        <>
          <Box
            component="img"
            src={SITE.hero.src}
            srcSet={SITE.hero.srcSet}
            sizes="100vw"
            alt=""
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
          <Box
            aria-hidden
            sx={{
              position: "absolute",
              inset: 0,
              background: T.heroOverlay,
            }}
          />
        </>
      ) : (
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            inset: "-20%",
            transform: "rotate(-14deg)",
            backgroundImage:
              `repeating-linear-gradient(0deg, ${T.pattern} 0 1px, transparent 1px 88px), repeating-linear-gradient(90deg, ${T.pattern} 0 1px, transparent 1px 132px)`,
            maskImage:
              "radial-gradient(ellipse at 75% 40%, #000 0%, transparent 62%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at 75% 40%, #000 0%, transparent 62%)",
          }}
        />
      )}

      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          alignItems: "center",
          pt: { xs: 13, md: 14 },
          pb: { xs: 5, md: 6 },
        }}
      >
        <Box
          sx={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr auto" },
            alignItems: "center",
            gap: { xs: 4, md: 6 },
          }}
        >
          <Box>
            <motion.div {...entrada(0)}>
              <Box
                component="h1"
                sx={{
                  m: 0,
                  fontFamily: T.display,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  color: T.text,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1.2,
                    mb: { xs: 1.5, md: 2 },
                    fontFamily: T.body,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.16em",
                    color: T.muted,
                  }}
                >
                  <Punto size={8} />
                  Restaurante · {SITE.ciudad}
                </Box>

                <Box
                  component="span"
                  sx={{
                    display: "block",
                    fontSize: "clamp(4.6rem, min(21vw, 30vh), 15rem)",
                    lineHeight: 0.8,
                    letterSpacing: "-0.02em",
                  }}
                >
                  Punto
                  <br />
                  Urbano
                  <Box component="span" sx={{ color: T.accent }}>
                    .
                  </Box>
                </Box>
              </Box>
            </motion.div>

            {/* FRASE ROTATIVA */}
            <motion.div {...entrada(1)}>
              <Box
                sx={{
                  mt: { xs: 3, md: 4 },
                  minHeight: { xs: 56, md: 34 },
                  maxWidth: 560,
                  fontFamily: T.body,
                  fontSize: { xs: 17, md: 20 },
                  lineHeight: 1.5,
                  color: T.text2,
                }}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.p
                    key={frase}
                    style={{ margin: 0 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.45 }}
                  >
                    {FRASES[frase]}
                  </motion.p>
                </AnimatePresence>
              </Box>
            </motion.div>

            {/* BOTONES */}
            <motion.div {...entrada(2)}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{ mt: { xs: 3, md: 4 } }}
              >
                <Button
                  onClick={() => irA("menu")}
                  endIcon={<ArrowDownwardIcon />}
                  sx={btnPrimario}
                >
                  Ver el menú
                </Button>

                <Button
                  href={waLink("Hola Punto Urbano, quiero hacer un pedido.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<WhatsAppIcon />}
                  sx={btnSecundario}
                >
                  Pedir por WhatsApp
                </Button>
              </Stack>
            </motion.div>
          </Box>

          {/* LOGO */}
          <motion.div {...entrada(1)}>
            <Box
              sx={{
                position: "relative",
                // En móvil el logo ya está en la barra superior
                display: { xs: "none", md: "block" },
                width: 280,
                height: 280,
              }}
            >
              <Box
                aria-hidden
                sx={{
                  position: "absolute",
                  inset: -18,
                  borderRadius: "50%",
                  border: `1px dashed ${T.line}`,
                  animation: "puGiro 60s linear infinite",
                  "@keyframes puGiro": { to: { transform: "rotate(360deg)" } },
                }}
              />
              <Box
                component="img"
                src={logo}
                alt={`Logo de ${SITE.nombre}`}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "50%",
                  border: `1px solid ${T.line}`,
                }}
              />
            </Box>
          </motion.div>
        </Box>
      </Container>

      {/* FRANJA INFERIOR: datos reales */}
      <Box sx={{ position: "relative", borderTop: `1px solid ${T.line}` }}>
        <Container
          maxWidth="lg"
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: { xs: 1, md: 3 },
            py: { xs: 2, md: 2.5 },
            fontFamily: T.body,
            fontSize: 14,
            color: T.muted,
          }}
        >
          <Box
            component="a"
            href="#ubicacion"
            onClick={(e: MouseEvent) => {
              e.preventDefault();
              irA("ubicacion");
            }}
            sx={{
              color: T.text,
              textDecoration: "none",
              "&:hover": { color: T.accent },
            }}
          >
            {SITE.direccion}
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              justifyContent: { md: "center" },
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: horario.abierto ? T.accent : T.off,
              }}
            />
            {horario.texto}
          </Box>

          <Box
            sx={{
              textAlign: { md: "right" },
              fontVariantNumeric: "tabular-nums",
              letterSpacing: "0.04em",
            }}
          >
            {coordenadas}
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
