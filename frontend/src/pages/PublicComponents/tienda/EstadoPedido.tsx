import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink, useParams, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Alert, Box, Button, CircularProgress, Container, IconButton, Snackbar, Stack, Tooltip, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import SoupKitchenOutlinedIcon from "@mui/icons-material/SoupKitchenOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import CelebrationOutlinedIcon from "@mui/icons-material/CelebrationOutlined";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CheckIcon from "@mui/icons-material/Check";
import HourglassTopIcon from "@mui/icons-material/HourglassTop";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { T } from "../landing/tokens";
import { btnPrimario, btnSecundario } from "./estilo";
import SitioProvider from "../landing/SitioProvider";
import ThemeSelector from "../landing/ThemeSelector";
import { useSitio, waLink } from "../landing/siteConfig";
import { ErrorTienda, consultarPedido, guardarPedido, pesos, reintentarPago } from "./api";
import type { PedidoPublico } from "./api";
import { Confeti, PuntoVivo } from "./Animaciones";

const suave = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;
const EASE = [0.22, 1, 0.36, 1] as const;
const ROJO = "#ef4444";

type Paso = { estado: string; label: string; icono: ReactNode; soloDomicilio?: boolean; titulo: string; texto: string };

/* Primero se consulta el pedido para saber de qué negocio es y mostrar su marca */
export default function EstadoPedido() {
  const { codigo = "", token = "" } = useParams();
  const [negocio, setNegocio] = useState<string | null>(null);
  const [noExiste, setNoExiste] = useState(false);

  useEffect(() => {
    consultarPedido(codigo, token)
      .then((p) => setNegocio(p.url_negocio ?? ""))
      .catch((e) => (e instanceof ErrorTienda && e.status === 404 ? setNoExiste(true) : setNegocio("")));
  }, [codigo, token]);

  if (noExiste) {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0a0a0a", color: "#f5f5f4", textAlign: "center", p: 3 }}>
        <Box>
          <ErrorOutlineIcon sx={{ fontSize: 56, opacity: 0.6 }} />
          <Typography sx={{ mt: 1, fontSize: 24, fontWeight: 600 }}>No encontramos este pedido</Typography>
          <Typography sx={{ mt: 0.5, color: "#a3a3a3" }}>Revisa el enlace que recibiste.</Typography>
        </Box>
      </Box>
    );
  }
  if (negocio === null) {
    return <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#0a0a0a" }}><CircularProgress /></Box>;
  }
  return (
    <SitioProvider negocio={negocio || undefined} estilo="tienda">
      <Contenido />
    </SitioProvider>
  );
}

function Contenido() {
  const sitio = useSitio();
  const { textos } = sitio;
  const reducido = useReducedMotion();
  const { codigo = "", token = "" } = useParams();
  const [params] = useSearchParams();
  // Wompi agrega ?id=<transacción> al volver: el backend lo verifica con la pasarela
  const idTransaccion = params.get("id");
  const recienCreado = params.get("nuevo") === "1";
  const [pedido, setPedido] = useState<PedidoPublico | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagando, setPagando] = useState(false);
  const [celebrar, setCelebrar] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const anterior = useRef<PedidoPublico | null>(null);

  const cargar = useCallback(() =>
    consultarPedido(codigo, token, idTransaccion).then((p) => {
      const antes = anterior.current;
      // Celebración: pedido recién hecho, pago aprobado o pedido entregado mientras se mira la página
      const pagoNuevo = p.estado_pago === "APROBADO" && (antes ? antes.estado_pago !== "APROBADO" : Boolean(idTransaccion));
      const entregaNueva = p.estado === "ENTREGADO" && antes !== null && antes.estado !== "ENTREGADO";
      const primeraVez = !antes && recienCreado;
      if (pagoNuevo || entregaNueva || primeraVez) {
        setCelebrar(true);
        window.setTimeout(() => setCelebrar(false), 2600);
      }
      anterior.current = p;
      setPedido(p);
      setError(null);
    }, (e) => {
      setError(e instanceof ErrorTienda && e.status === 404 ? "No encontramos este pedido." : "No pudimos consultar el pedido. Reintentando…");
    }), [codigo, token, idTransaccion, recienCreado]);

  useEffect(() => {
    guardarPedido({ codigo, token, fecha: new Date().toISOString() });
    cargar();
  }, [codigo, token, cargar]);

  // Seguimiento: se consulta cada 10 s mientras el pedido no termine
  const terminado = pedido && ["ENTREGADO", "CANCELADO"].includes(pedido.estado);
  useEffect(() => {
    if (terminado) return;
    const t = window.setInterval(cargar, 10_000);
    return () => window.clearInterval(t);
  }, [terminado, cargar]);

  const pagar = async () => {
    setPagando(true);
    try {
      const pago = await reintentarPago(codigo, token);
      window.location.assign(pago.checkout_url);
    } catch (e) {
      setPagando(false);
      setError(e instanceof ErrorTienda ? e.message : "No pudimos iniciar el pago.");
    }
  };

  const copiar = async () => {
    try { await navigator.clipboard.writeText(window.location.href.split("?")[0]); setAviso("Enlace copiado"); } catch { setAviso("No se pudo copiar"); }
  };
  const compartir = async () => {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try { await navigator.share({ title: `Pedido ${codigo}`, text: `Sigue mi pedido en ${sitio.nombre}`, url }); } catch { /* cancelado */ }
    } else copiar();
  };

  const PASOS: Paso[] = [
    { estado: "PENDIENTE", label: "Recibido", icono: <ReceiptLongOutlinedIcon />, titulo: "¡Recibimos tu pedido!", texto: "Lo revisamos y lo confirmamos en unos minutos." },
    { estado: "CONFIRMADO", label: "Confirmado", icono: <TaskAltIcon />, titulo: "Pedido confirmado", texto: "Ya está en nuestra lista y pronto empezamos." },
    { estado: "EN_PREPARACION", label: textos.preparacion, icono: <SoupKitchenOutlinedIcon />, titulo: textos.preparacion, texto: "Estamos trabajando en tu pedido." },
    { estado: "LISTO", label: "Listo", icono: <Inventory2OutlinedIcon />, titulo: "¡Tu pedido está listo!", texto: pedido?.tipo_entrega === "RECOGER" ? "Ya puedes pasar a recogerlo." : "Sale en breve hacia tu dirección." },
    { estado: "EN_CAMINO", label: "En camino", icono: <DeliveryDiningIcon />, soloDomicilio: true, titulo: "Va en camino", texto: "Prepárate para recibirlo." },
    { estado: "ENTREGADO", label: "Entregado", icono: <CelebrationOutlinedIcon />, titulo: "¡Entregado!", texto: `Gracias por tu compra en ${sitio.nombre}.` },
  ];
  const pasos = PASOS.filter((p) => !p.soloDomicilio || pedido?.tipo_entrega === "DOMICILIO");
  const cancelado = pedido?.estado === "CANCELADO";
  const activo = pedido ? Math.max(0, pasos.findIndex((p) => p.estado === pedido.estado)) : 0;
  const actual = cancelado
    ? { icono: <CancelOutlinedIcon />, titulo: "Pedido cancelado", texto: "Si tienes dudas, escríbenos." }
    : pasos[activo];
  const esperandoPago = pedido?.metodo_pago === "EN_LINEA" && pedido.estado_pago !== "APROBADO" && !cancelado;
  const colorEstado = cancelado ? ROJO : esperandoPago && pedido?.estado_pago !== "PENDIENTE" ? T.warn : T.accent;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: T.bg, color: T.text, pb: 6 }}>
      <Confeti activo={celebrar} />

      <Container maxWidth="sm" sx={{ pt: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Button component={RouterLink} to={`${sitio.base}/tienda`} startIcon={<ArrowBackIcon />} sx={{ color: T.text, textTransform: "none", fontWeight: 700 }}>Volver a la tienda</Button>
          <ThemeSelector />
        </Stack>

        {!pedido && !error && <Box sx={{ display: "grid", placeItems: "center", py: 12 }}><CircularProgress /></Box>}
        {error && <Alert severity={pedido ? "warning" : "error"} sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

        {pedido && (
          <Stack spacing={2}>
            {/* ===== ESTADO ACTUAL ===== */}
            <motion.div initial={reducido ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
              <Box sx={{
                position: "relative", overflow: "hidden", textAlign: "center", borderRadius: 6, p: { xs: 3, md: 4.5 }, border: `1px solid ${T.line}`,
                background: `radial-gradient(120% 120% at 50% 0%, ${suave(colorEstado, 22)} 0%, transparent 60%), ${T.surface}`,
              }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.8} sx={{ mb: 2.5, color: T.muted, fontSize: 12.5, fontWeight: 700 }}>
                  {terminado ? <CheckIcon sx={{ fontSize: 15 }} /> : <PuntoVivo color={colorEstado} tam={8} />}
                  <span>{terminado ? "Pedido finalizado" : "Actualizando en vivo"}</span>
                </Stack>

                {/* Ícono del estado con anillos */}
                <Box sx={{ position: "relative", width: 112, height: 112, mx: "auto" }}>
                  {!reducido && !terminado && [0, 1].map((i) => (
                    <motion.span key={i} aria-hidden animate={{ scale: [1, 1.7], opacity: [0.35, 0] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 1.1, ease: "easeOut" }}
                      style={{ position: "absolute", inset: 0, borderRadius: "50%", background: colorEstado }} />
                  ))}
                  <AnimatePresence mode="wait">
                    <motion.div key={pedido.estado} initial={reducido ? false : { scale: 0.4, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }}
                      exit={reducido ? undefined : { scale: 0.4, opacity: 0 }} transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      style={{ position: "absolute", inset: 0, borderRadius: "50%", display: "grid", placeItems: "center", background: colorEstado, color: "var(--pu-accentInk)", boxShadow: `0 18px 40px ${suave(colorEstado, 45)}` }}>
                      <Box sx={{ display: "flex", color: cancelado ? "#fff" : T.accentInk, "& svg": { fontSize: 50 } }}>{actual.icono}</Box>
                    </motion.div>
                  </AnimatePresence>
                </Box>

                <AnimatePresence mode="wait">
                  <motion.div key={`${pedido.estado}-${pedido.estado_pago}`} initial={reducido ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={reducido ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
                    <Typography component="h1" sx={{ mt: 3, fontFamily: T.display, fontWeight: 600, fontSize: { xs: 34, md: 42 }, lineHeight: 1 }}>
                      {esperandoPago && pedido.estado === "PENDIENTE" ? (pedido.estado_pago === "PENDIENTE" ? "Esperando tu pago" : "Pago no completado") : actual.titulo}
                    </Typography>
                    <Typography sx={{ mt: 1.2, color: T.text2, maxWidth: 400, mx: "auto" }}>
                      {esperandoPago && pedido.estado === "PENDIENTE"
                        ? pedido.pago_en_proceso ? "Tu pago está en proceso. Esta página se actualiza sola." : pedido.estado_pago === "PENDIENTE" ? textos.aviso_preparacion : "No se realizó ningún cobro. Puedes intentarlo de nuevo."
                        : actual.texto}
                    </Typography>
                  </motion.div>
                </AnimatePresence>

                {pedido.puede_reintentar_pago && (
                  <Button onClick={pagar} disabled={pagando} sx={{ ...btnPrimario, mt: 2.5, minHeight: 52, px: 4 }} startIcon={!pagando && <CreditCardIcon />}>
                    {pagando ? <CircularProgress size={22} color="inherit" /> : "Pagar en línea"}
                  </Button>
                )}

                {/* Código + acciones */}
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1} sx={{ mt: 3 }}>
                  <Box sx={{ px: 1.6, py: 0.7, borderRadius: 999, bgcolor: T.wash, fontWeight: 600, letterSpacing: 0.6, fontSize: 14 }}>{pedido.codigo}</Box>
                  <Tooltip title="Copiar enlace"><IconButton size="small" onClick={copiar} sx={{ color: T.text, border: `1px solid ${T.line}` }} aria-label="Copiar enlace"><ContentCopyIcon fontSize="small" /></IconButton></Tooltip>
                  <Tooltip title="Compartir"><IconButton size="small" onClick={compartir} sx={{ color: T.text, border: `1px solid ${T.line}` }} aria-label="Compartir"><ShareOutlinedIcon fontSize="small" /></IconButton></Tooltip>
                </Stack>
              </Box>
            </motion.div>

            {/* ===== LÍNEA DE TIEMPO ===== */}
            {!cancelado && (
              <Tarjeta retraso={0.1}>
                <Typography sx={{ fontWeight: 600, mb: 2 }}>Seguimiento</Typography>
                <Box sx={{ position: "relative" }}>
                  {/* Línea base y progreso animado */}
                  <Box aria-hidden sx={{ position: "absolute", left: 19, top: 20, bottom: 20, width: 3, borderRadius: 999, bgcolor: T.line }} />
                  <motion.div aria-hidden initial={false}
                    animate={{ height: `calc(${pasos.length > 1 ? (activo / (pasos.length - 1)) * 100 : 0}% - ${activo === pasos.length - 1 ? 40 : 20}px)` }}
                    transition={{ duration: reducido ? 0 : 0.8, ease: EASE }}
                    style={{ position: "absolute", left: 19, top: 20, width: 3, borderRadius: 999, background: "var(--pu-accent)" }} />
                  <Stack spacing={2.2}>
                    {pasos.map((p, i) => {
                      const hecho = i < activo || (i === activo && terminado);
                      const ahora = i === activo && !terminado;
                      return (
                        <Stack key={p.estado} direction="row" spacing={2} alignItems="center" sx={{ position: "relative" }}>
                          <Box sx={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
                            {ahora && !reducido && (
                              <motion.span aria-hidden animate={{ scale: [1, 1.5], opacity: [0.45, 0] }} transition={{ duration: 1.6, repeat: Infinity }}
                                style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "var(--pu-accent)" }} />
                            )}
                            <Box sx={{
                              position: "relative", width: 42, height: 42, borderRadius: "50%", display: "grid", placeItems: "center", transition: "all .4s ease",
                              bgcolor: hecho || ahora ? T.accent : T.surface, color: hecho || ahora ? T.accentInk : T.muted,
                              border: `2px solid ${hecho || ahora ? T.accent : T.line}`, "& svg": { fontSize: 20 },
                            }}>
                              {hecho ? <CheckIcon /> : p.icono}
                            </Box>
                          </Box>
                          <Box>
                            <Typography sx={{ fontWeight: ahora ? 900 : 700, color: hecho || ahora ? T.text : T.muted, fontSize: ahora ? 16 : 15 }}>{p.label}</Typography>
                            {ahora && <Typography sx={{ fontSize: 13, color: T.accent, fontWeight: 700 }}>Ahora</Typography>}
                          </Box>
                        </Stack>
                      );
                    })}
                  </Stack>
                </Box>
              </Tarjeta>
            )}

            {/* ===== PAGO ===== */}
            <Tarjeta retraso={0.15}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 44, height: 44, borderRadius: 3, display: "grid", placeItems: "center", flexShrink: 0,
                  bgcolor: pedido.estado_pago === "APROBADO" ? suave(T.accent, 16) : pedido.estado_pago === "PENDIENTE" ? T.wash : suave(T.warn, 16),
                  color: pedido.estado_pago === "APROBADO" ? T.accent : pedido.estado_pago === "PENDIENTE" ? T.text : T.warn }}>
                  {pedido.metodo_pago === "EN_LINEA" ? <CreditCardIcon /> : <PaymentsOutlinedIcon />}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 600 }}>{pedido.metodo_pago === "EN_LINEA" ? "Pago en línea" : pedido.tipo_entrega === "DOMICILIO" ? "Pago al recibir" : "Pago al recoger"}</Typography>
                  <Typography sx={{ fontSize: 13.5, color: T.muted }}>
                    {{
                      APROBADO: "Pagado ✓",
                      PENDIENTE: pedido.metodo_pago === "EN_LINEA" ? (pedido.pago_en_proceso ? "Pago en proceso…" : "Esperando la confirmación del pago") : `Pagas ${pesos.format(pedido.total)} ${pedido.tipo_entrega === "DOMICILIO" ? "al recibir" : "al recoger"}`,
                      RECHAZADO: "Pago rechazado. No se realizó ningún cobro.",
                      ANULADO: "Pago anulado.",
                      REEMBOLSO_PENDIENTE: "Tu pago será reembolsado. Te contactaremos.",
                    }[pedido.estado_pago] ?? pedido.estado_pago}
                  </Typography>
                </Box>
                {pedido.estado_pago === "PENDIENTE" && pedido.metodo_pago === "EN_LINEA" && <HourglassTopIcon sx={{ color: T.muted }} />}
                {pedido.estado_pago === "APROBADO" && <CheckIcon sx={{ color: T.accent }} />}
              </Stack>
            </Tarjeta>

            {/* ===== DETALLE ===== */}
            <Tarjeta retraso={0.2}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
                <Typography sx={{ fontWeight: 600 }}>Tu pedido</Typography>
                <Typography sx={{ fontSize: 12.5, color: T.muted }}>{new Date(pedido.fecha).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</Typography>
              </Stack>
              {pedido.items.map((i, n) => (
                <Stack key={n} direction="row" justifyContent="space-between" spacing={1} sx={{ py: 1, borderTop: n ? `1px solid ${T.line}` : 0 }}>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: 14.5 }}><Box component="span" sx={{ color: T.accent }}>{i.cantidad}×</Box> {i.nombre}</Typography>
                    {i.adicionales.map((a, k) => <Typography key={k} sx={{ fontSize: 12.5, color: T.muted }}>+ {a.nombre}</Typography>)}
                  </Box>
                  <Typography sx={{ fontWeight: 700, whiteSpace: "nowrap", fontSize: 14.5 }}>
                    {pesos.format(i.subtotal + i.adicionales.reduce((s, a) => s + a.subtotal, 0))}
                  </Typography>
                </Stack>
              ))}
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: `1px dashed ${T.soft}` }}>
                <Fila etiqueta="Subtotal" valor={pesos.format(pedido.subtotal)} tenue />
                {pedido.tipo_entrega === "DOMICILIO" && <Fila etiqueta={textos.domicilio} valor={pedido.costo_domicilio > 0 ? pesos.format(pedido.costo_domicilio) : "Sin costo"} tenue />}
                <Fila etiqueta="Total" valor={pesos.format(pedido.total)} fuerte />
              </Box>
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ mt: 2, p: 1.4, borderRadius: 3, bgcolor: T.wash }}>
                {pedido.tipo_entrega === "DOMICILIO" ? <DeliveryDiningIcon sx={{ color: T.accent }} /> : <StorefrontOutlinedIcon sx={{ color: T.accent }} />}
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{pedido.tipo_entrega === "DOMICILIO" ? textos.domicilio : textos.recoger}</Typography>
                  <Typography sx={{ fontSize: 13, color: T.muted }}>{pedido.tipo_entrega === "DOMICILIO" ? pedido.direccion : sitio.direccion}</Typography>
                </Box>
              </Stack>
            </Tarjeta>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
              {sitio.whatsapp && (
                <Button href={waLink(sitio, `Hola ${sitio.nombre}, tengo una pregunta sobre mi pedido ${pedido.codigo}.`)} target="_blank" rel="noopener noreferrer"
                  startIcon={<WhatsAppIcon />} fullWidth sx={{ ...btnSecundario, minHeight: 50 }}>
                  Escribir por WhatsApp
                </Button>
              )}
              <Button component={RouterLink} to={`${sitio.base}/tienda`} fullWidth sx={{ ...btnPrimario, minHeight: 50 }}>Seguir comprando</Button>
            </Stack>
            <Typography sx={{ fontSize: 12.5, color: T.muted, textAlign: "center" }}>
              Guarda esta página: el enlace es privado y te permite seguir tu pedido.
            </Typography>
          </Stack>
        )}
      </Container>

      <Snackbar open={Boolean(aviso)} autoHideDuration={2200} onClose={() => setAviso(null)} message={aviso} anchorOrigin={{ vertical: "bottom", horizontal: "center" }} />
    </Box>
  );
}

function Tarjeta({ children, retraso = 0 }: { children: ReactNode; retraso?: number }) {
  const reducido = useReducedMotion();
  return (
    <motion.div initial={reducido ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: retraso, ease: EASE }}>
      <Box sx={{ borderRadius: 5, p: { xs: 2.2, md: 2.8 }, bgcolor: T.surface, border: `1px solid ${T.line}` }}>{children}</Box>
    </motion.div>
  );
}

function Fila({ etiqueta, valor, fuerte = false, tenue = false }: { etiqueta: string; valor: string; fuerte?: boolean; tenue?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 0.3 }}>
      <Typography sx={{ fontWeight: fuerte ? 800 : 500, fontSize: fuerte ? 19 : 14.5, color: tenue ? T.muted : T.text }}>{etiqueta}</Typography>
      <Typography sx={{ fontWeight: 600, fontSize: fuerte ? 19 : 14.5, color: tenue ? T.muted : T.text }}>{valor}</Typography>
    </Stack>
  );
}
