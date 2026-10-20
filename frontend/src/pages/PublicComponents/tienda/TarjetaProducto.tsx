/*
 * Tarjeta de producto (catálogo, destacados y relacionados).
 * La imagen y el nombre llevan a la ficha; el botón agrega directo si el
 * producto no tiene opciones ni variantes (si las tiene, abre la ficha).
 */
import { useRef, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box, Button, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import CheckIcon from "@mui/icons-material/Check";
import TuneIcon from "@mui/icons-material/Tune";

import { T } from "../landing/tokens";
import { btnPrimario, etiquetaNaranja, tarjeta, titulo } from "./estilo";
import { capitalizar } from "../landing/useMenu";
import { useSitio } from "../landing/siteConfig";
import { pesos } from "./api";
import type { PlatoTienda } from "./api";
import { useCarrito } from "./carritoContexto";
import { useMarco } from "./marcoContexto";
import { descuento, fotoDe, rutaProducto } from "./util";

export default function TarjetaProducto({ plato, variantes = [], habilitado }: { plato: PlatoTienda; variantes?: PlatoTienda[]; habilitado: boolean }) {
  const sitio = useSitio();
  const { lineas, agregar, cambiarCantidad } = useCarrito();
  const { volar } = useMarco();
  const navigate = useNavigate();
  const reducido = useReducedMotion();
  // Si la foto no carga, la tarjeta muestra las iniciales (no un cuadro en blanco)
  const [fotoFallida, setFotoFallida] = useState(false);
  const imagen = fotoFallida ? undefined : fotoDe(plato, sitio.mostrarFotosDeProductos);
  const conOpciones = plato.productos_complementos.length > 0 || variantes.length > 1;
  const ruta = rutaProducto(sitio.base, plato);
  // Producto simple ya en el carrito: contador directo en la tarjeta
  const enCarrito = conOpciones ? undefined : lineas.find((l) => l.clave === `${plato.id}:`);
  const idsGrupo = new Set([plato.id, ...variantes.map((v) => v.id)]);
  const unidadesGrupo = conOpciones ? lineas.filter((l) => idsGrupo.has(l.id_producto)).reduce((a, l) => a + l.cantidad, 0) : 0;
  const boton = useRef<HTMLButtonElement | null>(null);
  const [recien, setRecien] = useState(false);
  const pocas = plato.stock_actual !== null && plato.stock_actual <= 5;
  const maximo = plato.stock_actual ?? 50;
  const pct = descuento(plato.precio_venta, plato.precio_anterior);
  const colores = variantes.filter((v) => v.variante_color || v.variante_nombre);

  const accion = () => {
    if (conOpciones) return navigate(ruta);
    agregar({ id_producto: plato.id, nombre: capitalizar(plato.nombre), imagen: plato.imagenes[0], precio: plato.precio_venta, cantidad: 1, opciones: [] });
    volar(boton.current, imagen);
    setRecien(true);
    window.setTimeout(() => setRecien(false), 1200);
  };

  const etiqueta = pct > 0 ? `Ahorra ${pct} %` : pocas ? `¡Últimas ${plato.stock_actual}!` : plato.destacado ? "Destacado" : null;

  return (
    <motion.article whileHover={reducido ? undefined : { scale: 1.015 }} transition={{ type: "spring", stiffness: 260, damping: 24 }} style={{ height: "100%" }}>
      <Box sx={{
        ...tarjeta, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", position: "relative",
        outline: enCarrito || unidadesGrupo ? `2px solid ${T.accent}` : "2px solid transparent", transition: `${tarjeta.transition}, outline-color .25s ease`,
        "&:hover .pu-img": { transform: reducido ? "none" : "scale(1.05)" },
      }}>
        <Box component={RouterLink} to={ruta} aria-label={`Ver ${plato.nombre}`}
          sx={{ position: "relative", display: "block", aspectRatio: "1 / 1", overflow: "hidden", bgcolor: imagen ? "#ffffff" : T.surface2 }}>
          {imagen ? (
            // contain: el producto se ve completo sobre fondo limpio
            <Box className="pu-img" component="img" src={imagen} alt={plato.nombre} loading="lazy" decoding="async" width={600} height={600}
              onError={() => setFotoFallida(true)}
              sx={{ width: "100%", height: "100%", objectFit: "contain", p: "9%", display: "block", transition: "transform .8s cubic-bezier(.22,1,.36,1)" }} />
          ) : (
            <Box className="pu-img" sx={{ height: "100%", display: "grid", placeItems: "center", color: T.muted, transition: "transform .8s cubic-bezier(.22,1,.36,1)" }}>
              <Typography sx={{ ...titulo(44, 60), color: T.muted, opacity: 0.4 }}>{capitalizar(plato.nombre).slice(0, 2)}</Typography>
            </Box>
          )}
          {plato.productos_complementos.length > 0 && (
            <Box sx={{ position: "absolute", top: 12, left: 12, px: 1.1, py: 0.35, borderRadius: 999, fontSize: 11.5, fontWeight: 500, bgcolor: T.glass, color: T.text, backdropFilter: "blur(10px)", display: "flex", alignItems: "center", gap: 0.4 }}>
              <TuneIcon sx={{ fontSize: 13 }} /> Personalizable
            </Box>
          )}
          <AnimatePresence>
            {unidadesGrupo > 0 && (
              <motion.div initial={reducido ? false : { scale: 0 }} animate={{ scale: 1 }} exit={reducido ? undefined : { scale: 0 }}
                style={{ position: "absolute", top: 12, right: 12 }}>
                <Box sx={{ minWidth: 24, height: 24, px: 0.7, borderRadius: 999, display: "grid", placeItems: "center", fontSize: 12, fontWeight: 600, bgcolor: T.accent, color: T.accentInk }}>
                  {unidadesGrupo}
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>

        <Box sx={{ px: { xs: 1.75, md: 2.5 }, pt: { xs: 1.5, md: 2 }, pb: { xs: 1.75, md: 2.5 }, display: "flex", flexDirection: "column", gap: 0.4, flex: 1 }}>
          {/* Muestras de color / variantes */}
          {colores.length > 1 && (
            <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mb: 0.5 }}>
              {colores.slice(0, 6).map((v) => (
                <Tooltip key={v.id} title={v.variante_nombre ?? v.nombre}>
                  <Box component={RouterLink} to={rutaProducto(sitio.base, v)} aria-label={v.variante_nombre ?? v.nombre}
                    sx={{ width: 12, height: 12, borderRadius: "50%", boxShadow: `inset 0 0 0 1px ${T.soft}`, bgcolor: v.variante_color ?? T.wash, display: "block",
                      transition: "transform .2s ease", "&:hover": { transform: "scale(1.3)" } }} />
                </Tooltip>
              ))}
              {colores.length > 6 && <Typography sx={{ fontSize: 12, color: T.muted }}>+{colores.length - 6}</Typography>}
            </Stack>
          )}
          {etiqueta && <Typography sx={etiquetaNaranja}>{etiqueta}</Typography>}
          {plato.marca && <Typography sx={{ fontSize: 12, color: T.muted }}>{plato.marca}</Typography>}
          <Typography component={RouterLink} to={ruta} sx={{ fontWeight: 600, fontSize: { xs: 15, md: 17 }, lineHeight: 1.25, letterSpacing: "-0.01em", color: T.text, textDecoration: "none",
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {capitalizar(plato.nombre)}
          </Typography>
          {plato.descripcion && plato.descripcion.trim().toLowerCase() !== plato.nombre.trim().toLowerCase() && (
            <Typography sx={{ fontSize: 13.5, color: T.muted, lineHeight: 1.4, display: { xs: "none", sm: "-webkit-box" }, WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {plato.descripcion}
            </Typography>
          )}

          <Box sx={{ mt: "auto", pt: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, minHeight: 40 }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: { xs: 14.5, md: 16 }, fontWeight: 500, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                {conOpciones ? "Desde " : ""}{pesos.format(plato.precio_venta)}
              </Typography>
              {pct > 0 && <Typography sx={{ fontSize: 12.5, color: T.muted, textDecoration: "line-through" }}>{pesos.format(plato.precio_anterior!)}</Typography>}
            </Box>

            <AnimatePresence mode="popLayout" initial={false}>
              {enCarrito && !recien ? (
                <motion.div key="contador" initial={reducido ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={reducido ? undefined : { scale: 0.6, opacity: 0 }}>
                  <Stack direction="row" alignItems="center" sx={{ bgcolor: T.wash, color: T.text, borderRadius: 999, height: 34 }}>
                    <IconButton size="small" onClick={() => cambiarCantidad(enCarrito.clave, enCarrito.cantidad - 1)} aria-label={`Quitar uno de ${plato.nombre}`} sx={{ color: "inherit" }}>
                      {enCarrito.cantidad === 1 ? <DeleteOutlineIcon sx={{ fontSize: 18 }} /> : <RemoveIcon sx={{ fontSize: 18 }} />}
                    </IconButton>
                    <Typography sx={{ minWidth: 16, textAlign: "center", fontWeight: 600, fontSize: 14 }} aria-live="polite">{enCarrito.cantidad}</Typography>
                    <IconButton ref={boton} size="small" disabled={enCarrito.cantidad >= maximo}
                      onClick={() => { cambiarCantidad(enCarrito.clave, enCarrito.cantidad + 1); volar(boton.current, imagen); }}
                      aria-label={`Agregar uno de ${plato.nombre}`} sx={{ color: T.accent }}>
                      <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </motion.div>
              ) : (
                <motion.div key="agregar" initial={reducido ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={reducido ? undefined : { scale: 0.6, opacity: 0 }}>
                  <Button ref={boton} onClick={accion} disabled={!habilitado && !conOpciones} aria-label={conOpciones ? `Elegir opciones de ${plato.nombre}` : `Agregar ${plato.nombre}`}
                    sx={{ ...btnPrimario, minHeight: 32, minWidth: 0, px: { xs: 1.4, md: 1.8 }, py: 0.5, fontSize: 14, bgcolor: recien ? "#1d9a4a" : T.accent }}>
                    {recien ? <CheckIcon sx={{ fontSize: 18 }} /> : conOpciones ? "Elegir" : "Agregar"}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </Box>
      </Box>
    </motion.article>
  );
}
