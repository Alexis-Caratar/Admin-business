import { useCallback, useEffect, useState } from "react";
import { avisarImpresion } from "../impresion/ticket";
import {
  Alert, Badge, Box, Button, Chip, CircularProgress, Dialog, DialogContent, Divider, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import StorefrontIcon from "@mui/icons-material/Storefront";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import HistoryIcon from "@mui/icons-material/History";
import CancelOutlinedIcon from "@mui/icons-material/CancelOutlined";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

import {
  agregarNotaPedido, cambiarEstadoPedido, detallePedido, imprimirPedido, mensajeError, registrarPagoPedido,
} from "../../api/pedidos";
import type { EstadoPedido, PedidoDetalle, PedidoResumen } from "../../api/pedidos";
import { ESTADOS, METODOS_COBRO, PAGOS, botonPrincipal, botonSecundario, campo, cop, hora } from "./pedidosUtil";
import { Encabezado, Seccion } from "./DisenoPedidos";

export function Filtro({ label, valor, opciones, onCambio }: { label: string; valor?: string; opciones: string[][]; onCambio: (v?: string) => void }) {
  return (
    <TextField select size="small" label={label} value={valor ?? ""} onChange={(e) => onCambio(e.target.value || undefined)} sx={{ ...campo, minWidth: 150 }}>
      <MenuItem value="">Todos</MenuItem>
      {opciones.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
    </TextField>
  );
}

/* Chip de estado con fondo suave y texto del color del estado (como "CAJA ABIERTA") */
export function ChipEstado({ estado }: { estado: EstadoPedido }) {
  const e = ESTADOS[estado];
  return <Chip size="small" label={e.label} sx={{ fontWeight: 700, borderRadius: "8px", bgcolor: `${e.color}1A`, color: e.color, border: `1px solid ${e.color}33` }} />;
}

export function ChipPago({ pago }: { pago: PedidoResumen["estado_pago"] }) {
  const tono = { success: "#16A34A", warning: "#D97706", error: "#DC2626", default: "#64748B", info: "#2563EB" }[PAGOS[pago].color];
  return <Chip size="small" label={PAGOS[pago].label} sx={{ fontWeight: 700, borderRadius: "8px", bgcolor: "#FFFFFF", color: tono, border: `1px solid ${tono}55` }} />;
}

export function TarjetaPedido({ pedido: p, nuevo, onAbrir }: { pedido: PedidoResumen; nuevo: boolean; onAbrir: () => void }) {
  const platos = p.items.filter((i) => !i.adicional);
  const color = ESTADOS[p.estado].color;
  return (
    <Badge color="error" badgeContent="Nuevo" invisible={!nuevo} sx={{ display: "block", "& .MuiBadge-badge": { right: 36, fontWeight: 700 } }}>
      <Paper elevation={0} onClick={onAbrir} role="button" tabIndex={0}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onAbrir(); } }}
        sx={{
          position: "relative", overflow: "hidden", height: "100%", p: 2, cursor: "pointer", borderRadius: "22px", background: "#fff",
          border: nuevo ? "2px solid #DC2626" : "1px solid rgba(15,23,42,0.06)", boxShadow: "0 8px 24px rgba(15,23,42,.05)", transition: ".25s",
          "&:hover": { transform: "translateY(-4px)", boxShadow: "0 15px 35px rgba(15,23,42,.10)" },
          "&:focus-visible": { outline: "2px solid #2563EB", outlineOffset: 2 },
        }}>
        {/* Franja del color del estado */}
        <Box sx={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 5, bgcolor: color }} />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography sx={{ fontWeight: 900, color: "#0F172A" }}>{p.codigo}</Typography>
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: "#94A3B8" }}>
            <AccessTimeIcon sx={{ fontSize: 15 }} />
            <Typography sx={{ fontSize: 12, fontWeight: 600 }}>{hora(p.created_at)}</Typography>
          </Stack>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.7} sx={{ mt: 1, color: "#475569" }}>
          {p.tipo_entrega === "DOMICILIO" ? <DeliveryDiningIcon sx={{ fontSize: 18 }} /> : <StorefrontIcon sx={{ fontSize: 18 }} />}
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>
            {p.nombre_cliente} · {p.tipo_entrega === "DOMICILIO" ? p.barrio || p.direccion : "Recoge"}
          </Typography>
        </Stack>
        <Typography sx={{ mt: 0.8, fontSize: 12.5, color: "#64748B", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", minHeight: 36 }}>
          {platos.map((i) => `${i.cantidad}× ${i.nombre}`).join(", ")}
        </Typography>
        <Divider sx={{ my: 1.2, borderColor: "#F1F5F9" }} />
        <Stack direction="row" spacing={0.6} useFlexGap flexWrap="wrap" alignItems="center">
          <ChipEstado estado={p.estado} />
          <ChipPago pago={p.estado_pago} />
          <Typography sx={{ ml: "auto", fontWeight: 900, fontSize: 16, color: "#0F172A" }}>{cop.format(p.total)}</Typography>
        </Stack>
        <Typography sx={{ mt: 0.5, fontSize: 11, color: "#94A3B8" }}>{p.metodo_pago === "EN_LINEA" ? "Pago en línea" : "Contraentrega"}</Typography>
      </Paper>
    </Badge>
  );
}

/* ================================================================
 * Detalle y acciones
 * ================================================================ */
export function DetallePedido({ id, recarga, onCerrar, onCambio, onAviso }: { id: number; recarga: number; onCerrar: () => void; onCambio: () => void; onAviso: (m: string) => void }) {
  const [d, setD] = useState<PedidoDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState("");
  const [cobro, setCobro] = useState({ metodo: "EFECTIVO", recibido: "" });
  const [nota, setNota] = useState("");

  const cargar = useCallback(async () => {
    try { setD(await detallePedido(id)); } catch (e) { setError(mensajeError(e)); }
  }, [id]);
  useEffect(() => { cargar(); }, [cargar, recarga]);

  const ejecutar = async (accion: () => Promise<PedidoDetalle | unknown>, exito: string) => {
    setOcupado(true);
    setError(null);
    try {
      const r = await accion();
      if (r && typeof r === "object" && "codigo" in r) setD(r as PedidoDetalle);
      else await cargar();
      onAviso(exito);
      onCambio();
      return true;
    } catch (e) {
      setError(mensajeError(e));
      await cargar(); // si fue conflicto de versión, se muestra el estado actual
      return false;
    } finally {
      setOcupado(false);
    }
  };

  if (!d) {
    return (
      <Dialog open onClose={onCerrar} PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogContent sx={{ p: 4 }}>{error ? <Alert severity="error">{error}</Alert> : <CircularProgress />}</DialogContent>
      </Dialog>
    );
  }

  const siguientes = d.siguientes_estados.filter((e) => e !== "CANCELADO" && !(e === "EN_CAMINO" && d.tipo_entrega !== "DOMICILIO"));
  const puedeCancelar = d.siguientes_estados.includes("CANCELADO");
  const esperandoPagoEnLinea = d.metodo_pago === "EN_LINEA" && d.estado_pago !== "APROBADO";
  const porCobrar = d.metodo_pago === "CONTRAENTREGA" && d.estado_pago === "PENDIENTE" && d.id_venta && d.estado !== "CANCELADO";
  const cambio = cobro.metodo === "EFECTIVO" && Number(cobro.recibido) >= d.total ? Number(cobro.recibido) - d.total : 0;

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="md" scroll="paper" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#F8FAFC" } }}>
      <DialogContent sx={{ p: { xs: 2, md: 4 } }}>
        <Encabezado
          icono={<ReceiptLongIcon />}
          color="azul"
          titulo={<Stack direction="row" alignItems="center" spacing={1} useFlexGap flexWrap="wrap"><span>{d.codigo}</span><ChipEstado estado={d.estado} /><ChipPago pago={d.estado_pago} /></Stack>}
          subtitulo={`${new Date(d.created_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })} · ${d.metodo_pago === "EN_LINEA" ? "Pago en línea (Wompi)" : "Contraentrega"}`}
          onCerrar={onCerrar}
        />

        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
        {d.estado_pago === "REEMBOLSO_PENDIENTE" && (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>Este pedido fue pagado y luego cancelado: realiza el reembolso desde el panel de Wompi o en caja.</Alert>
        )}
        {d.estado === "PENDIENTE" && esperandoPagoEnLinea && (
          <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>Esperando la confirmación del pago en línea. Se podrá confirmar cuando el pago esté aprobado.</Alert>
        )}

        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          <Seccion titulo="Cliente y entrega" icono={<PersonOutlineIcon />}>
            <Typography sx={{ fontWeight: 700, color: "#0F172A" }}>{d.nombre_cliente}</Typography>
            <Typography sx={{ fontSize: 13, color: "#475569" }}>Tel: {d.telefono}{d.email ? ` · ${d.email}` : ""}</Typography>
            <Divider sx={{ my: 1.5, borderColor: "#F1F5F9" }} />
            <Stack direction="row" spacing={1} alignItems="flex-start">
              {d.tipo_entrega === "DOMICILIO" ? <DeliveryDiningIcon sx={{ color: "#2563EB" }} /> : <StorefrontIcon sx={{ color: "#2563EB" }} />}
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{d.tipo_entrega === "DOMICILIO" ? "Domicilio" : "Recoge en el local"}</Typography>
                {d.tipo_entrega === "DOMICILIO" && (
                  <>
                    <Typography sx={{ fontSize: 13, color: "#475569" }}>{d.direccion}{d.barrio ? `, ${d.barrio}` : ""}</Typography>
                    {d.referencias && <Typography sx={{ fontSize: 12.5, color: "#94A3B8" }}>{d.referencias}</Typography>}
                  </>
                )}
              </Box>
            </Stack>
            {d.observacion && (
              <Box sx={{ mt: 1.5, p: 1.2, borderRadius: 3, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 13, color: "#92400E" }}>
                <b>Observaciones:</b> {d.observacion}
              </Box>
            )}
          </Seccion>

          <Seccion titulo="Productos" icono={<ShoppingBagOutlinedIcon />}>
            {d.items.map((i) => (
              <Box key={i.id} sx={{ mb: 0.8 }}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{i.cantidad}× {i.nombre}</Typography>
                  <Typography sx={{ fontSize: 14 }}>{cop.format(i.subtotal)}</Typography>
                </Stack>
                {i.adicionales.map((a) => (
                  <Stack key={a.id} direction="row" justifyContent="space-between">
                    <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>+ {a.nombre}</Typography>
                    <Typography sx={{ fontSize: 12.5, color: "#64748B" }}>{cop.format(a.subtotal)}</Typography>
                  </Stack>
                ))}
              </Box>
            ))}
            <Divider sx={{ my: 1, borderColor: "#F1F5F9" }} />
            <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13, color: "#64748B" }}>Subtotal</Typography><Typography sx={{ fontSize: 13 }}>{cop.format(d.subtotal)}</Typography></Stack>
            {d.tipo_entrega === "DOMICILIO" && <Stack direction="row" justifyContent="space-between"><Typography sx={{ fontSize: 13, color: "#64748B" }}>Domicilio</Typography><Typography sx={{ fontSize: 13 }}>{cop.format(d.costo_domicilio)}</Typography></Stack>}
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}><Typography sx={{ fontWeight: 900 }}>Total</Typography><Typography sx={{ fontWeight: 900, fontSize: 18 }}>{cop.format(d.total)}</Typography></Stack>
            {d.venta && <Typography sx={{ mt: 1, fontSize: 12.5, color: "#64748B" }}>Factura <b>{d.venta.numero_factura}</b> · caja {d.id_caja}</Typography>}
          </Seccion>
        </Box>

        {/* COBRO CONTRAENTREGA */}
        {porCobrar && (
          <Seccion titulo="Registrar cobro" icono={<PaymentsOutlinedIcon />} sx={{ mt: 2, border: "1px solid #BBF7D0", background: "linear-gradient(135deg,#F0FDF4,#FFFFFF)" }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "flex-start" }}>
              <TextField select size="small" label="Método" value={cobro.metodo} onChange={(e) => setCobro({ ...cobro, metodo: e.target.value })} sx={{ ...campo, minWidth: 170 }}>
                {METODOS_COBRO.map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
              </TextField>
              {cobro.metodo === "EFECTIVO" && (
                <TextField size="small" type="number" label="Recibido" value={cobro.recibido} onChange={(e) => setCobro({ ...cobro, recibido: e.target.value })} sx={campo}
                  helperText={cambio > 0 ? `Cambio: ${cop.format(cambio)}` : " "} />
              )}
              <Button variant="contained" disabled={ocupado || (cobro.metodo === "EFECTIVO" && Number(cobro.recibido) < d.total)}
                sx={{ ...botonPrincipal, background: "linear-gradient(135deg,#16A34A,#22C55E)", boxShadow: "0 8px 20px rgba(22,163,74,.20)", "&:hover": { background: "linear-gradient(135deg,#15803D,#16A34A)" }, height: 40 }}
                onClick={() => ejecutar(() => registrarPagoPedido(d.id, cobro.metodo, cobro.metodo === "EFECTIVO" ? Number(cobro.recibido) : d.total, d.version), "Cobro registrado")}>
                Registrar cobro de {cop.format(d.total)}
              </Button>
            </Stack>
          </Seccion>
        )}
        {d.metodo_pago === "CONTRAENTREGA" && d.estado_pago === "PENDIENTE" && !d.id_venta && d.estado !== "CANCELADO" && (
          <Typography sx={{ mt: 2, fontSize: 13, color: "#64748B" }}>El cobro se registra después de confirmar el pedido (se factura en tu caja abierta).</Typography>
        )}

        {/* WHATSAPP */}
        <Seccion titulo="Avisos por WhatsApp" icono={<WhatsAppIcon sx={{ color: "#25D366" }} />} sx={{ mt: 2 }}
          accion={<Chip size="small"
            label={!d.whatsapp.autorizado ? "El cliente no autorizó avisos" : d.whatsapp.automatico ? "Envío automático activo" : "Envío automático sin configurar"}
            sx={{ fontWeight: 700, borderRadius: "8px", bgcolor: d.whatsapp.autorizado && d.whatsapp.automatico ? "#DCFCE7" : "#F1F5F9", color: d.whatsapp.autorizado && d.whatsapp.automatico ? "#166534" : "#64748B" }} />}>
          {d.whatsapp.mensajes.map((m) => (
            <Typography key={m.evento} sx={{ fontSize: 13, color: "#475569" }}>
              {m.evento} · <b>{m.estado === "ENVIADO" ? "Enviado" : m.estado === "ERROR" ? "No se pudo enviar" : "En cola"}</b>
              {m.enviado_at ? ` · ${new Date(m.enviado_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}` : ""}
              {m.error ? ` · ${m.error}` : ""}
            </Typography>
          ))}
          {d.whatsapp.manual && (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mt: 1 }}>
              <Typography sx={{ flex: 1, fontSize: 13, color: "#64748B", fontStyle: "italic" }}>"{d.whatsapp.manual.texto}"</Typography>
              <Button size="small" variant="outlined" startIcon={<WhatsAppIcon />} href={d.whatsapp.manual.url} target="_blank" rel="noopener noreferrer"
                sx={{ ...botonSecundario, whiteSpace: "nowrap", color: "#128C7E", borderColor: "#25D366" }}>
                Avisar por WhatsApp
              </Button>
            </Stack>
          )}
        </Seccion>

        {/* PAGOS EN LÍNEA */}
        {d.transacciones.length > 0 && (
          <Seccion titulo="Transacciones Wompi" icono={<PaymentsOutlinedIcon />} sx={{ mt: 2 }}>
            {d.transacciones.map((t) => (
              <Typography key={t.referencia} sx={{ fontSize: 13, color: "#475569" }}>
                {new Date(t.created_at).toLocaleString("es-CO")} · {t.referencia} · <b>{t.estado}</b>{t.metodo ? ` · ${t.metodo}` : ""} · {cop.format(t.monto_centavos / 100)}
              </Typography>
            ))}
          </Seccion>
        )}

        {/* HISTORIAL */}
        <Seccion titulo="Historial" icono={<HistoryIcon />} sx={{ mt: 2 }}>
          {d.historial.map((h, i) => (
            <Stack key={i} direction="row" spacing={1.2} sx={{ mb: 0.8 }}>
              <Box sx={{ mt: 0.6, width: 8, height: 8, borderRadius: "50%", flexShrink: 0, bgcolor: h.campo === "estado" && h.valor_nuevo && h.valor_nuevo in ESTADOS ? ESTADOS[h.valor_nuevo as EstadoPedido].color : "#CBD5E1" }} />
              <Typography sx={{ fontSize: 13, color: "#475569" }}>
                <Box component="span" sx={{ color: "#94A3B8" }}>{new Date(h.created_at).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}</Box>{" · "}
                {h.campo === "nota" ? "Nota" : `${h.campo === "estado" ? "Estado" : "Pago"}: ${h.valor_anterior ?? "—"} → ${h.valor_nuevo}`}
                {h.nota ? ` · ${h.nota}` : ""} · <i>{h.usuario ?? h.origen.toLowerCase()}</i>
              </Typography>
            </Stack>
          ))}
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <TextField size="small" fullWidth placeholder="Agregar una observación interna" value={nota} onChange={(e) => setNota(e.target.value)} sx={campo} />
            <Button variant="outlined" sx={botonSecundario} disabled={!nota.trim() || ocupado} onClick={async () => { if (await ejecutar(() => agregarNotaPedido(d.id, nota), "Nota agregada")) setNota(""); }}>Guardar</Button>
          </Stack>
        </Seccion>

        {cancelando && (
          <Seccion titulo="Cancelar pedido" icono={<CancelOutlinedIcon sx={{ color: "#DC2626" }} />} sx={{ mt: 2, border: "1px solid #FCA5A5", background: "linear-gradient(135deg,#FEF2F2,#FFFFFF)" }}>
            <Typography sx={{ fontSize: 13, color: "#7F1D1D", mb: 1.5 }}>
              {d.estado_pago === "APROBADO" ? "El pago ya fue recibido: quedará como reembolso pendiente." : "El pago pendiente quedará anulado."}
              {d.id_venta ? " La factura asociada se anulará y el inventario se devolverá." : ""}
            </Typography>
            <TextField size="small" fullWidth required label="Motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} sx={campo} />
            <Stack direction="row" spacing={1} sx={{ mt: 1.5 }} justifyContent="flex-end">
              <Button variant="outlined" sx={botonSecundario} onClick={() => setCancelando(false)}>Volver</Button>
              <Button variant="contained" disabled={!motivo.trim() || ocupado}
                sx={{ ...botonPrincipal, background: "linear-gradient(135deg,#DC2626,#EF4444)", boxShadow: "0 8px 20px rgba(220,38,38,.20)", "&:hover": { background: "linear-gradient(135deg,#B91C1C,#DC2626)" } }}
                onClick={async () => { if (await ejecutar(() => cambiarEstadoPedido(d.id, "CANCELADO", d.version, motivo), "Pedido cancelado")) setCancelando(false); }}>
                Confirmar cancelación
              </Button>
            </Stack>
          </Seccion>
        )}

        {/* ACCIONES */}
        <Box sx={{ mt: 3, pt: 2.5, borderTop: "1px solid #E2E8F0", display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="outlined" startIcon={<PrintIcon />} disabled={ocupado} sx={botonSecundario} onClick={async () => { setOcupado(true); try { await avisarImpresion(await imprimirPedido(d.id), "El pedido"); } catch (e) { setError(mensajeError(e)); } finally { setOcupado(false); } }}>Imprimir</Button>
          {puedeCancelar && !cancelando && (
            <Button variant="outlined" disabled={ocupado} onClick={() => setCancelando(true)}
              sx={{ ...botonSecundario, color: "#DC2626", borderColor: "#FCA5A5", "&:hover": { bgcolor: "#FEF2F2", borderColor: "#DC2626" } }}>
              Cancelar pedido
            </Button>
          )}
          <Box sx={{ flex: 1 }} />
          {siguientes.map((e) => (
            <Button key={e} variant="contained" disabled={ocupado || (e === "CONFIRMADO" && esperandoPagoEnLinea)}
              sx={{ ...botonPrincipal, height: 44, background: ESTADOS[e].color, boxShadow: `0 8px 20px ${ESTADOS[e].color}33`, "&:hover": { background: ESTADOS[e].color, filter: "brightness(.92)" } }}
              onClick={() => ejecutar(() => cambiarEstadoPedido(d.id, e, d.version), `Pedido: ${ESTADOS[e].label}`)}>
              {ocupado ? <CircularProgress size={20} color="inherit" /> : ESTADOS[e].accion}
            </Button>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
