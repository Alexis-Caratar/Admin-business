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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Avatar,
  Stack,
  Checkbox,
  CircularProgress
} from "@mui/material";

import { motion, AnimatePresence } from "framer-motion";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SortIcon from "@mui/icons-material/Sort";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import StorefrontIcon from "@mui/icons-material/Storefront";
import PersonIcon from "@mui/icons-material/Person";
import BadgeIcon from "@mui/icons-material/Badge";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import HomeIcon from "@mui/icons-material/Home";
import WorkIcon from "@mui/icons-material/Work";
import ImageIcon from "@mui/icons-material/Image";
import InputAdornment from "@mui/material/InputAdornment";
import Swal from "sweetalert2";
import { useTheme, useMediaQuery } from "@mui/material";

import {
  getUsuarios,
  createUsuarioCompleto,
  updateUsuarioCompleto,
  deleteUsuario,
  getMenusNegocio,
  getMenusUsuario,
  asignarMenuUsuario
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
  const [openPermisos, setOpenPermisos] = useState(false);
  const [menusNegocio, setMenusNegocio] = useState<{ id: number; nombre: string, icono: string, url: string }[]>([]);
  const [menusUsuario, setMenusUsuario] = useState<number[]>([]);
  const [selectedUsuario, setSelectedUsuario] = useState<User | null>(null);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [savingPermisos, setSavingPermisos] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  /** FORMULARIO con tipado real */
  const [form, setForm] = useState({
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
        const fullName = `${u.nombres ?? ""} ${u.apellidos ?? ""}${u.rol ?? ""} ${u.identificacion ?? ""} `.toLowerCase();
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
       let email;
        if(form.email==''){
             const ultimos4 = form.identificacion.slice(-4);
        const nombresUsuario = `${form.nombres.split(" ")[0]}${ultimos4}`
          .replace(/ /g, "")
          .toLowerCase();

          email = `${nombresUsuario}@gmail.com`;
        }else{
           email=form.email
        }
         const password = `${form.identificacion}*`;

      /** === SI ES CREAR === */
      if (form.id_usuario === 0) {
        if (!form.identificacion || !form.nombres || !form.apellidos) {
          Swal.fire("Error", "Todos los campos son obligatorios", "error");
          return;
        }

        const payload = {
          persona: {
            tipo_identificacion: form.tipo_identificacion,
            identificacion: form.identificacion,
            nombres: form.nombres,
            apellidos: form.apellidos,
            telefono: form.telefono || null,
            direccion: form.direccion || null,
            email:email,
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
    Swal.fire({
      icon: "success",
      title: "Éxito",
      html: `
          Usuario creado correctamente.<br>
            Ten en cuenta que  al crear el usuario, para el ingreso de la plataforma el usuario es el correo <br>
            en caso de no tener el sistema le genera uno automatico<br>
            la contraseña se genera con la identificación- Termina en '*' <br>
            (ejemplo: 112345678*)
      `,
    });
      } else {
        /** === SI ES EDITAR === */

        const payload = {
          persona: {
            id: form.id_persona,
            tipo_identificacion: form.tipo_identificacion,
            identificacion: form.identificacion,
            nombres: form.nombres,
            apellidos: form.apellidos,
            telefono: form.telefono,
            direccion: form.direccion,
            email: email
          },
          usuario: {
            id: form.id_usuario,
            email: email,
            rol: form.rol,
            imagen: form.imagen,
            password: password
          },
        };

        await updateUsuarioCompleto(payload);
        Swal.fire({
          icon: "success",
          title: "Éxito",
          html: `
            Usuario actualizado correctamente.<br>
            Ten en cuenta que  al actualizar el usuario, <br>
            la contraseña se actualiza:Se genera con la identificación- Termina en '*' <br>
            (ejemplo: 112345678*)
          `,
        });
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
      tipo_identificacion: u.tipo_identificacion,
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


  const handlePermisos = async (u: User) => {
    setSelectedUsuario(u);
    setLoadingPermisos(true);
    setOpenPermisos(true);

    try {
      const [allMenus, userMenus] = await Promise.all([
        getMenusNegocio(Number(idNegocioLS)),    // tu API que trae todos los menús del negocio
        getMenusUsuario(u.id_usuario, Number(idNegocioLS)), // tu API que trae los menús que tiene el usuario
      ]);

      setMenusNegocio(allMenus);
      setMenusUsuario(userMenus.map((m: any) => m.id));
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron cargar los permisos", "error");
    } finally {
      setLoadingPermisos(false);
    }
  };

  const toggleMenuUsuario = (idMenu: number) => {
    setMenusUsuario(prev =>
      prev.includes(idMenu) ? prev.filter(m => m !== idMenu) : [...prev, idMenu]
    );
  };

  const savePermisos = async () => {
    if (!selectedUsuario) return;
    setSavingPermisos(true);
    try {
      await asignarMenuUsuario(selectedUsuario.id_usuario, menusUsuario); // tu API para guardar permisos
      Swal.fire("Éxito", "Permisos actualizados", "success");
      setOpenPermisos(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron guardar los permisos", "error");
    } finally {
      setSavingPermisos(false);
    }
  };

  return (
    <>
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

        <Box display="flex" flexWrap="wrap" gap={2}>
          <AnimatePresence>
            {paginated.map((u) => (
              <Box
                key={u.id_usuario}
                flex="1 1 calc(100% - 16px)" // xs: full width
                sx={{
                  '@media (min-width:600px)': { flex: '1 1 calc(50% - 16px)' },  // sm: 2 por fila
                  '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 16px)' }, // md: 3 por fila
                }}
              >
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
                        <IconButton color="secondary" onClick={() => handlePermisos(u)}>
                          <MenuBookIcon />
                        </IconButton>
                      </Stack>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            ))}
          </AnimatePresence>
        </Box>

        {/* PAGINACIÓN */}

          {totalPages > 1 && (
                <Stack alignItems="center" mt={3}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_event: React.ChangeEvent<unknown>, value: number) => setPage(value)} 
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


      <Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
  {/* HEADER */}
  <DialogTitle sx={{ p: 0 }}>
    <Box
      px={3}
      py={2}
      sx={{
        bgcolor: "#f9fafb",
        borderBottom: "1px solid #e5e7eb",
      }}
    >
      <Typography fontWeight={600} fontSize={18}>
        {form.id_usuario === 0 ? "Nuevo Usuario" : "Editar Usuario"}
      </Typography>
      <Typography fontSize={13} color="text.secondary">
        Completa la información del usuario
      </Typography>
    </Box>
  </DialogTitle>

  {/* CONTENIDO DEL FORMULARIO*/}
<Dialog open={openModal} onClose={() => setOpenModal(false)} fullWidth maxWidth="md">
  
  {/* HEADER */}
  <DialogTitle sx={{ p: 0 }}>
    <Box px={3} py={2} sx={{ bgcolor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
      <Typography fontWeight={600} fontSize={18}>
        {form.id_usuario === 0 ? "Nuevo Usuario" : "Editar Usuario"}
      </Typography>
      <Typography fontSize={13} color="text.secondary">
        Completa la información del usuario
      </Typography>
    </Box>
  </DialogTitle>

  <DialogContent sx={{ py: 3 }}>
    <Box display="flex" flexDirection="column" gap={3}>

      {/* PERFIL */}
      <Box display="flex" alignItems="center" gap={2}>
        <Avatar src={form.imagen || ""} sx={{ width: 60, height: 60 }}>
          {form.nombres?.charAt(0)}
        </Avatar>

        <TextField
          fullWidth
          label="Imagen"
          name="imagen"
          value={form.imagen}
          onChange={handleChange}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <ImageIcon color="primary"/>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* ========================= */}
      {/* INFO PERSONAL */}
      {/* ========================= */}
      <Box>
        <Typography fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
          <PersonIcon fontSize="small"  color="primary"/> Información personal
        </Typography>

        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
          
          <FormControl fullWidth size="small">
            <InputLabel>Tipo ID</InputLabel>
            <Select name="tipo_identificacion" value={form.tipo_identificacion} label="Tipo ID" onChange={handleChange}>
              <MenuItem value="CC">Cédula</MenuItem>
              <MenuItem value="CE">Extranjería</MenuItem>
              <MenuItem value="VISA">VISA</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Identificación"
            name="identificacion"
            value={form.identificacion}
            onChange={handleChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start" >
                  <BadgeIcon  color="primary"/>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Nombres"
            name="nombres"
            value={form.nombres}
            onChange={handleChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="primary"/>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Apellidos"
            name="apellidos"
            value={form.apellidos}
            onChange={handleChange}
            size="small"
          />

          <TextField
            label="Teléfono"
            name="telefono"
            value={form.telefono}
            onChange={handleChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color="primary"/>
                </InputAdornment>
              ),
            }}
          />

          <TextField
            label="Dirección"
            name="direccion"
            value={form.direccion}
            onChange={handleChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HomeIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

      {/* ========================= */}
      {/* CUENTA */}
      {/* ========================= */}
      <Box>
        <Typography fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
          <WorkIcon fontSize="small" color="primary" /> Cuenta de acceso
        </Typography>

        <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
          
          <FormControl fullWidth size="small">
            <InputLabel>Rol</InputLabel>
            <Select name="rol" value={form.rol} label="Rol" onChange={handleChange}>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="cliente">Cliente</MenuItem>
              <MenuItem value="cajero">Cajero</MenuItem>
              <MenuItem value="mesero">Mesero</MenuItem>
              <MenuItem value="cocina">Cocina</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Email"
            name="email"
            value={form.email}
            onChange={handleChange}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>

    </Box>
  </DialogContent>

  {/* FOOTER */}
  <DialogActions sx={{ px: 3, py: 2 }}>
    <Button onClick={() => setOpenModal(false)} color="inherit">
      Cancelar
    </Button>

    <Button
      variant="contained"
      onClick={handleSubmit}
      sx={{ textTransform: "none", px: 3, borderRadius: 2 }}
    >
      Guardar
    </Button>
  </DialogActions>
</Dialog>

  {/* FOOTER */}
  <DialogActions sx={{ px: 3, py: 2 }}>
    <Button onClick={() => setOpenModal(false)} color="inherit">
      Cancelar
    </Button>

    <Button
      variant="contained"
      onClick={handleSubmit}
      sx={{
        textTransform: "none",
        px: 3,
        borderRadius: 2,
      }}
    >
      Guardar
    </Button>
  </DialogActions>
</Dialog>
      </Box>
   {/* MODAL PARA PERMISOS DE LA PERSONA O MODULOS*/}
      <Dialog
        open={openPermisos}
        onClose={() => setOpenPermisos(false)}
        fullWidth
        maxWidth="sm"
      >
        {/* HEADER */}
        <DialogTitle sx={{ p: 0 }}>
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            px={3}
            py={2}
            sx={{
              bgcolor: "#f9fafb",
              borderBottom: "1px solid #e5e7eb",
            }}
          >
            {/* AVATAR */}
            <Avatar
              src={selectedUsuario?.imagen || ""}
              sx={{ width: 50, height: 50, fontSize: 20 }}
            >
              {selectedUsuario?.nombres?.charAt(0)}
            </Avatar>

            {/* INFO */}
            <Box flex={1}>
              <Typography fontWeight={600} fontSize={16}>
                {selectedUsuario?.nombres} {selectedUsuario?.apellidos}
              </Typography>

              <Typography fontSize={13} color="text.secondary">
                {selectedUsuario?.email}
              </Typography>

              <Typography fontSize={12} color="text.secondary">
                {selectedUsuario?.tipo_identificacion} -{" "}
                {selectedUsuario?.identificacion}
              </Typography>
            </Box>

            {/* ROL */}
            <Box
              sx={{
                bgcolor: "primary.main",
                color: "#fff",
                px: 2,
                py: 0.5,
                borderRadius: 2,
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {selectedUsuario?.rol}
            </Box>
          </Box>

          {/* SUBTÍTULO */}
          <Box px={3} py={1}>
            <Typography variant="body2" color="text.secondary">
              Asigna los módulos disponibles en el sistema
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          {loadingPermisos ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : menusNegocio.length === 0 ? (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              py={5}
              color="text.secondary"
            >
              <StorefrontIcon sx={{ fontSize: 40, mb: 1, opacity: 0.6 }} />
              <Typography fontWeight={500}>
                Ningún módulo disponible
              </Typography>
              <Typography fontSize={13}>
                No hay módulos configurados para este negocio
              </Typography>
            </Box>
          ) : (
            <Box display="flex" flexDirection="column" gap={1.2}>
              {menusNegocio.map((menu) => {
                const checked = menusUsuario.includes(menu.id);

                return (
                  <Box
                    key={menu.id}
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                    px={2}
                    py={1.5}
                    borderRadius={2}
                    sx={{
                      bgcolor: checked ? "rgba(25,118,210,0.08)" : "#f9fafb",
                      border: "1px solid",
                      borderColor: checked ? "primary.main" : "#e5e7eb",
                      transition: "all 0.2s ease",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: "rgba(25,118,210,0.12)",
                      },
                    }}
                    onClick={() => toggleMenuUsuario(menu.id)}
                  >



                    {/* IZQUIERDA */}
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box
                        sx={{
                          bgcolor: checked ? "primary.main" : "#e5e7eb",
                          color: checked ? "#fff" : "#6b7280",
                          borderRadius: 2,
                          p: 1,
                          display: "flex",
                        }}
                      >

                      </Box>

                      <Box>
                        <Typography fontSize={14} fontWeight={500}>
                          {menu.nombre}
                        </Typography>
                        <Typography fontSize={12} color="text.secondary">
                          /{menu.url}
                        </Typography>
                      </Box>
                    </Box>

                    {/* DERECHA */}
                    <Checkbox
                      checked={checked}
                      onChange={() => toggleMenuUsuario(menu.id)}
                    />
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>

        {/* FOOTER */}
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenPermisos(false)} color="inherit">
            Cancelar
          </Button>

          <Button
            variant="contained"
            onClick={savePermisos}
            disabled={savingPermisos}
            sx={{
              textTransform: "none",
              px: 3,
              borderRadius: 2,
            }}
          >
            {savingPermisos ? "Guardando..." : "Guardar cambios"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdminUsuarios;
