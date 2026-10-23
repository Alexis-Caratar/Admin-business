// Armar un pedido (nueva comanda o adición) con el catálogo real de la caja:
// mismas categorías y el mismo selector de productos y complementos.
import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { ProductosCategoriaModal } from "../Ventas/Cajero/components/ProductosCategoria";
import { apiCatalogoComandas, errorDe, nuevaClave, type ItemPedido } from "../../../api/comandas";
import type { CategoriaCajero, ProductoCajero } from "../../../types/cajero";
import { cop } from "./meserosUtil";
import { Encabezado, Seccion, TarjetaPrincipal } from "../../../components/pedidos/DisenoPedidos";
import RoomServiceIcon from "@mui/icons-material/RoomService";
import CloseIcon from "@mui/icons-material/Close";
import { sxBotonPrincipal } from "../../../components/pedidos/pedidosUtil";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import ShoppingBasketIcon from "@mui/icons-material/ShoppingBasket";

// Categoría como tarjeta con foto (selección rápida, como las mesas)
function TarjetaCategoria({ c, enPedido, onClick }: { c: CategoriaCajero; enPedido: number; onClick: () => void }) {
  const total = c.platos?.length ?? 0;
  const [fallo, setFallo] = useState(false);   // imagen que no carga: se muestra el fondo con ícono
  const imagen = c.imagen && !fallo ? c.imagen : null;
  return (
    <Box onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      sx={{
        position: "relative", overflow: "hidden", borderRadius: "22px", cursor: "pointer", bgcolor: "#fff", aspectRatio: "1 / 1",
        border: enPedido ? "2px solid #2563EB" : "1px solid rgba(15,23,42,.06)", boxShadow: "0 8px 24px rgba(15,23,42,.06)", transition: ".25s ease",
        "&:hover": { transform: "translateY(-4px)", boxShadow: "0 14px 35px rgba(15,23,42,.12)" }, "&:active": { transform: "scale(.98)" },
      }}>
      {imagen
        ? <Box component="img" src={imagen} alt="" loading="lazy" onError={() => setFallo(true)} sx={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        : <Box sx={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#DBEAFE,#EFF6FF)", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563EB", "& svg": { fontSize: 44 } }}><RestaurantMenuIcon /></Box>}
      <Box sx={{ position: "absolute", inset: 0, background: imagen ? "linear-gradient(180deg, rgba(15,23,42,0) 35%, rgba(15,23,42,.85) 100%)" : "none" }} />
      {enPedido > 0 && <Box sx={{ position: "absolute", top: 10, right: 10, minWidth: 28, height: 28, px: 1, borderRadius: 999, bgcolor: "#2563EB", color: "#fff", fontWeight: 800, fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 6px 14px rgba(37,99,235,.35)" }}>{enPedido}</Box>}
      <Box sx={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
        <Typography sx={{ fontWeight: 800, fontSize: { xs: 13.5, sm: 15 }, lineHeight: 1.2, color: imagen ? "#fff" : "#0F172A" }}>{c.categoria}</Typography>
        <Typography sx={{ fontSize: 11.5, color: imagen ? "rgba(255,255,255,.85)" : "#64748B" }}>{total} producto{total === 1 ? "" : "s"}</Typography>
      </Box>
    </Box>
  );
}

type Linea = { id_producto: number; nombre: string; precio: number; cantidad: number; nota: string };

type Props = {
  titulo: string;
  boton: string;                     // "Enviar comanda" / "Enviar adición"
  conNotaGeneral?: boolean;
  onEnviar: (items: ItemPedido[], nota: string, clave: string) => Promise<void>;
  onCancelar: () => void;
};

export default function PedidoEditor({ titulo, boton, conNotaGeneral = true, onEnviar, onCancelar }: Props) {
  const [categorias, setCategorias] = useState<CategoriaCajero[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoria, setCategoria] = useState<CategoriaCajero | null>(null);
  const [lineas, setLineas] = useState<Linea[]>([]);
  const [nota, setNota] = useState("");
  const [editarNota, setEditarNota] = useState<number | null>(null);
  const [revisar, setRevisar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  // Una clave por pedido: si la red reintenta o hay doble toque, el servidor no duplica
  const clave = useRef(nuevaClave());

  useEffect(() => {
    apiCatalogoComandas().then(setCategorias).catch((e) => setError(errorDe(e).mensaje)).finally(() => setCargando(false));
  }, []);

  const agregar = (p: ProductoCajero) => setLineas((ls) => {
    const i = ls.findIndex((l) => l.id_producto === p.id && !l.nota);
    if (i >= 0) return ls.map((l, k) => (k === i ? { ...l, cantidad: Math.min(99, l.cantidad + 1) } : l));
    return [...ls, { id_producto: p.id, nombre: p.nombre, precio: Number(p.precio_venta) || 0, cantidad: 1, nota: "" }];
  });
  const cambiar = (k: number, d: number) => setLineas((ls) => ls.map((l, i) => (i === k ? { ...l, cantidad: Math.min(99, l.cantidad + d) } : l)).filter((l) => l.cantidad > 0));
  const total = useMemo(() => lineas.reduce((a, l) => a + l.precio * l.cantidad, 0), [lineas]);
  const unidades = lineas.reduce((a, l) => a + l.cantidad, 0);

  const enviar = async () => {
    setEnviando(true); setError(null);
    try {
      await onEnviar(lineas.map((l) => ({ id_producto: l.id_producto, cantidad: l.cantidad, nota: l.nota.trim() || null })), nota.trim(), clave.current);
    } catch (e) {
      setError(errorDe(e).mensaje);
      setRevisar(false);
      clave.current = nuevaClave();   // no se registró: el siguiente intento es una operación nueva
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Stack spacing={2}>
      <TarjetaPrincipal icono={<RestaurantMenuIcon />} titulo={titulo}
        descripcion="Elige los productos de la carta, ajusta cantidades y observaciones, y envíalo a cocina."
        acciones={<Button startIcon={<CloseIcon />} onClick={onCancelar} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0", color: "#334155" }}>Cancelar</Button>} />
      {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 360px" }, gap: 2, alignItems: "start" }}>
        <Seccion titulo="Categorías" icono={<RestaurantMenuIcon />} sx={{ minWidth: 0 }}>
          {cargando ? <Box textAlign="center" py={4}><CircularProgress /></Box> : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" }, gap: 1.5 }}>
              {categorias.map((c) => <TarjetaCategoria key={c.id} c={c} enPedido={lineas.filter((l) => c.platos?.some((p) => p.id === l.id_producto)).reduce((a, l) => a + l.cantidad, 0)} onClick={() => setCategoria(c)} />)}
            </Box>
          )}
        </Seccion>

        {/* Pedido (en el celular queda debajo del catálogo) */}
        <Seccion titulo={`Pedido · ${unidades} producto${unidades === 1 ? "" : "s"}`} icono={<ShoppingBasketIcon />} sx={{ position: { md: "sticky" }, top: { md: 16 } }}>
          {!lineas.length && <Typography color="text.secondary" fontSize={14}>Toca una categoría y agrega productos.</Typography>}
          <Stack divider={<Divider flexItem />} spacing={1}>
            {lineas.map((l, k) => (
              <Box key={`${l.id_producto}-${k}`}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box flex={1} minWidth={0}>
                    <Typography fontSize={14} fontWeight={600} noWrap>{l.nombre}</Typography>
                    <Typography fontSize={12} color="text.secondary">{cop(l.precio)}</Typography>
                  </Box>
                  <IconButton size="small" onClick={() => cambiar(k, -1)} aria-label="Quitar uno"><RemoveIcon fontSize="small" /></IconButton>
                  <Typography fontWeight={700} minWidth={20} textAlign="center">{l.cantidad}</Typography>
                  <IconButton size="small" onClick={() => cambiar(k, 1)} aria-label="Agregar uno"><AddIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setEditarNota(editarNota === k ? null : k)} aria-label="Observación" color={l.nota ? "primary" : "default"}><EditNoteIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => setLineas((ls) => ls.filter((_, i) => i !== k))} aria-label="Eliminar"><DeleteOutlineIcon fontSize="small" /></IconButton>
                </Stack>
                {(editarNota === k || l.nota) && (
                  <TextField size="small" fullWidth placeholder="Observación: sin cebolla, término medio…" value={l.nota} autoFocus={editarNota === k}
                    inputProps={{ maxLength: 200 }} onChange={(e) => setLineas((ls) => ls.map((x, i) => (i === k ? { ...x, nota: e.target.value } : x)))} sx={{ mt: 1 }} />
                )}
              </Box>
            ))}
          </Stack>
          {conNotaGeneral && (
            <TextField size="small" fullWidth multiline minRows={2} label="Observación general" value={nota} onChange={(e) => setNota(e.target.value)} inputProps={{ maxLength: 300 }} sx={{ mt: 2 }} />
          )}
          <Box sx={{ mt: 2, p: 1.5, borderRadius: "14px", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between" }}>
            <Typography fontWeight={600}>Total</Typography>
            <Typography fontWeight={800}>{cop(total)}</Typography>
          </Box>
          <Button fullWidth variant="contained" disabled={!lineas.length} onClick={() => setRevisar(true)} sx={{ ...sxBotonPrincipal, mt: 2, height: 46 }}>
            Revisar y enviar
          </Button>
        </Seccion>
      </Box>

      {/* Celular: el pedido queda abajo del catálogo; esta barra siempre a la vista */}
      {lineas.length > 0 && (
        <Box sx={{ display: { xs: "flex", md: "none" }, position: "sticky", bottom: 8, zIndex: 2, p: 1.5, gap: 1.5, alignItems: "center", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", borderRadius: "18px", boxShadow: "0 12px 30px rgba(15,23,42,.25)" }}>
          <Box flex={1}>
            <Typography fontWeight={700} fontSize={14}>{unidades} producto{unidades === 1 ? "" : "s"}</Typography>
            <Typography fontSize={13} sx={{ opacity: .8 }}>{cop(total)}</Typography>
          </Box>
          <Button variant="contained" onClick={() => setRevisar(true)} sx={sxBotonPrincipal}>Revisar y enviar</Button>
        </Box>
      )}

      <ProductosCategoriaModal open={!!categoria} onClose={() => setCategoria(null)} modo="dialog" categoria={categoria} categorias={categorias} onAgregar={agregar} />

      <Dialog open={revisar} onClose={enviando ? undefined : () => setRevisar(false)} fullWidth maxWidth="sm" scroll="paper" PaperProps={{ sx: { borderRadius: 4, bgcolor: "#F8FAFC" } }}>
        <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
          <Encabezado icono={<RoomServiceIcon />} color="ambar" titulo="Confirmar envío a cocina"
            subtitulo={`${titulo} · ${unidades} producto${unidades === 1 ? "" : "s"}`} onCerrar={enviando ? undefined : () => setRevisar(false)} />
          <Seccion titulo="Lo que se va a preparar" icono={<RestaurantMenuIcon />}>
            {lineas.map((l, k) => (
              <Stack key={k} direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 1, borderBottom: "1px solid #EEF2F7", "&:last-of-type": { borderBottom: "none" } }}>
                <Box sx={{ minWidth: 34, height: 34, borderRadius: 2, bgcolor: "#FEF3C7", color: "#92400E", fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center" }}>{l.cantidad}</Box>
                <Box flex={1} minWidth={0}>
                  <Typography fontWeight={600} color="#0F172A">{l.nombre}</Typography>
                  {l.nota.trim() && <Typography fontSize={12.5} color="#64748B">* {l.nota.trim()}</Typography>}
                </Box>
                <Typography fontWeight={600} color="#334155">{cop(l.precio * l.cantidad)}</Typography>
              </Stack>
            ))}
            {conNotaGeneral && nota.trim() && (
              <Box sx={{ mt: 1.5, p: 1.2, borderRadius: 3, bgcolor: "#FFFBEB", border: "1px solid #FDE68A", fontSize: 13, color: "#92400E" }}>
                <b>Observación general:</b> {nota.trim()}
              </Box>
            )}
            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "14px", background: "linear-gradient(135deg, #111827, #1f2937)", color: "#fff", display: "flex", justifyContent: "space-between" }}>
              <Typography fontWeight={600}>Total</Typography><Typography fontWeight={800}>{cop(total)}</Typography>
            </Box>
          </Seccion>
          <Typography fontSize={12} color="#64748B" mt={1.5}>La comanda se guarda primero y luego se imprime en cocina; si la impresora falla, podrás reintentar sin duplicar el pedido.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, md: 3 }, pb: 2.5, bgcolor: "#F8FAFC" }}>
          <Button onClick={() => setRevisar(false)} disabled={enviando} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Volver</Button>
          <Button variant="contained" onClick={enviar} disabled={enviando} startIcon={enviando ? <CircularProgress size={16} color="inherit" /> : <RoomServiceIcon />} sx={sxBotonPrincipal}>{boton}</Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
