import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  IconButton,
  Stack,
  Pagination
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";
import CategoryIcon from "@mui/icons-material/Category";
import NumbersIcon from "@mui/icons-material/Numbers";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import AddBoxIcon from "@mui/icons-material/AddBox";
import { useTheme, useMediaQuery } from "@mui/material";
import Swal from "sweetalert2";
import { motion } from "framer-motion";
import SearchIcon from "@mui/icons-material/Search";

import {
  getInventarios,
  deleteInventario,
  crearInventario,
  actualizarInventario,
  crearMovimiento,
} from "../../../api/inventarios";

const AdminInventario: React.FC = () => {
  const [inventarios, setInventarios] = useState<any[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [openMovimiento, setOpenMovimiento] = useState(false);
  const [tipoMovimiento, setTipoMovimiento] = useState("");
  const [motivo, setMotivo] = useState("");
  const [itemsMovimiento, setItemsMovimiento] = useState<any[]>([]);
  const [modoMovimiento, setModoMovimiento] = useState<"INDIVIDUAL" | "MASIVO">("MASIVO");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 24;
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const rol = localStorage.getItem("rol") || "";


  const inventariosFiltrados = inventarios.filter((inv) => {
    const texto = search.toLowerCase();

    return (
      (inv.nombre || "").toLowerCase().includes(texto) ||
      (inv.unidad || "").toLowerCase().includes(texto) ||
      (inv.tipo || "").toLowerCase().includes(texto)
    );
  });

  const inventariosPaginados = inventariosFiltrados.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(inventariosFiltrados.length / itemsPerPage);


  const abrirMovimiento = (tipo: string, modo: "INDIVIDUAL" | "MASIVO", productoId?: number) => {
    setTipoMovimiento(tipo);
    setModoMovimiento(modo);
    setMotivo("");

    if (modo === "INDIVIDUAL") {
      setItemsMovimiento([
        { inventario_id: productoId || "", cantidad: 0 }
      ]);
    } else {
      setItemsMovimiento([
        { inventario_id: "", cantidad: 0 }
      ]);
    }

    setOpenMovimiento(true);
  };
  type TipoInventario = "INSUMO" | "PRODUCTO" | "ACTIVO";

  const [form, setForm] = useState<{
    nombre: string;
    unidad: string;
    tipo: TipoInventario;
    stock_actual: number | "";
    stock_minimo: number | "";
    stock_maximo: number | "";
    costo_unitario: number | "";
  }>({
    nombre: "",
    unidad: "",
    tipo: "INSUMO",
    stock_actual: 0,
    stock_minimo: 0,
    stock_maximo: 0,
    costo_unitario: 0
  });

  const fetchData = async () => {
    const data = await getInventarios();
    setInventarios(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ CREAR / EDITAR
  const handleSubmit = async () => {
    if (!form.nombre) {
      Swal.fire("Error", "El nombre es obligatorio", "warning");
      return;
    }

    try {
      const toNumber = (value: number | "") => (value === "" ? 0 : value);

      const cleanForm = {
        ...form,
        stock_actual: toNumber(form.stock_actual),
        stock_minimo: toNumber(form.stock_minimo),
        stock_maximo: toNumber(form.stock_maximo),
        costo_unitario: toNumber(form.costo_unitario),
      };

      if (editingId) {
        await actualizarInventario(editingId, cleanForm);
      } else {
        await crearInventario(cleanForm);
      }

      setOpenModal(false);
      resetForm();
      fetchData();
    } catch (error) {
      Swal.fire("Error", "No se pudo guardar", "error");
    }
  };

  const resetForm = () => {
    setForm({
      nombre: "",
      unidad: "",
      tipo: "INSUMO",
      stock_actual: 0,
      stock_minimo: 0,
      stock_maximo: 0,
      costo_unitario: 0
    });
    setEditingId(null);
  };

  // ✅ EDITAR
  const handleEdit = (inv: any) => {
    setForm(inv);
    setEditingId(inv.id);
    setOpenModal(true);
  };

  // ✅ ELIMINAR
  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "¿Eliminar?",
      icon: "warning",
      showCancelButton: true
    });

    if (result.isConfirmed) {
      await deleteInventario(id);
      fetchData();
    }
  };



  return (
    <Box p={2}>
      {/* HEADER */}

      <Box
        display="flex"
        flexDirection={isMobile ? "column" : "row"}
        justifyContent="space-between"
        alignItems={isMobile ? "flex-start" : "center"}
        gap={2}
        mb={4}
      >
        {/* TITULO */}
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Inventario
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Gestiona productos, stock y movimientos
          </Typography>
        </Box>

        {/* ACCIONES */}
        <Stack
          direction={isMobile ? "column" : "row"}
          spacing={2}
          width={isMobile ? "100%" : "auto"}
        >
          <Button
            variant="outlined"
            color="success"
            startIcon={<TrendingUpIcon />}
            onClick={() => abrirMovimiento("ENTRADA", "MASIVO")}
            sx={{ borderRadius: 2 }}
          >
            Registrar entradas
          </Button>

          {rol == 'admin' && (
            <>
              <Button
                variant="outlined"
                color="warning"
                startIcon={<TrendingDownIcon />}
                onClick={() => abrirMovimiento("SALIDA", "MASIVO")}
                sx={{ borderRadius: 2 }}
              >
                Registrar Salidas
              </Button>

              <Button
                variant="contained"
                startIcon={<AddBoxIcon />}
                onClick={() => {
                  resetForm();
                  setOpenModal(true);
                }}
                sx={{ borderRadius: 2, px: 3 }}
              >
                Nuevo
              </Button>
            </>
          )}

        </Stack>
      </Box>

      <Box mb={3} display="flex" justifyContent="space-between">
        <TextField
          placeholder="Buscar producto..."
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: "text.secondary" }} />
          }}
        />

        <Typography variant="body2" color="text.secondary">
          {inventariosFiltrados.length} resultados
        </Typography>

      </Box>


      {/* LISTA */}
     <Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 3,
  }}
>
        {inventariosPaginados.map((inv) => {
         // const bajoStock = inv.stock_actual <= inv.stock_minimo;
          return (
            <Box
        key={inv.id}
        sx={{
          flex: {
            xs: "0 0 40%",
            sm: "0 0 calc(30% - 24px)",
            md: "0 0 calc(25% - 24px)",
            lg: "0 0 calc(20% - 24px)",
            xl: "0 0 calc(16% - 24px)",
          },
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          style={{ height: "100%" }}
        >
      <Card
  sx={{
    position: "relative",
    height: "100%",
    borderRadius: "20px",
    p: 1.5,
    pb: 1, // 🔥 clave: reduce aire inferior
    bgcolor: "#fff",
    border: "1px solid rgba(15,23,42,0.06)",
    boxShadow: "0 6px 18px rgba(15,23,42,0.05)",
    transition: "0.2s ease",

    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 12px 28px rgba(15,23,42,0.10)",
    },
  }}
>
  {/* DECORACIÓN */}
  <Box
    sx={{
      position: "absolute",
      top: -50,
      right: -50,
      width: 120,
      height: 120,
      borderRadius: "50%",
      background:
        "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(96,165,250,0.02))",
    }}
  />

  <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
    <Stack
      spacing={0.3}
      sx={{
        position: "relative",
        zIndex: 2,
      }}
    >

      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <InventoryIcon sx={{ fontSize: 16, color: "#2563eb" }} />

          <Typography
            sx={{
              fontSize: 11,
              fontWeight: 800,
              lineHeight: 1,
              m: 0,
              p:0.5,
            }}
          >
            {inv.nombre}
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 0.8,
            py: 0.2,
            p:0.5,
            borderRadius: 999,
            fontSize: 10,
            fontWeight: 700,
            bgcolor: "#f1f5f9",
          }}
        >
          {inv.tipo}
        </Box>
      </Stack>

      {/* UNIDAD */}
      <Typography sx={{ p:0.5,fontSize: 11, color: "#64748b", m: 0, lineHeight: 1.1 }}>
        Unidad: {inv.unidad}
      </Typography>

      {/* STOCK */}
      <Box
        sx={{
          p: 0.8,
          borderRadius: 2,
          bgcolor: inv.stock_actual <= inv.stock_minimo ? "#fef2f2" : "#f0fdf4",
          border: "1px solid",
          borderColor: inv.stock_actual <= inv.stock_minimo ? "#fecaca" : "#bbf7d0",
        }}
      >
        <Stack direction="row" justifyContent="space-between">
          <Typography sx={{ fontSize: 10, color: "#64748b" }}>
            Stock
          </Typography>

          <Typography
            sx={{
              fontSize: 15,
              fontWeight: 900,
              lineHeight: 1,
              color:
                inv.stock_actual <= inv.stock_minimo ? "#dc2626" : "#16a34a",
            }}
          >
            {inv.stock_actual}
          </Typography>
        </Stack>

        <Typography sx={{ fontSize: 10, color: "#94a3b8", lineHeight: 1 }}>
          Mín: {inv.stock_minimo}
        </Typography>

        {inv.stock_actual <= inv.stock_minimo && (
          <Typography sx={{ fontSize: 10, color: "#dc2626", fontWeight: 700 }}>
            ⚠ Bajo stock
          </Typography>
        )}
      </Box>

      {/* COSTO */}
      {rol === "admin" && (
        <Typography
          sx={{
            fontSize: 11,
            fontWeight: 700,
            m: 0,
            lineHeight: 1,
          }}
        >
          $ {inv.costo_unitario}
        </Typography>
      )}

      {/* ACCIONES (SIN ESPACIO EXTRA) */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mt: 0.2 }}   // 🔥 mínimo espacio controlado
      >
        {rol === "admin" && (
          <Stack direction="row" spacing={0.5}>
            <IconButton size="small" sx={{ p: 0.4 }} onClick={() => handleEdit(inv)}>
              <EditIcon fontSize="small" />
            </IconButton>

            <IconButton size="small" sx={{ p: 0.4 }} onClick={() => handleDelete(inv.id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Stack>
        )}

        <Stack direction="row" spacing={0.5}>
          <Button
            size="small"
            sx={{
              minWidth: 28,
              height: 26,
              fontSize: 11,
              borderRadius: 1.5,
              p: 0,
            }}
            variant="outlined"
            color="success"
            onClick={(e) => {
              e.stopPropagation();
              abrirMovimiento("ENTRADA", "INDIVIDUAL", inv.id);
            }}
          >
            +
          </Button>

          {rol === "admin" && (
            <Button
              size="small"
              sx={{
                minWidth: 28,
                height: 26,
                fontSize: 11,
                borderRadius: 1.5,
                p: 0,
              }}
              variant="outlined"
              color="warning"
              onClick={(e) => {
                e.stopPropagation();
                abrirMovimiento("SALIDA", "INDIVIDUAL", inv.id);
              }}
            >
              -
            </Button>
          )}
        </Stack>
      </Stack>

    </Stack>
  </CardContent>
</Card>

            </motion.div>
            </Box>
          );
        })}
      </Box>
      {/* PAGINACIÓN */}
      {totalPages > 1 && (
        <Stack alignItems="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
            size={isMobile ? "small" : "medium"}
            siblingCount={isMobile ? 0 : 1}
            boundaryCount={isMobile ? 1 : 2}
            showFirstButton={!isMobile}
            showLastButton={!isMobile}

          />
        </Stack>
      )}


      {/* MODAL */}

      <Dialog
        open={openModal}
        onClose={() => setOpenModal(false)}
        fullWidth
        maxWidth="sm"
      >
        {/* HEADER */}
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Inventory2Icon />
            <Typography fontWeight={600}>
              {editingId ? "Editar inventario" : "Nuevo inventario"}
            </Typography>
          </Stack>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={3} mt={1}>

            {/* INFO GENERAL */}
            <Box>
              <Typography fontSize={13} color="text.secondary" mb={1}>
                Información general
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Nombre"
                  fullWidth
                  value={form.nombre}
                  onChange={(e) =>
                    setForm({ ...form, nombre: e.target.value })
                  }
                  InputProps={{
                    startAdornment: <CategoryIcon sx={{ mr: 1 }} />
                  }}
                />

                <TextField
                  label="Unidad"
                  fullWidth
                  select
                  value={form.unidad}
                  onChange={(e) =>
                    setForm({ ...form, unidad: e.target.value })
                  }
                  helperText="Puedes seleccionar o escribir una unidad"
                  SelectProps={{
                    native: false
                  }}
                >
                  <MenuItem value="UND">Unidad (UND)</MenuItem>
                  <MenuItem value="GRAMO">GRAMO</MenuItem>
                  <MenuItem value="L">Litro</MenuItem>
                  <MenuItem value="OTRO">Otro...</MenuItem>
                </TextField>

                <FormControl fullWidth>
                  <InputLabel>Tipo</InputLabel>
                  <Select
                    value={form.tipo}
                    label="Tipo"
                    onChange={(e) =>
                      setForm({ ...form, tipo: e.target.value })
                    }
                  >
                    <MenuItem value="INSUMO">Insumo</MenuItem>
                    <MenuItem value="PRODUCTO">Producto</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>

            {/* STOCK */}
            <Box>
              <Typography fontSize={13} color="text.secondary" mb={1}>
                Control de stock
              </Typography>

              <Box
                display="grid"
                gridTemplateColumns="repeat(3, 1fr)"
                gap={2}
              >
                <TextField
                  label="Actual"
                  type="number"
                  value={form.stock_actual === 0 ? "" : form.stock_actual}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock_actual: e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    })
                  }
                  inputProps={{ min: 0 }}
                  InputProps={{
                    startAdornment: <NumbersIcon sx={{ mr: 1, color: "text.secondary" }} />
                  }}
                />

                <TextField
                  label="Mínimo"
                  type="number"
                  value={form.stock_minimo === 0 ? "" : form.stock_minimo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock_minimo: e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    })
                  }
                  inputProps={{ min: 0 }}
                />

                <TextField
                  label="Máximo"
                  type="number"
                  value={form.stock_maximo === 0 ? "" : form.stock_maximo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      stock_maximo: e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    })
                  }
                  inputProps={{ min: 0 }}
                />
              </Box>
            </Box>

            {/* COSTO */}
            <Box>
              <Typography fontSize={13} color="text.secondary" mb={1}>
                Costos
              </Typography>

              <TextField
                label="Costo unitario"
                type="number"
                fullWidth
                value={form.costo_unitario === 0 ? "" : form.costo_unitario}
                onChange={(e) =>
                  setForm({
                    ...form,
                    costo_unitario: e.target.value === ""
                      ? ""
                      : Number(e.target.value)
                  })
                }
                InputProps={{
                  startAdornment: <AttachMoneyIcon sx={{ mr: 1 }} />
                }}
              />
            </Box>

          </Stack>
        </DialogContent>

        {/* FOOTER */}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenModal(false)}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
            onClick={handleSubmit}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>


      {/* MODAL MOVIMIENTO */}
      <Dialog
        open={openMovimiento}
        onClose={() => setOpenMovimiento(false)}
        fullWidth
        maxWidth="md"
      >
        {/* HEADER */}
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight={600}>
            {modoMovimiento === "MASIVO"
              ? tipoMovimiento === "ENTRADA"
                ? "Registro masivo de entradas"
                : "Registro masivo de salidas"
              : tipoMovimiento === "ENTRADA"
                ? "Registrar entrada"
                : "Registrar salida"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Agrega stock a uno o varios productos de forma rápida y sencilla
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

          {modoMovimiento === "MASIVO" && (
            <>
              {/* BOTÓN AGREGAR */}
              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    setItemsMovimiento([
                      ...itemsMovimiento,
                      { inventario_id: "", cantidad: 0 }
                    ])
                  }
                >
                  Agregar producto
                </Button>
              </Box>
            </>
          )}

          {/* CABECERA TIPO TABLA */}
          <Box
            display="grid"
            gridTemplateColumns="2fr 1fr auto"
            px={1}
            py={1}
            sx={{
              fontSize: 13,
              fontWeight: 600,
              color: "text.secondary",
              borderBottom: "1px solid #eee"
            }}
          >
            <span>Producto</span>
            <span>Cantidad</span>
            <span></span>
          </Box>

          {/* LISTA */}
          <Box display="flex" flexDirection="column" gap={1}>
            {itemsMovimiento.map((item, index) => (
              <Box
                key={index}
                display="grid"
                gridTemplateColumns="2fr 1fr auto"
                gap={2}
                alignItems="center"
                sx={{
                  p: 1,
                  borderRadius: 2,
                  background: "#fafafa",
                  border: "1px solid #eee"
                }}
              >
                <FormControl size="small" fullWidth>
                  <Select
                    value={item.inventario_id}
                    displayEmpty
                    disabled={modoMovimiento === "INDIVIDUAL"} // 🔥 clave
                    onChange={(e) => {
                      const newItems = [...itemsMovimiento];
                      newItems[index].inventario_id = e.target.value;
                      setItemsMovimiento(newItems);
                    }}
                  >
                    {/* SOLO mostrar placeholder en modo MASIVO */}
                    {modoMovimiento === "MASIVO" && (
                      <MenuItem value="">
                        <em>Seleccionar producto</em>
                      </MenuItem>
                    )}

                    {inventarios.map((inv) => (
                      <MenuItem key={inv.id} value={inv.id}>
                        {inv.nombre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* CANTIDAD + UNIDAD */}
                <Box display="flex" alignItems="center" gap={1}>
                  <TextField
                    size="small"
                    type="number"
                    placeholder=""
                    value={item.cantidad === 0 ? "" : item.cantidad}
                    onChange={(e) => {
                      const newItems = [...itemsMovimiento];
                      newItems[index].cantidad =
                        e.target.value === "" ? 0 : Number(e.target.value);
                      setItemsMovimiento(newItems);
                    }}
                    fullWidth
                  />

                  {/* 👉 UNIDAD DINÁMICA */}
                  <Typography fontSize={12} color="text.secondary" sx={{ minWidth: 50 }}>
                    {
                      inventarios.find((inv) => inv.id === item.inventario_id)?.unidad || ""
                    }
                  </Typography>
                </Box>




                {/* DELETE */}
                <IconButton
                  color="error"
                  onClick={() =>
                    setItemsMovimiento(itemsMovimiento.filter((_, i) => i !== index))
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>

          {/* OBSERVACIÓN */}
          <TextField
            label="Observación"
            size="small"
            multiline
            minRows={2}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </DialogContent>

        {/* FOOTER */}
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenMovimiento(false)}>
            Cancelar
          </Button>

          <Button
            variant="contained"
            sx={{ borderRadius: 2, px: 3 }}
            onClick={async () => {
              try {
                for (const item of itemsMovimiento) {
                  if (!item.inventario_id || item.cantidad <= 0) continue;

                  await crearMovimiento({
                    inventario_id: item.inventario_id,
                    tipo: tipoMovimiento,
                    cantidad: item.cantidad,
                    observacion: motivo
                  });
                }

                Swal.fire("OK", "Movimientos registrados", "success");

                setOpenMovimiento(false);
                fetchData();

              } catch (error) {
                Swal.fire("Error", "No se pudo guardar", "error");
              }
            }}
          >
            Guardar todo
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

export default AdminInventario;