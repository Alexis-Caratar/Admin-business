import { Box, Container, Fab } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { T } from "./tokens";
import { useSitio, waLink } from "./siteConfig";

export function Pie({ onAcceso }: { onAcceso: () => void }) {
  const sitio = useSitio();
  return (
    <Box
      component="footer"
      sx={{ borderTop: `1px solid ${T.line}`, py: { xs: 5, md: 6 } }}
    >
      <Container
        maxWidth="lg"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          gap: 2,
          fontFamily: T.body,
          fontSize: 14,
          color: T.muted,
          // Deja libre la esquina del botón flotante de WhatsApp
          pr: { md: 12 },
          pb: { xs: 8, md: 0 },
        }}
      >
        <Box>
          © {new Date().getFullYear()} {sitio.nombre}{sitio.ciudad ? ` · ${sitio.ciudad}` : ""}{sitio.nit ? ` · NIT ${sitio.nit}` : ""}
          <br />
          Enterprise Software by Eng. Alexis Caratar
        </Box>

        <Box
          component="button"
          type="button"
          onClick={onAcceso}
          sx={{
            alignSelf: { xs: "flex-start", md: "center" },
            p: 0,
            minHeight: 44,
            border: 0,
            bgcolor: "transparent",
            cursor: "pointer",
            fontFamily: T.body,
            fontSize: 14,
            fontWeight: 700,
            color: T.text,
            "&:hover": { color: T.accent },
          }}
        >
          Acceso al sistema →
        </Box>
      </Container>
    </Box>
  );
}

export function BotonWhatsApp() {
  const sitio = useSitio();
  if (!sitio.whatsapp) return null;
  return (
    <Fab
      component="a"
      href={waLink(sitio, sitio.mensajeWhatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Escribir a ${sitio.nombre} por WhatsApp`}
      sx={{
        position: "fixed",
        right: { xs: 16, md: 24 },
        bottom: { xs: 16, md: 24 },
        zIndex: 1050,
        width: 60,
        height: 60,
        bgcolor: T.accent,
        color: T.accentInk,
        boxShadow: `0 10px 30px ${T.shadow}`,
        transition: "transform .2s ease, background-color .2s ease",
        "&:hover": { bgcolor: T.accentHover, transform: "scale(1.06)" },
      }}
    >
      <WhatsAppIcon sx={{ fontSize: 32 }} />
    </Fab>
  );
}
