// Módulo Meseros: mesas en vivo, nueva comanda, comandas abiertas y "mis comandas".
// Mismo diseño del proyecto (tarjeta principal, indicadores y tarjetas de mesa de la caja).
import { useEffect, useMemo, useState } from "react";
import { Alert, Avatar, Box, Card, Chip, CircularProgress, Divider, Stack, Tab, Tabs, Typography } from "@mui/material";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import TableRestaurantIcon from "@mui/icons-material/TableRestaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PersonPinIcon from "@mui/icons-material/PersonPin";
import WifiOffIcon from "@mui/icons-material/WifiOff";
import { apiComandas, apiCrearComanda, ESTADO_COMANDA, ESTADO_IMPRESION, type ComandaResumen, type EstadoMesa, type MesaEstado } from "../../../api/comandas";
import { useMesasEnVivo } from "../../../components/comandas/useComandas";
import { usePermisos } from "../../../hooks/usePermisos";
import { Pagina, TarjetaIndicador, TarjetaPestanas, TarjetaPrincipal } from "../../../components/pedidos/DisenoPedidos";
import { GRADIENTES } from "../../../components/pedidos/pedidosUtil";
import PedidoEditor from "./PedidoEditor";
import ComandaVista from "./ComandaVista";
import { avisarComanda, cop, hora } from "./meserosUtil";

type Vista = { tipo: "mesas" } | { tipo: "nueva"; mesa: MesaEstado } | { tipo: "comanda"; id: number };
const idUsuario = () => Number(localStorage.getItem("id_usuario") || 0);

// Colores por estado, como las tarjetas de mesa de la caja
const ESTILO: Record<EstadoMesa, { texto: string; chipBg: string; chipColor: string; chipBorder: string; gradiente: string; icono: React.ReactNode }> = {
  DISPONIBLE: { texto: "Disponible", chipBg: "#DCFCE7", chipColor: "#166534", chipBorder: "#BBF7D0", gradiente: GRADIENTES.verde, icono: <EventSeatIcon /> },
  CON_PEDIDO: { texto: "Con pedido", chipBg: "#FEF3C7", chipColor: "#92400E", chipBorder: "#FDE68A", gradiente: GRADIENTES.ambar, icono: <RestaurantIcon /> },
  PENDIENTE_PAGO: { texto: "Por cobrar", chipBg: "#EDE9FE", chipColor: "#5B21B6", chipBorder: "#DDD6FE", gradiente: GRADIENTES.violeta, icono: <PaymentsIcon /> },
  OCUPADA: { texto: "Ocupada", chipBg: "#FFE4E6", chipColor: "#9F1239", chipBorder: "#FECDD3", gradiente: GRADIENTES.rojo, icono: <RestaurantIcon /> },
  RESERVADA: { texto: "Reservada", chipBg: "#F1F5F9", chipColor: "#334155", chipBorder: "#E2E8F0", gradiente: GRADIENTES.pizarra, icono: <EventSeatIcon /> },
};

function TarjetaMesa({ m, onClick }: { m: MesaEstado; onClick?: () => void }) {
  const e = ESTILO[m.estado_operativo];
  const propia = m.id_mesero === idUsuario();
  return (
    <Card onClick={onClick}
      sx={{
        position: "relative", overflow: "hidden", p: 2, borderRadius: "22px", minHeight: { xs: 150, sm: 170 }, bgcolor: "#fff",
        display: "flex", flexDirection: "column", alignItems: "center", cursor: onClick ? "pointer" : "default", opacity: onClick ? 1 : 0.65,
        border: propia ? "2px solid #2563EB" : "1px solid rgba(15,23,42,.06)",
        boxShadow: propia ? "0 0 0 3px rgba(37,99,235,.12)" : "0 8px 24px rgba(15,23,42,.05)", transition: ".25s ease",
        "&:hover": onClick ? { transform: "translateY(-4px)", boxShadow: "0 14px 35px rgba(15,23,42,.09)" } : undefined,
      }}>
      <Box sx={{ position: "absolute", top: -35, right: -35, width: 90, height: 90, borderRadius: "50%", background: e.gradiente, opacity: .08 }} />
      <Chip label={e.texto} size="small" sx={{ position: "absolute", top: 12, right: 12, height: 26, bgcolor: e.chipBg, color: e.chipColor, border: `1px solid ${e.chipBorder}`, borderRadius: "10px", fontWeight: 700, fontSize: 11 }} />
      <Avatar sx={{ mt: 3, mb: 1.2, width: 52, height: 52, background: e.gradiente, boxShadow: "0 10px 20px rgba(0,0,0,.10)", "& svg": { fontSize: 26 } }}>{e.icono}</Avatar>
      <Typography sx={{ fontSize: { xs: 15, sm: 17 }, fontWeight: 800, color: "#0F172A", textAlign: "center", width: "100%" }} noWrap>{m.nombre}</Typography>
      {m.id_comanda
        ? <Typography sx={{ mt: .5, fontSize: 12, fontWeight: 700, color: e.chipColor, textAlign: "center", width: "100%" }} noWrap>#{m.numero_comanda} · {propia ? "tuya" : String(m.mesero ?? "").split(" ")[0]}{m.comanda_desde ? ` · ${hora(m.comanda_desde)}` : ""}</Typography>
        : <Typography sx={{ mt: .5, fontSize: 12, color: "#64748B" }}>{m.capacidad} personas</Typography>}
    </Card>
  );
}

function MisComandas({ onAbrir, recarga }: { onAbrir: (id: number) => void; recarga: number }) {
  const [lista, setLista] = useState<ComandaResumen[] | null>(null);
  useEffect(() => { apiComandas({ mias: "1", fecha: new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" }) }).then(setLista).catch(() => setLista([])); }, [recarga]);
  if (!lista) return <Box textAlign="center" py={4}><CircularProgress /></Box>;
  if (!lista.length) return <Typography color="text.secondary" fontSize={14}>Hoy aún no tienes comandas.</Typography>;
  return (
    <Stack spacing={1.2}>
      {lista.map((c) => (
        <Card key={c.id} onClick={() => onAbrir(c.id)} sx={{ p: 1.8, borderRadius: "18px", cursor: "pointer", boxShadow: "0 8px 24px rgba(15,23,42,.05)", border: "1px solid rgba(15,23,42,.06)", transition: ".2s", "&:hover": { transform: "translateY(-2px)" } }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Avatar sx={{ width: 42, height: 42, borderRadius: 3, background: GRADIENTES.azul }}><ReceiptLongIcon /></Avatar>
            <Box flex={1} minWidth={0}>
              <Typography fontWeight={800} noWrap>#{c.numero} · {c.mesa} · {hora(c.created_at)}</Typography>
              <Typography fontSize={12.5} color="#64748B">{c.unidades} producto(s) · {cop(c.total)}{c.tandas > 1 ? ` · ${c.tandas - 1} adición(es)` : ""}</Typography>
            </Box>
            <Stack alignItems="flex-end" spacing={0.5}>
              <Chip size="small" color={ESTADO_COMANDA[c.estado].color} label={ESTADO_COMANDA[c.estado].texto} sx={{ fontWeight: 700 }} />
              {c.impresion && c.impresion !== "CONFIRMADA" && <Chip size="small" variant="outlined" color={ESTADO_IMPRESION[c.impresion].color} label={ESTADO_IMPRESION[c.impresion].texto} />}
            </Stack>
          </Stack>
        </Card>
      ))}
    </Stack>
  );
}

export default function MeseroPanel() {
  const { tiene, listo } = usePermisos();
  const { mesas, error, cargando, conectado, version: recarga, recargar } = useMesasEnVivo();
  const [vista, setVista] = useState<Vista>({ tipo: "mesas" });
  const [tab, setTab] = useState(0);

  const abrir = (m: MesaEstado) => {
    if (m.id_comanda) return setVista({ tipo: "comanda", id: m.id_comanda });
    if (m.estado_operativo === "DISPONIBLE" && tiene("meseros.crear")) setVista({ tipo: "nueva", mesa: m });
  };
  const resumen = useMemo(() => ({
    libres: mesas.filter((m) => m.estado_operativo === "DISPONIBLE").length,
    mias: mesas.filter((m) => m.id_mesero === idUsuario()).length,
    pedido: mesas.filter((m) => m.estado_operativo === "CON_PEDIDO").length,
    cobro: mesas.filter((m) => m.estado_operativo === "PENDIENTE_PAGO").length,
  }), [mesas]);

  if (vista.tipo === "nueva") return (
    <Pagina>
      <PedidoEditor titulo={`Nueva comanda · ${vista.mesa.nombre}`} boton="Enviar comanda" onCancelar={() => setVista({ tipo: "mesas" })}
        onEnviar={async (items, nota, clave) => {
          const r = await apiCrearComanda({ id_mesa: vista.mesa.id, nota, items }, clave);
          setVista({ tipo: "comanda", id: r.id });
          recargar();
          await avisarComanda(r.impresion);
        }} />
    </Pagina>
  );
  if (vista.tipo === "comanda") return (
    <Pagina><ComandaVista id={vista.id} recarga={recarga} onVolver={() => { setVista({ tipo: "mesas" }); recargar(); }} /></Pagina>
  );

  return (
    <Pagina>
      <TarjetaPrincipal icono={<RoomServiceIcon />} titulo="Meseros"
        descripcion="Toma el pedido en la mesa y envíalo a cocina. La caja lo recibe al instante para cobrarlo."
        etiquetas={["Mesas en vivo", "Comandas", "Impresión en cocina"]}
        acciones={!conectado ? <Chip icon={<WifiOffIcon />} label="Sin tiempo real" sx={{ fontWeight: 600 }} /> : undefined} />
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, mb: 2 }}>
        <TarjetaIndicador titulo="Disponibles" valor={resumen.libres} subtitulo={`de ${mesas.length} mesas`} icono={<EventSeatIcon />} color="verde" />
        <TarjetaIndicador titulo="Mis mesas" valor={resumen.mias} subtitulo="atendidas por ti" icono={<PersonPinIcon />} color="azul" />
        <TarjetaIndicador titulo="Con pedido" valor={resumen.pedido} subtitulo="en cocina" icono={<RestaurantIcon />} color="ambar" />
        <TarjetaIndicador titulo="Por cobrar" valor={resumen.cobro} subtitulo="cuenta en caja" icono={<PaymentsIcon />} color="violeta" />
      </Box>
      <TarjetaPestanas>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab icon={<TableRestaurantIcon />} iconPosition="start" label="Mesas" />
          <Tab icon={<ReceiptLongIcon />} iconPosition="start" label="Mis comandas de hoy" />
        </Tabs>
        <Divider />
        <Box sx={{ p: { xs: 1.5, md: 2 }, bgcolor: "#F8FAFC" }}>
          {listo && !tiene("meseros.crear") && tab === 0 && <Alert severity="info" sx={{ mb: 2, borderRadius: 3 }}>Tu perfil permite consultar, pero no crear comandas.</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
          {tab === 0 && (cargando ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)", lg: "repeat(5, 1fr)" }, gap: 1.5 }}>
              {mesas.map((m) => {
                const usable = Boolean(m.id_comanda) || (m.estado_operativo === "DISPONIBLE" && tiene("meseros.crear"));
                return <TarjetaMesa key={m.id} m={m} onClick={usable ? () => abrir(m) : undefined} />;
              })}
              {!mesas.length && <Typography color="text.secondary">No hay mesas activas. El administrador las crea en el módulo Mesas.</Typography>}
            </Box>
          ))}
          {tab === 1 && <MisComandas recarga={recarga} onAbrir={(id) => setVista({ tipo: "comanda", id })} />}
        </Box>
      </TarjetaPestanas>
    </Pagina>
  );
}
