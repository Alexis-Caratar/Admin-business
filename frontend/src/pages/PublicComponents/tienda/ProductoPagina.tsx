/*
 * Ficha de producto: /tienda/p/<nombre>-<id> (o /:negocio/tienda/p/…).
 * Todo lo que se muestra viene del producto real; las secciones sin datos
 * no aparecen. Las variantes son productos reales (precio, stock, imágenes).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Alert, Box, Breadcrumbs, Button, Container, Skeleton, Stack, Tooltip, Typography,
} from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import BoltIcon from "@mui/icons-material/Bolt";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ScheduleIcon from "@mui/icons-material/Schedule";

import { T } from "../landing/tokens";
import { btnPrimario, btnSecundario, etiquetaNaranja, titulo } from "./estilo";
import { TituloSeccion } from "./Estante";
import SitioProvider from "../landing/SitioProvider";
import { capitalizar, leerCategoria } from "../landing/useMenu";
import { horarioDeHoy, useSitio } from "../landing/siteConfig";
import type { Sitio } from "../landing/siteConfig";
import { ErrorTienda, obtenerProducto, pesos } from "./api";
import type { PlatoTienda, ProductoDetalle } from "./api";
import { CarritoProvider } from "./carrito";
import { precioLinea, useCarrito } from "./carritoContexto";
import type { Opcion } from "./carritoContexto";
import { useMarco } from "./marcoContexto";
import MarcoTienda, { Contador } from "./Marco";
import Galeria from "./Galeria";
import TarjetaProducto from "./TarjetaProducto";
import { Aparecer, NumeroAnimado, PuntoVivo, TarjetaSeleccion } from "./Animaciones";
import { EASE, descuento, formatear, idDesdeSlug, rutaProducto, slugProducto, suave } from "./util";

export default function ProductoPagina() {
  const { negocio } = useParams();
  return (
    <SitioProvider negocio={negocio} estilo="tienda">
      <ConCarrito />
    </SitioProvider>
  );
}

function ConCarrito() {
  const sitio = useSitio();
  return (
    <CarritoProvider key={sitio.urlNegocio} negocio={sitio.urlNegocio}>
      <MarcoTienda barraMovil={false}>
        <Ficha />
      </MarcoTienda>
    </CarritoProvider>
  );
}

type Datos = { producto: ProductoDetalle; relacionados: PlatoTienda[] };

function Ficha() {
  const sitio = useSitio();
  const { slug } = useParams();
  const navigate = useNavigate();
  const { setTienda, tienda, setOnNoDisponible } = useMarco();
  const id = idDesdeSlug(slug);
  const [datos, setDatos] = useState<Datos | null>(null);
  const [error, setError] = useState<"no-existe" | "red" | null>(null);

  const cargar = useCallback((signal?: AbortSignal) =>
    obtenerProducto(sitio.urlNegocio, id, signal).then((r) => {
      setTienda(r.tienda);
      setDatos({ producto: r.producto, relacionados: r.relacionados });
      setError(null);
      // URL canónica: si cambió el nombre, se corrige el slug sin recargar
      const canonico = slugProducto(r.producto);
      if (slug !== canonico) navigate(rutaProducto(sitio.base, r.producto), { replace: true });
    }, (e) => {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setError(e instanceof ErrorTienda && e.status === 404 ? "no-existe" : "red");
    }), [sitio.urlNegocio, sitio.base, id, slug, navigate, setTienda]);

  useEffect(() => {
    const ctrl = new AbortController();
    cargar(ctrl.signal);
    setOnNoDisponible(() => cargar());
    return () => ctrl.abort();
  }, [cargar, setOnNoDisponible]);

  // Al abrir otro producto se empieza desde arriba (solo cuando cambia el producto)
  useEffect(() => { window.scrollTo({ top: 0 }); }, [id]);

  useSeoProducto(datos?.producto ?? null, sitio);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <ErrorOutlineIcon sx={{ fontSize: 56, color: T.muted }} />
        <Typography sx={{ mt: 1, fontWeight: 600, fontSize: 22 }}>{error === "no-existe" ? "Este producto no está disponible" : "No pudimos cargar el producto"}</Typography>
        <Stack direction="row" spacing={1.5} justifyContent="center" sx={{ mt: 3 }}>
          {error === "red" && <Button onClick={() => cargar()} sx={btnSecundario}>Reintentar</Button>}
          <Button component={RouterLink} to={`${sitio.base}/tienda`} sx={btnPrimario}>Ver {sitio.textos.titulo_catalogo.toLowerCase()}</Button>
        </Stack>
      </Container>
    );
  }

  if (!datos) {
    return (
      <Container maxWidth="lg" sx={{ pt: 4 }}>
        <Box sx={{ display: "grid", gap: 5, gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" } }}>
          <Skeleton variant="rounded" sx={{ aspectRatio: "1 / 1", height: "auto", borderRadius: 5, bgcolor: T.wash }} />
          <Box>
            <Skeleton width="30%" sx={{ bgcolor: T.wash }} />
            <Skeleton width="80%" height={60} sx={{ bgcolor: T.wash }} />
            <Skeleton width="40%" height={50} sx={{ bgcolor: T.wash }} />
            <Skeleton variant="rounded" height={120} sx={{ bgcolor: T.wash, mt: 3, borderRadius: 3 }} />
          </Box>
        </Box>
      </Container>
    );
  }

  return <Contenido key={datos.producto.id} producto={datos.producto} relacionados={datos.relacionados} abierta={Boolean(tienda?.abierta)} />;
}

function Contenido({ producto: p, relacionados, abierta }: { producto: ProductoDetalle; relacionados: PlatoTienda[]; abierta: boolean }) {
  const sitio = useSitio();
  const { textos } = sitio;
  const { agregar } = useCarrito();
  const { volar, abrirCheckout, abrirCarrito, tienda } = useMarco();
  const reducido = useReducedMotion();
  const [eleccion, setEleccion] = useState<number | null>(null);
  const [adiciones, setAdiciones] = useState<number[]>([]);
  const [cantidad, setCantidad] = useState(1);
  const [sacudir, setSacudir] = useState(0);
  const [agregado, setAgregado] = useState(false);
  const boton = useRef<HTMLButtonElement | null>(null);
  const zonaAcciones = useRef<HTMLDivElement | null>(null);
  const zonaObligatoria = useRef<HTMLDivElement | null>(null);
  const [barraVisible, setBarraVisible] = useState(false);

  const imagenes = sitio.mostrarFotosDeProductos ? p.imagenes : [];
  const aElegir = p.productos_complementos.filter((c) => c.obligatorio);
  const opcionales = p.productos_complementos.filter((c) => !c.obligatorio);
  const falta = aElegir.length > 0 && eleccion === null;
  const opciones: Opcion[] = [
    ...aElegir.filter((c) => c.id_producto_complemento === eleccion),
    ...opcionales.filter((c) => adiciones.includes(c.id_producto_complemento)),
  ].map((c) => ({ id: c.id_producto_complemento, nombre: capitalizar(c.nombre), precio: c.precio_venta }));
  const total = precioLinea({ precio: p.precio_venta, opciones, cantidad });
  const pct = descuento(p.precio_venta, p.precio_anterior);
  const maximo = p.stock_actual ?? 50;
  const puedeComprar = abierta && p.disponible;
  const categoria = leerCategoria(p.categoria).nombre;

  // Barra fija en celular solo cuando los botones principales salen de la pantalla
  useEffect(() => {
    const el = zonaAcciones.current;
    if (!el) return;
    const o = new IntersectionObserver(([e]) => setBarraVisible(!e.isIntersecting), { rootMargin: "0px 0px -40px 0px" });
    o.observe(el);
    return () => o.disconnect();
  }, []);

  const disponibilidad = !p.disponible
    ? (p.stock_actual === 0 ? { texto: "Agotado", color: "#ef4444" } : !p.en_horario ? { texto: "No disponible en este horario", color: T.warn } : { texto: "No disponible", color: "#ef4444" })
    : p.stock_actual !== null && p.stock_actual <= 5
      ? { texto: `¡Últimas ${p.stock_actual} unidades!`, color: T.warn }
      : { texto: "Disponible", color: T.accent };

  const confirmar = (comprarYa: boolean) => {
    if (falta) {
      setSacudir((n) => n + 1);
      zonaObligatoria.current?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" });
      return;
    }
    agregar({ id_producto: p.id, nombre: capitalizar(p.nombre), imagen: p.imagenes[0], precio: p.precio_venta, cantidad, opciones });
    if (comprarYa) return abrirCheckout();
    volar(boton.current, imagenes[0]);
    setAgregado(true);
    window.setTimeout(() => setAgregado(false), 1800);
  };

  const secciones: { titulo: string; contenido: ReactNode }[] = [
    (p.descripcion_detallada || (p.descripcion && p.descripcion.trim().toLowerCase() !== p.nombre.trim().toLowerCase())) && {
      titulo: "Descripción", contenido: <Texto>{p.descripcion_detallada || p.descripcion}</Texto>,
    },
    p.caracteristicas.length > 0 && {
      titulo: "Características",
      contenido: (
        <Stack spacing={1}>
          {p.caracteristicas.map((c, k) => (
            <Stack key={k} direction="row" spacing={1.2} alignItems="flex-start">
              <CheckIcon sx={{ fontSize: 18, color: T.accent, mt: 0.2 }} />
              <Typography sx={{ color: T.text2 }}>{c}</Typography>
            </Stack>
          ))}
        </Stack>
      ),
    },
    p.atributos.length > 0 && {
      titulo: "Especificaciones",
      contenido: (
        <Box component="dl" sx={{ m: 0, display: "grid", gridTemplateColumns: "minmax(120px, 40%) 1fr", borderRadius: 3, overflow: "hidden", border: `1px solid ${T.line}` }}>
          {p.atributos.map((a, k) => (
            <Box key={k} sx={{ display: "contents", "& > *": { px: 1.8, py: 1.2, borderTop: k ? `1px solid ${T.line}` : 0 } }}>
              <Box component="dt" sx={{ fontWeight: 700, bgcolor: T.wash, fontSize: 14 }}>{a.nombre}</Box>
              <Box component="dd" sx={{ m: 0, color: T.text2, fontSize: 14 }}>{a.valor}</Box>
            </Box>
          ))}
        </Box>
      ),
    },
    p.modo_uso && { titulo: "Modo de uso", contenido: <Texto>{p.modo_uso}</Texto> },
    p.ingredientes && { titulo: "Ingredientes / composición", contenido: <Texto>{p.ingredientes}</Texto> },
    p.cuidados && { titulo: "Cuidados y conservación", contenido: <Texto>{p.cuidados}</Texto> },
    p.advertencias && { titulo: "Advertencias", contenido: <Texto>{p.advertencias}</Texto> },
    p.fabricante && { titulo: "Fabricante", contenido: <Texto>{p.fabricante}</Texto> },
  ].filter(Boolean) as { titulo: string; contenido: ReactNode }[];

  const entrada = (k: number) => (reducido ? {} : { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5, delay: 0.06 * k, ease: EASE } });

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 2, md: 3 } }}>
      <Breadcrumbs sx={{ mb: { xs: 2, md: 3 }, fontSize: 13.5, color: T.muted, "& a": { color: T.muted, textDecoration: "none", "&:hover": { color: T.text } } }}>
        <RouterLink to={`${sitio.base}/tienda`}>{textos.titulo_catalogo}</RouterLink>
        <span>{categoria}</span>
        <Typography component="span" sx={{ fontSize: 13.5, color: T.text, fontWeight: 600 }}>{capitalizar(p.nombre)}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: "grid", gap: { xs: 3, md: 6 }, gridTemplateColumns: { xs: "1fr", md: "1.1fr 1fr" }, alignItems: "start" }}>
        {/* Galería (fija al bajar en escritorio) */}
        <Box sx={{ position: { md: "sticky" }, top: { md: 76 } }}>
          <motion.div {...entrada(0)}>
            <Galeria imagenes={imagenes} nombre={capitalizar(p.nombre)} inicial={capitalizar(p.nombre).slice(0, 2)} />
          </motion.div>
        </Box>

        {/* Información y compra */}
        <Box>
          <motion.div {...entrada(1)}>
            {(pct > 0 || p.destacado) && <Typography sx={{ ...etiquetaNaranja, fontSize: 14 }}>{pct > 0 ? `Ahorra ${pct} %` : "Destacado"}</Typography>}
            {p.marca && <Typography sx={{ fontSize: 14, color: T.muted, mt: 0.5 }}>{p.marca}</Typography>}
            <Typography component="h1" sx={{ ...titulo(34, 52), mt: 0.5 }}>
              {capitalizar(p.nombre)}
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
              <Stack direction="row" spacing={0.8} alignItems="center" sx={{ fontSize: 13.5, fontWeight: 700, color: disponibilidad.color }}>
                <PuntoVivo color={disponibilidad.color} tam={8} />
                <span>{disponibilidad.texto}</span>
              </Stack>
              {p.sku && <Typography sx={{ fontSize: 12.5, color: T.muted }}>Ref. {p.sku}</Typography>}
              {p.variante_nombre && <Typography sx={{ fontSize: 12.5, color: T.muted }}>{p.variante_nombre}</Typography>}
            </Stack>
          </motion.div>

          {/* Precio */}
          <motion.div {...entrada(2)}>
            <Stack direction="row" alignItems="baseline" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mt: 2.5 }}>
              <Typography sx={{ fontWeight: 500, fontSize: { xs: 24, md: 28 }, letterSpacing: "-0.02em", lineHeight: 1.1, color: T.text, fontVariantNumeric: "tabular-nums" }}>{pesos.format(p.precio_venta)}</Typography>
              {pct > 0 && <Typography sx={{ fontSize: 17, color: T.muted, textDecoration: "line-through" }}>{pesos.format(p.precio_anterior!)}</Typography>}
            </Stack>
            {pct > 0 && <Typography sx={{ mt: 0.5, fontSize: 14, color: T.warn, fontWeight: 500 }}>Ahorras {pesos.format(p.precio_anterior! - p.precio_venta)} ({pct} %)</Typography>}
          </motion.div>

          {/* Variantes */}
          {p.variantes.length > 1 && (
            <motion.div {...entrada(3)}>
              <Box sx={{ mt: 3 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 17, mb: 1.5 }}>
                  {p.variantes.some((v) => v.variante_color) ? "Color" : "Elige tu opción"}. <Box component="span" sx={{ fontWeight: 400, color: T.muted }}>{p.variante_nombre ?? capitalizar(p.nombre)}</Box>
                </Typography>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  {p.variantes.map((v) => {
                    const activa = v.id === p.id;
                    const etiqueta = `${v.variante_nombre ?? v.nombre}${v.disponible ? "" : " (agotado)"}`;
                    return v.variante_color ? (
                      <Tooltip key={v.id} title={etiqueta}>
                        <Box component={RouterLink} to={rutaProducto(sitio.base, v)} replace aria-label={etiqueta} aria-current={activa}
                          sx={{ position: "relative", width: 40, height: 40, borderRadius: "50%", bgcolor: v.variante_color, display: "block",
                            outline: `2px solid ${activa ? T.accent : "transparent"}`, outlineOffset: 3, border: `1px solid ${T.soft}`, transition: "outline-color .2s ease, transform .2s ease",
                            opacity: v.disponible ? 1 : 0.45, "&:hover": { transform: "scale(1.08)" },
                            "&::after": v.disponible ? undefined : { content: '""', position: "absolute", left: "50%", top: -2, bottom: -2, width: 2, bgcolor: T.text, transform: "rotate(45deg)" } }} />
                      </Tooltip>
                    ) : (
                      <Box key={v.id} component={RouterLink} to={rutaProducto(sitio.base, v)} replace aria-current={activa}
                        sx={{ px: 2.25, py: 1.5, borderRadius: "12px", textDecoration: "none", fontWeight: 500, fontSize: 15, color: T.text,
                          bgcolor: T.surface, boxShadow: `inset 0 0 0 ${activa ? 2 : 1}px ${activa ? T.accent : T.soft}`, opacity: v.disponible ? 1 : 0.5,
                          transition: "box-shadow .2s ease", "&:hover": { boxShadow: `inset 0 0 0 ${activa ? 2 : 1}px ${activa ? T.accent : T.muted}` },
                          textDecorationLine: v.disponible ? "none" : "line-through" }}>
                        {v.variante_nombre ?? v.nombre}
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            </motion.div>
          )}

          {/* Opciones obligatorias y adicionales */}
          {aElegir.length > 0 && (
            <motion.div ref={zonaObligatoria} key={`obl-${sacudir}`} animate={sacudir && !reducido ? { x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.45 }}>
              <Box sx={{ mt: 3, p: 1.5, mx: -1.5, borderRadius: 3, border: `1.5px solid ${falta && sacudir ? T.warn : "transparent"}` }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
                  <Typography sx={{ fontWeight: 600 }}>{textos.a_elegir}</Typography>
                  <Box sx={{ px: 1.2, py: 0.3, borderRadius: 999, fontSize: 12, fontWeight: 600, bgcolor: falta ? suave(T.warn, 18) : suave(T.accent, 18), color: falta ? T.warn : T.accent, display: "flex", alignItems: "center", gap: 0.4 }}>
                    {falta ? "Obligatorio" : <><CheckIcon sx={{ fontSize: 14 }} /> Listo</>}
                  </Box>
                </Stack>
                <Stack spacing={1}>
                  {aElegir.map((c) => (
                    <TarjetaSeleccion key={c.id_producto_complemento} activa={eleccion === c.id_producto_complemento} onClick={() => setEleccion(c.id_producto_complemento)}
                      titulo={capitalizar(c.nombre)} extra={c.precio_venta > 0 ? <Typography sx={{ fontWeight: 700, fontSize: 14, color: T.muted }}>+{pesos.format(c.precio_venta)}</Typography> : undefined} />
                  ))}
                </Stack>
              </Box>
            </motion.div>
          )}
          {opcionales.length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.2 }}>
                <Typography sx={{ fontWeight: 600 }}>{textos.adiciones}</Typography>
                <Typography sx={{ fontSize: 12.5, color: T.muted }}>Opcional</Typography>
              </Stack>
              <Stack spacing={1}>
                {opcionales.map((c) => {
                  const sel = adiciones.includes(c.id_producto_complemento);
                  return (
                    <TarjetaSeleccion key={c.id_producto_complemento} tipo="check" activa={sel}
                      onClick={() => setAdiciones((a) => (sel ? a.filter((x) => x !== c.id_producto_complemento) : [...a, c.id_producto_complemento]))}
                      titulo={capitalizar(c.nombre)} extra={<Typography sx={{ fontWeight: 700, fontSize: 14, color: T.muted }}>+{pesos.format(c.precio_venta)}</Typography>} />
                  );
                })}
              </Stack>
            </Box>
          )}

          {/* Acciones */}
          <Box ref={zonaAcciones} sx={{ mt: 3 }}>
            {!abierta && <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>{tienda?.motivo ?? "La tienda no está recibiendo pedidos en este momento."}</Alert>}
            <Stack direction="row" spacing={1.2} alignItems="center">
              <Contador valor={cantidad} min={1} max={Math.max(1, maximo)} onCambio={setCantidad} etiqueta={p.nombre} />
              <Button ref={boton} fullWidth disabled={!puedeComprar} onClick={() => confirmar(false)}
                sx={{ ...btnPrimario, minHeight: 52, justifyContent: "space-between", px: 2.5, bgcolor: agregado ? T.accentHover : T.accent }}>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span key={agregado ? "ok" : "agregar"} initial={reducido ? false : { y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reducido ? undefined : { y: -10, opacity: 0 }}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {agregado ? <><CheckIcon /> Agregado</> : <><ShoppingBagOutlinedIcon /> {p.disponible ? (falta ? "Elige una opción" : "Agregar") : "Agotado"}</>}
                  </motion.span>
                </AnimatePresence>
                <NumeroAnimado valor={total} formato={formatear} />
              </Button>
            </Stack>
            <Stack direction="row" spacing={1.2} sx={{ mt: 1.2 }}>
              <Button fullWidth disabled={!puedeComprar} onClick={() => confirmar(true)} startIcon={<BoltIcon />} sx={{ ...btnSecundario, minHeight: 48 }}>Comprar ahora</Button>
              <AnimatePresence>
                {agregado && (
                  <motion.div initial={reducido ? false : { width: 0, opacity: 0 }} animate={{ width: "auto", opacity: 1 }} exit={reducido ? undefined : { width: 0, opacity: 0 }} style={{ overflow: "hidden", display: "flex" }}>
                    <Button onClick={abrirCarrito} sx={{ ...btnSecundario, minHeight: 48, whiteSpace: "nowrap" }}>Ver {textos.carrito.toLowerCase()}</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </Stack>
          </Box>

          {/* Entrega y pago reales de la tienda */}
          {tienda && (
            <Box sx={{ mt: 3, borderRadius: 4, border: `1px solid ${T.line}`, overflow: "hidden" }}>
              {[
                tienda.entrega.domicilio && { icono: <DeliveryDiningIcon />, titulo: textos.domicilio, texto: tienda.entrega.costo_domicilio > 0 ? `${pesos.format(tienda.entrega.costo_domicilio)}${tienda.entrega.domicilio_gratis_desde ? ` · gratis desde ${pesos.format(tienda.entrega.domicilio_gratis_desde)}` : ""}` : "Sin costo" },
                tienda.entrega.recoger && { icono: <StorefrontOutlinedIcon />, titulo: textos.recoger, texto: sitio.direccion ?? "Sin costo adicional" },
                { icono: tienda.pagos.en_linea ? <CreditCardIcon /> : <PaymentsOutlinedIcon />, titulo: "Pago", texto: [tienda.pagos.en_linea && "En línea con tarjeta, PSE o Nequi", tienda.pagos.contraentrega && "al recibir"].filter(Boolean).join(" o ") },
                tienda.horarios.length > 0 && { icono: <ScheduleIcon />, titulo: "Horario", texto: horarioDeHoy(tienda.horarios) },
              ].filter(Boolean).map((d, k) => {
                const x = d as { icono: ReactNode; titulo: string; texto: string };
                return (
                  <Stack key={x.titulo} direction="row" spacing={1.5} alignItems="center" sx={{ px: 2, py: 1.5, borderTop: k ? `1px solid ${T.line}` : 0 }}>
                    <Box sx={{ color: T.accent, display: "flex" }}>{x.icono}</Box>
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{x.titulo}</Typography>
                      <Typography sx={{ fontSize: 13, color: T.muted }}>{x.texto}</Typography>
                    </Box>
                  </Stack>
                );
              })}
            </Box>
          )}

        </Box>
      </Box>

      {/* Información del producto: filas título | contenido */}
      {secciones.length > 0 && (
        <Box component="section" aria-labelledby="info-producto" sx={{ mt: { xs: 7, md: 12 } }}>
          <TituloSeccion id="info-producto" titulo="Información del producto." subtitulo={p.marca ? `${capitalizar(p.nombre)} de ${p.marca}.` : undefined} />
          <Box sx={{ mt: { xs: 2, md: 4 } }}>
            {secciones.map((sec, k) => (
              <Aparecer key={sec.titulo} retraso={k * 0.04}>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: { xs: 1.5, md: 6 }, py: { xs: 3, md: 4.5 }, borderTop: `1px solid ${T.line}` }}>
                  <Typography component="h3" sx={titulo(21, 24)}>{sec.titulo}</Typography>
                  <Box>{sec.contenido}</Box>
                </Box>
              </Aparecer>
            ))}
          </Box>
        </Box>
      )}

      {/* Relacionados */}
      {relacionados.length > 0 && (
        <Box component="section" sx={{ mt: { xs: 6, md: 10 } }} aria-labelledby="relacionados">
          <Box sx={{ mb: 3 }}><TituloSeccion id="relacionados" titulo="También te puede gustar." subtitulo={`Más de ${categoria.toLowerCase()}.`} /></Box>
          <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2.5 }, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" } }}>
            {relacionados.map((r, k) => (
              <Aparecer key={r.id} retraso={k * 0.05}><TarjetaProducto plato={r} habilitado={abierta} /></Aparecer>
            ))}
          </Box>
        </Box>
      )}

      {/* Barra de compra fija: aparece cuando los botones principales salen de la pantalla */}
      <AnimatePresence>
        {barraVisible && puedeComprar && (
          <motion.div initial={reducido ? false : { y: 100 }} animate={{ y: 0 }} exit={reducido ? undefined : { y: 100 }} transition={{ type: "spring", stiffness: 380, damping: 36 }}
            style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 30 }}>
            <Box sx={{ bgcolor: T.navBg, backdropFilter: "saturate(1.8) blur(20px)", borderTop: `1px solid ${T.line}`, pb: "env(safe-area-inset-bottom, 0px)" }}>
              <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.25 }}>
                {imagenes[0] && <Box component="img" src={imagenes[0]} alt="" sx={{ width: 44, height: 44, borderRadius: "10px", objectFit: "contain", bgcolor: "#fff", display: { xs: "none", sm: "block" } }} />}
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap sx={{ fontWeight: 600, fontSize: 15 }}>{capitalizar(p.nombre)}{p.variante_nombre ? ` · ${p.variante_nombre}` : ""}</Typography>
                  <Typography sx={{ fontSize: 14, color: T.muted }}><NumeroAnimado valor={total} formato={formatear} /></Typography>
                </Box>
                <Button onClick={() => confirmar(true)} sx={{ ...btnSecundario, minHeight: 40, display: { xs: "none", sm: "inline-flex" } }}>Comprar ahora</Button>
                <Button onClick={() => confirmar(false)} sx={{ ...btnPrimario, minHeight: 40, px: 2.5 }} startIcon={agregado ? <CheckIcon /> : undefined}>
                  {agregado ? "Agregado" : "Agregar"}
                </Button>
              </Container>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Container>
  );
}

function Texto({ children }: { children: ReactNode }) {
  return <Typography sx={{ color: T.text2, lineHeight: 1.7, whiteSpace: "pre-line" }}>{children}</Typography>;
}

/* SEO del producto: título, descripción, Open Graph, URL canónica y datos estructurados */
function useSeoProducto(p: ProductoDetalle | null, sitio: Sitio) {
  const imagen = p && sitio.mostrarFotosDeProductos ? p.imagenes[0] : undefined;
  const datos = useMemo(() => {
    if (!p) return null;
    const url = `${window.location.origin}${rutaProducto(sitio.base, p)}`;
    const descripcion = (p.descripcion_detallada || p.descripcion || `${p.nombre} en ${sitio.nombre}`).slice(0, 300);
    return {
      titulo: `${capitalizar(p.nombre)}${p.marca ? ` · ${p.marca}` : ""} | ${sitio.nombre}`,
      descripcion,
      url,
      jsonLd: {
        "@context": "https://schema.org",
        "@type": "Product",
        name: capitalizar(p.nombre),
        description: descripcion,
        sku: p.sku ?? undefined,
        brand: p.marca ? { "@type": "Brand", name: p.marca } : undefined,
        category: leerCategoria(p.categoria).nombre,
        color: p.variante_nombre ?? undefined,
        image: sitio.mostrarFotosDeProductos ? p.imagenes : undefined,
        offers: {
          "@type": "Offer",
          url,
          priceCurrency: "COP",
          price: p.precio_venta,
          availability: p.disponible ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          seller: { "@type": "Organization", name: sitio.nombre },
        },
      },
    };
  }, [p, sitio]);

  useEffect(() => {
    if (!datos) return;
    document.title = datos.titulo;
    const meta = (attr: "name" | "property", clave: string, valor?: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${clave}"]`);
      if (!valor) { el?.remove(); return; }
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, clave); document.head.appendChild(el); }
      el.setAttribute("content", valor);
    };
    meta("name", "description", datos.descripcion);
    meta("property", "og:type", "product");
    meta("property", "og:title", datos.titulo);
    meta("property", "og:description", datos.descripcion);
    meta("property", "og:url", datos.url);
    meta("property", "og:image", imagen);
    let canonico = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonico) { canonico = document.createElement("link"); canonico.rel = "canonical"; document.head.appendChild(canonico); }
    canonico.href = datos.url;
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "pu-producto-ld";
    script.text = JSON.stringify(datos.jsonLd);
    document.getElementById("pu-producto-ld")?.remove();
    document.head.appendChild(script);
    return () => { script.remove(); canonico?.remove(); };
  }, [datos, imagen]);
}
