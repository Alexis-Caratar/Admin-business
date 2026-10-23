// Pagar una venta con tiquetera, desde el carrito (venta nueva) o desde una mesa (venta existente).
// Los almuerzos elegibles descuentan de la tiquetera; lo demás se cobra con otro medio.
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, MenuItem, Stack, TextField, Typography } from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PaymentsIcon from "@mui/icons-material/Payments";
import SearchIcon from "@mui/icons-material/Search";
import { Encabezado, Seccion } from "../../../../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../../../../components/pedidos/pedidosUtil";
import { apiConsumir, apiPrevisualizar, errorDe, nuevaClave, type Consumo, type Previa, type Tiquetera, type VentaCarrito } from "../../../../../../api/tiqueteras";
import { BuscadorTiqueteras, TarjetaTiquetera } from "./comun";
import { cop, motivoNoUsable } from "./tiqueterasUtil";

const MEDIOS = [["EFECTIVO", "💵 Efectivo"], ["TRANSFERENCIA", "🔁 Transferencia"], ["TARJETA", "💳 Tarjeta"], ["NEQUI", "📲 Nequi"], ["DAVIPLATA", "📲 DaviPlata"]];

type Props = {
  open: boolean;
  onClose: () => void;
  venta?: VentaCarrito;      // carrito: se crea la venta al confirmar
  idVenta?: number;          // mesa: venta ya registrada
  busquedaInicial?: string;  // documento del cliente elegido en la venta, si lo hay
  onExito: (r: Consumo) => void;
};

export const PagoTiqueteraDialog: React.FC<Props> = ({ open, onClose, venta, idVenta, busquedaInicial, onExito }) => {
  const [previa, setPrevia] = useState<Previa | null>(null);
  const [resultados, setResultados] = useState<Tiquetera[]>([]);
  const [elegida, setElegida] = useState<Tiquetera | null>(null);
  const [medio, setMedio] = useState("EFECTIVO");
  const [recibido, setRecibido] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const clave = useRef(nuevaClave());

  useEffect(() => {
    if (!open) return;
    clave.current = nuevaClave();
    setPrevia(null); setElegida(null); setResultados([]); setError(null); setRecibido(""); setMedio("EFECTIVO");
    apiPrevisualizar(idVenta ? { id_venta: idVenta } : { productos: venta?.productos ?? [] })
      .then(setPrevia)
      .catch((e) => setError(errorDe(e).mensaje));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, idVenta]);

  // Si solo hay una tiquetera usable, queda elegida
  useEffect(() => {
    const usables = resultados.filter((t) => !motivoNoUsable(t) && t.disponibles >= (previa?.almuerzos ?? 0));
    setElegida((e) => (e && resultados.some((t) => t.id === e.id) ? e : usables.length === 1 ? usables[0] : null));
  }, [resultados, previa]);

  const hayResto = (previa?.otros.length ?? 0) > 0;
  const cambio = medio === "EFECTIVO" && recibido !== "" ? Number(recibido) - (previa?.total_otros ?? 0) : 0;
  const listo = useMemo(() => {
    if (!previa || previa.almuerzos === 0 || !elegida) return false;
    if (elegida.disponibles < previa.almuerzos) return false;
    if (hayResto && medio === "EFECTIVO" && recibido !== "" && cambio < 0) return false;
    return true;
  }, [previa, elegida, hayResto, medio, recibido, cambio]);

  const confirmar = async () => {
    if (!listo || !elegida || enviando) return;
    setEnviando(true); setError(null);
    try {
      const r = await apiConsumir({
        id_tiquetera: elegida.id,
        ...(idVenta ? { id_venta: idVenta } : { venta }),
        ...(hayResto ? { metodo_resto: medio, monto_recibido_resto: recibido === "" ? undefined : Number(recibido) } : {}),
      }, clave.current);
      onExito(r);
    } catch (e) {
      const er = errorDe(e);
      setError(er.mensaje);
      // Lo rechazado no se registró: un nuevo intento es una operación nueva
      clave.current = nuevaClave();
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Dialog open={open} onClose={enviando ? undefined : onClose} fullWidth maxWidth="sm" scroll="paper" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#F8FAFC" } }}>
      <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
        <Encabezado icono={<ConfirmationNumberIcon />} color="violeta" titulo="Pagar con tiquetera"
          subtitulo={previa ? `${previa.almuerzos} almuerzo${previa.almuerzos === 1 ? "" : "s"} con tiquetera${hayResto ? ` · ${cop(previa.total_otros)} se cobran aparte` : ""}` : "Revisando la cuenta…"}
          onCerrar={enviando ? undefined : onClose} />
        {!previa && !error && <Box textAlign="center" py={3}><CircularProgress /></Box>}
        {previa && previa.almuerzos === 0 && (
          <Alert severity="warning" sx={{ borderRadius: 3 }}>Ningún producto de esta venta se puede pagar con tiquetera. Usa otro medio de pago.</Alert>
        )}
        {previa && previa.almuerzos > 0 && (
          <Stack spacing={2}>
            <Seccion titulo="Qué paga la tiquetera" icono={<RestaurantIcon />}>
              {previa.productos_tiquetera.map((p) => (
                <Stack key={p.id_producto} direction="row" spacing={1.5} alignItems="center" sx={{ py: 0.6 }}>
                  <Box sx={{ minWidth: 30, height: 30, borderRadius: 2, bgcolor: "#EDE9FE", color: "#5B21B6", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{p.cantidad}</Box>
                  <Typography fontWeight={600} color="#0F172A">{p.nombre}</Typography>
                </Stack>
              ))}
              {previa.acompanan.length > 0 && <Typography fontSize={12.5} color="#64748B" mt={0.5}>Incluido, no descuenta: {previa.acompanan.map((p) => `${p.cantidad} × ${p.nombre}`).join(" · ")}</Typography>}
              {hayResto && (
                <Box sx={{ mt: 1.5, p: 1.2, borderRadius: 3, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 13, color: "#92400E" }}>
                  <b>Se cobra aparte {cop(previa.total_otros)}:</b> {previa.otros.map((p) => `${p.cantidad} × ${p.nombre}`).join(" · ")}
                </Box>
              )}
            </Seccion>

            <Seccion titulo="Tiquetera del cliente" icono={<SearchIcon />}>
              <BuscadorTiqueteras inicial={busquedaInicial} onResultados={setResultados} autoFocus={!busquedaInicial} />
              <Stack spacing={1} sx={{ maxHeight: 300, overflowY: "auto", p: 0.5 }}>
                {resultados.map((t) => (
                  <TarjetaTiquetera key={t.id} t={t} necesarios={previa.almuerzos} seleccionada={elegida?.id === t.id} onClick={() => setElegida(t)} />
                ))}
              </Stack>
              {elegida && (
                <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "14px", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography fontWeight={600} noWrap>{elegida.cliente}</Typography>
                  <Typography fontWeight={800}>{elegida.disponibles} → {elegida.disponibles - previa.almuerzos}</Typography>
                </Box>
              )}
            </Seccion>

            {hayResto && (
              <Seccion titulo={`Cobro de lo demás · ${cop(previa.total_otros)}`} icono={<PaymentsIcon />}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <TextField select size="small" fullWidth label="Medio de pago" value={medio} onChange={(e) => setMedio(e.target.value)}>
                    {MEDIOS.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}
                  </TextField>
                  {medio === "EFECTIVO" && (
                    <TextField
                      size="small" fullWidth label="Monto recibido" value={recibido === "" ? "" : Number(recibido).toLocaleString("es-CO")}
                      onChange={(e) => { const raw = e.target.value.replace(/\D/g, ""); setRecibido(raw === "" ? "" : Number(raw)); }}
                      helperText={recibido === "" ? " " : cambio < 0 ? `Faltan ${cop(-cambio)}` : `Cambio ${cop(cambio)}`}
                      error={recibido !== "" && cambio < 0}
                    />
                  )}
                </Stack>
              </Seccion>
            )}
          </Stack>
        )}
        {error && <Alert severity="error" sx={{ mt: 2, borderRadius: 3 }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: 2.5, bgcolor: "#F8FAFC" }}>
        <Button onClick={onClose} disabled={enviando} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Cancelar</Button>
        <Button variant="contained" onClick={confirmar} disabled={!listo || enviando} startIcon={enviando ? <CircularProgress size={16} color="inherit" /> : <ConfirmationNumberIcon />} sx={sxBotonPrincipal}>
          Confirmar pago
        </Button>
      </DialogActions>
    </Dialog>
  );
};
