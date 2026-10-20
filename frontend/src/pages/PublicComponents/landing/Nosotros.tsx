import { Box, Container, Typography } from "@mui/material";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import BakeryDiningIcon from "@mui/icons-material/BakeryDining";
import LocalBarIcon from "@mui/icons-material/LocalBar";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";
import DevicesIcon from "@mui/icons-material/Devices";
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";
import CheckroomIcon from "@mui/icons-material/Checkroom";
import WorkspacePremiumIcon from "@mui/icons-material/WorkspacePremium";
import LocalPharmacyIcon from "@mui/icons-material/LocalPharmacy";
import HandymanIcon from "@mui/icons-material/Handyman";
import SpaIcon from "@mui/icons-material/Spa";
import HandshakeIcon from "@mui/icons-material/Handshake";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import type { ReactNode } from "react";
import { T } from "./tokens";
import { useSitio } from "./siteConfig";
import { Encabezado, Imagen, Reveal } from "./Comunes";

// Íconos según el tipo de negocio (perfil.iconos en tipos_negocio)
const ICONOS: Record<string, ReactNode> = {
  restaurante: <RestaurantIcon />, comida: <LocalDiningIcon />, domicilio: <DeliveryDiningIcon />,
  cafe: <LocalCafeIcon />, panaderia: <BakeryDiningIcon />, bar: <LocalBarIcon />, musica: <MusicNoteIcon />,
  reserva: <EventSeatIcon />, tienda: <StorefrontIcon />, oferta: <LocalOfferIcon />, envio: <LocalShippingIcon />,
  mercado: <ShoppingBasketIcon />, tecnologia: <DevicesIcon />, garantia: <VerifiedUserIcon />, ropa: <CheckroomIcon />,
  calidad: <WorkspacePremiumIcon />, salud: <LocalPharmacyIcon />, herramienta: <HandymanIcon />,
  belleza: <SpaIcon />, servicio: <HandshakeIcon />, agenda: <EventAvailableIcon />,
};
const POR_DEFECTO = ["tienda", "calidad", "envio"];

export default function Nosotros() {
  const sitio = useSitio();
  const iconos = sitio.iconos.length ? sitio.iconos : POR_DEFECTO;
  const PILARES = sitio.nosotrosItems.map((it, i) => ({ ...it, icono: ICONOS[iconos[i % iconos.length]] ?? ICONOS.tienda }));
  const fotos = sitio.nosotrosItems.map((it) => it.foto).filter((f) => f !== null);
  if (!PILARES.length && !sitio.descripcion) return null;
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
          <Encabezado etiqueta={sitio.textos.nosotros_etiqueta} titulo={sitio.nosotrosTitulo ?? sitio.nombre}>
            {sitio.nosotrosTexto ?? sitio.descripcion}
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
        {fotos.length > 0 && (
          <Box
            sx={{
              mt: { xs: 6, md: 10 },
              display: "grid",
              gridTemplateColumns: { xs: "1fr 1fr", md: "1.5fr 1fr 1fr" },
              gap: { xs: 1, md: 2 },
            }}
          >
            {fotos.slice(0, 3).map((foto, i) => (
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
