import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

import logo from "./../../assets/img/img_puntourbano/logosinfondo.jpeg";

import NavBar from "./landing/NavBar";
import type { Enlace } from "./landing/NavBar";
import Hero from "./landing/Hero";
import Nosotros from "./landing/Nosotros";
import Menu from "./landing/Menu";
import Franja from "./landing/Franja";
import Galeria from "./landing/Galeria";
import Contacto from "./landing/Contacto";
import { BotonWhatsApp, Pie } from "./landing/Pie";
import { SITE } from "./landing/siteConfig";
import { TemaPuntoUrbano } from "./landing/Tema";
import { useSeo } from "./landing/useSeo";
import Ubicacion from "./Ubicacion";

export default function Home() {
  const navigate = useNavigate();

  useSeo();

  // Solo se enlazan secciones que existen de verdad
  const enlaces = useMemo<Enlace[]>(
    () => [
      { id: "inicio", label: "Inicio" },
      { id: "nosotros", label: "Nuestro restaurante" },
      { id: "menu", label: "Menú" },
      ...(SITE.galeria.length > 0 ? [{ id: "galeria", label: "Galería" }] : []),
      { id: "ubicacion", label: "Cómo llegar" },
      { id: "contacto", label: "Contacto" },
    ],
    []
  );

  return (
    <TemaPuntoUrbano>
      <NavBar logo={logo} enlaces={enlaces} />

      <Box component="main">
        <Hero logo={logo} />
        <Nosotros />
        <Menu />
        <Franja />
        <Galeria />
        <Ubicacion />
        <Contacto />
      </Box>

      <Pie onAcceso={() => navigate("/login")} />
      <BotonWhatsApp />
    </TemaPuntoUrbano>
  );
}
