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
  Stack
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import InventoryIcon from "@mui/icons-material/Inventory";

import Swal from "sweetalert2";
import { motion } from "framer-motion";

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

const abrirMovimiento = ( tipo: string) => {
  setTipoMovimiento(tipo);
  setItemsMovimiento([]);
  setMotivo("");
  setOpenMovimiento(true);
};

type TipoInventario = "INSUMO" | "PRODUCTO" | "ACTIVO";

const [form, setForm] = useState<{
  nombre: string;
  unidad: string;
  tipo: TipoInventario;
  stock_actual: number;
  stock_minimo: number;
  stock_maximo: number;
  costo_unitario: number;
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
      if (editingId) {
        await actualizarInventario(editingId, form);
      } else {
        await crearInventario(form);
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
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Inventario
        </Typography>

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            resetForm();
            setOpenModal(true);
          }}
        >
          NUEVO INVENTARIO
        </Button>
              <Button
        variant="contained"
        color="success"
        onClick={() => abrirMovimiento("ENTRADA")}
      >
        Registrar Compra masiva
      </Button>
      </Box>

      {/* LISTA */}
      <Box display="flex" flexWrap="wrap" gap={2}>
        {inventarios.map((inv) => (
          <Box key={inv.id} flex="1 1 calc(33% - 16px)">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card sx={{ borderRadius: 3 }}>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={1}>
                    <InventoryIcon />
                    <Typography fontWeight={600}>
                      {inv.nombre}
                    </Typography>
                  </Box>

                  <Typography fontSize={13}>
                    Unidad: {inv.unidad}
                  </Typography>

                  <Typography fontSize={13}>
                    Stock: {inv.stock_actual}
                  </Typography>

                  <Typography fontSize={13} color="error">
                    Min: {inv.stock_minimo}
                  </Typography>

                  <Typography fontSize={13}>
                    Costo: ${inv.costo_unitario}
                  </Typography>

                  <Stack direction="row" spacing={1} mt={2}>
                    <IconButton onClick={() => handleEdit(inv)}>
                      <EditIcon />
                    </IconButton>

                    <IconButton color="error" onClick={() => handleDelete(inv.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </Stack>

                  <Stack direction="row" spacing={1} mt={2}>
  <Button
    size="small"
    variant="contained"
    color="success"
    onClick={(e) => {
      e.stopPropagation();
      abrirMovimiento( "ENTRADA");
    }}
  >
    + Entrada
  </Button>

  <Button
    size="small"
    variant="contained"
    color="warning"
    onClick={(e) => {
      e.stopPropagation();
      abrirMovimiento( "SALIDA");
    }}
  >
    - Salida
  </Button>


</Stack>

                </CardContent>
              </Card>
            </motion.div>
          </Box>
        ))}
      </Box>

      {/* MODAL */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth>
        <DialogTitle>
          {editingId ? "Editar" : "Nuevo"} inventario
        </DialogTitle>

        <DialogContent sx={{ display: "grid", gap: 2, mt: 1 }}>
          <TextField
            label="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />

          <TextField
            label="Unidad"
            value={form.unidad}
            onChange={(e) => setForm({ ...form, unidad: e.target.value })}
          />

          <FormControl>
            <InputLabel>Tipo</InputLabel>
            <Select
              value={form.tipo}
              label="Tipo"
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <MenuItem value="INSUMO">Insumo</MenuItem>
              <MenuItem value="PRODUCTO">Producto</MenuItem>
              <MenuItem value="ACTIVO">Activo</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Stock actual"
            type="number"
            value={form.stock_actual}
            onChange={(e) =>
              setForm({ ...form, stock_actual: Number(e.target.value) })
            }
          />

          <TextField
            label="Stock mínimo"
            type="number"
            value={form.stock_minimo}
            onChange={(e) =>
              setForm({ ...form, stock_minimo: Number(e.target.value) })
            }
          />

          <TextField
            label="Stock máximo"
            type="number"
            value={form.stock_maximo}
            onChange={(e) =>
              setForm({ ...form, stock_maximo: Number(e.target.value) })
            }
          />

          <TextField
            label="Costo unitario"
            type="number"
            value={form.costo_unitario}
            onChange={(e) =>
              setForm({ ...form, costo_unitario: Number(e.target.value) })
            }
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
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
      {tipoMovimiento === "ENTRADA" ? "Registrar compra" : "Registrar salida"}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      Agrega múltiples productos en un solo movimiento
    </Typography>
  </DialogTitle>

  <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

    {/* BOTÓN AGREGAR */}
    <Box display="flex" justifyContent="flex-end">
      <Button
        variant="contained"
        size="small"
        startIcon={<AddIcon />}
        sx={{ borderRadius: 2 }}
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
          {/* SELECT */}
          <FormControl size="small" fullWidth>
            <Select
              value={item.inventario_id}
              displayEmpty
              onChange={(e) => {
                const newItems = [...itemsMovimiento];
                newItems[index].inventario_id = e.target.value;
                setItemsMovimiento(newItems);
              }}
            >
              <MenuItem value="">
                <em>Seleccionar producto</em>
              </MenuItem>
              {inventarios.map((inv) => (
                <MenuItem key={inv.id} value={inv.id}>
                  {inv.nombre}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* CANTIDAD */}
          <TextField
            size="small"
            type="number"
            placeholder="0"
            value={item.cantidad}
            onChange={(e) => {
              const newItems = [...itemsMovimiento];
              newItems[index].cantidad = Number(e.target.value);
              setItemsMovimiento(newItems);
            }}
          />

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