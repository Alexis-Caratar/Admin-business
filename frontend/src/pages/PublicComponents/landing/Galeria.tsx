import { Box, Container } from "@mui/material";
import { T } from "./tokens";
import { useSitio } from "./siteConfig";
import { Encabezado, Imagen, Reveal } from "./Comunes";

/*
 * Mosaico de fotos (galería del sitio). Mientras esté vacío,
 * la sección no se muestra (y tampoco su enlace en la navegación).
 */
export default function Galeria() {
  const { galeria, textos } = useSitio();
  if (galeria.length === 0) return null;

  return (
    <Box
      component="section"
      id="galeria"
      sx={{ py: { xs: 10, md: 16 }, borderTop: `1px solid ${T.line}` }}
    >
      <Container maxWidth="lg">
        <Encabezado etiqueta="Galería" titulo={textos.galeria_titulo} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gridAutoRows: { xs: 150, md: 220 },
            gridAutoFlow: "dense",
            gap: { xs: 1, md: 1.5 },
          }}
        >
          {galeria.map((foto, i) => (
            <Box
              key={foto.src}
              sx={{
                gridColumn: foto.forma === "ancha" ? "span 2" : "auto",
                gridRow: foto.forma === "alta" ? "span 2" : "auto",
                overflow: "hidden",
                borderRadius: 3,
                bgcolor: T.surface2,
                "& > div": { height: "100%" },
              }}
            >
              <Reveal delay={(i % 4) * 0.06}>
                <Imagen foto={foto} sizes="(min-width: 900px) 50vw, 100vw" zoom />
              </Reveal>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
