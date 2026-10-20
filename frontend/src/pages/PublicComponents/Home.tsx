import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { useSitio } from "./landing/siteConfig";
import SitioProvider from "./landing/SitioProvider";
import { useSeo } from "./landing/useSeo";
import Ubicacion from "./Ubicacion";

/* /:negocio → por url_negocio; / → por dominio (o el negocio por defecto en local) */
export default function Home() {
  const { negocio } = useParams();
  return (
    <SitioProvider negocio={negocio}>
      <PaginaNegocio />
    </SitioProvider>
  );
}

function PaginaNegocio() {
  const navigate = useNavigate();
  const sitio = useSitio();

  useSeo();

  // Solo se enlazan secciones que existen de verdad
  const enlaces = useMemo<Enlace[]>(
    () => [
      { id: "inicio", label: "Inicio" },
      ...(sitio.nosotrosItems.length > 0 || sitio.descripcion ? [{ id: "nosotros", label: sitio.textos.nosotros_etiqueta }] : []),
      { id: "menu", label: sitio.textos.seccion_catalogo },
      ...(sitio.galeria.length > 0 ? [{ id: "galeria", label: "Galería" }] : []),
      ...(sitio.lat !== null && sitio.lng !== null ? [{ id: "ubicacion", label: "Cómo llegar" }] : []),
      { id: "contacto", label: "Contacto" },
    ],
    [sitio]
  );

  return (
    <>
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
    </>
  );
}
