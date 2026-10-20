import { useState } from "react";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Container, IconButton, InputAdornment, Skeleton, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import { T, btnPrimario } from "./tokens";
import { useSitio, waLink } from "./siteConfig";
import { Encabezado } from "./Comunes";
import { useMenu } from "./useMenu";
import type { Categoria, Opcion, Plato } from "./useMenu";
import { rutaProducto } from "../tienda/util";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function listaOpciones(opciones: Opcion[]): string {
  return opciones
    .map((o) => (o.extra > 0 ? `${o.nombre} (+${pesos.format(o.extra)})` : o.nombre))
    .join(" · ");
}

/* Destino al tocar un plato: su ficha en la tienda o, sin tienda, WhatsApp */
function useDestino(plato: Plato) {
  const sitio = useSitio();
  return sitio.tiendaActiva
    ? { component: RouterLink, to: rutaProducto(sitio.base, plato) }
    : { component: "a", href: waLink(sitio, `Hola ${sitio.nombre}, quiero pedir: ${plato.nombre}.`), target: "_blank", rel: "noopener noreferrer" };
}

/* Tarjeta horizontal de la carta: texto a la izquierda, foto a la derecha */
function FilaPlato({ plato }: { plato: Plato }) {
  const sitio = useSitio();
  const reducido = useReducedMotion();
  const destino = useDestino(plato);
  const conFoto = sitio.mostrarFotosDeProductos && plato.imagen;
  const accion = sitio.tiendaActiva ? `Ver ${plato.nombre}` : `Pedir ${plato.nombre} por WhatsApp`;

  const botonMas = (
    <Box aria-hidden className="pu-mas"
      sx={{ width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: T.accent, color: T.accentInk,
        boxShadow: `0 6px 16px ${T.shadow}`, transition: "transform .25s cubic-bezier(.22,1,.36,1)" }}>
      {sitio.tiendaActiva ? <AddIcon sx={{ fontSize: 22 }} /> : <WhatsAppIcon sx={{ fontSize: 19 }} />}
    </Box>
  );

  return (
    <motion.li style={{ listStyle: "none" }} whileHover={reducido || plato.agotado ? undefined : { y: -4 }} transition={{ type: "spring", stiffness: 320, damping: 24 }}>
      <Box {...(plato.agotado ? { component: "div" } : destino)} aria-label={plato.agotado ? undefined : accion}
        sx={{
          height: "100%", display: "flex", gap: 2, p: { xs: 1.75, md: 2 }, borderRadius: "20px", textDecoration: "none", color: T.text,
          bgcolor: T.bg, border: `1px solid ${T.line}`, opacity: plato.agotado ? 0.55 : 1, cursor: plato.agotado ? "default" : "pointer",
          transition: "box-shadow .35s ease, border-color .35s ease",
          "&:hover": plato.agotado ? undefined : { boxShadow: `0 16px 36px ${T.shadow}`, borderColor: T.soft },
          "&:hover .pu-mas": { transform: reducido ? "none" : "scale(1.12) rotate(90deg)" },
          "&:hover .pu-foto": { transform: reducido ? "none" : "scale(1.07)" },
          "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 },
        }}>
        <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Typography component="h4" sx={{ fontFamily: T.body, fontWeight: 700, fontSize: { xs: 15.5, md: 17 }, lineHeight: 1.3, letterSpacing: "-0.01em" }}>
            {plato.nombre}
          </Typography>
          {plato.aElegir.length > 0 && (
            <Typography sx={{ mt: 0.6, fontFamily: T.body, fontSize: 13, lineHeight: 1.45, color: T.muted,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              <Box component="span" sx={{ color: T.text2, fontWeight: 600 }}>{sitio.textos.a_elegir}: </Box>
              {listaOpciones(plato.aElegir)}
            </Typography>
          )}
          {plato.adiciones.length > 0 && (
            <Typography sx={{ mt: 0.4, fontFamily: T.body, fontSize: 13, color: T.muted, display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              <Box component="span" sx={{ color: T.text2, fontWeight: 600 }}>{sitio.textos.adiciones}: </Box>
              {listaOpciones(plato.adiciones)}
            </Typography>
          )}
          <Box sx={{ mt: "auto", pt: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            {plato.agotado ? (
              <Box sx={{ px: 1.2, py: 0.4, borderRadius: 999, bgcolor: T.wash, fontFamily: T.body, fontSize: 12, fontWeight: 700, color: T.muted }}>Agotado</Box>
            ) : (
              plato.precio !== null && (
                <Typography sx={{ fontFamily: T.body, fontWeight: 800, fontSize: { xs: 17, md: 18 }, color: T.text, fontVariantNumeric: "tabular-nums" }}>
                  {pesos.format(plato.precio)}
                </Typography>
              )
            )}
            {!conFoto && !plato.agotado && botonMas}
          </Box>
        </Box>

        {conFoto && (
          <Box sx={{ position: "relative", flexShrink: 0, width: { xs: 104, md: 124 }, height: { xs: 104, md: 124 } }}>
            <Box sx={{ width: "100%", height: "100%", borderRadius: "16px", overflow: "hidden", bgcolor: T.surface2 }}>
              <Box className="pu-foto" component="img" src={plato.imagen} alt={plato.nombre} loading="lazy" decoding="async" width={124} height={124}
                onError={(e: { currentTarget: HTMLImageElement }) => { e.currentTarget.style.visibility = "hidden"; }}
                sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block", transition: "transform .6s cubic-bezier(.22,1,.36,1)" }} />
            </Box>
            {!plato.agotado && <Box sx={{ position: "absolute", right: -6, bottom: -6 }}>{botonMas}</Box>}
          </Box>
        )}
      </Box>
    </motion.li>
  );
}

/* Vista de comercio: tarjetas con foto (o ícono), nombre y precio */
function TarjetaProducto({ plato }: { plato: Plato }) {
  const sitio = useSitio();
  const conFoto = sitio.mostrarFotosDeProductos && plato.imagen;
  const enlace = sitio.tiendaActiva
    ? { component: RouterLink, to: `${sitio.base}/tienda` }
    : { component: "a", href: waLink(sitio, `Hola ${sitio.nombre}, quiero: ${plato.nombre}.`), target: "_blank", rel: "noopener noreferrer" };
  return (
    <Box sx={{ display: "flex", flexDirection: "column", border: `1px solid ${T.line}`, borderRadius: 3, overflow: "hidden", bgcolor: T.bg, opacity: plato.agotado ? 0.55 : 1 }}>
      <Box sx={{ aspectRatio: "4 / 3", bgcolor: T.surface2, display: "grid", placeItems: "center", color: T.muted }}>
        {conFoto
          ? <Box component="img" src={plato.imagen} alt={plato.nombre} loading="lazy" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <ShoppingBagOutlinedIcon sx={{ fontSize: 34, opacity: 0.6 }} />}
      </Box>
      <Box sx={{ p: 1.5, display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
        <Typography component="h4" sx={{ fontFamily: T.body, fontWeight: 700, fontSize: 15, lineHeight: 1.3 }}>{plato.nombre}</Typography>
        <Box sx={{ mt: "auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
          <Typography sx={{ fontFamily: T.display, fontWeight: 700, fontSize: 22 }}>
            {plato.agotado ? "Agotado" : plato.precio !== null ? pesos.format(plato.precio) : ""}
          </Typography>
          {!plato.agotado && (
            <Box {...enlace} sx={{ fontFamily: T.body, fontSize: 13, fontWeight: 700, color: T.accent, textDecoration: "none", "&:hover": { textDecoration: "underline" } }}>
              {sitio.textos.pedir_corto}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function BloqueCategoria({ categoria }: { categoria: Categoria }) {
  const { vistaCatalogo, textos } = useSitio();
  const reducido = useReducedMotion();
  return (
    <Box component="section" aria-labelledby={`carta-${categoria.id}`} sx={{ mb: { xs: 6, md: 8 }, scrollMarginTop: 150 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2.5 }}>
        <Typography id={`carta-${categoria.id}`} component="h3"
          sx={{ fontFamily: T.body, fontWeight: 800, fontSize: { xs: 24, md: 30 }, lineHeight: 1.1, letterSpacing: "-0.02em" }}>
          {categoria.nombre}
        </Typography>
        <Box sx={{ px: 1.2, py: 0.3, borderRadius: 999, bgcolor: T.wash, fontFamily: T.body, fontSize: 12.5, fontWeight: 700, color: T.muted }}>
          {categoria.platos.length} {categoria.platos.length === 1 ? textos.item : textos.items}
        </Box>
      </Box>

      {vistaCatalogo === "cuadricula" ? (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" } }}>
          {categoria.platos.map((p) => <TarjetaProducto key={p.id} plato={p} />)}
        </Box>
      ) : (
        <Box component="ul" sx={{ m: 0, p: 0, display: "grid", gap: { xs: 1.5, md: 2 }, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {categoria.platos.map((p, i) => (
            <motion.div key={p.id} style={{ height: "100%" }}
              initial={reducido ? false : { opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: Math.min(i, 6) * 0.04, ease: [0.22, 1, 0.36, 1] }}>
              <FilaPlato plato={p} />
            </motion.div>
          ))}
        </Box>
      )}
    </Box>
  );
}

function Filtro({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: string }) {
  const reducido = useReducedMotion();
  return (
    <Box component="button" type="button" onClick={onClick} aria-pressed={activo}
      sx={{
        position: "relative", flexShrink: 0, px: 2, minHeight: 40, borderRadius: 999, cursor: "pointer", border: 0,
        fontFamily: T.body, fontSize: 14, fontWeight: 700, bgcolor: activo && reducido ? T.text : "transparent",
        color: activo ? T.bg : T.text2, transition: "color .25s ease", "&:hover": { color: activo ? T.bg : T.text },
        "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 },
      }}>
      {activo && !reducido && (
        <motion.span layoutId="carta-filtro" transition={{ type: "spring", stiffness: 420, damping: 36 }}
          style={{ position: "absolute", inset: 0, borderRadius: 999, background: "var(--pu-text)" }} />
      )}
      <span style={{ position: "relative" }}>{children}</span>
    </Box>
  );
}

export default function Menu() {
  const sitio = useSitio();
  const { estado, categorias } = useMenu();
  const [filtro, setFiltro] = useState<number | "todo">("todo");
  const [busqueda, setBusqueda] = useState("");
  const reducido = useReducedMotion();

  const q = busqueda.trim().toLowerCase();
  const visibles = categorias
    .filter((c) => filtro === "todo" || c.id === filtro)
    .map((c) => (q ? { ...c, platos: c.platos.filter((p) => `${p.nombre} ${p.aElegir.map((o) => o.nombre).join(" ")}`.toLowerCase().includes(q)) } : c))
    .filter((c) => c.platos.length > 0);
  const elegir = (id: number | "todo") => {
    setFiltro(id);
    document.getElementById("menu-carta")?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "start" });
  };

  return (
    <Box
      component="section"
      id="menu"
      sx={{
        py: { xs: 10, md: 16 },
        bgcolor: T.surface,
        borderTop: `1px solid ${T.line}`,
      }}
    >
      <Container maxWidth="lg">
        <Encabezado etiqueta={sitio.textos.seccion_catalogo} titulo={sitio.textos.titulo_catalogo}>
          {sitio.textos.subtitulo_catalogo}
        </Encabezado>

        {sitio.tiendaActiva && <Button
          component={RouterLink}
          to={`${sitio.base}/tienda`}
          startIcon={<ShoppingBagOutlinedIcon />}
          sx={{ ...btnPrimario, mt: { xs: -2, md: -3 }, mb: { xs: 5, md: 6 } }}
        >
          {sitio.textos.pedir_linea}
        </Button>}

        {/* CARGANDO */}
        {estado === "cargando" && (
          <Box aria-busy="true" aria-label={`Cargando ${sitio.textos.titulo_catalogo.toLowerCase()}`}>
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={64}
                sx={{ mb: 1.5, bgcolor: T.wash }}
              />
            ))}
          </Box>
        )}

        {/* SIN CONEXIÓN CON LA CARTA: salida real por WhatsApp */}
        {estado === "error" && (
          <Box
            role="status"
            sx={{
              p: { xs: 3, md: 5 },
              border: `1px solid ${T.line}`,
              borderRadius: 4,
              maxWidth: 620,
            }}
          >
            <Typography
              sx={{
                fontFamily: T.display,
                fontWeight: 700,
                fontSize: 30,
                lineHeight: 1.05,
                textTransform: "uppercase",
              }}
            >
              {sitio.textos.catalogo_error}
            </Typography>
            <Typography
              sx={{ mt: 1.5, mb: 3, fontFamily: T.body, color: T.muted }}
            >
              Escríbenos y te la enviamos de inmediato por WhatsApp.
            </Typography>
            <Button
              href={waLink(sitio, `Hola ${sitio.nombre}, ${sitio.textos.pedir_catalogo_wa}`)}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon />}
              sx={btnPrimario}
            >
              {sitio.textos.pedir_catalogo}
            </Button>
          </Box>
        )}

        {estado === "listo" && (
          <>
            {/* BARRA FIJA: categorías con indicador animado + búsqueda */}
            <Box id="menu-carta" sx={{ position: "sticky", top: { xs: 64, md: 72 }, zIndex: 5, mx: { xs: -2, sm: -3 }, px: { xs: 2, sm: 3 }, py: 1.5, mb: { xs: 4, md: 5 },
              bgcolor: T.navBg, backdropFilter: "saturate(1.6) blur(16px)", borderBottom: `1px solid ${T.line}`, scrollMarginTop: 72 }}>
              <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 1.5, alignItems: { md: "center" } }}>
                {categorias.length > 1 && (
                  <LayoutGroup id="carta">
                    <Box role="group" aria-label={`Filtrar ${sitio.textos.titulo_catalogo.toLowerCase()} por categoría`}
                      sx={{ flex: 1, minWidth: 0, display: "flex", gap: 0.5, overflowX: "auto", scrollbarWidth: "none", "&::-webkit-scrollbar": { display: "none" } }}>
                      <Filtro activo={filtro === "todo"} onClick={() => elegir("todo")}>Todo</Filtro>
                      {categorias.map((c) => (
                        <Filtro key={c.id} activo={filtro === c.id} onClick={() => elegir(c.id)}>{c.nombre}</Filtro>
                      ))}
                    </Box>
                  </LayoutGroup>
                )}
                <TextField size="small" placeholder={sitio.textos.buscar} value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                  inputProps={{ "aria-label": sitio.textos.buscar }}
                  sx={{ width: { xs: "100%", md: 280 }, flexShrink: 0, "& .MuiOutlinedInput-root": { borderRadius: 999, bgcolor: T.bg, fontFamily: T.body, fontSize: 14,
                    "& fieldset": { borderColor: T.line }, "&:hover fieldset": { borderColor: T.soft }, "&.Mui-focused fieldset": { borderColor: T.accent } } }}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 20, color: T.muted }} /></InputAdornment>,
                    endAdornment: busqueda ? <InputAdornment position="end"><IconButton size="small" onClick={() => setBusqueda("")} aria-label="Limpiar búsqueda"><CloseIcon fontSize="small" /></IconButton></InputAdornment> : undefined,
                  }} />
              </Box>
            </Box>

            {/* CARTA */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={`${filtro}-${q ? "q" : ""}`}
                initial={reducido ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducido ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {visibles.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: "center" }}>
                    <SearchIcon sx={{ fontSize: 40, color: T.muted, opacity: 0.6 }} />
                    <Typography sx={{ mt: 1, fontFamily: T.body, fontWeight: 700, fontSize: 18 }}>No encontramos “{busqueda}”</Typography>
                    <Button onClick={() => { setBusqueda(""); setFiltro("todo"); }} sx={{ mt: 1.5, fontFamily: T.body, fontWeight: 700, textTransform: "none", color: T.accent }}>Ver todo</Button>
                  </Box>
                ) : (
                  visibles.map((c) => <BloqueCategoria key={c.id} categoria={c} />)
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </Container>
    </Box>
  );
}
