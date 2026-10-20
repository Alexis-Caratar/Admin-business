import { useEffect, useState } from "react";
import type { MouseEvent } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, Drawer, IconButton } from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import ScheduleOutlinedIcon from "@mui/icons-material/ScheduleOutlined";
import { T, btnPrimario } from "./tokens";
import { horarioDeHoy, irA, useSitio, waLink } from "./siteConfig";
import ThemeSelector, { OpcionesDeTema } from "./ThemeSelector";

export type Enlace = { id: string; label: string };

export default function NavBar({
  logo,
  enlaces,
}: {
  logo: string;
  enlaces: Enlace[];
}) {
  const sitio = useSitio();
  const [conFondo, setConFondo] = useState(false);
  const [activo, setActivo] = useState(enlaces[0]?.id ?? "");
  const [abierto, setAbierto] = useState(false);

  /* La barra gana fondo al bajar */
  useEffect(() => {
    const alBajar = () => setConFondo(window.scrollY > 24);
    alBajar();
    window.addEventListener("scroll", alBajar, { passive: true });
    return () => window.removeEventListener("scroll", alBajar);
  }, []);

  /* Sección activa: la que cruza el centro de la pantalla */
  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) setActivo(e.target.id);
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );

    enlaces.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observador.observe(el);
    });

    return () => observador.disconnect();
  }, [enlaces]);

  const navegar = (e: MouseEvent, id: string) => {
    e.preventDefault();
    setAbierto(false);
    // Espera a que cierre el menú móvil antes de desplazar
    window.setTimeout(() => irA(id), abierto ? 220 : 0);
  };

  return (
    <Box
      component="header"
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        transition: "background-color .3s ease, border-color .3s ease",
        bgcolor: conFondo ? T.navBg : "transparent",
        backdropFilter: conFondo ? "blur(14px)" : "none",
        borderBottom: "1px solid",
        borderColor: conFondo ? T.line : "transparent",
      }}
    >
      {/* DATOS DEL NEGOCIO (desde la base de datos); se ocultan al bajar */}
      <Box
        sx={{
          display: { xs: "none", md: conFondo ? "none" : "block" },
          borderBottom: `1px solid ${T.line}`,
          fontFamily: T.body,
          fontSize: 12.5,
          color: T.muted,
        }}
      >
        <Container maxWidth="lg" sx={{ height: 34, display: "flex", alignItems: "center", gap: 3, overflow: "hidden", whiteSpace: "nowrap" }}>
          {sitio.direccion && (
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
              <PlaceOutlinedIcon sx={{ fontSize: 15 }} />
              {[sitio.direccion, sitio.ciudad].filter(Boolean).join(", ")}
            </Box>
          )}
          {sitio.horarios.length > 0 && (
            <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: 0.6 }}>
              <ScheduleOutlinedIcon sx={{ fontSize: 15 }} />
              {horarioDeHoy(sitio.horarios)}
            </Box>
          )}
          <Box sx={{ flex: 1 }} />
          {sitio.telefono && (
            <Box component="a" href={sitio.telefonoLink ?? undefined} sx={{ display: "inline-flex", alignItems: "center", gap: 0.6, color: "inherit", textDecoration: "none", "&:hover": { color: T.text } }}>
              <PhoneOutlinedIcon sx={{ fontSize: 15 }} />
              {sitio.telefono}
            </Box>
          )}
          {sitio.nit && <Box component="span">{sitio.razonSocial} · NIT {sitio.nit}</Box>}
        </Container>
      </Box>

      <Container
        maxWidth="lg"
        sx={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        {/* MARCA */}
        <Box
          component="a"
          href="#inicio"
          onClick={(e: MouseEvent) => navegar(e, "inicio")}
          aria-label={`${sitio.nombre}, ir al inicio`}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            textDecoration: "none",
            color: T.text,
          }}
        >
          <Box
            component="img"
            src={sitio.logo || logo}
            alt=""
            width={40}
            height={40}
            sx={{ borderRadius: "50%", objectFit: "cover" }}
          />
          <Box
            component="span"
            sx={{
              fontFamily: T.display,
              fontWeight: 800,
              fontSize: 22,
              textTransform: "uppercase",
              letterSpacing: "0.02em",
            }}
          >
            {sitio.nombre}
          </Box>
        </Box>

        {/* ENLACES ESCRITORIO */}
        <Box
          component="nav"
          aria-label="Secciones"
          sx={{ display: { xs: "none", md: "flex" }, gap: 3.5 }}
        >
          {enlaces.map(({ id, label }) => (
            <Box
              key={id}
              component="a"
              href={`#${id}`}
              onClick={(e: MouseEvent) => navegar(e, id)}
              aria-current={activo === id ? "true" : undefined}
              sx={{
                position: "relative",
                py: 1,
                fontFamily: T.body,
                fontSize: 14,
                fontWeight: 600,
                textDecoration: "none",
                color: activo === id ? T.text : T.muted,
                transition: "color .2s ease",
                "&:hover": { color: T.text },
                "&::after": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 2,
                  bgcolor: T.accent,
                  transformOrigin: "left",
                  transform: activo === id ? "scaleX(1)" : "scaleX(0)",
                  transition: "transform .3s ease",
                },
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ThemeSelector />

          <Button
            {...(sitio.tiendaActiva
              ? { component: RouterLink, to: `${sitio.base}/tienda`, startIcon: <ShoppingBagOutlinedIcon /> }
              : { href: waLink(sitio, sitio.mensajeWhatsapp), target: "_blank", rel: "noopener noreferrer", startIcon: <WhatsAppIcon /> })}
            sx={{
              ...btnPrimario,
              display: { xs: "none", sm: "inline-flex" },
              minHeight: 42,
              py: 0.8,
              px: 2.5,
              fontSize: 14,
            }}
          >
            {sitio.textos.pedir_corto}
          </Button>

          <IconButton
            onClick={() => setAbierto(true)}
            aria-label="Abrir menú de navegación"
            sx={{ display: { md: "none" }, color: T.text }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Container>

      {/* MENÚ MÓVIL */}
      <Drawer
        anchor="top"
        open={abierto}
        onClose={() => setAbierto(false)}
        sx={{
          display: { md: "none" },
          "& .MuiDrawer-paper": {
            bgcolor: T.bg,
            color: T.text,
            backgroundImage: "none",
            minHeight: "100%",
            px: 3,
            pb: 4,
          },
        }}
      >
        <Box
          sx={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <IconButton
            onClick={() => setAbierto(false)}
            aria-label="Cerrar menú de navegación"
            sx={{ color: T.text }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <Box component="nav" aria-label="Secciones">
          {enlaces.map(({ id, label }) => (
            <Box
              key={id}
              component="a"
              href={`#${id}`}
              onClick={(e: MouseEvent) => navegar(e, id)}
              sx={{
                display: "block",
                py: 1.6,
                borderBottom: `1px solid ${T.line}`,
                fontFamily: T.display,
                fontWeight: 800,
                fontSize: 40,
                lineHeight: 1,
                textTransform: "uppercase",
                textDecoration: "none",
                color: activo === id ? T.accent : T.text,
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        <Box sx={{ mt: 4 }}>
          <OpcionesDeTema />
        </Box>

        <Button
          href={waLink(sitio, sitio.mensajeWhatsapp)}
          target="_blank"
          rel="noopener noreferrer"
          startIcon={<WhatsAppIcon />}
          sx={{ ...btnPrimario, mt: 3, width: "100%" }}
        >
          {sitio.textos.whatsapp_cta}
        </Button>
      </Drawer>
    </Box>
  );
}
