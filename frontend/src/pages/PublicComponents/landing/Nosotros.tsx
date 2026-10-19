import { Box, Container, Typography } from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import { T } from "./tokens";
import { SITE } from "./siteConfig";
import { Encabezado, Imagen, Reveal } from "./Comunes";

/* Textos tomados del sitio actual, sin añadir datos nuevos */
const PILARES = [
  {
    icono: <RestaurantIcon />,
    titulo: "Comida urbana",
    texto: "Sabores intensos con identidad local.",
  },
  {
    icono: <LocalDiningIcon />,
    titulo: "Ambiente moderno",
    texto: "Diseño pensado para una experiencia única.",
  },
  {
    icono: <DeliveryDiningIcon />,
    titulo: "Domicilios rápidos",
    texto: "Llevamos el sabor hasta tu puerta.",
  },
];

export default function Nosotros() {
  return (
    <Box
      component="section"
      id="nosotros"
      sx={{ py: { xs: 10, md: 16 }, borderTop: `1px solid ${T.line}` }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: { xs: 2, md: 10 },
            alignItems: "end",
          }}
        >
          <Encabezado etiqueta="Nuestro restaurante" titulo="Sabor de ciudad">
            En Punto Urbano combinamos hamburguesas artesanales, comida rápida
            premium y una experiencia moderna en el corazón de Pasto.
          </Encabezado>

          <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mb: { md: 7 } }}>
            {PILARES.map((p, i) => (
              <Reveal key={p.titulo} delay={i * 0.08}>
                <Box
                  component="li"
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "44px 1fr",
                    gap: 2,
                    alignItems: "start",
                    py: 3,
                    borderTop: `1px solid ${T.line}`,
                    transition: "padding-left .3s ease",
                    "&:hover": { pl: 1.5 },
                    "&:hover .pu-icono": { color: T.accent },
                  }}
                >
                  <Box
                    className="pu-icono"
                    aria-hidden
                    sx={{
                      color: T.muted,
                      transition: "color .3s ease",
                      "& svg": { fontSize: 30 },
                    }}
                  >
                    {p.icono}
                  </Box>

                  <Box>
                    <Typography
                      component="h3"
                      sx={{
                        fontFamily: T.display,
                        fontWeight: 700,
                        fontSize: 28,
                        lineHeight: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      {p.titulo}
                    </Typography>
                    <Typography
                      sx={{
                        mt: 0.8,
                        fontFamily: T.body,
                        fontSize: 15,
                        color: T.muted,
                      }}
                    >
                      {p.texto}
                    </Typography>
                  </Box>
                </Box>
              </Reveal>
            ))}
          </Box>
        </Box>

        {/* COLLAGE: una foto grande y dos escalonadas */}
        {SITE.nosotros.length > 0 && (
          <Box
            sx={{
              mt: { xs: 6, md: 10 },
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "1.5fr 1fr 1fr" },
              gap: { xs: 1, md: 2 },
            }}
          >
            {SITE.nosotros.slice(0, 3).map((foto, i) => (
              <Box
                key={foto.src}
                sx={{
                  gridColumn: { xs: i === 0 ? "1 / -1" : "auto", md: "auto" },
                  mt: { md: i === 1 ? 8 : i === 2 ? 3 : 0 },
                }}
              >
                <Reveal delay={i * 0.1}>
                  <Box
                    sx={{
                      height: { xs: i === 0 ? 240 : 180, md: i === 0 ? 480 : 400 },
                      overflow: "hidden",
                      borderRadius: 3,
                      bgcolor: T.surface2,
                    }}
                  >
                    <Imagen
                      foto={foto}
                      sizes="(min-width: 900px) 40vw, 100vw"
                      zoom
                    />
                  </Box>
                </Reveal>
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}
