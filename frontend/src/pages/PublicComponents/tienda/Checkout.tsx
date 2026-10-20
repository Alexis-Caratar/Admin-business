/*
 * Pago en una sola página: a la izquierda los datos (contacto, entrega y pago)
 * y a la derecha el resumen de lo que se está pagando, fijo al bajar.
 * En celular el resumen va arriba, plegable ("Mostrar resumen del pedido").
 * El servidor recalcula precios y total: aquí solo se envían productos y cantidades.
 */
import { useRef, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Alert, Box, Button, Checkbox, CircularProgress, Container, Dialog, FormControlLabel, IconButton, Stack, TextField, Typography, useMediaQuery,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import logo from "../../../assets/img/img_puntourbano/logosinfondo.jpeg";
import { T } from "../landing/tokens";
import { useSitio } from "../landing/siteConfig";
import { ErrorTienda, crearPedido, guardarPedido, pesos } from "./api";
import type { EstadoTienda, SolicitudPedido } from "./api";
import { precioLinea, useCarrito } from "./carritoContexto";
import { NumeroAnimado } from "./Animaciones";
import { btnPrimario } from "./estilo";
import { EASE, estimarDomicilio, formatear } from "./util";

type Formulario = {
  nombre: string; telefono: string; email: string;
  tipo: "DOMICILIO" | "RECOGER"; direccion: string; barrio: string; referencias: string;
  metodo: "EN_LINEA" | "CONTRAENTREGA"; observacion: string;
  avisos: boolean; recordar: boolean;
};

const DATOS_GUARDADOS = "pu_datos_cliente";
// Orden en que aparecen los campos (para llevar al primero con error)
const ORDEN_CAMPOS = ["nombre", "telefono", "email", "tipo_entrega", "direccion", "metodo_pago"];

function validar(f: Formulario): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.nombre.trim().length < 2) e.nombre = "Escribe tu nombre";
  if (!/^\d{7,10}$/.test(f.telefono.replace(/[\s\-().]/g, "").replace(/^\+?57/, ""))) e.telefono = "Escribe un teléfono válido";
  if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "El correo no es válido";
  if (f.metodo === "EN_LINEA" && !f.email.trim()) e.email = "Para pagar en línea necesitamos tu correo";
  if (f.tipo === "DOMICILIO" && f.direccion.trim().length < 5) e.direccion = "Escribe la dirección de entrega";
  return e;
}

/* Campo al estilo del checkout: alto, bordes suaves, foco azul */
const campo = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px", bgcolor: T.surface, fontSize: 15,
    "& fieldset": { borderColor: T.soft }, "&:hover fieldset": { borderColor: T.muted },
    "&.Mui-focused fieldset": { borderColor: T.accent, borderWidth: 2 },
  },
  "& .MuiInputBase-input": { py: 1.9 },
  "& .MuiInputLabel-root": { color: T.muted, "&.Mui-focused": { color: T.accent } },
} as const;

export default function Checkout({ abierto, tienda, onCerrar, onNoDisponible }: { abierto: boolean; tienda: EstadoTienda; onCerrar: () => void; onNoDisponible: () => void }) {
  const { lineas, subtotal, unidades, vaciar } = useCarrito();
  const sitio = useSitio();
  const { textos } = sitio;
  const navigate = useNavigate();
  const reducido = useReducedMotion();
  const ancho = useMediaQuery("(min-width:900px)");
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resumenAbierto, setResumenAbierto] = useState(false);
  const clave = useRef<string | null>(null);
  const contenedor = useRef<HTMLDivElement | null>(null);

  const [f, setF] = useState<Formulario>(() => {
    const base: Formulario = {
      nombre: "", telefono: "", email: "", tipo: tienda.entrega.domicilio ? "DOMICILIO" : "RECOGER",
      direccion: "", barrio: "", referencias: "", metodo: tienda.pagos.contraentrega ? "CONTRAENTREGA" : "EN_LINEA", observacion: "",
      avisos: false, recordar: true,
    };
    try {
      // Datos de contacto de una compra anterior en este navegador
      const guardados = JSON.parse(localStorage.getItem(DATOS_GUARDADOS) ?? "null");
      return guardados ? { ...base, ...guardados, recordar: true } : base;
    } catch {
      return base;
    }
  });
  const set = (k: keyof Formulario) => (e: { target: { value: string } }) => {
    setF((x) => ({ ...x, [k]: e.target.value }));
    if (errores[k]) setErrores((x) => ({ ...x, [k]: "" }));
  };
  const elegir = <K extends keyof Formulario>(k: K, v: Formulario[K]) => setF((x) => ({ ...x, [k]: v }));

  const domicilio = f.tipo === "DOMICILIO" ? estimarDomicilio(tienda, subtotal) : 0;
  const total = subtotal + domicilio;

  // Lleva al primer campo con error
  const irAlError = (e: Record<string, string>) => {
    const primero = ORDEN_CAMPOS.find((k) => e[k]);
    if (!primero) return;
    const el = contenedor.current?.querySelector<HTMLElement>(`[data-campo="${primero}"]`);
    el?.scrollIntoView({ behavior: reducido ? "auto" : "smooth", block: "center" });
    el?.querySelector<HTMLInputElement>("input, textarea")?.focus({ preventScroll: true });
  };

  const confirmar = async () => {
    const e = validar(f);
    setErrores(e);
    if (Object.keys(e).length) return irAlError(e);
    setEnviando(true);
    setErrorGeneral(null);
    // Misma clave mientras se reintenta el mismo envío: no se duplica el pedido
    clave.current ??= crypto.randomUUID();
    const solicitud: SolicitudPedido = {
      cliente: { nombre: f.nombre.trim(), telefono: f.telefono.trim(), email: f.email.trim() || undefined },
      entrega: f.tipo === "DOMICILIO"
        ? { tipo: "DOMICILIO", direccion: f.direccion.trim(), barrio: f.barrio.trim() || undefined, referencias: f.referencias.trim() || undefined }
        : { tipo: "RECOGER" },
      metodo_pago: f.metodo,
      observacion: f.observacion.trim() || undefined,
      avisos_whatsapp: f.avisos,
      items: lineas.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad, complementos: l.opciones.map((o) => o.id) })),
    };
    try {
      const pedido = await crearPedido(sitio.urlNegocio, solicitud, clave.current);
      guardarPedido({ codigo: pedido.codigo, token: pedido.token, fecha: new Date().toISOString() });
      try {
        if (f.recordar) {
          const { nombre, telefono, email, direccion, barrio, referencias } = f;
          localStorage.setItem(DATOS_GUARDADOS, JSON.stringify({ nombre, telefono, email, direccion, barrio, referencias }));
        } else {
          localStorage.removeItem(DATOS_GUARDADOS);
        }
      } catch { /* opcional */ }
      vaciar();
      if (pedido.pago?.checkout_url) window.location.assign(pedido.pago.checkout_url);
      else navigate(`/tienda/pedido/${pedido.codigo}/${pedido.token}?nuevo=1`);
    } catch (err) {
      setEnviando(false);
      if (err instanceof ErrorTienda) {
        if (err.errores) { setErrores(err.errores); irAlError(err.errores); }
        setErrorGeneral(err.message);
        // Algo dejó de estar disponible: se recarga el catálogo y se ajusta el carrito
        if (err.status === 409 && err.idProducto) onNoDisponible();
        // Nuevo intento = nueva clave solo si el pedido no se creó
        if (err.status !== 0) clave.current = null;
      } else {
        setErrorGeneral("No pudimos enviar el pedido. Intenta de nuevo.");
      }
    }
  };

  const cerrar = () => { if (!enviando) { setErrorGeneral(null); onCerrar(); } };
  const textoBoton = f.metodo === "EN_LINEA" ? "Pagar ahora" : "Confirmar pedido";

  const resumen = <ResumenPedido domicilio={domicilio} hayDomicilio={f.tipo === "DOMICILIO"} total={total} />;

  return (
    <Dialog open={abierto} onClose={cerrar} fullScreen
      PaperProps={{ sx: { bgcolor: T.surface, color: T.text, backgroundImage: "none" } }}>
      {/* Encabezado */}
      <Box sx={{ borderBottom: `1px solid ${T.line}`, bgcolor: T.surface, position: "sticky", top: 0, zIndex: 3 }}>
        <Container maxWidth="lg" sx={{ display: "flex", alignItems: "center", gap: 1.5, height: 64 }}>
          <Box component="img" src={sitio.logo || logo} alt="" sx={{ width: 34, height: 34, borderRadius: "9px", objectFit: "cover" }} />
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", flex: 1 }}>{sitio.nombre}</Typography>
          <Stack direction="row" alignItems="center" spacing={0.6} sx={{ color: T.muted, display: { xs: "none", sm: "flex" } }}>
            <LockOutlinedIcon sx={{ fontSize: 16 }} />
            <Typography sx={{ fontSize: 13 }}>Pago seguro</Typography>
          </Stack>
          <IconButton onClick={cerrar} aria-label="Cerrar y volver a la tienda" sx={{ color: T.text }}><CloseIcon /></IconButton>
        </Container>
      </Box>

      {/* Celular: resumen plegable arriba */}
      {!ancho && (
        <Box sx={{ bgcolor: T.bg, borderBottom: `1px solid ${T.line}` }}>
          <Box component="button" type="button" onClick={() => setResumenAbierto((v) => !v)} aria-expanded={resumenAbierto}
            sx={{ width: "100%", border: 0, bgcolor: "transparent", font: "inherit", color: T.text, cursor: "pointer", px: 2, py: 2, display: "flex", alignItems: "center", gap: 1 }}>
            <ShoppingBagOutlinedIcon sx={{ fontSize: 20, color: T.accent }} />
            <Typography sx={{ color: T.accent, fontSize: 14.5 }}>{resumenAbierto ? "Ocultar" : "Mostrar"} resumen del pedido</Typography>
            <ExpandMoreIcon sx={{ color: T.accent, transition: "transform .25s ease", transform: resumenAbierto ? "rotate(180deg)" : "none" }} />
            <Typography sx={{ ml: "auto", fontWeight: 600, fontSize: 17 }}><NumeroAnimado valor={total} formato={formatear} /></Typography>
          </Box>
          <AnimatePresence initial={false}>
            {resumenAbierto && (
              <motion.div initial={reducido ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reducido ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: EASE }} style={{ overflow: "hidden" }}>
                <Box sx={{ px: 2, pb: 2.5 }}>{resumen}</Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      )}

      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" } }}>
        {/* Izquierda: datos */}
        <Box ref={contenedor} sx={{ display: "flex", justifyContent: { md: "flex-end" }, px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 5 } }}>
          <Box sx={{ width: "100%", maxWidth: 580 }}>
            {errorGeneral && <Alert severity="error" sx={{ mb: 3, borderRadius: "10px" }}>{errorGeneral}</Alert>}
            {!tienda.abierta && <Alert severity="warning" sx={{ mb: 3, borderRadius: "10px" }}>{tienda.motivo}</Alert>}

            <Seccion titulo="Contacto">
              <Box data-campo="nombre">
                <TextField fullWidth label="Nombre y apellidos" value={f.nombre} onChange={set("nombre")} error={!!errores.nombre} helperText={errores.nombre}
                  autoComplete="name" sx={campo} />
              </Box>
              <Box data-campo="telefono">
                <TextField fullWidth label="Teléfono / WhatsApp" value={f.telefono} onChange={set("telefono")} error={!!errores.telefono}
                  helperText={errores.telefono} inputMode="tel" autoComplete="tel" sx={campo} />
              </Box>
              <Box data-campo="email">
                <TextField fullWidth label={f.metodo === "EN_LINEA" ? "Correo electrónico" : "Correo electrónico (opcional)"} value={f.email} onChange={set("email")}
                  error={!!errores.email} helperText={errores.email ?? (f.metodo === "EN_LINEA" ? "Ahí te llega el comprobante del pago" : undefined)}
                  type="email" autoComplete="email" sx={campo} />
              </Box>
              <FormControlLabel sx={{ alignItems: "flex-start", m: 0 }}
                control={<Checkbox checked={f.avisos} onChange={(e) => elegir("avisos", e.target.checked)} sx={{ mt: -0.6, ml: -1 }} />}
                label={
                  <Stack direction="row" spacing={0.8} alignItems="flex-start">
                    <WhatsAppIcon sx={{ color: "#25D366", fontSize: 19, mt: 0.15 }} />
                    <Typography sx={{ fontSize: 14 }}>Avisarme por WhatsApp cuando mi pedido sea recibido, confirmado, vaya en camino y sea entregado.</Typography>
                  </Stack>
                } />
            </Seccion>

            <Seccion titulo="Entrega">
              <Box data-campo="tipo_entrega">
                <GrupoOpciones>
                  {tienda.entrega.domicilio && (
                    <Opcion activa={f.tipo === "DOMICILIO"} onClick={() => elegir("tipo", "DOMICILIO")} titulo={textos.domicilio}
                      derecha={estimarDomicilio(tienda, subtotal) > 0 ? pesos.format(estimarDomicilio(tienda, subtotal)) : "Gratis"} />
                  )}
                  {tienda.entrega.recoger && (
                    <Opcion activa={f.tipo === "RECOGER"} onClick={() => elegir("tipo", "RECOGER")} titulo={textos.recoger}
                      detalle={sitio.direccion ?? undefined} derecha="Gratis" />
                  )}
                </GrupoOpciones>
                {errores.tipo_entrega && <Typography color="error" fontSize={13} sx={{ mt: 1 }}>{errores.tipo_entrega}</Typography>}
              </Box>
              <AnimatePresence initial={false}>
                {f.tipo === "DOMICILIO" && (
                  <motion.div initial={reducido ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reducido ? undefined : { height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE }} style={{ overflow: "hidden" }}>
                    <Stack spacing={1.5} sx={{ pt: 0.5 }}>
                      <Box data-campo="direccion">
                        <TextField fullWidth label="Dirección" value={f.direccion} onChange={set("direccion")} error={!!errores.direccion} helperText={errores.direccion}
                          autoComplete="street-address" sx={campo} />
                      </Box>
                      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                        <TextField fullWidth label="Barrio" value={f.barrio} onChange={set("barrio")} sx={campo} />
                        <TextField fullWidth label="Casa, apartamento, referencias (opcional)" value={f.referencias} onChange={set("referencias")} sx={campo} />
                      </Stack>
                    </Stack>
                  </motion.div>
                )}
              </AnimatePresence>
              <TextField fullWidth label="Notas del pedido (opcional)" value={f.observacion} onChange={set("observacion")} multiline minRows={2}
                inputProps={{ maxLength: 500 }} sx={campo} />
            </Seccion>

            <Seccion titulo="Pago" subtitulo="Todas las transacciones son seguras y están encriptadas.">
              <Box data-campo="metodo_pago">
                <GrupoOpciones>
                  {tienda.pagos.en_linea && (
                    <Opcion activa={f.metodo === "EN_LINEA"} onClick={() => elegir("metodo", "EN_LINEA")} titulo="Pagar en línea con Wompi"
                      derecha={<Etiquetas items={["Tarjeta", "PSE", "Nequi"]} />}
                      panel={
                        <Stack alignItems="center" spacing={1} sx={{ textAlign: "center", py: 1 }}>
                          <OpenInNewIcon sx={{ color: T.muted }} />
                          <Typography sx={{ fontSize: 14, color: T.text2, maxWidth: 360 }}>
                            Al hacer clic en "Pagar ahora" se te redirigirá a Wompi para completar tu compra de forma segura.
                          </Typography>
                        </Stack>
                      } />
                  )}
                  {tienda.pagos.contraentrega && (
                    <Opcion activa={f.metodo === "CONTRAENTREGA"} onClick={() => elegir("metodo", "CONTRAENTREGA")}
                      titulo={f.tipo === "DOMICILIO" ? "Pagar al recibir" : "Pagar al recoger"}
                      panel={<Typography sx={{ fontSize: 14, color: T.text2, textAlign: "center", py: 1 }}>Pagas en efectivo u otro medio cuando recibas tu pedido.</Typography>} />
                  )}
                </GrupoOpciones>
                {errores.metodo_pago && <Typography color="error" fontSize={13} sx={{ mt: 1 }}>{errores.metodo_pago}</Typography>}
              </Box>
            </Seccion>

            <FormControlLabel sx={{ m: 0, mb: 2.5 }} control={<Checkbox checked={f.recordar} onChange={(e) => elegir("recordar", e.target.checked)} sx={{ ml: -1 }} />}
              label={<Typography sx={{ fontSize: 14 }}>Guardar mis datos en este dispositivo para la próxima compra</Typography>} />

            <Button fullWidth onClick={confirmar} disabled={enviando || lineas.length === 0 || !tienda.abierta}
              sx={{ ...btnPrimario, minHeight: 56, fontSize: 17, fontWeight: 600, borderRadius: "12px" }}>
              {enviando
                ? <Stack direction="row" alignItems="center" spacing={1.2}><CircularProgress size={20} color="inherit" /><span>Enviando…</span></Stack>
                : <>{textoBoton} · <NumeroAnimado valor={total} formato={formatear} /></>}
            </Button>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.6} sx={{ mt: 1.5, color: T.muted }}>
              <LockOutlinedIcon sx={{ fontSize: 14 }} />
              <Typography sx={{ fontSize: 12.5 }}>El total final lo confirma el sistema con los precios vigentes</Typography>
            </Stack>
            <Typography sx={{ mt: 4, fontSize: 12.5, color: T.muted, textAlign: "center" }}>
              {unidades} {unidades === 1 ? textos.item : textos.items} · {sitio.nombre}
            </Typography>
          </Box>
        </Box>

        {/* Derecha: lo que se está pagando */}
        {ancho && (
          <Box sx={{ bgcolor: T.bg, borderLeft: `1px solid ${T.line}`, px: 5, py: 5 }}>
            <Box sx={{ position: "sticky", top: 104, maxWidth: 460 }}>{resumen}</Box>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}

function ResumenPedido({ domicilio, hayDomicilio, total }: { domicilio: number; hayDomicilio: boolean; total: number }) {
  const { lineas, subtotal } = useCarrito();
  const sitio = useSitio();
  return (
    <Box>
      <Stack spacing={2}>
        {lineas.map((l) => {
          const foto = sitio.mostrarFotosDeProductos ? l.imagen : undefined;
          return (
            <Stack key={l.clave} direction="row" spacing={1.75} alignItems="center">
              <Box sx={{ position: "relative", flexShrink: 0 }}>
                <Box sx={{ width: 64, height: 64, borderRadius: "12px", border: `1px solid ${T.line}`, bgcolor: "#fff", overflow: "hidden", display: "grid", placeItems: "center" }}>
                  {foto
                    ? <Box component="img" src={foto} alt="" sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5 }} />
                    : <Typography sx={{ fontWeight: 600, color: "#86868b" }}>{l.nombre.slice(0, 2).toUpperCase()}</Typography>}
                </Box>
                <Box sx={{ position: "absolute", top: -8, right: -8, minWidth: 22, height: 22, px: 0.6, borderRadius: 999, bgcolor: T.text, color: T.bg,
                  fontSize: 12, fontWeight: 600, display: "grid", placeItems: "center" }}>{l.cantidad}</Box>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontWeight: 500, fontSize: 14.5, lineHeight: 1.3 }}>{l.nombre}</Typography>
                {l.opciones.length > 0 && (
                  <Typography sx={{ fontSize: 12.5, color: T.muted }}>{l.opciones.map((o) => o.nombre).join(" / ")}</Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: 14.5, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{pesos.format(precioLinea(l))}</Typography>
            </Stack>
          );
        })}
      </Stack>

      <Stack spacing={1} sx={{ mt: 3.5 }}>
        <Fila etiqueta="Subtotal" valor={<NumeroAnimado valor={subtotal} formato={formatear} />} />
        {hayDomicilio && <Fila etiqueta={sitio.textos.domicilio} valor={domicilio > 0 ? pesos.format(domicilio) : "Gratis"} />}
      </Stack>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mt: 2.5 }}>
        <Typography sx={{ fontWeight: 600, fontSize: 20 }}>Total</Typography>
        <Stack direction="row" alignItems="baseline" spacing={1}>
          <Typography sx={{ fontSize: 12.5, color: T.muted }}>COP</Typography>
          <Typography sx={{ fontWeight: 600, fontSize: 24, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
            <NumeroAnimado valor={total} formato={formatear} />
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function Fila({ etiqueta, valor }: { etiqueta: string; valor: ReactNode }) {
  return (
    <Stack direction="row" justifyContent="space-between">
      <Typography sx={{ fontSize: 14.5, color: T.text2 }}>{etiqueta}</Typography>
      <Typography component="div" sx={{ fontSize: 14.5, fontVariantNumeric: "tabular-nums" }}>{valor}</Typography>
    </Stack>
  );
}

function Seccion({ titulo, subtitulo, children }: { titulo: string; subtitulo?: string; children: ReactNode }) {
  return (
    <Box component="section" sx={{ mb: 4.5 }}>
      <Typography component="h2" sx={{ fontWeight: 600, fontSize: 22, letterSpacing: "-0.015em", mb: subtitulo ? 0.4 : 1.75 }}>{titulo}</Typography>
      {subtitulo && <Typography sx={{ fontSize: 14, color: T.muted, mb: 1.75 }}>{subtitulo}</Typography>}
      <Stack spacing={1.5}>{children}</Stack>
    </Box>
  );
}

/* Lista de opciones unidas (como un grupo de radios con bordes compartidos) */
function GrupoOpciones({ children }: { children: ReactNode }) {
  return (
    <Box role="radiogroup" sx={{ borderRadius: "12px", border: `1px solid ${T.soft}`, overflow: "hidden", bgcolor: T.surface }}>
      {children}
    </Box>
  );
}

function Opcion({ activa, onClick, titulo, detalle, derecha, panel }: {
  activa: boolean; onClick: () => void; titulo: string; detalle?: string; derecha?: ReactNode; panel?: ReactNode;
}) {
  const reducido = useReducedMotion();
  return (
    <Box sx={{ "& + &": { borderTop: `1px solid ${T.soft}` } }}>
      <Box component="button" type="button" role="radio" aria-checked={activa} onClick={onClick}
        sx={{ width: "100%", border: 0, font: "inherit", color: T.text, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 1.5, px: 2, py: 1.9,
          bgcolor: activa ? `color-mix(in srgb, ${T.accent} 7%, ${T.surface})` : T.surface,
          boxShadow: activa ? `inset 0 0 0 2px ${T.accent}` : "none", transition: "background-color .2s ease, box-shadow .2s ease",
          "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: -2 } }}>
        <Box sx={{ width: 20, height: 20, borderRadius: "50%", flexShrink: 0, border: `${activa ? 6 : 1.5}px solid ${activa ? T.accent : T.soft}`, transition: "border .2s ease", bgcolor: T.surface }} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 500, fontSize: 15 }}>{titulo}</Typography>
          {detalle && <Typography sx={{ fontSize: 13, color: T.muted }}>{detalle}</Typography>}
        </Box>
        {derecha && (typeof derecha === "string" ? <Typography sx={{ fontSize: 14.5, fontWeight: 500 }}>{derecha}</Typography> : derecha)}
      </Box>
      <AnimatePresence initial={false}>
        {activa && panel && (
          <motion.div initial={reducido ? false : { height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={reducido ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: EASE }} style={{ overflow: "hidden" }}>
            <Box sx={{ px: 2.5, py: 2, bgcolor: T.bg, borderTop: `1px solid ${T.line}` }}>{panel}</Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}

function Etiquetas({ items }: { items: string[] }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ display: { xs: "none", sm: "flex" } }}>
      {items.map((t) => (
        <Box key={t} sx={{ px: 0.9, py: 0.3, borderRadius: "6px", border: `1px solid ${T.line}`, fontSize: 11.5, fontWeight: 600, color: T.text2, bgcolor: T.surface }}>{t}</Box>
      ))}
    </Stack>
  );
}
