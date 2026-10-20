/*
 * Marco común de la tienda: encabezado, carrito, checkout y animación de
 * "volar al carrito". Lo usan el catálogo y la página de producto.
 */
import { useCallback, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Alert, Box, Button, Container, Drawer, IconButton, Snackbar, Stack, Typography, useMediaQuery,
} from "@mui/material";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

import logo from "../../../assets/img/img_puntourbano/logosinfondo.jpeg";
import { T } from "../landing/tokens";
import { btnPrimario, btnSecundario } from "./estilo";
import ThemeSelector from "../landing/ThemeSelector";
import { useSitio } from "../landing/siteConfig";
import { misPedidos, pesos } from "./api";
import type { EstadoTienda } from "./api";
import { precioLinea, useCarrito } from "./carritoContexto";
import type { Linea } from "./carritoContexto";
import { NumeroAnimado } from "./Animaciones";
import { ContextoMarco } from "./marcoContexto";
import Checkout from "./Checkout";
import type { Marco } from "./marcoContexto";
import { EASE, estimarDomicilio, formatear, suave } from "./util";

type Vuelo = { id: number; x: number; y: number; dx: number; dy: number; imagen?: string };

export default function MarcoTienda({ children, barraMovil = true }: { children: ReactNode; barraMovil?: boolean }) {
  const sitio = useSitio();
  const carrito = useCarrito();
  const reducido = useReducedMotion();
  const [tienda, setTienda] = useState<EstadoTienda | null>(null);
  const [carritoAbierto, setCarritoAbierto] = useState(false);
  const [checkoutAbierto, setCheckoutAbierto] = useState(false);
  const [vuelos, setVuelos] = useState<Vuelo[]>([]);
  const iconoCarrito = useRef<HTMLButtonElement | null>(null);
  const noDisponible = useRef<() => void>(() => {});

  // El producto "vuela" desde donde se agregó hasta el ícono del carrito
  const volar = useCallback((origen: HTMLElement | null, imagen?: string) => {
    if (reducido || !origen || !iconoCarrito.current) return;
    const a = origen.getBoundingClientRect();
    const b = iconoCarrito.current.getBoundingClientRect();
    const x = a.left + a.width / 2, y = a.top + a.height / 2;
    const v = { id: Date.now() + Math.random(), x, y, dx: b.left + b.width / 2 - x, dy: b.top + b.height / 2 - y, imagen };
    setVuelos((l) => [...l, v]);
    window.setTimeout(() => setVuelos((l) => l.filter((z) => z.id !== v.id)), 900);
  }, [reducido]);

  // Las acciones son estables (no cambian cuando cambia `tienda`): las páginas
  // las usan en efectos y, si cambiaran, recargarían los datos en bucle.
  const acciones = useMemo(() => ({
    setTienda,
    abrirCarrito: () => setCarritoAbierto(true),
    abrirCheckout: () => { setCarritoAbierto(false); setCheckoutAbierto(true); },
    onNoDisponible: () => noDisponible.current(),
    setOnNoDisponible: (f: () => void) => { noDisponible.current = f; },
  }), []);
  const valor = useMemo<Marco>(() => ({ ...acciones, tienda, volar }), [acciones, tienda, volar]);

  return (
    <ContextoMarco.Provider value={valor}>
      <Box sx={{ minHeight: "100vh", bgcolor: T.bg, color: T.text, pb: { xs: 14, md: 8 }, overflowX: "clip" }}>
        <Encabezado unidades={carrito.unidades} onCarrito={() => setCarritoAbierto(true)} refCarrito={iconoCarrito} />
        {children}

        {/* Barra inferior en celular */}
        <AnimatePresence>
          {barraMovil && carrito.unidades > 0 && !carritoAbierto && (
            <motion.div
              initial={reducido ? false : { y: 90, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reducido ? undefined : { y: 90, opacity: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
              style={{ position: "fixed", left: 12, right: 12, bottom: "calc(12px + env(safe-area-inset-bottom, 0px))", zIndex: 30 }}
            >
              <Box sx={{ display: { xs: "block", md: "none" } }}>
                <Button fullWidth onClick={() => setCarritoAbierto(true)}
                  sx={{ ...btnPrimario, minHeight: 58, justifyContent: "space-between", px: 2.5, boxShadow: `0 14px 40px ${T.shadow}` }}>
                  <Stack direction="row" alignItems="center" spacing={1.2}>
                    <Box sx={{ minWidth: 28, height: 28, px: 0.8, borderRadius: 999, bgcolor: suave("#000", 18), display: "grid", placeItems: "center", fontSize: 14 }}>{carrito.unidades}</Box>
                    <span>Ver {sitio.textos.carrito.toLowerCase()}</span>
                  </Stack>
                  <NumeroAnimado valor={carrito.subtotal} formato={formatear} />
                </Button>
              </Box>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Productos volando al carrito */}
        {vuelos.map((v) => (
          <motion.div
            key={v.id}
            initial={{ x: v.x - 22, y: v.y - 22, scale: 1, opacity: 1 }}
            animate={{ x: [v.x - 22, v.x - 22 + v.dx * 0.5, v.x - 22 + v.dx], y: [v.y - 22, v.y - 22 + v.dy * 0.5 - 90, v.y - 22 + v.dy], scale: [1, 0.9, 0.35], opacity: [1, 1, 0.6] }}
            transition={{ duration: 0.8, ease: "easeInOut" }}
            style={{ position: "fixed", left: 0, top: 0, width: 44, height: 44, borderRadius: "50%", zIndex: 2500, pointerEvents: "none", overflow: "hidden",
              background: v.imagen ? `center / cover url(${v.imagen})` : "var(--pu-accent)", boxShadow: "0 8px 20px rgba(0,0,0,.35)", display: "grid", placeItems: "center" }}
          >
            {!v.imagen && <AddIcon sx={{ color: T.accentInk }} />}
          </motion.div>
        ))}

        <PanelCarrito abierto={carritoAbierto} tienda={tienda} onCerrar={() => setCarritoAbierto(false)}
          onContinuar={() => { setCarritoAbierto(false); setCheckoutAbierto(true); }} />

        {tienda && (
          <Checkout abierto={checkoutAbierto} tienda={tienda} onCerrar={() => setCheckoutAbierto(false)}
            onNoDisponible={() => { setCheckoutAbierto(false); noDisponible.current(); }} />
        )}
      </Box>
    </ContextoMarco.Provider>
  );
}

/* ================================================================
 * Encabezado
 * ================================================================ */
function Encabezado({ unidades, onCarrito, refCarrito }: { unidades: number; onCarrito: () => void; refCarrito: React.RefObject<HTMLButtonElement | null> }) {
  const sitio = useSitio();
  const reducido = useReducedMotion();
  const recientes = misPedidos();
  return (
    <Box component="header" sx={{ position: "sticky", top: 0, zIndex: 25, bgcolor: T.navBg, backdropFilter: "saturate(1.8) blur(20px)", borderBottom: `1px solid ${T.line}`, pt: "env(safe-area-inset-top, 0px)" }}>
      <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, md: 2 }, height: 52 }}>
        <Box component={RouterLink} to={sitio.base || "/"} sx={{ display: "flex", alignItems: "center", gap: 1, color: T.text, textDecoration: "none", minWidth: 0, flex: { xs: 1, md: "0 1 auto" }, opacity: 0.9, transition: "opacity .2s ease", "&:hover": { opacity: 1 } }} aria-label="Volver al inicio">
          <Box component="img" src={sitio.logo || logo} alt="" sx={{ width: 28, height: 28, borderRadius: "8px", objectFit: "cover" }} />
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 15, letterSpacing: "-0.01em" }}>{sitio.nombre}</Typography>
        </Box>
        <Stack direction="row" spacing={3} sx={{ flex: 1, justifyContent: "center", display: { xs: "none", md: "flex" } }}>
          {[
            { a: `${sitio.base}/tienda`, t: "Tienda" },
            { a: sitio.base || "/", t: "Inicio" },
            ...(recientes[0] ? [{ a: `/tienda/pedido/${recientes[0].codigo}/${recientes[0].token}`, t: "Mi pedido" }] : []),
          ].map((l) => (
            <Box key={l.t} component={RouterLink} to={l.a} sx={{ fontSize: 13, color: T.text, opacity: 0.8, textDecoration: "none", transition: "opacity .2s ease", "&:hover": { opacity: 1 } }}>{l.t}</Box>
          ))}
        </Stack>
        {recientes[0] && (
          <IconButton component={RouterLink} to={`/tienda/pedido/${recientes[0].codigo}/${recientes[0].token}`} aria-label="Mi pedido" sx={{ color: T.text, display: { md: "none" } }}>
            <ReceiptLongOutlinedIcon sx={{ fontSize: 21 }} />
          </IconButton>
        )}
        <ThemeSelector />
        <motion.div key={unidades} animate={reducido || unidades === 0 ? undefined : { scale: [1, 1.25, 0.94, 1] }} transition={{ duration: 0.45 }}>
          <IconButton ref={refCarrito} onClick={onCarrito} aria-label={`Abrir ${sitio.textos.carrito.toLowerCase()}, ${unidades} productos`} sx={{ color: T.text, position: "relative" }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
            <AnimatePresence>
              {unidades > 0 && (
                <motion.span initial={reducido ? false : { scale: 0 }} animate={{ scale: 1 }} exit={reducido ? undefined : { scale: 0 }}
                  style={{ position: "absolute", right: 2, bottom: 4, minWidth: 16, height: 16, padding: "0 4px", borderRadius: 999, background: "var(--pu-text)", color: "var(--pu-bg)",
                    fontSize: 10, fontWeight: 600, display: "grid", placeItems: "center", lineHeight: 1 }}>
                  {unidades}
                </motion.span>
              )}
            </AnimatePresence>
          </IconButton>
        </motion.div>
      </Container>
    </Box>
  );
}


export function Contador({ valor, min = 0, max, onCambio, etiqueta, compacto = false }: { valor: number; min?: number; max: number; onCambio: (n: number) => void; etiqueta: string; compacto?: boolean }) {
  const reducido = useReducedMotion();
  return (
    <Stack direction="row" alignItems="center" sx={{ border: `1px solid ${T.soft}`, borderRadius: 999, flexShrink: 0, height: compacto ? 36 : 48, bgcolor: T.bg }}>
      <IconButton size="small" onClick={() => onCambio(valor - 1)} disabled={valor <= min} aria-label={`Quitar uno de ${etiqueta}`} sx={{ color: T.text }}><RemoveIcon fontSize="small" /></IconButton>
      <Box sx={{ minWidth: 26, textAlign: "center", fontWeight: 700, overflow: "hidden" }} aria-live="polite">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span key={valor} style={{ display: "inline-block" }} initial={reducido ? false : { y: -14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={reducido ? undefined : { y: 14, opacity: 0 }} transition={{ duration: 0.18 }}>
            {valor}
          </motion.span>
        </AnimatePresence>
      </Box>
      <IconButton size="small" onClick={() => onCambio(valor + 1)} disabled={valor >= max} aria-label={`Agregar uno de ${etiqueta}`} sx={{ color: T.text }}><AddIcon fontSize="small" /></IconButton>
    </Stack>
  );
}

/* ================================================================
 * Carrito
 * ================================================================ */
function PanelCarrito({ abierto, tienda, onCerrar, onContinuar }: { abierto: boolean; tienda: EstadoTienda | null; onCerrar: () => void; onContinuar: () => void }) {
  const sitio = useSitio();
  const { textos } = sitio;
  const { lineas, subtotal, unidades, cambiarCantidad, quitar, agregar } = useCarrito();
  const reducido = useReducedMotion();
  const movil = useMediaQuery("(max-width:600px)");
  const [quitado, setQuitado] = useState<Linea | null>(null);
  const minimo = tienda?.pedido_minimo ?? 0;
  const faltaMinimo = minimo > 0 && subtotal < minimo;
  const gratisDesde = tienda?.entrega.domicilio && tienda.entrega.costo_domicilio > 0 ? tienda.entrega.domicilio_gratis_desde ?? 0 : 0;
  const progreso = gratisDesde ? Math.min(100, (subtotal / gratisDesde) * 100) : 0;
  const domicilio = estimarDomicilio(tienda, subtotal);

  const quitarLinea = (l: Linea) => { setQuitado(l); quitar(l.clave); };
  const deshacer = () => {
    if (!quitado) return;
    const { clave: _clave, ...resto } = quitado;
    void _clave;
    agregar(resto);
    setQuitado(null);
  };

  return (
    <Drawer anchor={movil ? "bottom" : "right"} open={abierto} onClose={onCerrar}
      PaperProps={{ sx: { bgcolor: T.surface, color: T.text, width: movil ? "100%" : 440, height: movil ? "92vh" : "100%", borderTopLeftRadius: movil ? 24 : 0, borderTopRightRadius: movil ? 24 : 0, backgroundImage: "none", display: "flex", flexDirection: "column" } }}>
      {movil && <Box sx={{ width: 44, height: 5, borderRadius: 999, bgcolor: T.soft, mx: "auto", mt: 1.2 }} />}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: T.display, fontWeight: 600, fontSize: 30, lineHeight: 1 }}>{textos.carrito}</Typography>
          <Typography sx={{ fontSize: 13, color: T.muted, mt: 0.4 }}>{unidades} {unidades === 1 ? textos.item : textos.items}</Typography>
        </Box>
        <IconButton onClick={onCerrar} aria-label="Cerrar carrito" sx={{ color: T.text, border: `1px solid ${T.line}` }}><CloseIcon /></IconButton>
      </Stack>

      {/* Progreso hacia el domicilio gratis */}
      {gratisDesde > 0 && lineas.length > 0 && (
        <Box sx={{ mx: 2.5, mb: 1.5, p: 1.5, borderRadius: 3, bgcolor: progreso >= 100 ? suave(T.accent, 14) : T.wash }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LocalShippingOutlinedIcon sx={{ fontSize: 20, color: T.accent }} />
            <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
              {progreso >= 100 ? `¡Tienes ${textos.domicilio.toLowerCase()} gratis!` : <>Te faltan <b>{pesos.format(gratisDesde - subtotal)}</b> para {textos.domicilio.toLowerCase()} gratis</>}
            </Typography>
          </Stack>
          <Box sx={{ mt: 1, height: 6, borderRadius: 999, bgcolor: T.line, overflow: "hidden" }}>
            <motion.div animate={{ width: `${progreso}%` }} initial={false} transition={{ duration: reducido ? 0 : 0.6, ease: EASE }}
              style={{ height: "100%", borderRadius: 999, background: "var(--pu-accent)" }} />
          </Box>
        </Box>
      )}

      <Box sx={{ flex: 1, overflowY: "auto", px: 2.5 }}>
        {lineas.length === 0 && (
          <Stack alignItems="center" sx={{ py: 8, textAlign: "center" }}>
            <motion.div animate={reducido ? undefined : { y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}>
              <Box sx={{ width: 96, height: 96, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: suave(T.accent, 14), color: T.accent }}>
                <ShoppingBagOutlinedIcon sx={{ fontSize: 46 }} />
              </Box>
            </motion.div>
            <Typography sx={{ mt: 2, fontWeight: 600, fontSize: 18 }}>Tu {textos.carrito.replace(/^Tu /i, "").toLowerCase()} está vacío</Typography>
            <Typography sx={{ mt: 0.5, color: T.muted, fontSize: 14 }}>Agrega {textos.items} para empezar.</Typography>
            <Button onClick={onCerrar} sx={{ ...btnSecundario, mt: 2.5 }}>Explorar {textos.titulo_catalogo.toLowerCase()}</Button>
          </Stack>
        )}
        <AnimatePresence initial={false}>
          {lineas.map((l) => {
            const foto = sitio.mostrarFotosDeProductos ? l.imagen : undefined;
            return (
              <motion.div key={l.clave} layout={!reducido}
                initial={reducido ? false : { opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }}
                exit={reducido ? undefined : { opacity: 0, x: -60, height: 0, marginBottom: 0 }} transition={{ duration: 0.28 }}>
                <Stack direction="row" spacing={1.5} sx={{ py: 1.5, borderBottom: `1px solid ${T.line}` }}>
                  <Box sx={{ width: 58, height: 58, borderRadius: 2.5, flexShrink: 0, overflow: "hidden", display: "grid", placeItems: "center",
                    background: foto ? `center / cover url(${foto})` : `linear-gradient(135deg, ${T.surface2}, ${suave(T.accent, 18)})` }}>
                    {!foto && <Typography sx={{ fontFamily: T.display, fontWeight: 600, fontSize: 22, opacity: 0.55 }}>{l.nombre.slice(0, 2).toUpperCase()}</Typography>}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" spacing={1}>
                      <Typography sx={{ fontWeight: 600, fontSize: 15, lineHeight: 1.25 }}>{l.nombre}</Typography>
                      <Typography sx={{ fontWeight: 600, whiteSpace: "nowrap" }}><NumeroAnimado valor={precioLinea(l)} formato={formatear} /></Typography>
                    </Stack>
                    {l.opciones.map((o) => (
                      <Typography key={o.id} sx={{ fontSize: 12.5, color: T.muted }}>+ {o.nombre}{o.precio > 0 ? ` (${pesos.format(o.precio)})` : ""}</Typography>
                    ))}
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                      <Contador compacto valor={l.cantidad} min={1} max={50} onCambio={(n) => cambiarCantidad(l.clave, n)} etiqueta={l.nombre} />
                      <IconButton size="small" onClick={() => quitarLinea(l)} aria-label={`Quitar ${l.nombre}`} sx={{ color: T.muted, "&:hover": { color: "#ef4444", bgcolor: suave("#ef4444", 10) } }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </Stack>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </Box>

      {lineas.length > 0 && (
        <Box sx={{ px: 2.5, pt: 2, borderTop: `1px solid ${T.line}`, pb: "calc(18px + env(safe-area-inset-bottom, 0px))", bgcolor: T.surface }}>
          <Fila etiqueta="Subtotal" valor={<NumeroAnimado valor={subtotal} formato={formatear} />} />
          {tienda?.entrega.domicilio && <Fila etiqueta={textos.domicilio} valor={domicilio > 0 ? pesos.format(domicilio) : "Sin costo"} tenue />}
          {faltaMinimo && <Alert severity="info" sx={{ my: 1, borderRadius: 3 }}>El pedido mínimo es {pesos.format(minimo)}.</Alert>}
          {tienda && !tienda.abierta && <Alert severity="warning" sx={{ my: 1, borderRadius: 3 }}>{tienda.motivo}</Alert>}
          <Button fullWidth onClick={onContinuar} disabled={!tienda?.abierta || faltaMinimo}
            sx={{ ...btnPrimario, mt: 1.5, minHeight: 56, justifyContent: "space-between", px: 2.5, "&:hover .pu-flecha": { transform: "translateX(4px)" } }}>
            <span>Continuar</span>
            <Stack direction="row" alignItems="center" spacing={1}>
              <NumeroAnimado valor={subtotal} formato={formatear} />
              <ArrowForwardIcon className="pu-flecha" sx={{ transition: "transform .2s ease" }} />
            </Stack>
          </Button>
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.6} sx={{ mt: 1.2, color: T.muted }}>
            <LockOutlinedIcon sx={{ fontSize: 14 }} />
            <Typography sx={{ fontSize: 12 }}>El total final lo confirma el sistema con los precios vigentes</Typography>
          </Stack>
        </Box>
      )}

      <Snackbar open={Boolean(quitado)} autoHideDuration={4000} onClose={() => setQuitado(null)} message={quitado ? `Quitaste ${quitado.nombre}` : ""}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        action={<Button size="small" onClick={deshacer} sx={{ color: T.accent, fontWeight: 600 }}>Deshacer</Button>} />
    </Drawer>
  );
}

function Fila({ etiqueta, valor, fuerte = false, tenue = false }: { etiqueta: string; valor: ReactNode; fuerte?: boolean; tenue?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.4 }}>
      <Typography sx={{ fontWeight: fuerte ? 800 : 500, fontSize: fuerte ? 19 : 14.5, color: tenue ? T.muted : T.text }}>{etiqueta}</Typography>
      <Typography component="div" sx={{ fontWeight: 600, fontSize: fuerte ? 19 : 14.5, color: tenue ? T.muted : T.text }}>{valor}</Typography>
    </Stack>
  );
}
