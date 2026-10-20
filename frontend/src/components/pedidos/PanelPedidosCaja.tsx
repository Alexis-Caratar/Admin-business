/*
 * Pedidos web dentro del cajero: la operación del día (confirmar y facturar,
 * preparar, despachar, cobrar). Los datos y el tiempo real llegan del
 * hook usePedidosEnCurso del CajeroDashboard. Diseño del proyecto.
 */
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Chip, CircularProgress, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import SearchIcon from "@mui/icons-material/Search";
import WifiIcon from "@mui/icons-material/Wifi";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PendingActionsIcon from "@mui/icons-material/PendingActions";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import SoupKitchenIcon from "@mui/icons-material/SoupKitchen";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import ViewListIcon from "@mui/icons-material/ViewList";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";

import type { EstadoPedido } from "../../api/pedidos";
import { DetallePedido, TarjetaPedido } from "./PedidosComunes";
import { Encabezado, TarjetaIndicador } from "./DisenoPedidos";
import { campo, cop } from "./pedidosUtil";
import type { Gradiente, PedidosEnCurso } from "./pedidosUtil";

const COLUMNAS: { valor: EstadoPedido | "TODOS"; label: string; color: Gradiente; icono: ReactNode }[] = [
  { valor: "PENDIENTE", label: "Por confirmar", color: "ambar", icono: <PendingActionsIcon /> },
  { valor: "CONFIRMADO", label: "Confirmados", color: "azul", icono: <TaskAltIcon /> },
  { valor: "EN_PREPARACION", label: "En preparación", color: "violeta", icono: <SoupKitchenIcon /> },
  { valor: "LISTO", label: "Listos", color: "verde", icono: <Inventory2OutlinedIcon /> },
  { valor: "EN_CAMINO", label: "En camino", color: "rojo", icono: <DeliveryDiningIcon /> },
  { valor: "TODOS", label: "Todos en curso", color: "pizarra", icono: <ViewListIcon /> },
];

export default function PanelPedidosCaja({ datos, onAviso, onCerrar, cajaAbierta = true }: {
  datos: PedidosEnCurso; onAviso: (m: string) => void; onCerrar?: () => void; cajaAbierta?: boolean;
}) {
  const { pedidos, cargando, error, conectado, nuevos, recarga, cargar, marcarVisto } = datos;
  const [columna, setColumna] = useState<EstadoPedido | "TODOS">("PENDIENTE");
  const [busqueda, setBusqueda] = useState("");
  const [abierto, setAbierto] = useState<number | null>(null);

  const resumen = useMemo(() => {
    const c: Record<string, { n: number; total: number }> = { TODOS: { n: pedidos.length, total: 0 } };
    pedidos.forEach((p) => {
      c[p.estado] = { n: (c[p.estado]?.n ?? 0) + 1, total: (c[p.estado]?.total ?? 0) + p.total };
      c.TODOS.total += p.total;
    });
    return c;
  }, [pedidos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return pedidos
      .filter((p) => columna === "TODOS" || p.estado === columna)
      .filter((p) => !q || `${p.codigo} ${p.nombre_cliente} ${p.telefono}`.toLowerCase().includes(q));
  }, [pedidos, columna, busqueda]);

  const etiqueta = COLUMNAS.find((c) => c.valor === columna)?.label ?? "";

  return (
    <Box>
      <Encabezado
        icono={<ReceiptLongIcon />}
        titulo="Pedidos web"
        subtitulo="Confirma, prepara, despacha y cobra los pedidos de la tienda en línea."
        onCerrar={onCerrar}
        acciones={
          <>
            <Tooltip title={conectado ? "Recibiendo pedidos en tiempo real" : "Sin conexión en tiempo real: se actualiza cada 30 s"}>
              <Chip size="small" icon={conectado ? <WifiIcon /> : <WifiOffIcon />} label={conectado ? "En vivo" : "Sin conexión"}
                sx={{ fontWeight: 700, borderRadius: "8px", bgcolor: conectado ? "#DCFCE7" : "#F1F5F9", color: conectado ? "#166534" : "#64748B", "& .MuiChip-icon": { color: "inherit" } }} />
            </Tooltip>
            <Tooltip title="Actualizar">
              <IconButton onClick={cargar} aria-label="Actualizar" sx={{ bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", "&:hover": { bgcolor: "#F1F5F9" } }}>
                <RefreshIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </>
        }
      />

      {!cajaAbierta && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>Abre la caja para poder confirmar y facturar pedidos.</Alert>
      )}

      {/* INDICADORES = FILTROS */}
      <Box sx={{ display: "grid", gap: 1.5, mb: 2.5, gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)", lg: "repeat(6, 1fr)" } }}>
        {COLUMNAS.map((c) => (
          <TarjetaIndicador key={c.valor} titulo={c.label} valor={resumen[c.valor]?.n ?? 0}
            subtitulo={resumen[c.valor]?.total ? cop.format(resumen[c.valor].total) : "—"}
            icono={c.icono} color={c.color} activo={columna === c.valor} onClick={() => setColumna(c.valor)} />
        ))}
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
        <Typography sx={{ fontWeight: 700, color: "#0F172A", flex: 1 }}>
          {etiqueta} <Box component="span" sx={{ color: "#94A3B8", fontWeight: 600 }}>({visibles.length})</Box>
        </Typography>
        <TextField size="small" placeholder="Código, cliente o teléfono" value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
          sx={{ ...campo, width: { xs: "100%", sm: 300 } }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }} />
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      {cargando && <Box sx={{ display: "grid", placeItems: "center", py: 6 }}><CircularProgress /></Box>}
      {!cargando && visibles.length === 0 && (
        <Box sx={{ py: 6, textAlign: "center", color: "#94A3B8", borderRadius: "22px", border: "1px dashed #CBD5E1", bgcolor: "#FFFFFF" }}>
          <InboxOutlinedIcon sx={{ fontSize: 40 }} />
          <Typography sx={{ mt: 1, fontWeight: 600 }}>No hay pedidos en "{etiqueta}".</Typography>
        </Box>
      )}

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" } }}>
        {visibles.map((p) => (
          <TarjetaPedido key={p.id} pedido={p} nuevo={nuevos.has(p.id)} onAbrir={() => { setAbierto(p.id); marcarVisto(p.id); }} />
        ))}
      </Box>

      {abierto !== null && (
        <DetallePedido id={abierto} recarga={recarga} onCerrar={() => setAbierto(null)} onCambio={cargar} onAviso={onAviso} />
      )}
    </Box>
  );
}
