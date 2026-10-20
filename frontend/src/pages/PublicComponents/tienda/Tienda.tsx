import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useParams } from "react-router-dom";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import {
  Alert, Badge, Box, Button, Chip, Container, FormControlLabel, IconButton, InputAdornment, MenuItem, Skeleton, Slider,
  Snackbar, Stack, Switch, TextField, Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AppsIcon from "@mui/icons-material/Apps";

import { T } from "../landing/tokens";
import { btnSecundario, enlace, tarjeta, titulo } from "./estilo";
import Estante, { TituloSeccion } from "./Estante";
import SitioProvider from "../landing/SitioProvider";
import { leerCategoria } from "../landing/useMenu";
import { irA, textoHorario, useSitio, waLink } from "../landing/siteConfig";
import { obtenerCatalogo, pesos } from "./api";
import type { CategoriaTienda, EstadoTienda, PlatoTienda } from "./api";
import { CarritoProvider } from "./carrito";
import { useCarrito } from "./carritoContexto";
import { useMarco } from "./marcoContexto";
import { Aparecer, PuntoVivo } from "./Animaciones";
import MarcoTienda from "./Marco";
import TarjetaProducto from "./TarjetaProducto";
import { EASE, descuento } from "./util";

/* ================================================================
 * Página
 * ================================================================ */
/* /:negocio/tienda → por url_negocio; /tienda → por dominio (o el negocio por defecto) */
export default function Tienda() {
  const { negocio } = useParams();
  return (
    <SitioProvider negocio={negocio} estilo="tienda">
      <TiendaNegocio />
    </SitioProvider>
  );
}

function TiendaNegocio() {
  const sitio = useSitio();
  useEffect(() => { document.title = `${sitio.textos.pedir_linea} · ${sitio.nombre}`; }, [sitio.nombre, sitio.textos.pedir_linea]);
  return (
    <CarritoProvider key={sitio.urlNegocio} negocio={sitio.urlNegocio}>
      <MarcoTienda>
        <Catalogo />
      </MarcoTienda>
    </CarritoProvider>
  );
}

type Estado = "cargando" | "listo" | "error";
type Orden = "relevancia" | "precio_asc" | "precio_desc" | "nombre" | "novedades";
type Filtros = { marcas: string[]; colores: string[]; precio: [number, number] | null; promo: boolean };
const SIN_FILTROS: Filtros = { marcas: [], colores: [], precio: null, promo: false };

function Catalogo() {
  const sitio = useSitio();
  const reducido = useReducedMotion();
  const { sincronizar } = useCarrito();
  const marco = useMarco();
  const { setTienda, setOnNoDisponible } = marco;
  const tienda = marco.tienda;
  const [estado, setEstado] = useState<Estado>("cargando");
  const [categorias, setCategorias] = useState<CategoriaTienda[]>([]);
  const [filtro, setFiltro] = useState<number | "todo">("todo");
  const [busqueda, setBusqueda] = useState("");
  const [orden, setOrden] = useState<Orden>("relevancia");
  const [filtros, setFiltros] = useState<Filtros>(SIN_FILTROS);
  const [panel, setPanel] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // Los estados se actualizan solo cuando llega la respuesta (nunca en el mismo render)
  const cargar = useCallback((signal?: AbortSignal) =>
    obtenerCatalogo(sitio.urlNegocio, signal).then((r) => {
      setTienda(r.tienda);
      setCategorias(r.productos);
      const quitados = sincronizar(r.productos);
      if (quitados.length) setAviso(`Ya no están disponibles: ${quitados.join(", ")}`);
      setEstado("listo");
    }, (e) => {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setEstado("error");
    }), [sincronizar, sitio.urlNegocio, setTienda]);

  useEffect(() => {
    const ctrl = new AbortController();
    cargar(ctrl.signal);
    setOnNoDisponible(() => cargar());
    // La disponibilidad cambia durante el día: se refresca cada 2 minutos
    const t = window.setInterval(() => cargar(), 120_000);
    return () => { ctrl.abort(); window.clearInterval(t); };
  }, [cargar, setOnNoDisponible]);

  // Todos los productos y sus grupos de variantes (cada variante es un producto real)
  const todos = useMemo(() => categorias.flatMap((c) => c.platos), [categorias]);
  const grupos = useMemo(() => {
    const m = new Map<number, PlatoTienda[]>();
    todos.forEach((p) => {
      const base = p.id_producto_base && todos.some((x) => x.id === p.id_producto_base) ? p.id_producto_base : p.id;
      m.set(base, [...(m.get(base) ?? []), p]);
    });
    return m;
  }, [todos]);
  // En las tarjetas solo aparece el producto base de cada grupo
  const esTarjeta = useCallback((p: PlatoTienda) => !p.id_producto_base || !todos.some((x) => x.id === p.id_producto_base), [todos]);

  const marcas = useMemo(() => [...new Set(todos.map((p) => p.marca).filter(Boolean) as string[])].sort(), [todos]);
  const colores = useMemo(() => [...new Map(todos.filter((p) => p.variante_nombre).map((p) => [p.variante_nombre!, p.variante_color])).entries()], [todos]);
  const rangoPrecio = useMemo<[number, number]>(() => {
    const ps = todos.map((p) => p.precio_venta);
    return ps.length ? [Math.min(...ps), Math.max(...ps)] : [0, 0];
  }, [todos]);
  const hayPromos = todos.some((p) => descuento(p.precio_venta, p.precio_anterior) > 0);
  const nFiltros = filtros.marcas.length + filtros.colores.length + (filtros.precio ? 1 : 0) + (filtros.promo ? 1 : 0);

  // Un grupo pasa el filtro si alguno de sus productos lo cumple
  const cumple = useCallback((p: PlatoTienda) => {
    const grupo = grupos.get(p.id) ?? [p];
    const q = busqueda.trim().toLowerCase();
    return grupo.some((g) =>
      (!q || `${g.nombre} ${g.descripcion ?? ""} ${g.marca ?? ""} ${g.variante_nombre ?? ""}`.toLowerCase().includes(q)) &&
      (!filtros.marcas.length || (g.marca && filtros.marcas.includes(g.marca))) &&
      (!filtros.colores.length || (g.variante_nombre && filtros.colores.includes(g.variante_nombre))) &&
      (!filtros.precio || (g.precio_venta >= filtros.precio[0] && g.precio_venta <= filtros.precio[1])) &&
      (!filtros.promo || descuento(g.precio_venta, g.precio_anterior) > 0));
  }, [grupos, busqueda, filtros]);

  const ordenar = useCallback((a: PlatoTienda, b: PlatoTienda) => {
    if (orden === "precio_asc") return a.precio_venta - b.precio_venta;
    if (orden === "precio_desc") return b.precio_venta - a.precio_venta;
    if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
    if (orden === "novedades") return b.id - a.id;
    return Number(Boolean(b.destacado)) - Number(Boolean(a.destacado));
  }, [orden]);

  const ordenadas = useMemo(
    () => categorias.map((c) => ({ ...c, ...leerCategoria(c.categoria) })).sort((a, b) => a.orden - b.orden),
    [categorias]
  );

  const visibles = useMemo(() => ordenadas
    .filter((c) => filtro === "todo" || c.id === filtro)
    .map((c) => ({ ...c, platos: c.platos.filter((p) => esTarjeta(p) && cumple(p)).sort(ordenar) }))
    .filter((c) => c.platos.length > 0), [ordenadas, filtro, esTarjeta, cumple, ordenar]);

  const destacados = useMemo(() => todos.filter((p) => p.destacado && esTarjeta(p)), [todos, esTarjeta]);
  const promociones = useMemo(() => todos.filter((p) => esTarjeta(p) && descuento(p.precio_venta, p.precio_anterior) > 0), [todos, esTarjeta]);
  const filtrando = Boolean(busqueda.trim()) || nFiltros > 0 || filtro !== "todo";
  const abierta = Boolean(tienda?.abierta);
  const total = visibles.reduce((a, c) => a + c.platos.length, 0);
  const limpiar = () => { setBusqueda(""); setFiltros(SIN_FILTROS); setFiltro("todo"); };
  const verCategoria = (id: number) => { setFiltro(id); irA("catalogo"); };
  const tarjeta = (p: PlatoTienda) => <TarjetaProducto plato={p} variantes={grupos.get(p.id) ?? []} habilitado={abierta} />;

  return (
    <Container maxWidth="lg" sx={{ pt: { xs: 3, md: 6 } }}>
      <Portada tienda={tienda} />

      {estado === "cargando" && (
        <Box sx={{ display: "flex", gap: 2.5, overflow: "hidden", mt: 6 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} sx={{ flex: "0 0 auto", width: { xs: 240, md: 290 } }}>
              <Skeleton variant="rounded" sx={{ bgcolor: T.wash, borderRadius: "18px", height: { xs: 340, md: 400 } }} />
            </Box>
          ))}
        </Box>
      )}

      {estado === "error" && (
        <Alert severity="error" sx={{ mt: 4, borderRadius: 3 }} action={<Button color="inherit" onClick={() => { setEstado("cargando"); cargar(); }}>Reintentar</Button>}>
          No pudimos cargar la tienda. Revisa tu conexión.
        </Alert>
      )}

      {estado === "listo" && (
        <>
          {/* Categorías como íconos grandes */}
          {ordenadas.length > 1 && (
            <Box component="nav" aria-label="Categorías" sx={{ mt: { xs: 4, md: 6 }, mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, display: "flex", gap: { xs: 2.5, md: 4 }, overflowX: "auto", pb: 1, scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
              {ordenadas.map((c, i) => {
                const fotos = [c.imagen, ...(sitio.mostrarFotosDeProductos ? c.platos.flatMap((p) => p.imagenes.slice(0, 1)) : [])].filter(Boolean).slice(0, 4) as string[];
                return (
                  <motion.button key={c.id} type="button" onClick={() => verCategoria(c.id)}
                    initial={reducido ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 * i, duration: 0.5, ease: EASE }}
                    whileHover={reducido ? undefined : { y: -3 }}
                    style={{ border: 0, background: "none", padding: 0, cursor: "pointer", font: "inherit", color: "inherit", flex: "0 0 auto", width: 96 }}>
                    <Box sx={{ mx: "auto", width: 80, borderRadius: "22px", boxShadow: `0 2px 10px ${T.shadow}` }}>
                      <Miniatura imagenes={fotos} tam={80} radio={22} vacio={c.nombre.slice(0, 1).toUpperCase()} />
                    </Box>
                    <Typography sx={{ mt: 1, fontSize: 13, fontWeight: 500, color: T.text, lineHeight: 1.25 }}>{c.nombre}</Typography>
                  </motion.button>
                );
              })}
            </Box>
          )}

          {!filtrando && (
            <>
              {destacados.length > 0 && (
                <Estante id="destacados" titulo="Lo más destacado." subtitulo="Elegidos para ti.">
                  {destacados.slice(0, 12).map(tarjeta)}
                </Estante>
              )}
              {promociones.length > 0 && (
                <Estante id="promociones" titulo="Promociones." subtitulo="Precios especiales.">
                  {promociones.slice(0, 12).map(tarjeta)}
                </Estante>
              )}
              <Beneficios tienda={tienda} />
            </>
          )}

          {/* Catálogo completo */}
          <Box id="catalogo" sx={{ scrollMarginTop: 60, mt: { xs: 5, md: 8 } }}>
            <TituloSeccion titulo={`${sitio.textos.titulo_catalogo}.`} subtitulo={(() => { const n = todos.filter(esTarjeta).length; return `${n} ${n === 1 ? `${sitio.textos.item} disponible` : `${sitio.textos.items} disponibles`}.`; })()} />
          </Box>
          <BarraFiltros
            busqueda={busqueda} onBusqueda={setBusqueda}
            categorias={ordenadas.map((c) => ({ id: c.id, nombre: c.nombre }))}
            filtro={filtro} onFiltro={setFiltro}
            orden={orden} onOrden={setOrden}
            nFiltros={nFiltros} panel={panel} onPanel={() => setPanel((v) => !v)}
          />

          <PanelFiltros abierto={panel} filtros={filtros} onFiltros={setFiltros} marcas={marcas} colores={colores}
            rango={rangoPrecio} hayPromos={hayPromos} />

          {/* Escritorio: menú lateral de categorías + productos. Celular: solo las píldoras de arriba */}
          <Box sx={{ display: { md: "grid" }, gridTemplateColumns: { md: "232px minmax(0, 1fr)", lg: "256px minmax(0, 1fr)" }, gap: { md: 4, lg: 5 }, alignItems: "start" }}>
          {ordenadas.length > 1 && (
            <MenuCategorias
              categorias={ordenadas.map((c) => ({
                id: c.id, nombre: c.nombre, cantidad: c.platos.filter(esTarjeta).length,
                // Imagen de la categoría y, si falla o no hay, fotos de sus productos
                imagenes: [c.imagen, ...(sitio.mostrarFotosDeProductos ? c.platos.flatMap((p) => p.imagenes.slice(0, 1)) : [])].filter(Boolean).slice(0, 4) as string[],
              }))}
              total={todos.filter(esTarjeta).length}
              filtro={filtro}
              onFiltro={(id) => { setFiltro(id); irA("catalogo"); }}
            />
          )}
          <Box sx={{ minWidth: 0, gridColumn: ordenadas.length > 1 ? undefined : { md: "1 / -1" } }}>

          {filtrando && (
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography sx={{ color: T.muted, fontSize: 14 }}>{total} {total === 1 ? sitio.textos.item : sitio.textos.items}</Typography>
              <Box component="button" type="button" onClick={limpiar} sx={{ ...enlace, border: 0, background: "none", font: "inherit", fontSize: 14 }}>Limpiar todo</Box>
            </Stack>
          )}

          {visibles.length === 0 && (
            <Box sx={{ py: 10, textAlign: "center", color: T.muted }}>
              <SearchIcon sx={{ fontSize: 44, opacity: 0.5 }} />
              <Typography sx={{ mt: 1, fontWeight: 600, fontSize: 19, color: T.text }}>
                {categorias.length === 0 ? sitio.textos.sin_items : `No encontramos ${sitio.textos.items} con esos criterios.`}
              </Typography>
              {filtrando && <Button onClick={limpiar} sx={{ ...btnSecundario, mt: 2 }}>Ver todo</Button>}
            </Box>
          )}

          <LayoutGroup>
            {visibles.map((c) => (
              <Box key={c.id} component="section" sx={{ mb: { xs: 5, md: 7 }, scrollMarginTop: 140 }} aria-labelledby={`cat-${c.id}`}>
                <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 2.5 }}>
                  <Typography id={`cat-${c.id}`} component="h3" sx={titulo(21, 26)}>{c.nombre}</Typography>
                  <Typography sx={{ fontSize: 13, color: T.muted }}>{c.platos.length} {c.platos.length === 1 ? sitio.textos.item : sitio.textos.items}</Typography>
                </Stack>
                <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2.5 }, gridTemplateColumns: { xs: "1fr 1fr", md: ordenadas.length > 1 ? "repeat(2, 1fr)" : "repeat(3, 1fr)", lg: ordenadas.length > 1 ? "repeat(3, 1fr)" : "repeat(4, 1fr)" } }}>
                  {c.platos.map((p, i) => (
                    <motion.div key={p.id} layout={!reducido} transition={{ duration: 0.35, ease: EASE }}>
                      <Aparecer retraso={Math.min(i, 8) * 0.04}>{tarjeta(p)}</Aparecer>
                    </motion.div>
                  ))}
                </Box>
              </Box>
            ))}
          </LayoutGroup>
          </Box>
          </Box>
        </>
      )}

      <Snackbar open={Boolean(aviso)} autoHideDuration={3500} onClose={() => setAviso(null)} message={aviso} anchorOrigin={{ vertical: "top", horizontal: "center" }} />
    </Container>
  );
}

/* ================================================================
 * Portada: nombre grande + subtítulo gris, estado y ayuda
 * ================================================================ */
function Portada({ tienda }: { tienda: EstadoTienda | null }) {
  const sitio = useSitio();
  const reducido = useReducedMotion();
  const { textos } = sitio;
  const entrada = (i: number) => (reducido ? {} : { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.8, delay: 0.1 * i, ease: EASE } });
  const color = tienda?.abierta === false ? T.warn : "#1d9a4a";

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: { xs: 3, md: 6 }, alignItems: { md: "flex-end" }, justifyContent: "space-between" }}>
      <motion.div {...entrada(0)} style={{ maxWidth: 760 }}>
        <Typography component="h1" sx={{ ...titulo(40, 72), lineHeight: 1.04 }}>{textos.tienda_titulo.replace(/\.$/, "")}.</Typography>
        <Typography sx={{ ...titulo(21, 30), color: T.muted, mt: { xs: 1, md: 1.5 }, lineHeight: 1.2, maxWidth: 680 }}>{textos.tienda_subtitulo}</Typography>
      </motion.div>
      <motion.div {...entrada(1)} style={{ flexShrink: 0 }}>
        <Stack spacing={1.2} sx={{ minWidth: { md: 240 } }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PuntoVivo color={color} tam={8} />
            <Typography sx={{ fontSize: 14, fontWeight: 500, color: T.text }}>
              {!tienda ? "Cargando…" : tienda.abierta ? "Abierto · recibiendo pedidos" : tienda.motivo}
            </Typography>
          </Stack>
          {tienda?.abierta === false && tienda.horarios.length > 0 && (
            <Typography sx={{ fontSize: 13, color: T.muted, maxWidth: 300 }}>Horario: {textoHorario(tienda.horarios)}</Typography>
          )}
          {sitio.whatsapp && (
            <Box>
              <Typography sx={{ fontSize: 13, color: T.muted }}>¿Necesitas ayuda para elegir?</Typography>
              <Box component="a" href={waLink(sitio, sitio.mensajeWhatsapp)} target="_blank" rel="noopener noreferrer" sx={{ ...enlace, fontSize: 14 }}>
                Escríbenos por WhatsApp ›
              </Box>
            </Box>
          )}
        </Stack>
      </motion.div>
    </Box>
  );
}

/* "Comprar con nosotros": entrega, pago y horario reales de la tienda */
function Beneficios({ tienda }: { tienda: EstadoTienda | null }) {
  const sitio = useSitio();
  const { textos } = sitio;
  if (!tienda) return null;
  const entrega = tienda.entrega;
  const items: { icono: ReactNode; titulo: string; texto: string; color: string }[] = [
    ...(entrega.domicilio ? [{
      icono: <DeliveryDiningIcon />, color: "#0071e3", titulo: textos.domicilio,
      texto: entrega.costo_domicilio > 0
        ? `${pesos.format(entrega.costo_domicilio)}${entrega.domicilio_gratis_desde ? `. Gratis en compras desde ${pesos.format(entrega.domicilio_gratis_desde)}.` : "."}`
        : "Sin costo de envío.",
    }] : []),
    ...(entrega.recoger ? [{ icono: <StorefrontOutlinedIcon />, color: "#1d9a4a", titulo: textos.recoger, texto: sitio.direccion ? `${sitio.direccion}. Sin costo adicional.` : "Sin costo adicional." }] : []),
    {
      icono: tienda.pagos.en_linea ? <CreditCardIcon /> : <PaymentsOutlinedIcon />, color: "#bf4800", titulo: "Paga como prefieras",
      texto: [tienda.pagos.en_linea && "Tarjeta, PSE o Nequi en línea", tienda.pagos.contraentrega && "o al recibir"].filter(Boolean).join(" ") + ".",
    },
    ...(tienda.horarios.length ? [{ icono: <ScheduleIcon />, color: "#8e44ad", titulo: "Horario", texto: textoHorario(tienda.horarios) }] : []),
    ...(sitio.whatsapp ? [{ icono: <WhatsAppIcon />, color: "#1fa855", titulo: "Atención por WhatsApp", texto: "Resolvemos tus dudas antes y después de tu compra." }] : []),
  ];
  return (
    <Estante id="beneficios" titulo="Comprar con nosotros." subtitulo="Fácil, rápido y seguro." ancho={{ xs: 240, md: 280 }}>
      {items.map((b) => (
        <Box key={b.titulo} sx={{ ...tarjeta, p: 3, height: "100%", minHeight: { xs: 150, md: 170 }, display: "flex", flexDirection: "column" }}>
          <Box sx={{ color: b.color, "& svg": { fontSize: 34 } }}>{b.icono}</Box>
          <Typography sx={{ mt: 2, fontWeight: 600, fontSize: 19, letterSpacing: "-0.015em", lineHeight: 1.2 }}>{b.titulo}</Typography>
          <Typography sx={{ mt: 0.75, fontSize: 14, color: T.muted, lineHeight: 1.45 }}>{b.texto}</Typography>
        </Box>
      ))}
    </Estante>
  );
}

/* Búsqueda + categorías con indicador animado + orden + botón de filtros (fija bajo el encabezado) */
function BarraFiltros({ busqueda, onBusqueda, categorias, filtro, onFiltro, orden, onOrden, nFiltros, panel, onPanel }: {
  busqueda: string; onBusqueda: (v: string) => void; categorias: { id: number; nombre: string }[];
  filtro: number | "todo"; onFiltro: (v: number | "todo") => void; orden: Orden; onOrden: (o: Orden) => void;
  nFiltros: number; panel: boolean; onPanel: () => void;
}) {
  const { textos } = useSitio();
  const reducido = useReducedMotion();
  const opciones: { id: number | "todo"; nombre: string }[] = [{ id: "todo", nombre: "Todo" }, ...categorias];
  const campo = { "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: T.wash, "& fieldset": { border: 0 }, "&.Mui-focused": { boxShadow: `0 0 0 3px color-mix(in srgb, ${T.accent} 35%, transparent)` } } };
  return (
    <Box sx={{ position: "sticky", top: { xs: 52, md: 52 }, zIndex: 20, mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, py: 1.5, mt: 2, mb: 3, bgcolor: T.navBg, backdropFilter: "saturate(1.8) blur(20px)", borderBottom: `1px solid ${T.line}` }}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
        <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
          <TextField
            size="small" placeholder={textos.buscar} value={busqueda} onChange={(e) => onBusqueda(e.target.value)}
            sx={{ flex: 1, minWidth: { md: 260 }, ...campo }}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: T.muted, fontSize: 20 }} /></InputAdornment>,
              endAdornment: busqueda ? <InputAdornment position="end"><IconButton size="small" onClick={() => onBusqueda("")} aria-label="Limpiar búsqueda"><CloseIcon fontSize="small" /></IconButton></InputAdornment> : undefined,
            }}
            inputProps={{ "aria-label": textos.buscar }}
          />
          <Badge badgeContent={nFiltros} color="primary" overlap="circular">
            <IconButton onClick={onPanel} aria-expanded={panel} aria-label="Filtros"
              sx={{ borderRadius: "12px", bgcolor: panel || nFiltros ? `color-mix(in srgb, ${T.accent} 14%, transparent)` : T.wash, color: panel || nFiltros ? T.accent : T.text }}>
              <TuneIcon fontSize="small" />
            </IconButton>
          </Badge>
          <TextField select size="small" value={orden} onChange={(e) => onOrden(e.target.value as Orden)} aria-label="Ordenar"
            sx={{ minWidth: 150, display: { xs: "none", sm: "flex" }, ...campo }}>
            <MenuItem value="relevancia">Relevancia</MenuItem>
            <MenuItem value="precio_asc">Menor precio</MenuItem>
            <MenuItem value="precio_desc">Mayor precio</MenuItem>
            <MenuItem value="nombre">Nombre A–Z</MenuItem>
            <MenuItem value="novedades">Novedades</MenuItem>
          </TextField>
        </Stack>
        <LayoutGroup id="categorias">
          <Box role="tablist" aria-label="Categorías" sx={{ display: "flex", gap: 0.5, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
            {opciones.map((c) => {
              const activa = filtro === c.id;
              return (
                <Box key={String(c.id)} component="button" role="tab" aria-selected={activa} onClick={() => onFiltro(c.id)}
                  sx={{ position: "relative", border: 0, cursor: "pointer", font: "inherit", fontWeight: 500, fontSize: 14, whiteSpace: "nowrap", px: 1.8, py: 0.9, borderRadius: 999,
                    color: activa ? T.bg : T.text2, bgcolor: activa && reducido ? T.text : "transparent", transition: "color .25s ease", "&:hover": { color: activa ? T.bg : T.text },
                    "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 } }}>
                  {activa && !reducido && (
                    <motion.span layoutId="categoria-activa" transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      style={{ position: "absolute", inset: 0, borderRadius: 999, background: "var(--pu-text)" }} />
                  )}
                  <span style={{ position: "relative" }}>{c.nombre}</span>
                </Box>
              );
            })}
          </Box>
        </LayoutGroup>
      </Stack>
    </Box>
  );
}

/* Miniatura que prueba varias imágenes; si ninguna carga, muestra la inicial o un ícono */
function Miniatura({ imagenes, tam, radio, vacio, activa = false }: { imagenes: string[]; tam: number; radio: number; vacio: ReactNode; activa?: boolean }) {
  const [fallidas, setFallidas] = useState(0);
  const src = imagenes[fallidas];
  return (
    <Box sx={{ width: tam, height: tam, flexShrink: 0, borderRadius: `${radio}px`, overflow: "hidden", display: "grid", placeItems: "center",
      bgcolor: src ? "#fff" : activa ? T.text : T.surface, color: activa && !src ? T.bg : T.muted, boxShadow: `inset 0 0 0 1px ${T.line}`,
      transition: "background-color .25s ease, color .25s ease" }}>
      {src
        ? <Box component="img" key={src} src={src} alt="" loading="lazy" onError={() => setFallidas((n) => n + 1)}
            sx={{ width: "100%", height: "100%", objectFit: "contain", p: tam > 60 ? 1 : 0.5 }} />
        : typeof vacio === "string" ? <Typography sx={{ fontWeight: 600, fontSize: tam * 0.38, lineHeight: 1 }}>{vacio}</Typography> : vacio}
    </Box>
  );
}

/* Menú lateral de categorías (escritorio), fijo al bajar */
function MenuCategorias({ categorias, total, filtro, onFiltro }: {
  categorias: { id: number; nombre: string; cantidad: number; imagenes: string[] }[];
  total: number; filtro: number | "todo"; onFiltro: (id: number | "todo") => void;
}) {
  const { textos } = useSitio();
  const reducido = useReducedMotion();
  const opciones = [{ id: "todo" as const, nombre: "Todo", cantidad: total, imagenes: [] as string[] }, ...categorias];
  return (
    <Box component="nav" aria-label="Categorías" sx={{ display: { xs: "none", md: "block" }, position: "sticky", top: 140, maxHeight: "calc(100vh - 160px)", overflowY: "auto",
      pr: 0.5, scrollbarWidth: "thin" }}>
      <Typography sx={{ fontSize: 12, fontWeight: 600, color: T.muted, letterSpacing: "0.04em", textTransform: "uppercase", px: 1.5, mb: 1 }}>Categorías</Typography>
      <LayoutGroup id="menu-lateral">
        <Stack spacing={0.5}>
          {opciones.map((c, i) => {
            const activa = filtro === c.id;
            return (
              <motion.button key={String(c.id)} type="button" onClick={() => onFiltro(c.id)} aria-current={activa ? "true" : undefined}
                initial={reducido ? false : { opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i, 10) * 0.03, duration: 0.35, ease: EASE }}
                whileHover={reducido ? undefined : { x: 3 }}
                style={{ position: "relative", border: 0, background: "none", padding: 0, font: "inherit", textAlign: "left", cursor: "pointer", borderRadius: 14, color: "inherit" }}>
                {activa && !reducido && (
                  <motion.span layoutId="menu-lateral-activa" transition={{ type: "spring", stiffness: 420, damping: 36 }}
                    style={{ position: "absolute", inset: 0, borderRadius: 14, background: "var(--pu-surface)", boxShadow: "0 4px 16px var(--pu-shadow)" }} />
                )}
                <Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative", px: 1.25, py: 1, borderRadius: "14px",
                  bgcolor: activa && reducido ? T.surface : "transparent", "&:hover": { bgcolor: activa ? undefined : T.wash } }}>
                  <Miniatura imagenes={c.imagenes} tam={44} radio={12} activa={activa}
                    vacio={c.id === "todo" ? <AppsIcon fontSize="small" /> : c.nombre.slice(0, 1).toUpperCase()} />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontSize: 14.5, fontWeight: activa ? 600 : 500, color: T.text, letterSpacing: "-0.01em" }}>{c.nombre}</Typography>
                    <Typography sx={{ fontSize: 12, color: T.muted }}>{c.cantidad} {c.cantidad === 1 ? textos.item : textos.items}</Typography>
                  </Box>
                  {activa && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: T.accent, flexShrink: 0 }} />}
                </Stack>
              </motion.button>
            );
          })}
        </Stack>
      </LayoutGroup>
    </Box>
  );
}

/* Panel desplegable de filtros (solo muestra los filtros que tienen datos) */
function PanelFiltros({ abierto, filtros, onFiltros, marcas, colores, rango, hayPromos }: {
  abierto: boolean; filtros: Filtros; onFiltros: (f: Filtros) => void; marcas: string[]; colores: [string, string | null | undefined][];
  rango: [number, number]; hayPromos: boolean;
}) {
  const reducido = useReducedMotion();
  const alternar = (lista: string[], v: string) => (lista.includes(v) ? lista.filter((x) => x !== v) : [...lista, v]);
  const precio = filtros.precio ?? rango;
  const chip = (activo: boolean) => ({
    fontWeight: 500, borderRadius: "10px", height: 34, bgcolor: activo ? `color-mix(in srgb, ${T.accent} 14%, transparent)` : T.surface,
    color: activo ? T.accent : T.text, border: `1px solid ${activo ? T.accent : T.line}`, "&:hover": { bgcolor: activo ? `color-mix(in srgb, ${T.accent} 20%, transparent)` : T.wash },
  });
  return (
    <AnimatePresence initial={false}>
      {abierto && (
        <motion.div initial={reducido ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reducido ? undefined : { height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: EASE }} style={{ overflow: "hidden" }}>
          <Box sx={{ ...tarjeta, mb: 3, p: { xs: 2.5, md: 3 }, display: "grid", gap: 3, gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" } }}>
            {rango[1] > rango[0] && (
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 1 }}>Precio</Typography>
                <Slider value={precio} min={rango[0]} max={rango[1]} step={500} onChange={(_, v) => onFiltros({ ...filtros, precio: v as [number, number] })}
                  valueLabelDisplay="auto" valueLabelFormat={(v) => pesos.format(v)} getAriaLabel={(i) => (i ? "Precio máximo" : "Precio mínimo")} />
                <Typography sx={{ fontSize: 13, color: T.muted }}>{pesos.format(precio[0])} – {pesos.format(precio[1])}</Typography>
              </Box>
            )}
            {marcas.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 1 }}>Marca</Typography>
                <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                  {marcas.map((m) => (
                    <Chip key={m} label={m} onClick={() => onFiltros({ ...filtros, marcas: alternar(filtros.marcas, m) })} sx={chip(filtros.marcas.includes(m))} />
                  ))}
                </Stack>
              </Box>
            )}
            {colores.length > 0 && (
              <Box>
                <Typography sx={{ fontWeight: 600, fontSize: 15, mb: 1 }}>Color / variante</Typography>
                <Stack direction="row" spacing={0.8} useFlexGap flexWrap="wrap">
                  {colores.map(([nombre, color]) => (
                    <Chip key={nombre} label={nombre} onClick={() => onFiltros({ ...filtros, colores: alternar(filtros.colores, nombre) })} sx={chip(filtros.colores.includes(nombre))}
                      avatar={color ? <Box sx={{ width: 14, height: 14, borderRadius: "50%", bgcolor: color, ml: "8px !important", boxShadow: `inset 0 0 0 1px ${T.soft}` }} /> : undefined} />
                  ))}
                </Stack>
              </Box>
            )}
            {hayPromos && (
              <FormControlLabel control={<Switch checked={filtros.promo} onChange={(e) => onFiltros({ ...filtros, promo: e.target.checked })} />}
                label={<Typography sx={{ fontWeight: 500, fontSize: 15 }}>Solo en promoción</Typography>} />
            )}
            {!marcas.length && !colores.length && !hayPromos && rango[1] <= rango[0] && (
              <Typography sx={{ color: T.muted, fontSize: 14 }}>No hay filtros disponibles para estos productos.</Typography>
            )}
          </Box>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
