/* Metas de ventas, topes de gastos por mes y configuración de alertas. */
import { useEffect, useState } from "react";
import { Alert, Box, Button, InputAdornment, Stack, Switch, TextField, Typography } from "@mui/material";
import FlagIcon from "@mui/icons-material/Flag";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import Swal from "sweetalert2";
import { errorDe, fin } from "../../../api/finanzas";
import type { ConfigAlertas } from "../../../api/finanzas";
import { Seccion } from "../../../components/pedidos/DisenoPedidos";
import { hoy, mesCorto } from "./finanzasUtil";
import { useDatos } from "./useDatos";

const mesMas = (n: number) => { const [y, m] = hoy().split("-").map(Number); return new Date(Date.UTC(y, m - 1 + n, 1)).toISOString().slice(0, 7); };
const MESES = [-1, 0, 1, 2, 3, 4].map(mesMas);
const ALERTAS: { k: keyof ConfigAlertas; t: string; d: string; u: string }[] = [
  { k: "VENCIMIENTO_DIAS", t: "Vencimientos próximos", d: "Avisar los gastos y compras que vencen en los próximos", u: "días" },
  { k: "DESVIO_PRESUPUESTO_PCT", t: "Desvío del presupuesto", d: "Avisar si los gastos superan el tope o las ventas van por debajo de la meta en más de", u: "%" },
  { k: "MARGEN_MINIMO_PCT", t: "Margen mínimo por producto", d: "Avisar los productos con margen menor a", u: "%" },
  { k: "GASTO_ALTO_PCT", t: "Gasto alto", d: "Avisar si una categoría de gasto va por encima de su promedio de 3 meses en más de", u: "%" },
];

export default function MetasFinanzas() {
  const { datos: pres, recargar } = useDatos(() => fin.presupuestos(`${MESES[0]}-01`, `${MESES.at(-1)}-01`), []);
  const { datos: al } = useDatos(() => fin.alertas(), []);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [cfg, setCfg] = useState<ConfigAlertas | null>(null);

  useEffect(() => {
    if (!pres) return;
    const v: Record<string, string> = {};
    for (const p of pres) if (!p.id_categoria) v[`${p.periodo}|${p.tipo}`] = String(p.valor);
    const t = window.setTimeout(() => setValores(v), 0);
    return () => window.clearTimeout(t);
  }, [pres]);
  useEffect(() => { if (al) { const t = window.setTimeout(() => setCfg(al.config), 0); return () => window.clearTimeout(t); } }, [al]);

  const guardar = async () => {
    const lista = MESES.flatMap((m) => (["VENTAS", "GASTO", "MARGEN"] as const).map((tipo) => {
      const v = valores[`${m}|${tipo}`];
      return { periodo: m, tipo, valor: v === undefined || v === "" ? null : Number(v) };
    }));
    try { await fin.guardarPresupuestos(lista); Swal.fire({ icon: "success", title: "Metas guardadas", timer: 1400, showConfirmButton: false }); recargar(); }
    catch (e) { Swal.fire("Error", errorDe(e).mensaje, "error"); }
  };
  const guardarAlertas = async () => {
    if (!cfg) return;
    try { setCfg(await fin.guardarAlertas(cfg)); Swal.fire({ icon: "success", title: "Alertas guardadas", timer: 1400, showConfirmButton: false }); }
    catch (e) { Swal.fire("Error", errorDe(e).mensaje, "error"); }
  };

  return (
    <Stack spacing={2}>
      <Seccion titulo="Metas y presupuesto por mes" icono={<FlagIcon />} accion={<Button variant="contained" size="small" onClick={guardar} sx={{ textTransform: "none", borderRadius: 2 }}>Guardar metas</Button>}>
        <Typography sx={{ fontSize: 12.5, color: "#64748B", mb: 2 }}>El panel compara cada mes con estas cifras. Deja vacío lo que no quieras medir.</Typography>
        <Box sx={{ overflowX: "auto" }}>
          <Box component="table" sx={{ borderCollapse: "collapse", minWidth: 720, width: "100%", "& td, & th": { p: 1, borderBottom: "1px solid #EEF2F7", fontSize: 13 }, "& th": { textAlign: "left", color: "#64748B", fontWeight: 600 } }}>
            <thead><tr><th>Mes</th><th>Meta de ventas</th><th>Tope de gastos operativos</th><th>Margen bruto esperado</th></tr></thead>
            <tbody>
              {MESES.map((m) => (
                <tr key={m}>
                  <td><b>{mesCorto(m)}</b></td>
                  {(["VENTAS", "GASTO", "MARGEN"] as const).map((tipo) => (
                    <td key={tipo}>
                      <TextField size="small" type="number" value={valores[`${m}|${tipo}`] ?? ""} onChange={(e) => setValores((v) => ({ ...v, [`${m}|${tipo}`]: e.target.value }))}
                        InputProps={tipo === "MARGEN" ? { endAdornment: <InputAdornment position="end">%</InputAdornment> } : { startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Box>
        </Box>
      </Seccion>

      <Seccion titulo="Alertas" icono={<NotificationsActiveIcon />} accion={<Button variant="contained" size="small" onClick={guardarAlertas} disabled={!cfg} sx={{ textTransform: "none", borderRadius: 2 }}>Guardar alertas</Button>}>
        {!cfg ? <Typography sx={{ fontSize: 13, color: "#64748B" }}>Cargando…</Typography> : (
          <Stack spacing={1.5}>
            {ALERTAS.map((a) => (
              <Stack key={a.k} direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }} sx={{ p: 1.5, borderRadius: 2, border: "1px solid #EEF2F7" }}>
                <Switch checked={cfg[a.k] !== null} onChange={(e) => setCfg({ ...cfg, [a.k]: e.target.checked ? 10 : null })} />
                <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600, fontSize: 14 }}>{a.t}</Typography><Typography sx={{ fontSize: 12.5, color: "#64748B" }}>{a.d}</Typography></Box>
                <TextField size="small" type="number" disabled={cfg[a.k] === null} value={cfg[a.k] ?? ""} onChange={(e) => setCfg({ ...cfg, [a.k]: Number(e.target.value) })} sx={{ width: 120 }}
                  InputProps={{ endAdornment: <InputAdornment position="end">{a.u}</InputAdornment> }} />
              </Stack>
            ))}
            {al && al.alertas.length > 0 && <Alert severity="warning" sx={{ borderRadius: 2 }}>Hay {al.alertas.length} alerta(s) activa(s): las ves en el Panel.</Alert>}
          </Stack>
        )}
      </Seccion>
    </Stack>
  );
}
