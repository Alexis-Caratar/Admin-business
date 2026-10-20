import { useMemo } from "react";
import type { ReactNode } from "react";
import { Box, Button, Container, Stack, Typography } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneIcon from "@mui/icons-material/Phone";
import { T, btnPrimario, btnSecundario } from "./tokens";
import { estadoHorario, useSitio, waLink } from "./siteConfig";
import { Encabezado, Reveal } from "./Comunes";

function Dato({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <Box sx={{ py: 2.5, borderTop: `1px solid ${T.line}` }}>
      <Typography
        component="h3"
        sx={{
          fontFamily: T.body,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: T.muted,
          mb: 0.8,
        }}
      >
        {titulo}
      </Typography>
      <Box sx={{ fontFamily: T.body, fontSize: 16, color: T.text }}>
        {children}
      </Box>
    </Box>
  );
}

export default function Contacto() {
  const sitio = useSitio();
  const horario = useMemo(() => estadoHorario(sitio.horarios), [sitio.horarios]);

  return (
    <Box
      component="section"
      id="contacto"
      sx={{
        py: { xs: 10, md: 16 },
        bgcolor: T.surface,
        borderTop: `1px solid ${T.line}`,
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: { xs: 2, md: 10 },
            alignItems: "start",
          }}
        >
          <Box>
            <Encabezado etiqueta={sitio.textos.contacto_etiqueta} titulo={sitio.textos.contacto_titulo}>
              {sitio.textos.contacto_texto}
            </Encabezado>

            <Reveal delay={0.1}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Button
                  href={waLink(sitio, sitio.mensajeWhatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<WhatsAppIcon />}
                  sx={btnPrimario}
                >
                  {sitio.textos.whatsapp_cta}
                </Button>

                <Button
                  href={sitio.telefonoLink ?? undefined}
                  startIcon={<PhoneIcon />}
                  sx={btnSecundario}
                >
                  Llamar al {sitio.telefono}
                </Button>
              </Stack>
            </Reveal>
          </Box>

          <Reveal delay={0.15}>
            <Box sx={{ borderBottom: `1px solid ${T.line}` }}>
              <Dato titulo="Horario">
                {sitio.horarioTexto}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mt: 0.8,
                    fontSize: 14,
                    color: horario.abierto ? T.accent : T.muted,
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
              </Dato>

              <Dato titulo="Dirección">
                <Box
                  component="a"
                  href={sitio.googleMaps ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    color: T.text,
                    textDecorationColor: T.soft,
                    textUnderlineOffset: "4px",
                    "&:hover": { color: T.accent },
                  }}
                >
                  {[sitio.direccion, sitio.ciudad].filter(Boolean).join(", ")}
                </Box>
              </Dato>

              {sitio.servicios && (
                <Dato titulo="Servicios">
                  {sitio.servicios}
                </Dato>
              )}

              {(sitio.correo || sitio.nit) && (
                <Dato titulo="Datos del negocio">
                  {[sitio.razonSocial, sitio.nit && `NIT ${sitio.nit}`, sitio.correo].filter(Boolean).join(" · ")}
                </Dato>
              )}

              {sitio.redes.length > 0 && (
                <Dato titulo="Redes">
                  <Stack direction="row" spacing={2.5} flexWrap="wrap">
                    {sitio.redes.map((r) => (
                      <Box
                        key={r.url}
                        component="a"
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: T.text,
                          textDecorationColor: T.soft,
                          textUnderlineOffset: "4px",
                          "&:hover": { color: T.accent },
                        }}
                      >
                        {r.nombre}
                      </Box>
                    ))}
                  </Stack>
                </Dato>
              )}
            </Box>
          </Reveal>
        </Box>
      </Container>
    </Box>
  );
}
