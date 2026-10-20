/*
 * Pestañas "Sitio web", "Horarios" y "Tienda en línea" del modal Editar negocio.
 * Mismo diseño del formulario del negocio: tarjetas blancas con ícono y título,
 * campos compactos. Todo lo que se guarda aquí aparece en /<url_negocio>.
 */
import type { ReactNode } from "react";
import {
  Alert, Box, Button, Checkbox, Chip, FormControlLabel, IconButton, InputAdornment, MenuItem, Paper, Stack, Switch,
  TextField, Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LanguageIcon from "@mui/icons-material/Language";
import ImageIcon from "@mui/icons-material/Image";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PaymentsIcon from "@mui/icons-material/Payments";
import TravelExploreIcon from "@mui/icons-material/TravelExplore";
import PlaceIcon from "@mui/icons-material/Place";
import ShareIcon from "@mui/icons-material/Share";

import { slugNegocio } from "../../../api/negocios";
import type { FotoSitio, HorarioSitio, SitioNegocio } from "../../../api/negocios";

/* Mismo estilo de campo que el formulario del negocio */
const campo = {
  "& .MuiOutlinedInput-root": {
    minHeight: 42,
    borderRadius: 3,
    background: "#FFFFFF",
    fontSize: 13,
    "& fieldset": { borderColor: "#E2E8F0" },
    "&:hover fieldset": { borderColor: "#93C5FD" },
    "&.Mui-focused fieldset": { borderColor: "#2563EB", borderWidth: 2 },
  },
  "& .MuiInputLabel-root": { fontSize: 13 },
  "& .MuiFormHelperText-root": { fontSize: 11.5 },
} as const;

const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
const ORDEN = [1, 2, 3, 4, 5, 6, 0];


type Props = {
  sitio: SitioNegocio;
  set: <K extends keyof SitioNegocio>(k: K, v: SitioNegocio[K]) => void;
  errores: Record<string, string>;
  /** Nombre del tipo de negocio y acción para cargar sus textos sugeridos */
  tipoNombre?: string;
  onSugeridos?: () => void;
};

const err = (errores: Record<string, string>, k: string) => ({ error: Boolean(errores[k]), helperText: errores[k] });

/* Tarjeta con el mismo encabezado que "Información General" */
export function Tarjeta({ icono, titulo, accion, children }: { icono: ReactNode; titulo: string; accion?: ReactNode; children: ReactNode }) {
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 4, border: "1px solid #E2E8F0", background: "#FFFFFF" }}>
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Box sx={{ color: "primary.main", display: "flex" }}>{icono}</Box>
        <Typography fontWeight={700} fontSize={17} sx={{ flex: 1 }}>{titulo}</Typography>
        {accion}
      </Box>
      <Stack spacing={2}>{children}</Stack>
    </Paper>
  );
}

const Agregar = ({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) => (
  <Button size="small" startIcon={<AddIcon />} onClick={onClick} disabled={disabled} sx={{ textTransform: "none", fontWeight: 600 }}>Agregar</Button>
);

const Quitar = ({ onClick }: { onClick: () => void }) => (
  <IconButton size="small" onClick={onClick} aria-label="Quitar" sx={{ color: "#94A3B8", "&:hover": { color: "#DC2626" } }}><DeleteOutlineIcon fontSize="small" /></IconButton>
);

/* ================================================================
 * SITIO WEB
 * ================================================================ */
export function SeccionSitioWeb({ sitio: s, set, errores, tipoNombre, onSugeridos }: Props) {
  const host = window.location.host;
  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 1fr" }} gap={3}>
      {onSugeridos && (
        <Alert severity="info" sx={{ gridColumn: "1 / -1", borderRadius: 3 }}
          action={<Button color="inherit" size="small" onClick={onSugeridos} sx={{ textTransform: "none", fontWeight: 700 }}>Usar textos sugeridos</Button>}>
          La página se adapta al tipo de negocio <b>{tipoNombre}</b>: vocabulario (carta, productos, servicios…), forma del catálogo e íconos.
          Puedes cargar textos sugeridos para este tipo y luego ajustarlos.
        </Alert>
      )}
      <Tarjeta icono={<LanguageIcon />} titulo="Dirección y publicación"
        accion={<Chip size="small" label={s.publicado ? "PUBLICADO" : "SIN PUBLICAR"} color={s.publicado ? "success" : "default"} sx={{ fontWeight: 700 }} />}>
        <TextField size="small" fullWidth label="URL del negocio" value={s.url_negocio} sx={campo}
          onChange={(e) => set("url_negocio", slugNegocio(e.target.value))} {...err(errores, "url_negocio")}
          InputProps={{ startAdornment: <InputAdornment position="start">{host}/</InputAdornment> }} />
        <TextField size="small" fullWidth label="Dominio propio (opcional)" placeholder="puntourbano.co" value={s.dominio ?? ""} sx={campo}
          onChange={(e) => set("dominio", e.target.value || null)} {...err(errores, "dominio")} />
        <TextField size="small" fullWidth label="Nombre que se muestra en la web" value={s.nombre_publico ?? ""} sx={campo}
          onChange={(e) => set("nombre_publico", e.target.value)} helperText="Vacío: se usa el nombre del negocio" />
        <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
          <FormControlLabel control={<Switch checked={s.publicado} onChange={(e) => set("publicado", e.target.checked)} />} label="Sitio publicado" />
          <TextField size="small" select label="Tema por defecto" value={s.tema} sx={{ ...campo, minWidth: 180 }}
            onChange={(e) => set("tema", e.target.value as "dark" | "light")}>
            <MenuItem value="dark">Oscuro (negro)</MenuItem>
            <MenuItem value="light">Claro (blanco)</MenuItem>
          </TextField>
        </Stack>
        <FormControlLabel control={<Switch checked={s.mostrar_fotos_productos} onChange={(e) => set("mostrar_fotos_productos", e.target.checked)} />}
          label="Mostrar las fotos de los productos (solo si son propias)" />
      </Tarjeta>

      <Tarjeta icono={<PlaceIcon />} titulo="Contacto y ubicación">
        <TextField size="small" fullWidth label="WhatsApp (con indicativo)" placeholder="573001234567" value={s.whatsapp ?? ""} sx={campo}
          onChange={(e) => set("whatsapp", e.target.value.replace(/\D/g, "") || null)} {...err(errores, "whatsapp")} />
        <TextField size="small" fullWidth label="Mensaje inicial de WhatsApp" value={s.mensaje_whatsapp ?? ""} sx={campo}
          onChange={(e) => set("mensaje_whatsapp", e.target.value)} />
        <Stack direction="row" spacing={2}>
          <TextField size="small" fullWidth type="number" label="Latitud" value={s.latitud ?? ""} sx={campo}
            onChange={(e) => set("latitud", e.target.value === "" ? null : Number(e.target.value))} {...err(errores, "latitud")} />
          <TextField size="small" fullWidth type="number" label="Longitud" value={s.longitud ?? ""} sx={campo}
            onChange={(e) => set("longitud", e.target.value === "" ? null : Number(e.target.value))} {...err(errores, "longitud")} />
        </Stack>
        <TextField size="small" fullWidth label="Enlace de Google Maps" value={s.google_maps_url ?? ""} sx={campo}
          onChange={(e) => set("google_maps_url", e.target.value || null)}
          error={Boolean(errores.google_maps_url)} helperText={errores.google_maps_url ?? "Sin latitud y longitud no se muestra el mapa \"Cómo llegar\""} />
        <TextField size="small" fullWidth label="Servicios" placeholder="Domicilios · Reservas por teléfono" value={s.servicios ?? ""} sx={campo}
          onChange={(e) => set("servicios", e.target.value)} />
      </Tarjeta>

      <Tarjeta icono={<ImageIcon />} titulo="Portada">
        <TextField size="small" fullWidth label="Eslogan" value={s.eslogan ?? ""} sx={campo} onChange={(e) => set("eslogan", e.target.value)} />
        <CampoFoto titulo="Foto de portada" foto={s.imagen_portada} onCambio={(f) => set("imagen_portada", f)} error={errores.imagen_portada} />
        <Box>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography fontWeight={600} fontSize={14}>Frases que rotan en el inicio</Typography>
            <Agregar onClick={() => set("frases", [...s.frases, ""])} disabled={s.frases.length >= 10} />
          </Stack>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {s.frases.map((f, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <TextField size="small" fullWidth value={f} sx={campo} inputProps={{ maxLength: 120 }}
                  onChange={(e) => set("frases", s.frases.map((x, j) => (j === i ? e.target.value : x)))} />
                <Quitar onClick={() => set("frases", s.frases.filter((_, j) => j !== i))} />
              </Stack>
            ))}
          </Stack>
        </Box>
        <CampoFoto titulo="Foto de la franja (entre el catálogo y la galería)" foto={s.imagen_franja} onCambio={(f) => set("imagen_franja", f)} error={errores.imagen_franja} />
        <TextField size="small" fullWidth label="Texto grande sobre la franja" value={s.franja_texto ?? ""} sx={campo} inputProps={{ maxLength: 160 }}
          onChange={(e) => set("franja_texto", e.target.value)} helperText="Vacío: se usa el eslogan" />
      </Tarjeta>

      <Tarjeta icono={<InfoOutlinedIcon />} titulo="Nosotros"
        accion={<Agregar onClick={() => set("nosotros_items", [...s.nosotros_items, { titulo: "", texto: "", foto: null }])} disabled={s.nosotros_items.length >= 6} />}>
        <TextField size="small" fullWidth label="Título" value={s.nosotros_titulo ?? ""} sx={campo} onChange={(e) => set("nosotros_titulo", e.target.value)} />
        <TextField size="small" fullWidth multiline minRows={2} label="Texto" value={s.nosotros_texto ?? ""} sx={campo} onChange={(e) => set("nosotros_texto", e.target.value)} />
        {s.nosotros_items.map((it, i) => {
          const cambiar = (v: Partial<typeof it>) => set("nosotros_items", s.nosotros_items.map((x, j) => (j === i ? { ...x, ...v } : x)));
          return (
            <Box key={i} sx={{ p: 1.5, borderRadius: 3, bgcolor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" label={`Punto ${i + 1}`} value={it.titulo} sx={campo} onChange={(e) => cambiar({ titulo: e.target.value })} />
                <TextField size="small" fullWidth label="Texto" value={it.texto} sx={campo} onChange={(e) => cambiar({ texto: e.target.value })} />
                <Quitar onClick={() => set("nosotros_items", s.nosotros_items.filter((_, j) => j !== i))} />
              </Stack>
              <Box sx={{ mt: 1 }}>
                <CampoFoto titulo="Foto" foto={it.foto} onCambio={(f) => cambiar({ foto: f })} error={errores[`nosotros_${i}`]} />
              </Box>
            </Box>
          );
        })}
      </Tarjeta>

      <Tarjeta icono={<ImageIcon />} titulo={`Galería (${s.galeria.length})`}
        accion={<Agregar onClick={() => set("galeria", [...s.galeria, { src: "", alt: "", forma: "normal" }])} disabled={s.galeria.length >= 24} />}>
        {s.galeria.length === 0 && <Typography fontSize={13} color="text.secondary">Sin fotos: la sección Galería no se muestra.</Typography>}
        {s.galeria.map((g, i) => (
          <Stack key={i} direction="row" spacing={1} alignItems="center">
            {g.src && <Box component="img" src={g.src} alt="" sx={{ width: 48, height: 36, objectFit: "cover", borderRadius: 1.5, flexShrink: 0 }} />}
            <TextField size="small" fullWidth label="URL https" value={g.src} sx={campo} {...err(errores, `galeria_${i}`)}
              onChange={(e) => set("galeria", s.galeria.map((x, j) => (j === i ? { ...x, src: e.target.value } : x)))} />
            <TextField size="small" select label="Forma" value={g.forma ?? "normal"} sx={{ ...campo, minWidth: 100 }}
              onChange={(e) => set("galeria", s.galeria.map((x, j) => (j === i ? { ...x, forma: e.target.value as FotoSitio["forma"] } : x)))}>
              <MenuItem value="normal">Normal</MenuItem><MenuItem value="alta">Alta</MenuItem><MenuItem value="ancha">Ancha</MenuItem>
            </TextField>
            <Quitar onClick={() => set("galeria", s.galeria.filter((_, j) => j !== i))} />
          </Stack>
        ))}
      </Tarjeta>

      <Box display="grid" gap={3}>
        <Tarjeta icono={<ShareIcon />} titulo="Redes sociales"
          accion={<Agregar onClick={() => set("redes", [...s.redes, { nombre: "Instagram", url: "" }])} disabled={s.redes.length >= 10} />}>
          {s.redes.length === 0 && <Typography fontSize={13} color="text.secondary">Sin redes registradas.</Typography>}
          {s.redes.map((r, i) => (
            <Stack key={i} direction="row" spacing={1} alignItems="center">
              <TextField size="small" label="Red" value={r.nombre} sx={{ ...campo, maxWidth: 140 }}
                onChange={(e) => set("redes", s.redes.map((x, j) => (j === i ? { ...x, nombre: e.target.value } : x)))} />
              <TextField size="small" fullWidth label="Enlace https" value={r.url} sx={campo} {...err(errores, `red_${i}`)}
                onChange={(e) => set("redes", s.redes.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))} />
              <Quitar onClick={() => set("redes", s.redes.filter((_, j) => j !== i))} />
            </Stack>
          ))}
        </Tarjeta>

        <Tarjeta icono={<TravelExploreIcon />} titulo="Google (SEO)">
          <TextField size="small" fullWidth label="Título" value={s.seo_titulo ?? ""} sx={campo} inputProps={{ maxLength: 160 }}
            onChange={(e) => set("seo_titulo", e.target.value)} helperText={`${(s.seo_titulo ?? "").length}/160`} />
          <TextField size="small" fullWidth multiline minRows={2} label="Descripción" value={s.seo_descripcion ?? ""} sx={campo} inputProps={{ maxLength: 300 }}
            onChange={(e) => set("seo_descripcion", e.target.value)} helperText={`${(s.seo_descripcion ?? "").length}/300`} />
        </Tarjeta>
      </Box>
    </Box>
  );
}

function CampoFoto({ titulo, foto, onCambio, error }: { titulo: string; foto: FotoSitio | null; onCambio: (f: FotoSitio | null) => void; error?: string }) {
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start">
      <Box sx={{ width: 64, height: 42, borderRadius: 2, flexShrink: 0, bgcolor: "#F1F5F9", border: "1px solid #E2E8F0", overflow: "hidden", display: "grid", placeItems: "center" }}>
        {foto?.src ? <Box component="img" src={foto.src} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <ImageIcon sx={{ fontSize: 18, color: "#94A3B8" }} />}
      </Box>
      <TextField size="small" fullWidth label={`${titulo} (URL https)`} value={foto?.src ?? ""} sx={campo} error={Boolean(error)} helperText={error}
        onChange={(e) => onCambio(e.target.value ? { src: e.target.value, alt: foto?.alt ?? "" } : null)} />
      <TextField size="small" label="Descripción" value={foto?.alt ?? ""} sx={{ ...campo, maxWidth: 170 }} disabled={!foto?.src}
        onChange={(e) => foto && onCambio({ ...foto, alt: e.target.value })} />
    </Stack>
  );
}

/* ================================================================
 * HORARIOS
 * ================================================================ */
export function SeccionHorarios({ sitio: s, set, errores }: Props) {
  const delDia = (d: number) => s.horarios.filter((h) => h.dia_semana === d);
  const cambiar = (d: number, nuevos: HorarioSitio[]) =>
    set("horarios", [...s.horarios.filter((h) => h.dia_semana !== d), ...nuevos]
      .sort((a, b) => a.dia_semana - b.dia_semana || a.hora_apertura.localeCompare(b.hora_apertura)));
  const copiarLunes = () => set("horarios", ORDEN.flatMap((d) => (delDia(d).length || d === 1 ? delDia(1).map((h) => ({ ...h, dia_semana: d })) : [])));

  return (
    <Tarjeta icono={<ScheduleIcon />} titulo="Horario de atención"
      accion={<Button size="small" onClick={copiarLunes} disabled={delDia(1).length === 0} sx={{ textTransform: "none", fontWeight: 600 }}>Copiar lunes a los días abiertos</Button>}>
      {errores.horarios && <Alert severity="error">{errores.horarios}</Alert>}
      <Typography fontSize={13} color="text.secondary">
        Hora de Colombia. Se muestra en la web ("Abierto ahora") y la tienda en línea solo recibe pedidos en estos horarios.
        Un turno que pasa de medianoche (ej. 18:00 a 02:00) cuenta hasta la madrugada siguiente.
      </Typography>
      {ORDEN.map((d) => {
        const turnos = delDia(d);
        return (
          <Stack key={d} direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems={{ sm: "center" }}
            sx={{ p: 1.2, borderRadius: 3, bgcolor: turnos.length ? "#FFFFFF" : "#F8FAFC", border: "1px solid #E2E8F0" }}>
            <FormControlLabel sx={{ minWidth: 140, m: 0 }} label={<Typography fontWeight={600} fontSize={14}>{DIAS[d]}</Typography>}
              control={<Switch size="small" checked={turnos.length > 0} onChange={(e) => cambiar(d, e.target.checked ? [{ dia_semana: d, hora_apertura: "08:00", hora_cierre: "17:00" }] : [])} />} />
            {turnos.length === 0 && <Typography fontSize={13} color="text.secondary">Cerrado</Typography>}
            {turnos.map((t, i) => (
              <Stack key={i} direction="row" spacing={1} alignItems="center">
                <TextField size="small" type="time" label="Abre" value={t.hora_apertura} sx={campo} InputLabelProps={{ shrink: true }}
                  onChange={(e) => cambiar(d, turnos.map((x, j) => (j === i ? { ...x, hora_apertura: e.target.value } : x)))} />
                <TextField size="small" type="time" label="Cierra" value={t.hora_cierre} sx={campo} InputLabelProps={{ shrink: true }}
                  onChange={(e) => cambiar(d, turnos.map((x, j) => (j === i ? { ...x, hora_cierre: e.target.value } : x)))} />
                {turnos.length > 1 && <Quitar onClick={() => cambiar(d, turnos.filter((_, j) => j !== i))} />}
              </Stack>
            ))}
            {turnos.length > 0 && turnos.length < 3 && (
              <Button size="small" startIcon={<AddIcon />} sx={{ textTransform: "none" }}
                onClick={() => cambiar(d, [...turnos, { dia_semana: d, hora_apertura: "18:00", hora_cierre: "22:00" }])}>Turno</Button>
            )}
          </Stack>
        );
      })}
    </Tarjeta>
  );
}

/* ================================================================
 * TIENDA EN LÍNEA
 * ================================================================ */
export function SeccionTienda({ sitio: s, set, errores }: Props) {
  const pesos = (label: string, k: "tienda_costo_domicilio" | "tienda_domicilio_gratis_desde" | "tienda_pedido_minimo", ayuda?: string) => (
    <TextField size="small" fullWidth type="number" label={label} value={s[k]} sx={campo} inputProps={{ min: 0, step: 500 }}
      onChange={(e) => set(k, Number(e.target.value))} error={Boolean(errores[k])} helperText={errores[k] ?? ayuda}
      InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
  );
  return (
    <Box display="grid" gridTemplateColumns={{ xs: "1fr", lg: "1fr 1fr" }} gap={3}>
      <Tarjeta icono={<StorefrontIcon />} titulo="Tienda en línea"
        accion={<Chip size="small" label={s.tienda_activa ? "ACTIVA" : "INACTIVA"} color={s.tienda_activa ? "success" : "default"} sx={{ fontWeight: 700 }} />}>
        <FormControlLabel control={<Switch checked={s.tienda_activa} onChange={(e) => set("tienda_activa", e.target.checked)} />} label={<b>Recibir pedidos por la web</b>} />
        <Typography fontSize={13} color="text.secondary">
          Solo aparecen los productos marcados con "Publicación web". Los pedidos llegan al cajero en "Pedidos web".
        </Typography>
        {errores.tienda_entrega && <Alert severity="error">{errores.tienda_entrega}</Alert>}
        <FormControlLabel control={<Checkbox checked={s.tienda_permite_domicilio} onChange={(e) => set("tienda_permite_domicilio", e.target.checked)} />} label="Domicilios" />
        <FormControlLabel control={<Checkbox checked={s.tienda_permite_recoger} onChange={(e) => set("tienda_permite_recoger", e.target.checked)} />} label="Recoger en el local" />
        <FormControlLabel control={<Checkbox checked={s.tienda_requiere_caja_abierta} onChange={(e) => set("tienda_requiere_caja_abierta", e.target.checked)} />}
          label="Recibir pedidos solo si hay una caja abierta" />
      </Tarjeta>

      <Tarjeta icono={<PaymentsIcon />} titulo="Valores y pagos">
        {pesos("Costo del domicilio", "tienda_costo_domicilio", "0 = sin costo")}
        {pesos("Domicilio gratis desde", "tienda_domicilio_gratis_desde", "0 = nunca")}
        {pesos("Pedido mínimo", "tienda_pedido_minimo", "0 = sin mínimo")}
        <FormControlLabel control={<Checkbox checked={s.tienda_permite_contraentrega} onChange={(e) => set("tienda_permite_contraentrega", e.target.checked)} />}
          label="Pago contraentrega / al recoger" />
        <Typography fontSize={13} color="text.secondary">El pago en línea (Wompi) se configura en la pestaña "Pagos y WhatsApp".</Typography>
      </Tarjeta>
    </Box>
  );
}
