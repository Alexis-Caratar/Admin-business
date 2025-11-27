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
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SortIcon from "@mui/icons-material/Sort";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";

import Swal from "sweetalert2";

import {
  getUsuarios,
  createUsuarioCompleto,
  updateUsuarioCompleto,
  deleteUsuario
} from "../../../api/usuarios";

import type { User } from "../../../types";

const AdminUsuarios: React.FC = () => {
  const idNegocioLS = localStorage.getItem("id_negocio") || "";

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const [sortField] = useState<keyof User>("nombres");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [openModal, setOpenModal] = useState(false);

  /** FORMULARIO con tipado real */
  const [form, setForm] = useState({
    id_usuario: 0,
    id_persona: 0,
    tipo_identificacion:"",
    identificacion: "",
    nombres: "",
    apellidos: "",
    telefono: "",
    direccion: "",
    email: "",
    rol: "empleado",
    imagen: "",
  });

  /** ============================
   * TRAER USUARIOS
   ============================ */
  const fetchUsuarios = async () => {
    const data = await getUsuarios();
    setUsuarios(data);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  /** ============================
   *  BUSCADOR + ORDENAMIENTO
   ============================ */
  const filtered = useMemo(() => {
    let result = [...usuarios];

    if (search.trim() !== "") {
      const term = search.toLowerCase();

      result = result.filter((u) => {
        const fullName = `${u.nombres ?? ""} ${u.apellidos ?? ""}${u.rol?? ""} ${u.identificacion?? ""} `.toLowerCase();
        const email = u.email?.toLowerCase() ?? "";
        return fullName.includes(term) || email.includes(term);
      });
    }

    result.sort((a, b) => {
      const A = (a[sortField] ?? "").toString();
      const B = (b[sortField] ?? "").toString();

      const cmp = A.localeCompare(B, undefined, { numeric: true });
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [usuarios, search, sortField, sortOrder]);

  /** PAGINACIÓN */
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  /** ============================
   * FORM CHANGE
   ============================ */
  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /** ============================
   * GUARDAR / ACTUALIZAR
   ============================ */
  const handleSubmit = async () => {
    try {
      /** === SI ES CREAR === */
      if (form.id_usuario === 0) {
        if (!form.identificacion || !form.nombres || !form.apellidos) {
          Swal.fire("Error", "Todos los campos son obligatorios", "error");
          return;
        }

        const ultimos4 = form.identificacion.slice(-4);
        const nombresUsuario = `${form.nombres.split(" ")[0]}${ultimos4}`
          .replace(/ /g, "")
          .toLowerCase();
        const email = `${nombresUsuario}@gmail.com`;
        const password = ultimos4;

        console.log("form",form);
        
        const payload = {
          persona: {
            tipo_identificacion:form.tipo_identificacion,
            identificacion: form.identificacion,
            nombres: form.nombres,
            apellidos: form.apellidos,
            telefono: form.telefono || null,
            direccion: form.direccion || null,
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
      } else {
        /** === SI ES EDITAR === */

        const payload = {
          persona: {
            id: form.id_persona,
            tipo_identificacion:form.tipo_identificacion,
            identificacion: form.identificacion,
            nombres: form.nombres,
            apellidos: form.apellidos,
            telefono: form.telefono,
            direccion: form.direccion,
          },
          usuario: {
            id: form.id_usuario,
            email: form.email,
            rol: form.rol,
            imagen: form.imagen,
            password:'12345'
          },
        };

        await updateUsuarioCompleto(payload);
        Swal.fire("Éxito", "Usuario actualizado correctamente", "success");
      }

      setOpenModal(false);
      fetchUsuarios();
    } catch (err: any) {
      Swal.fire("Error", err.message || "Error al guardar", "error");
    }
  };

  /** ============================
   * ELIMINAR
   ============================ */
  const handleDeleteUser = async (id: number) => {
    Swal.fire({
      title: "¿Está seguro?",
      text: "Esta acción eliminará el usuario permanentemente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await deleteUsuario(id);
          fetchUsuarios();
          Swal.fire("Eliminado", "Usuario eliminado correctamente", "success");
        } catch {
          Swal.fire("Error", "No se pudo eliminar el usuario", "error");
        }
      }
    });
  };

  /** ============================
   * ANIMACIONES TARJETAS
   ============================ */
  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  };

  /** ============================
   * CARGAR DATOS EN EDICIÓN
   ============================ */
  const handleEdit = (u: User) => {
    setForm({
      id_usuario: u.id_usuario,
      id_persona: u.id_persona,
      tipo_identificacion:u.tipo_identificacion,
      identificacion: u.identificacion,
      nombres: u.nombres,
      apellidos: u.apellidos,
      telefono: u.telefono,
      direccion: u.direccion,
      email: u.email,
      rol: u.rol,
      imagen: u.imagen || "",
    });

    setOpenModal(true);
  };

  return (
    <Box p={1}>
      {/* HEADER */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" fontWeight={600} display="flex" gap={1}>
          <PeopleIcon /> Administrar Usuarios
        </Typography>

        <Button
          variant="contained"
          startIcon={<PeopleIcon />}
          onClick={() => {
            setForm({
              id_usuario: 0,
              id_persona: 0,
              tipo_identificacion: "",
              identificacion: "",
              nombres: "",
              apellidos: "",
              telefono: "",
              direccion: "",
              email: "",
              rol: "empleado",
              imagen: "",
            });
            setOpenModal(true);
          }}
          component={motion.button}
          whileHover={{ scale: 1.05 }}
        >
          Adicionar Usuario
        </Button>
      </Box>

      {/* BUSCADOR */}
      <Box mb={3}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            background: "#f1f3f4",
            px: 2,
            borderRadius: 5,
            width: 450,
            height: 38,
          }}
        >
          <SearchIcon sx={{ opacity: 0.6, mr: 1 }} />
          <TextField
            variant="standard"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{ disableUnderline: true }}
            fullWidth
          />
        </Box>
      </Box>

      {/* ORDENAMIENTO */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<SortIcon />}
        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        sx={{ mb: 2 }}
      >
        Ordenar
      </Button>

      <Typography mb={2}>
        Total: <strong>{filtered.length}</strong> usuarios encontrados.
      </Typography>

      {/* LISTA DE TARJETAS */}
      <Grid container spacing={2}>
        <AnimatePresence>
          {paginated.map((u) => (
            <Grid item xs={12} md={4} key={u.id_usuario}>
              <motion.div
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{
                  scale: 1.04,
                  transition: { duration: 0.25 },
                }}
              >
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent>
                    <Box display="flex" justifyContent="center">
                      <Avatar
                        src={u.imagen || ""}
                        sx={{ width: 80, height: 80, fontSize: 28 }}
                      >
                        {!u.imagen && u.nombres.charAt(0)}
                      </Avatar>
                    </Box>

                    <Typography align="center" fontWeight="bold">
                      {u.nombres} {u.apellidos}
                    </Typography>

                    <Typography align="center">
                      {u.tipo_identificacion}-{u.identificacion}
                    </Typography>

                    <Typography align="center">{u.email}</Typography>

                    <Typography align="center" variant="caption" fontWeight="bold">
                      <strong>Rol:</strong> {u.rol}
                    </Typography>

                    {/* BOTONES */}
                    <Stack direction="row" spacing={1} justifyContent="center" mt={2}>
                      <IconButton color="primary" onClick={() => handleEdit(u)}>
                        <EditIcon />
                      </IconButton>

                      <IconButton color="error" onClick={() => handleDeleteUser(u.id_usuario)}>
                        <DeleteIcon />
                      </IconButton>
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
        <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} />
      </Box>

      {/* MODAL */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="sm">
        <DialogTitle>
          {form.id_usuario === 0 ? "Adicionar Usuario" : "Editar Usuario"}
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
         <FormControl fullWidth>
  <InputLabel>Tipo de Identificación</InputLabel>
  <Select
    name="tipo_identificacion"
    label="Tipo de Identificación"
    value={form.tipo_identificacion}
    onChange={handleChange}
  >
    <MenuItem value="CC">Cédula de Ciudadanía</MenuItem>
    <MenuItem value="CE">Cédula de Extranjería</MenuItem>
    <MenuItem value="VISA">VISA</MenuItem>
  </Select>
</FormControl>

<TextField
  label="Identificación"
  name="identificacion"
  value={form.identificacion}
  onChange={handleChange}
/>

          <TextField
            label="Identificación"
            name="identificacion"
            value={form.identificacion}
            onChange={handleChange}
          />
          <TextField label="Nombres" name="nombres" value={form.nombres} onChange={handleChange} />
          <TextField label="Apellidos" name="apellidos" value={form.apellidos} onChange={handleChange} />
          <TextField label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
          <TextField label="Dirección" name="direccion" value={form.direccion} onChange={handleChange} />

          <FormControl fullWidth>
            <InputLabel>Rol</InputLabel>
            <Select name="rol" value={form.rol} label="Rol" onChange={handleChange}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="cliente">Cliente</MenuItem>
              <MenuItem value="empleado">Empleado</MenuItem>
            </Select>
          </FormControl>

          <TextField label="Email usuario" name="email" value={form.email} onChange={handleChange} />

          <TextField
            label="URL Imagen (opcional)"
            name="imagen"
            value={form.imagen}
            onChange={handleChange}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSubmit}>
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsuarios;
