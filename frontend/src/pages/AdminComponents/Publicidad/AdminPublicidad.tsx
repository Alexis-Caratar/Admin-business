// Publicidad: menú del día y promociones para estados de WhatsApp (1080×1920).
// Se comparten desde el celular (WhatsApp → Mi estado) o se descargan para subirlas después.
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Divider, IconButton, MenuItem, Slider, Stack, Switch, Tab, Tabs, TextField, Tooltip, Typography, FormControlLabel,
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import RestaurantMenuIcon from "@mui/icons-material/RestaurantMenu";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import BookmarksIcon from "@mui/icons-material/Bookmarks";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import AutoFixHighIcon from "@mui/icons-material/AutoFixHigh";
import ImageIcon from "@mui/icons-material/Image";
import UploadIcon from "@mui/icons-material/Upload";
import PaletteIcon from "@mui/icons-material/Palette";
import StorefrontIcon from "@mui/icons-material/Storefront";
import Swal from "sweetalert2";
import { apiBorrarDiseno, apiDisenos, apiGuardarDiseno, apiRecursos, type Diseno, type Recursos } from "../../../api/publicidad";
import { Pagina, Seccion, TarjetaPestanas, TarjetaPrincipal } from "../../../components/pedidos/DisenoPedidos";
import { sxBotonPrincipal } from "../../../components/pedidos/pedidosUtil";
import { usePermisos } from "../../../hooks/usePermisos";
import { aPNG, dibujarMenu, dibujarPromo, type DatosMenu, type DatosPromo, type SeccionMenu } from "./render";

type Plantilla = "menu" | "promo";
const hoy = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });
const telefono = (t: string | null) => { const d = String(t ?? "").replace(/\D/g, ""); return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : t ?? ""; };
const direccion = (r: Recursos) => [r.negocio.direccion, r.negocio.ciudad].filter(Boolean).join("\n");

const menuInicial = (r: Recursos): DatosMenu => ({
  titulo: "Menú del día", fondo: r.fotos[0]?.url ?? null, usarLogo: true,
  secciones: [
    { titulo: "Entrada", items: [r.carta.acompanamientos.slice(0, 2).join(" - ") || "Fruta - Sopa del día"], separador: true },
    { titulo: "Principio", items: ["Arroz atollado"], separador: false },
    { titulo: "Proteínas", items: r.carta.platos.slice(0, 5).length ? r.carta.platos.slice(0, 5) : ["Pollo a la plancha", "Carne sudada"], separador: false },
    { titulo: "Bebida", items: ["Jugo natural"], separador: false },
  ],
  domicilios: "Tenemos domicilios", telefono: telefono(r.negocio.telefono), frase: "¡Escríbenos o llámanos!", direccion: direccion(r),
  acento: "#8A6A2F", texto: "#7A6230", logoFondo: "#0E4A36", opacidad: 0.82,
});
const promoInicial = (r: Recursos): DatosPromo => ({
  etiqueta: "Solo por hoy", titulo: "Almuerzo gratis", subtitulo: "para universitarios", destacado: "", descripcion: "Presenta tu carné estudiantil y disfruta tu almuerzo por nuestra cuenta.",
  condiciones: "Válido hoy hasta agotar existencias. Una promoción por persona.", telefono: telefono(r.negocio.telefono), direccion: direccion(r),
  fondo: r.fotos[0]?.url ?? null, usarLogo: true, acento: "#F59E0B", tema: "oscuro",
});
// Ideas rápidas para promociones
const IDEAS: { nombre: string; datos: Partial<DatosPromo> }[] = [
  { nombre: "Universitarios gratis", datos: { etiqueta: "Solo por hoy", titulo: "Almuerzo gratis", subtitulo: "para universitarios", destacado: "", descripcion: "Presenta tu carné estudiantil y disfruta tu almuerzo por nuestra cuenta." } },
  { nombre: "2x1", datos: { etiqueta: "Promo del día", titulo: "2x1 en almuerzos", subtitulo: "trae a un amigo", destacado: "2x1", descripcion: "Pide dos almuerzos del menú y paga solo uno." } },
  { nombre: "Descuento", datos: { etiqueta: "Esta semana", titulo: "Almuerzo ejecutivo", subtitulo: "con descuento especial", destacado: "$10.000", descripcion: "Sopa, principio, proteína y bebida." } },
  { nombre: "Nuevo plato", datos: { etiqueta: "Nuevo", titulo: "Ya llegó", subtitulo: "nuestro nuevo plato", destacado: "", descripcion: "Ven a probarlo y cuéntanos qué te parece." } },
  { nombre: "Domicilios", datos: { etiqueta: "Domicilio gratis", titulo: "Pide desde casa", subtitulo: "te lo llevamos", destacado: "$0", descripcion: "Domicilio gratis en compras desde dos almuerzos." } },
];
const COLORES = ["#F59E0B", "#EF4444", "#22C55E", "#3B82F6", "#A855F7", "#EC4899", "#C9A45C", "#14B8A6"];

/* ---------------- Fondo ---------------- */
function SelectorFondo({ fotos, valor, onChange }: { fotos: Recursos["fotos"]; valor: string | null; onChange: (v: string | null) => void }) {
  const archivo = useRef<HTMLInputElement>(null);
  const subir = (f?: File) => {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) { Swal.fire("Foto muy pesada", "Usa una imagen de menos de 8 MB.", "warning"); return; }
    const r = new FileReader(); r.onload = () => onChange(String(r.result)); r.readAsDataURL(f);
  };
  return (
    <Seccion titulo="Foto de fondo" icono={<ImageIcon />}
      accion={<Stack direction="row" spacing={1}>
        <Button size="small" startIcon={<UploadIcon />} onClick={() => archivo.current?.click()} sx={{ textTransform: "none", fontWeight: 700 }}>Subir del dispositivo</Button>
        <Button size="small" onClick={() => onChange(null)} sx={{ textTransform: "none" }}>Sin foto</Button>
      </Stack>}>
      <input ref={archivo} type="file" accept="image/*" hidden onChange={(e) => subir(e.target.files?.[0])} />
      {valor?.startsWith("data:") && <Alert severity="info" sx={{ mb: 1.5, borderRadius: 3 }}>Foto subida desde este dispositivo (no se guarda con el diseño).</Alert>}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 1, maxHeight: 220, overflowY: "auto", p: 0.5 }}>
        {fotos.map((f) => (
          <Tooltip key={f.url} title={f.titulo}>
            <Box component="img" src={f.url} alt="" loading="lazy" onClick={() => onChange(f.url)} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              sx={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 2, cursor: "pointer", border: valor === f.url ? "3px solid #2563EB" : "1px solid #E2E8F0" }} />
          </Tooltip>
        ))}
        {!fotos.length && <Typography fontSize={13} color="#64748B">El negocio aún no tiene fotos: sube una desde el dispositivo.</Typography>}
      </Box>
    </Seccion>
  );
}

/* ---------------- Vista previa + compartir ---------------- */
function Vista({ plantilla, datos, recursos, onGuardar, puedeGuardar }: { plantilla: Plantilla; datos: DatosMenu | DatosPromo; recursos: Recursos; onGuardar: () => void; puedeGuardar: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [dibujando, setDibujando] = useState(true);
  useEffect(() => {
    let vivo = true;
    const t = window.setTimeout(async () => {
      if (!canvas.current) return;
      setDibujando(true);
      try {
        if (plantilla === "menu") await dibujarMenu(canvas.current, datos as DatosMenu, recursos.negocio.nombre, recursos.negocio.logo);
        else await dibujarPromo(canvas.current, datos as DatosPromo, recursos.negocio.nombre, recursos.negocio.logo);
      } finally { if (vivo) setDibujando(false); }
    }, 250);
    return () => { vivo = false; window.clearTimeout(t); };
  }, [plantilla, datos, recursos]);

  const nombreArchivo = `${plantilla === "menu" ? "menu-del-dia" : "promocion"}-${hoy()}.png`;
  const descargar = async () => {
    const b = await aPNG(canvas.current!);
    const a = document.createElement("a"); a.href = URL.createObjectURL(b); a.download = nombreArchivo; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  const compartir = async () => {
    try {
      const b = await aPNG(canvas.current!);
      const archivo = new File([b], nombreArchivo, { type: "image/png" });
      if (navigator.canShare?.({ files: [archivo] })) { await navigator.share({ files: [archivo], title: plantilla === "menu" ? "Menú del día" : "Promoción" }); return; }
      await descargar();
      Swal.fire({ icon: "info", title: "Imagen descargada", html: "Este navegador no permite compartir directo.<br/>Abre WhatsApp → <b>Estados</b> → <b>Mi estado</b> y sube la imagen descargada." });
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") Swal.fire("No se pudo compartir", "Descarga la imagen y súbela desde WhatsApp.", "warning");
    }
  };
  return (
    <Seccion titulo="Vista previa · estado de WhatsApp" icono={<CampaignIcon />} sx={{ position: { md: "sticky" }, top: { md: 16 }, order: { xs: -1, md: 0 } }}>
      <Box sx={{ position: "relative", mx: "auto", width: "100%", maxWidth: { xs: 260, md: 340 }, aspectRatio: "9 / 16", borderRadius: "22px", overflow: "hidden", boxShadow: "0 18px 40px rgba(15,23,42,.25)", bgcolor: "#0F172A" }}>
        <Box component="canvas" ref={canvas} sx={{ width: "100%", height: "100%", display: "block" }} />
        {dibujando && <Box sx={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", bgcolor: "rgba(15,23,42,.25)" }}><CircularProgress sx={{ color: "#fff" }} /></Box>}
      </Box>
      <Stack spacing={1} mt={2}>
        <Button variant="contained" startIcon={<ShareIcon />} onClick={compartir} disabled={dibujando} sx={{ ...sxBotonPrincipal, height: 46, background: "linear-gradient(135deg,#16a34a,#22c55e)" }}>Compartir (WhatsApp → Mi estado)</Button>
        <Stack direction="row" spacing={1}>
          <Button fullWidth variant="outlined" startIcon={<DownloadIcon />} onClick={descargar} disabled={dibujando} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Descargar</Button>
          {puedeGuardar && <Button fullWidth variant="outlined" startIcon={<SaveIcon />} onClick={onGuardar} sx={{ textTransform: "none", borderRadius: 3, fontWeight: 700 }}>Guardar diseño</Button>}
        </Stack>
        <Typography fontSize={12} color="#64748B" textAlign="center">En el celular, “Compartir” abre WhatsApp: elige <b>Mi estado</b>. En el computador, descarga la imagen y súbela desde WhatsApp. WhatsApp no permite publicar estados automáticamente.</Typography>
      </Stack>
    </Seccion>
  );
}

/* ---------------- Editores ---------------- */
function EditorMenu({ d, set, recursos }: { d: DatosMenu; set: (d: DatosMenu) => void; recursos: Recursos }) {
  const cambiar = (k: number, s: Partial<SeccionMenu>) => set({ ...d, secciones: d.secciones.map((x, i) => (i === k ? { ...x, ...s } : x)) });
  const mover = (k: number, delta: number) => {
    const n = [...d.secciones]; const j = k + delta; if (j < 0 || j >= n.length) return;
    [n[k], n[j]] = [n[j], n[k]]; set({ ...d, secciones: n });
  };
  const desdeCarta = () => {
    const n = [...d.secciones];
    const i = (t: string) => n.findIndex((s) => s.titulo.toLowerCase().startsWith(t));
    if (recursos.carta.acompanamientos.length && i("entrada") >= 0) n[i("entrada")] = { ...n[i("entrada")], items: [recursos.carta.acompanamientos.slice(0, 3).join(" - ")] };
    if (recursos.carta.platos.length && i("prote") >= 0) n[i("prote")] = { ...n[i("prote")], items: recursos.carta.platos.slice(0, 7) };
    set({ ...d, secciones: n });
  };
  return (
    <Stack spacing={2}>
      <Seccion titulo="Contenido del menú" icono={<RestaurantMenuIcon />}
        accion={<Button size="small" startIcon={<AutoFixHighIcon />} onClick={desdeCarta} disabled={!recursos.carta.platos.length && !recursos.carta.acompanamientos.length} sx={{ textTransform: "none", fontWeight: 700 }}>Llenar desde la carta</Button>}>
        <TextField size="small" fullWidth label="Título" value={d.titulo} onChange={(e) => set({ ...d, titulo: e.target.value })} sx={{ mb: 2 }} />
        <Stack spacing={1.5}>
          {d.secciones.map((s, k) => (
            <Box key={k} sx={{ p: 1.5, borderRadius: "16px", border: "1px solid #E2E8F0", bgcolor: "#F8FAFC" }}>
              <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                <TextField size="small" label="Sección" value={s.titulo} onChange={(e) => cambiar(k, { titulo: e.target.value })} sx={{ flex: 1, bgcolor: "#fff" }} />
                <IconButton size="small" onClick={() => mover(k, -1)} disabled={k === 0}><ArrowUpwardIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => mover(k, 1)} disabled={k === d.secciones.length - 1}><ArrowDownwardIcon fontSize="small" /></IconButton>
                <IconButton size="small" onClick={() => set({ ...d, secciones: d.secciones.filter((_, i) => i !== k) })} sx={{ color: "#DC2626" }}><DeleteOutlineIcon fontSize="small" /></IconButton>
              </Stack>
              <TextField size="small" fullWidth multiline minRows={2} label="Platos (uno por renglón)" value={s.items.join("\n")} onChange={(e) => cambiar(k, { items: e.target.value.split("\n") })} sx={{ bgcolor: "#fff" }} />
              <FormControlLabel control={<Switch size="small" checked={s.separador} onChange={(e) => cambiar(k, { separador: e.target.checked })} />} label={<Typography fontSize={13}>Línea divisoria debajo</Typography>} />
            </Box>
          ))}
        </Stack>
        <Button startIcon={<AddIcon />} onClick={() => set({ ...d, secciones: [...d.secciones, { titulo: "Nueva sección", items: [""], separador: false }] })} sx={{ mt: 1, textTransform: "none", fontWeight: 700 }}>Agregar sección</Button>
      </Seccion>
      <Seccion titulo="Contacto" icono={<StorefrontIcon />}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          <TextField size="small" label="Texto de domicilios" value={d.domicilios} onChange={(e) => set({ ...d, domicilios: e.target.value })} />
          <TextField size="small" label="Teléfono" value={d.telefono} onChange={(e) => set({ ...d, telefono: e.target.value })} />
          <TextField size="small" label="Frase" value={d.frase} onChange={(e) => set({ ...d, frase: e.target.value })} />
          <TextField size="small" multiline minRows={2} label="Dirección (renglones)" value={d.direccion} onChange={(e) => set({ ...d, direccion: e.target.value })} />
        </Box>
      </Seccion>
      <SelectorFondo fotos={recursos.fotos} valor={d.fondo} onChange={(fondo) => set({ ...d, fondo })} />
      <Seccion titulo="Colores" icono={<PaletteIcon />}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }}>
          {([["acento", "Títulos"], ["texto", "Texto"], ["logoFondo", "Fondo del logo"]] as const).map(([k, l]) => (
            <Stack key={k} direction="row" spacing={1} alignItems="center">
              <Box component="input" type="color" value={d[k]} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set({ ...d, [k]: e.target.value })} sx={{ width: 40, height: 32, border: 0, p: 0, bgcolor: "transparent", cursor: "pointer" }} />
              <Typography fontSize={13}>{l}</Typography>
            </Stack>
          ))}
          <FormControlLabel control={<Switch size="small" checked={d.usarLogo} onChange={(e) => set({ ...d, usarLogo: e.target.checked })} />} label={<Typography fontSize={13}>Logo del negocio</Typography>} />
        </Stack>
        <Typography fontSize={13} mt={2}>Transparencia de la tarjeta</Typography>
        <Slider size="small" min={0.55} max={0.97} step={0.01} value={d.opacidad} onChange={(_, v) => set({ ...d, opacidad: v as number })} />
      </Seccion>
    </Stack>
  );
}

function EditorPromo({ d, set, recursos }: { d: DatosPromo; set: (d: DatosPromo) => void; recursos: Recursos }) {
  const campo = (k: keyof DatosPromo, label: string, extra: object = {}) => (
    <TextField size="small" fullWidth label={label} value={String(d[k] ?? "")} onChange={(e) => set({ ...d, [k]: e.target.value })} {...extra} />
  );
  return (
    <Stack spacing={2}>
      <Seccion titulo="Ideas rápidas" icono={<AutoFixHighIcon />}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {IDEAS.map((i) => <Chip key={i.nombre} label={i.nombre} onClick={() => set({ ...d, ...i.datos })} sx={{ fontWeight: 700, bgcolor: "#EFF6FF", color: "#1D4ED8" }} />)}
        </Stack>
      </Seccion>
      <Seccion titulo="Mensaje" icono={<LocalOfferIcon />}>
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
          {campo("etiqueta", "Etiqueta (ej. Solo por hoy)")}
          {campo("destacado", "Destacado (ej. 2x1, $9.900, GRATIS)")}
          <Box sx={{ gridColumn: "1 / -1" }}>{campo("titulo", "Título")}</Box>
          <Box sx={{ gridColumn: "1 / -1" }}>{campo("subtitulo", "Subtítulo (ej. para universitarios)")}</Box>
          <Box sx={{ gridColumn: "1 / -1" }}>{campo("descripcion", "Descripción", { multiline: true, minRows: 2 })}</Box>
          <Box sx={{ gridColumn: "1 / -1" }}>{campo("condiciones", "Condiciones (letra pequeña)", { multiline: true, minRows: 2 })}</Box>
          {campo("telefono", "Teléfono")}
          {campo("direccion", "Dirección")}
        </Box>
      </Seccion>
      <SelectorFondo fotos={recursos.fotos} valor={d.fondo} onChange={(fondo) => set({ ...d, fondo })} />
      <Seccion titulo="Estilo" icono={<PaletteIcon />}>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center" mb={1.5}>
          {COLORES.map((c) => <Box key={c} onClick={() => set({ ...d, acento: c })} sx={{ width: 34, height: 34, borderRadius: "50%", bgcolor: c, cursor: "pointer", border: d.acento === c ? "3px solid #0F172A" : "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,.2)" }} />)}
          <Box component="input" type="color" value={d.acento} onChange={(e: React.ChangeEvent<HTMLInputElement>) => set({ ...d, acento: e.target.value })} sx={{ width: 40, height: 34, border: 0, p: 0, bgcolor: "transparent", cursor: "pointer" }} />
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField select size="small" label="Tema" value={d.tema} onChange={(e) => set({ ...d, tema: e.target.value as DatosPromo["tema"] })} sx={{ minWidth: 160 }}>
            <MenuItem value="oscuro">Oscuro (foto de fondo)</MenuItem>
            <MenuItem value="claro">Claro</MenuItem>
          </TextField>
          <FormControlLabel control={<Switch size="small" checked={d.usarLogo} onChange={(e) => set({ ...d, usarLogo: e.target.checked })} />} label={<Typography fontSize={13}>Logo del negocio</Typography>} />
        </Stack>
      </Seccion>
    </Stack>
  );
}

/* ---------------- Página ---------------- */
export default function AdminPublicidad() {
  const { tiene } = usePermisos();
  const [recursos, setRecursos] = useState<Recursos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Plantilla | "guardadas">("menu");
  const [menu, setMenu] = useState<DatosMenu | null>(null);
  const [promo, setPromo] = useState<DatosPromo | null>(null);
  const [abierto, setAbierto] = useState<{ menu?: Diseno; promo?: Diseno }>({});
  const [disenos, setDisenos] = useState<Diseno[]>([]);
  const puedeGuardar = tiene("publicidad.guardar");

  useEffect(() => {
    apiRecursos().then((r) => { setRecursos(r); setMenu(menuInicial(r)); setPromo(promoInicial(r)); })
      .catch((e) => setError(e?.response?.data?.error ?? "No se pudo cargar la información del negocio"));
    apiDisenos().then(setDisenos).catch(() => setDisenos([]));
  }, []);

  const guardar = async (plantilla: Plantilla) => {
    const actual = abierto[plantilla];
    const r = await Swal.fire({ title: "Guardar diseño", input: "text", inputValue: actual?.nombre ?? (plantilla === "menu" ? `Menú ${hoy()}` : "Promoción"),
      showCancelButton: true, confirmButtonText: "Guardar", inputValidator: (v) => (!v.trim() ? "Ponle un nombre" : null) });
    if (!r.isConfirmed) return;
    try {
      const g = await apiGuardarDiseno({ id: actual?.id, plantilla, nombre: r.value, datos: plantilla === "menu" ? menu! : promo! });
      setAbierto({ ...abierto, [plantilla]: g });
      setDisenos(await apiDisenos());
      Swal.fire({ icon: "success", title: "Diseño guardado", timer: 1300, showConfirmButton: false });
    } catch (e) { Swal.fire("No se guardó", (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Inténtalo de nuevo", "error"); }
  };
  const abrir = (x: Diseno) => {
    if (!recursos) return;
    if (x.plantilla === "menu") { setMenu({ ...menuInicial(recursos), ...(x.datos as Partial<DatosMenu>) }); setTab("menu"); }
    else { setPromo({ ...promoInicial(recursos), ...(x.datos as Partial<DatosPromo>) }); setTab("promo"); }
    setAbierto({ ...abierto, [x.plantilla]: x });
  };
  const borrar = async (x: Diseno) => {
    const r = await Swal.fire({ title: `Borrar “${x.nombre}”`, icon: "warning", showCancelButton: true, confirmButtonText: "Borrar", confirmButtonColor: "#d32f2f" });
    if (!r.isConfirmed) return;
    await apiBorrarDiseno(x.id); setDisenos(await apiDisenos());
  };
  const contenido = useMemo(() => {
    if (!recursos || !menu || !promo) return null;
    if (tab === "guardadas") return (
      <Seccion titulo="Diseños guardados" icono={<BookmarksIcon />}>
        {!disenos.length && <Typography color="#64748B" fontSize={14}>Aún no hay diseños guardados.</Typography>}
        <Stack spacing={1}>
          {disenos.map((x) => (
            <Stack key={x.id} direction="row" alignItems="center" spacing={1.5} sx={{ p: 1.5, borderRadius: "16px", border: "1px solid #EEF2F7" }}>
              <Chip size="small" label={x.plantilla === "menu" ? "Menú" : "Promoción"} color={x.plantilla === "menu" ? "success" : "warning"} sx={{ fontWeight: 700 }} />
              <Box flex={1} minWidth={0}>
                <Typography fontWeight={700} noWrap>{x.nombre}</Typography>
                <Typography fontSize={12} color="#64748B">{new Date(x.updated_at).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })}</Typography>
              </Box>
              <Button size="small" variant="contained" onClick={() => abrir(x)} sx={{ ...sxBotonPrincipal, height: 34 }}>Abrir</Button>
              {puedeGuardar && <IconButton size="small" onClick={() => borrar(x)} sx={{ bgcolor: "#FEF2F2", color: "#DC2626" }}><DeleteOutlineIcon fontSize="small" /></IconButton>}
            </Stack>
          ))}
        </Stack>
      </Seccion>
    );
    return (
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 380px" }, alignItems: "start" }}>
        <Box minWidth={0}>
          {tab === "menu" ? <EditorMenu d={menu} set={setMenu} recursos={recursos} /> : <EditorPromo d={promo} set={setPromo} recursos={recursos} />}
        </Box>
        <Vista plantilla={tab} datos={tab === "menu" ? menu : promo} recursos={recursos} puedeGuardar={puedeGuardar} onGuardar={() => guardar(tab)} />
      </Box>
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recursos, menu, promo, tab, disenos, puedeGuardar, abierto]);

  return (
    <Pagina>
      <TarjetaPrincipal icono={<CampaignIcon />} titulo="Publicidad"
        descripcion="Crea el menú del día y promociones para tus estados de WhatsApp. Compártelos desde el celular o descárgalos para subirlos después."
        etiquetas={["Menú del día", "Promociones", "Estados de WhatsApp"]} />
      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}
      <TarjetaPestanas>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab value="menu" icon={<RestaurantMenuIcon />} iconPosition="start" label="Menú del día" />
          <Tab value="promo" icon={<LocalOfferIcon />} iconPosition="start" label="Promoción" />
          <Tab value="guardadas" icon={<BookmarksIcon />} iconPosition="start" label={`Guardadas${disenos.length ? ` (${disenos.length})` : ""}`} />
        </Tabs>
        <Divider />
        <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: "#F8FAFC" }}>
          {!contenido && !error ? <Box textAlign="center" py={6}><CircularProgress /></Box> : contenido}
        </Box>
      </TarjetaPestanas>
    </Pagina>
  );
}
