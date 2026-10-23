// Una comanda: productos por envío (pedido inicial y adiciones), estado de cada
// impresión, reintento/reimpresión, adición de productos y anulación.
import { useCallback, useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Encabezado, Seccion } from "../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../components/pedidos/pedidosUtil";
import PrintIcon from "@mui/icons-material/Print";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import BlockIcon from "@mui/icons-material/Block";
import Swal from "sweetalert2";
import { apiAdicionar, apiAnularComanda, apiComanda, apiReimprimir, errorDe, ESTADO_COMANDA, ESTADO_IMPRESION, type ComandaDetalle } from "../../../api/comandas";
import { usePermisos } from "../../../hooks/usePermisos";
import PedidoEditor from "./PedidoEditor";
import { avisarComanda, cop, hora } from "./meserosUtil";

export default function ComandaVista({ id, recarga, onVolver }: { id: number; recarga: number; onVolver: () => void }) {
  const { tiene } = usePermisos();
  const [c, setC] = useState<ComandaDetalle | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [adicion, setAdicion] = useState(false);
  const [imprimiendo, setImprimiendo] = useState<number | "todo" | null>(null);

  const cargar = useCallback(() => apiComanda(id).then((d) => { setC(d); setError(null); }).catch((e) => setError(errorDe(e).mensaje)), [id]);
  useEffect(() => { cargar(); }, [cargar, recarga]);

  if (error) return <Stack spacing={2}><Alert severity="error">{error}</Alert><Button onClick={onVolver}>Volver</Button></Stack>;
  if (!c) return <Box textAlign="center" py={6}><CircularProgress /></Box>;

  const editable = c.estado === "ABIERTA" || (c.estado === "EN_COBRO" && !c.estado_pago);
  const puedeAtender = c.propia || tiene(["meseros.todas", "cajero.cobrar"]);
  const tandas = [...new Set(c.items.map((i) => i.tanda))];
  const ultimaImpresion = (t: number) => [...c.impresiones].reverse().find((i) => i.tanda === t);

  if (adicion) return (
    <PedidoEditor titulo={`Agregar a la comanda #${c.numero} · ${c.mesa}`} boton="Enviar adición" conNotaGeneral={false} onCancelar={() => setAdicion(false)}
      onEnviar={async (items, _nota, clave) => {
        const r = await apiAdicionar(c.id, items, clave);
        setAdicion(false); setC(r);
        await avisarComanda(r.impresion, "Adición enviada");
      }} />
  );

  const imprimir = async (tanda?: number) => {
    setImprimiendo(tanda ?? "todo");
    try { const r = await apiReimprimir(c.id, tanda); await avisarComanda(r.impresion, r.impresion.tipo === "REINTENTO" ? "Reintento enviado" : "Reimpresión enviada"); await cargar(); }
    catch (e) { Swal.fire("No se pudo", errorDe(e).mensaje, "error"); }
    finally { setImprimiendo(null); }
  };
  const anular = async () => {
    const r = await Swal.fire({ title: `Anular comanda #${c.numero}`, input: "text", inputLabel: "Motivo (se avisa a cocina)", showCancelButton: true,
      confirmButtonText: "Anular", confirmButtonColor: "#d32f2f", inputValidator: (v) => (v.trim().length < 3 ? "Escribe el motivo" : null) });
    if (!r.isConfirmed) return;
    try { await apiAnularComanda(c.id, r.value); await cargar(); }
    catch (e) { Swal.fire("No se anuló", errorDe(e).mensaje, "error"); }
  };

  const est = ESTADO_COMANDA[c.estado];
  return (
    <Stack spacing={2}>
      <Seccion>
        <Encabezado icono={<ReceiptLongIcon />} color={c.estado === "ABIERTA" ? "ambar" : c.estado === "EN_COBRO" ? "violeta" : c.estado === "PAGADA" ? "verde" : "pizarra"}
          titulo={`Comanda #${c.numero} · ${c.mesa}`}
          subtitulo={`${c.mesero} · ${hora(c.created_at)}${c.numero_factura ? ` · Factura ${c.numero_factura}` : ""}${!c.propia ? " · de otro mesero" : ""}`}
          acciones={<>
            <Chip label={est.texto} color={est.color} sx={{ fontWeight: 700 }} />
            <Button startIcon={<ArrowBackIcon />} onClick={onVolver} sx={{ textTransform: "none", borderRadius: 3 }}>Mesas</Button>
          </>} />
        {c.nota && <Alert severity="info" sx={{ borderRadius: 3 }}>{c.nota}</Alert>}
        {c.estado === "EN_COBRO" && <Alert severity="info" sx={{ mt: 1, borderRadius: 3 }}>La cuenta está en la caja. Aún puedes agregar productos mientras no se haya pagado.</Alert>}
      </Seccion>

      {tandas.map((t) => {
        const imp = ultimaImpresion(t);
        const items = c.items.filter((i) => i.tanda === t);
        return (
          <Seccion key={t} titulo={`${t === 1 ? "Pedido" : `Adición ${t - 1}`} · ${hora(items[0].created_at)}`} icono={<ReceiptLongIcon />}
            accion={<Stack direction="row" spacing={1} alignItems="center">
              {imp && <Chip size="small" color={ESTADO_IMPRESION[imp.estado].color} label={ESTADO_IMPRESION[imp.estado].texto} title={imp.mensaje ?? undefined} sx={{ fontWeight: 700 }} />}
              {imp?.estado === "ERROR" && puedeAtender && (
                <Button size="small" variant="contained" color="error" disabled={imprimiendo !== null} onClick={() => imprimir(t)} startIcon={imprimiendo === t ? <CircularProgress size={14} color="inherit" /> : <PrintIcon />} sx={{ textTransform: "none", borderRadius: 2 }}>
                  Reintentar
                </Button>
              )}
            </Stack>}>
            {items.map((i) => (
              <Stack key={i.id} direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1, borderBottom: "1px solid #EEF2F7", "&:last-of-type": { borderBottom: "none" } }}>
                <Box sx={{ minWidth: 34, height: 34, borderRadius: 2, bgcolor: "#EFF6FF", color: "#2563EB", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{i.cantidad}</Box>
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={600} color="#0F172A">{i.nombre}</Typography>
                  {i.nota && <Typography fontSize={12.5} color="#64748B">* {i.nota}</Typography>}
                </Box>
                <Typography fontWeight={600} color="#334155">{cop(i.precio_unitario * i.cantidad)}</Typography>
              </Stack>
            ))}
          </Seccion>
        );
      })}

      <Box sx={{ p: 2, borderRadius: "18px", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography fontWeight={600}>Total</Typography>
        <Typography variant="h6" fontWeight={800}>{cop(c.total)}</Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        {editable && puedeAtender && tiene("meseros.adicionar") && (
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={() => setAdicion(true)} sx={sxBotonPrincipal}>Agregar productos</Button>
        )}
        {puedeAtender && tiene(["meseros.imprimir", "cajero.cobrar"]) && c.estado !== "ANULADA" && (
          <Button variant="outlined" startIcon={imprimiendo === "todo" ? <CircularProgress size={16} /> : <PrintIcon />} disabled={imprimiendo !== null} onClick={() => imprimir()}
            sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700, height: 42, bgcolor: "#fff" }}>
            Reimprimir todo
          </Button>
        )}
        {c.estado === "ABIERTA" && puedeAtender && tiene("meseros.anular") && (
          <Button color="error" startIcon={<BlockIcon />} onClick={anular} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Anular</Button>
        )}
      </Stack>
    </Stack>
  );
}

