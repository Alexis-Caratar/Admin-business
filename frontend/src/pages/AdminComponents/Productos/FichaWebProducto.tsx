/*
 * Datos de la ficha del producto en la tienda web. Todo es opcional:
 * lo que se deja vacío no aparece en la página del producto.
 */
import { useState } from "react";
import {
  Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, FormControlLabel, IconButton, MenuItem, Stack, Switch, TextField, Typography,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { Producto } from "../../../types/index";

type Props = {
  form: Producto;
  setForm: (f: Producto) => void;
  /** Productos que pueden ser base de una variante (sin el actual ni otras variantes) */
  candidatosBase: Producto[];
};

export default function FichaWebProducto({ form, setForm, candidatosBase }: Props) {
  const [nuevaCaracteristica, setNuevaCaracteristica] = useState("");
  const caracteristicas = form.caracteristicas ?? [];
  const atributos = form.atributos ?? [];
  const cambiar = (campo: keyof Producto, valor: unknown) => setForm({ ...form, [campo]: valor });
  const texto = (campo: keyof Producto, label: string, filas = 3, max = 4000) => (
    <TextField label={label} size="small" fullWidth multiline minRows={filas} value={(form[campo] as string | null | undefined) ?? ""}
      onChange={(e) => cambiar(campo, e.target.value)} slotProps={{ htmlInput: { maxLength: max } }} />
  );

  const agregarCaracteristica = () => {
    const t = nuevaCaracteristica.trim();
    if (!t || caracteristicas.includes(t)) return;
    cambiar("caracteristicas", [...caracteristicas, t]);
    setNuevaCaracteristica("");
  };

  return (
    <Accordion disableGutters elevation={0} sx={{ border: "1px solid #e5e7eb", borderRadius: 3, "&::before": { display: "none" } }}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box>
          <Typography fontWeight={600} display="flex" gap={1} alignItems="center">
            <StorefrontIcon color="primary" fontSize="small" /> Ficha en la tienda web
          </Typography>
          <Typography fontSize={12.5} color="text.secondary">Marca, características, especificaciones y variantes. Lo vacío no se muestra.</Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={2}>
          <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr" }} gap={2} alignItems="center">
            <TextField label="Marca" size="small" value={form.marca ?? ""} onChange={(e) => cambiar("marca", e.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
            <FormControlLabel control={<Switch checked={Boolean(form.destacado)} onChange={(e) => cambiar("destacado", e.target.checked)} />} label="Destacar en la tienda" />
          </Box>

          {texto("descripcion_detallada", "Descripción detallada", 4, 5000)}

          {/* Características (lista de beneficios) */}
          <Box>
            <Typography fontSize={14} fontWeight={600} mb={1}>Características</Typography>
            <Stack direction="row" spacing={1}>
              <TextField size="small" fullWidth placeholder="Ej: Larga duración" value={nuevaCaracteristica}
                onChange={(e) => setNuevaCaracteristica(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); agregarCaracteristica(); } }}
                slotProps={{ htmlInput: { maxLength: 200 } }} />
              <Button variant="outlined" onClick={agregarCaracteristica} startIcon={<AddIcon />}>Agregar</Button>
            </Stack>
            {caracteristicas.length > 0 && (
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" mt={1}>
                {caracteristicas.map((c) => (
                  <Chip key={c} label={c} onDelete={() => cambiar("caracteristicas", caracteristicas.filter((x) => x !== c))} />
                ))}
              </Stack>
            )}
          </Box>

          {/* Especificaciones (nombre → valor) */}
          <Box>
            <Typography fontSize={14} fontWeight={600} mb={1}>Especificaciones</Typography>
            <Stack spacing={1}>
              {atributos.map((a, k) => (
                <Stack key={k} direction="row" spacing={1}>
                  <TextField size="small" label="Nombre" placeholder="Tonalidad" value={a.nombre} sx={{ flex: 1 }} slotProps={{ htmlInput: { maxLength: 60 } }}
                    onChange={(e) => cambiar("atributos", atributos.map((x, j) => (j === k ? { ...x, nombre: e.target.value } : x)))} />
                  <TextField size="small" label="Valor" placeholder="Rojo carmesí" value={a.valor} sx={{ flex: 1.4 }} slotProps={{ htmlInput: { maxLength: 300 } }}
                    onChange={(e) => cambiar("atributos", atributos.map((x, j) => (j === k ? { ...x, valor: e.target.value } : x)))} />
                  <IconButton aria-label="Quitar especificación" onClick={() => cambiar("atributos", atributos.filter((_, j) => j !== k))}><DeleteOutlineIcon /></IconButton>
                </Stack>
              ))}
              <Button variant="outlined" startIcon={<AddIcon />} sx={{ alignSelf: "flex-start" }}
                onClick={() => cambiar("atributos", [...atributos, { nombre: "", valor: "" }])}>Agregar especificación</Button>
            </Stack>
          </Box>

          {texto("modo_uso", "Modo de uso", 3, 3000)}
          {texto("ingredientes", "Ingredientes / composición", 3, 3000)}
          {texto("cuidados", "Cuidados y conservación", 2, 2000)}
          {texto("advertencias", "Advertencias", 2, 2000)}
          <TextField label="Fabricante" size="small" value={form.fabricante ?? ""} onChange={(e) => cambiar("fabricante", e.target.value)} slotProps={{ htmlInput: { maxLength: 150 } }} />

          {/* Variante: este producto es un color/tamaño de otro */}
          <Box sx={{ p: 2, borderRadius: 2, bgcolor: "#f9fafb" }}>
            <Typography fontSize={14} fontWeight={600}>Variante</Typography>
            <Typography fontSize={12.5} color="text.secondary" mb={1.5}>
              Si este producto es otro color o tamaño de un producto existente, elígelo. Cada variante conserva su propio precio, stock e imágenes. El producto principal también puede tener nombre y color (ej. su primer tono).
            </Typography>
            <Box display="grid" gridTemplateColumns={{ xs: "1fr", sm: "2fr 1.4fr 1fr" }} gap={2} alignItems="center">
              <TextField select size="small" label="Variante de" value={form.id_producto_base ?? ""}
                onChange={(e) => {
                  const v = e.target.value === "" ? null : Number(e.target.value);
                  setForm({ ...form, id_producto_base: v });
                }}>
                <MenuItem value="">Ninguno (producto principal)</MenuItem>
                {candidatosBase.map((p) => <MenuItem key={p.id} value={p.id}>{p.nombre}</MenuItem>)}
              </TextField>
              <TextField size="small" label="Nombre de la variante" placeholder="Rojo carmesí" 
                value={form.variante_nombre ?? ""} onChange={(e) => cambiar("variante_nombre", e.target.value)} slotProps={{ htmlInput: { maxLength: 80 } }} />
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField size="small" type="color" label="Color" value={form.variante_color ?? "#000000"} sx={{ width: 80 }}
                  onChange={(e) => cambiar("variante_color", e.target.value)} />
                {form.variante_color && <Button size="small" onClick={() => cambiar("variante_color", null)}>Sin color</Button>}
              </Stack>
            </Box>
          </Box>
        </Stack>
      </AccordionDetails>
    </Accordion>
  );
}
