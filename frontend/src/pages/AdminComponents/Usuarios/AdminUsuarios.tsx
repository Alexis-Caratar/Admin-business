import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  TextField,
  Card,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Avatar,
  Stack
} from "@mui/material";
import { motion, AnimatePresence } from "framer-motion";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SortIcon from "@mui/icons-material/Sort";
import PeopleIcon from "@mui/icons-material/People";
import Swal from "sweetalert2";

import { getUsuarios, createUsuarioCompleto, deleteUsuario } from "../../../api/usuarios";
import type { User } from "../../../types";

const AdminUsuarios: React.FC = () => {
  const idNegocioLS = localStorage.getItem("id_negocio") || "";

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState("todos");
  const [sortField, setSortField] = useState<keyof User>("nombre");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [openModal, setOpenModal] = useState(false);

  const [form, setForm] = useState({
    // Persona
    identificacion: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    direccion: "",

    // Usuario
    rol: "empleado",
    imagen: "",
  });

  /** --------------- TRAER USUARIOS --------------- */
  const fetchUsuarios = async () => {
    const data = await getUsuarios();
    setUsuarios(data);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  /** --------------- FILTROS Y ORDEN --------------- */
  const filtered = useMemo(() => {
    let result = [...usuarios];

    if (search) {
      result = result.filter(u =>
        u.nombre.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (rolFilter !== "todos") {
      result = result.filter(u => u.rol === rolFilter);
    }

    result.sort((a, b) => {
      const A = a[sortField];
      const B = b[sortField];
      if (typeof A === "string" && typeof B === "string") {
        return sortOrder === "asc" ? A.localeCompare(B) : B.localeCompare(A);
      }
      return 0;
    });

    return result;
  }, [usuarios, search, rolFilter, sortField, sortOrder]);

  /** --------------- PAGINACIÓN --------------- */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  /** --------------- MANEJO DEL FORMULARIO --------------- */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.identificacion || !form.nombres || !form.apellidos) {
      Swal.fire("Error", "Todos los campos obligatorios deben estar completos", "error");
      return;
    }

    try {
      // Generar email y password automáticamente
      const ultimos4 = form.identificacion.slice(-4);
      const nombreUsuario = `${form.nombres.split(" ")[0]}${ultimos4}`.replace(/ /g, "").toLowerCase();
      const email = `${nombreUsuario}@gmail.com`;
      const password = ultimos4;

      // Payload completo
      const payload = {
        persona: {
          identificacion: form.identificacion,
          nombres: form.nombres,
          apellidos: form.apellidos,
          telefono: form.telefono || null,
          direccion: form.direccion || null
        },
        usuario: {
          email,
          password,
          rol: form.rol,
          id_negocio: idNegocioLS,
          imagen: form.imagen || null,
        },
      };

      await createUsuarioCompleto(payload);

      Swal.fire("Éxito", "Usuario creado correctamente", "success");

      setForm({
        identificacion: "",
        nombres: "",
        apellidos: "",
        telefono: "",
        direccion: "",
        rol: "empleado",
        imagen: "",
      });

      fetchUsuarios();
      setOpenModal(false);
    } catch (err: any) {
      console.error(err);
      Swal.fire("Error", err.message || "Ocurrió un error al crear el usuario", "error");
    }
  };

const handleDeleteUser = async (id: number) => {
  Swal.fire({
    title: "¿Está seguro?",
    text: "Esta acción eliminará el usuario de forma permanente.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sí, eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        await deleteUsuario(id);
        await fetchUsuarios();

        Swal.fire({
          title: "Eliminado",
          text: "El usuario ha sido eliminado correctamente.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar el usuario", "error");
      }
    }
  });
};


  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  return (
    <Box p={1}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" display="flex" alignItems="center" gap={1}>
          <PeopleIcon /> Administrar Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenModal(true)}
          component={motion.button}
          whileHover={{ scale: 1.05 }}
        >
          Adicionar Usuario
        </Button>
      </Box>

      {/* FILTROS */}
      <Grid container spacing={2} mb={1}>
        <Grid item xs={12} md={3}>
          <TextField label="Buscar..." fullWidth value={search} onChange={(e) => setSearch(e.target.value)} />
        </Grid>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select value={rolFilter} onChange={(e) => setRolFilter(e.target.value)}>
              <MenuItem value="todos">Todos</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="cliente">Cliente</MenuItem>
              <MenuItem value="empleado">Empleado</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} md={2}>
          <Button variant="outlined" fullWidth startIcon={<SortIcon />} onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
            Ordenar
          </Button>
        </Grid>
      </Grid>

      <Typography mb={2}>
        Total: <strong>{filtered.length}</strong> usuarios encontrados.
      </Typography>

      {/* CARDS */}
      <Grid container spacing={2}>
        <AnimatePresence>
          {paginated.map(u => (
            <Grid item xs={12} md={4} key={u.id}>
              <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" layout>
                <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="center" mb={2}>
                      <Avatar src={u.imagen || ""} sx={{ width: 80, height: 80, bgcolor: "#1976d2", fontSize: 28 }}>
                        {!u.imagen && u.nombre.charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>
                    <Typography variant="body2" align="center" fontWeight="bold">{u.nombre}</Typography>
                    <Typography variant="body2" align="center">{u.email}</Typography>
                    <Typography variant="caption" align="center" component="div" fontWeight="bold">
                      <strong>Rol:</strong> {u.rol}
                    </Typography>

                    <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
                      <motion.div whileHover={{ scale: 1.2 }}>
                        <IconButton color="primary" onClick={() => setForm(u) || setOpenModal(true)}>
                          <EditIcon />
                        </IconButton>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.2 }}>
                        <IconButton color="error" onClick={() => handleDeleteUser(u.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </motion.div>
                    </Stack>
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </AnimatePresence>
      </Grid>

      {/* PAGINACIÓN */}
      <Box display="flex" justifyContent="center" mt={3}>
        <Pagination count={totalPages} page={page} onChange={(e, value) => setPage(value)} color="primary" />
      </Box>

      {/* MODAL */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.identificacion ? "Editar Usuario" : "Adicionar Usuario"}</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
          <TextField label="Identificación" name="identificacion" value={form.identificacion} onChange={handleChange} fullWidth />
          <TextField label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} fullWidth />
          <TextField label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} fullWidth />
          <TextField label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} fullWidth />
          <TextField label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} fullWidth />
          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select name="rol" value={form.rol} onChange={handleChange}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="cliente">Cliente</MenuItem>
              <MenuItem value="empleado">Empleado</MenuItem>
            </Select>
          </FormControl>
          <TextField label="URL Imagen (opcional)" name="imagen" value={form.imagen} onChange={handleChange} fullWidth />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsuarios;
