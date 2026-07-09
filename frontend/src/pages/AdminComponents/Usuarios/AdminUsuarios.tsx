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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  IconButton,
  Avatar,
  Stack,
  Checkbox,
  CircularProgress,
  Chip,
  Paper,
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
import VerifiedUserIcon from "@mui/icons-material/VerifiedUser";

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

interface AdminUsuariosProps {
  idNegocio?: number | string;
}

const AdminUsuarios: React.FC<AdminUsuariosProps> = ({ idNegocio }) => {

  const idNegocioFinal = idNegocio ?? localStorage.getItem("id_negocio") ?? "";

  const [usuarios, setUsuarios] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [sortField] = useState<keyof User>("nombres");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 20;
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
    const data = await getUsuarios(idNegocioFinal);
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
      if (form.email == '') {
        const ultimos4 = form.identificacion.slice(-4);
        const nombresUsuario = `${form.nombres.split(" ")[0]}${ultimos4}`
          .replace(/ /g, "")
          .toLowerCase();

        email = `${nombresUsuario}@gmail.com`;
      } else {
        email = form.email
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
            email: email,
          },
          usuario: {
            email,
            password,
            rol: form.rol,
            id_negocio: idNegocioFinal,
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
        getMenusNegocio(Number(idNegocioFinal)),    // tu API que trae todos los menús del negocio
        getMenusUsuario(u.id_usuario, Number(idNegocioFinal)), // tu API que trae los menús que tiene el usuario
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
      <Box p={2}>
        {/* HEADER */}
      <Box
  sx={{
    mb: 3,
    display: "flex",
    flexDirection: {
      xs: "column",
      sm: "row",
    },
    justifyContent: "space-between",
    alignItems: {
      xs: "stretch",
      sm: "center",
    },
    gap: 2,
  }}
>
  {/* TÍTULO + DESCRIPCIÓN */}
  <Box>
    <Typography
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.2,
        fontWeight: 700,
        fontSize: {
          xs: 22,
          md: 28,
        },
        color: "#0F172A",
      }}
    >
      <PeopleIcon
        sx={{
          fontSize: {
            xs: 28,
            md: 32,
          },
          color: "#2563EB",
        }}
      />
      Administrar Usuarios
    </Typography>

    <Typography
      sx={{
        mt: 0.5,
        ml: { xs: 0, sm: 5.5 },
        fontSize: 13,
        color: "#64748B",
      }}
    >
      Gestione y administre los usuarios registrados en el sistema.
    </Typography>
  </Box>

  {/* BOTÓN */}
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
    whileHover={{ scale: 1.03 }}
    sx={{
      width: {
        xs: "100%",
        sm: "auto",
      },
      minWidth: {
        sm: 220,
      },
      height: 46,
      borderRadius: 3,
      textTransform: "none",
      fontWeight: 700,
      background: "linear-gradient(135deg,#2563EB,#3B82F6)",
      boxShadow: "0 8px 18px rgba(37,99,235,.20)",

      "&:hover": {
        background: "linear-gradient(135deg,#1D4ED8,#2563EB)",
        transform: "translateY(-1px)",
        boxShadow: "0 12px 24px rgba(37,99,235,.28)",
      },
    }}
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

              width: {
                xs: "90%",
                sm: 350,
                md: 450,
              },

              height: 44,

              px: 2,
              borderRadius: 3,

              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",

              transition: ".2s",

              "&:focus-within": {
                borderColor: "#3B82F6",
                boxShadow: "0 0 0 4px rgba(59,130,246,.10)",
              },
            }}
          >
            <SearchIcon
              sx={{
                color: "#64748B",
                mr: 1,
                fontSize: 20,
              }}
            />

            <TextField
              variant="standard"
              placeholder="Buscar usuarios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              InputProps={{
                disableUnderline: true,
              }}
              sx={{
                "& input": {
                  fontSize: 14,
                  color: "#0F172A",
                },
              }}
            />
          </Box>
        </Box>

        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "stretch", sm: "center" },
            gap: 2,
          }}
        >
          {/* Información */}
          <Box
            display="flex"
            alignItems="center"
            gap={1}
            flexWrap="wrap"
          >
            <Typography
              sx={{
                fontSize: { xs: 14, sm: 15 },
                color: "#475569",
                fontWeight: 500,
              }}
            >
              usuarios registrados.
            </Typography>

            <Chip
              size="small"
              color="primary"
              variant="outlined"
              label={`Total: ${filtered.length}`}
              sx={{
                fontWeight: 700,
                borderRadius: 2,
              }}
            />
          </Box>

          {/* Acciones */}
          <Button
            variant="outlined"
            startIcon={<SortIcon />}
            onClick={() =>
              setSortOrder(sortOrder === "asc" ? "desc" : "asc")
            }
            sx={{
              minWidth: { xs: "100%", sm: 170 },
              height: 42,
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 600,
              borderColor: "#CBD5E1",
              color: "#334155",

              "&:hover": {
                borderColor: "#2563EB",
                bgcolor: "#F8FAFC",
              },
            }}
          >
            Orden {sortOrder === "asc" ? "Ascendente" : "Descendente"}
          </Button>
        </Box>

        <Box display="flex" flexWrap="wrap" gap={2}>
          <AnimatePresence>
            {paginated.map((u) => (
              <Box
                key={u.id_usuario}
                sx={{
                  flex: {
                    xs: "1 1 100%",
                    sm: "1 1 calc(50% - 16px)",
                    md: "1 1 calc(25% - 16px)",
                    lg: "1 1 calc(20% - 16px)",
                  },
                }}
              >
                <motion.div
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  whileHover={{
                    scale: 1.03,
                    transition: { duration: 0.2 },
                  }}
                >
                  <Box
                    sx={{
                      position: "relative",
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1,
                      px: 2.5,
                      py: 3,
                      borderRadius: "24px",
                      bgcolor: "#ffffff",
                      border: "1px solid rgba(15,23,42,0.06)",
                      boxShadow: "0 10px 30px rgba(15,23,42,0.05)",
                      transition: "0.3s",
                      overflow: "hidden",

                      "&:hover": {
                        boxShadow: "0 16px 45px rgba(15,23,42,0.12)",
                      },
                    }}
                  >
                    {/* DECORACIÓN */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -50,
                        right: -30,
                        width: 140,
                        height: 140,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(96,165,250,0.03))",
                      }}
                    >
                    </Box>

                    <Box
                      sx={{
                        position: "absolute",
                        top: 16,
                        right: 16,
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        px: 1.8,
                        py: 0.6,
                        borderRadius: 999,
                        background: "rgba(37,99,235,.10)",
                        backdropFilter: "blur(10px)",
                        border: "1px solid rgba(37,99,235,.20)",
                        color: "#1D4ED8",
                        fontSize: 11,
                        fontWeight: 700,
                        boxShadow: "0 8px 20px rgba(15,23,42,.08)",
                        zIndex: 10,
                      }}
                    >
                      <VerifiedUserIcon sx={{ fontSize: 15 }} />
                      {u.rol}
                    </Box>

                    {/* AVATAR */}
                    <Avatar
                      src={u.imagen || ""}
                      sx={{
                        width: 64,
                        height: 64,
                        bgcolor: "#eff6ff",
                        color: "#2563eb",
                        fontWeight: 900,
                        boxShadow: "0 10px 25px rgba(37,99,235,0.15)",
                        zIndex: 2,
                      }}
                    >
                      {!u.imagen && u.nombres?.charAt(0)}
                    </Avatar>

                    {/* NOMBRE */}
                    <Typography
                      sx={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: "#0f172a",
                        lineHeight: 1.2,
                        zIndex: 2,
                      }}
                    >
                      {u.nombres} {u.apellidos}
                    </Typography>

                    {/* DOCUMENTO */}
                    <Typography
                      sx={{
                        fontSize: 13,
                        color: "#64748b",
                        zIndex: 2,
                      }}
                    >
                      {u.tipo_identificacion}-{u.identificacion}
                    </Typography>

                    {/* EMAIL */}
                    <Typography
                      sx={{
                        fontSize: 12.5,
                        color: "#64748b",
                        wordBreak: "break-word",
                        px: 1,
                        zIndex: 2,
                      }}
                    >
                      {u.email}
                    </Typography>



                    {/* BOTONES */}
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="center"
                      mt={2}
                      zIndex={2}
                    >
                      <IconButton
                        sx={{
                          bgcolor: "#eff6ff",
                          "&:hover": { bgcolor: "#dbeafe" },
                        }}
                        onClick={() => handleEdit(u)}
                      >
                        <EditIcon fontSize="small" color="primary" />
                      </IconButton>

                      <IconButton
                        sx={{
                          bgcolor: "#fef2f2",
                          "&:hover": { bgcolor: "#fee2e2" },
                        }}
                        onClick={() => handleDeleteUser(u.id_usuario)}
                      >
                        <DeleteIcon fontSize="small" color="error" />
                      </IconButton>

                      <IconButton
                        sx={{
                          bgcolor: "#f5f3ff",
                          "&:hover": { bgcolor: "#ede9fe" },
                        }}
                        onClick={() => handlePermisos(u)}
                      >
                        <MenuBookIcon fontSize="small" color="success" />
                      </IconButton>
                    </Stack>
                  </Box>
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
      </Box>


      {/* MODAL PARA editar o adicionar un usuario*/}

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


              <Paper
                elevation={0}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  border: "1px solid #E2E8F0",
                  display: "flex",
                  alignItems: "center",
                  gap: 3
                }}
              >

                <Avatar
                  src={form.imagen}
                  sx={{
                    width: 90,
                    height: 90,
                    fontSize: 32
                  }}
                >
                  {form.nombres?.charAt(0)}
                </Avatar>

                <Box flex={1}>

                  <Typography
                    fontSize={15}
                    fontWeight={700}
                  >
                    Imagen del perfil
                  </Typography>

                  <Typography
                    fontSize={12}
                    color="text.secondary"
                    mb={2}
                  >
                    Puede ingresar una URL para personalizar el avatar del usuario.
                  </Typography>
                </Box>

              </Paper>
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
                      <ImageIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />

              {/* ========================= */}
              {/* INFO PERSONAL */}
              {/* ========================= */}
              <Box>
                <Typography fontWeight={600} mb={1} display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" color="primary" /> Información personal
                </Typography>

                <Box display="grid"
                  gridTemplateColumns={{
                  xs:"1fr",
                  md:"repeat(2,1fr)"
                  }}
                  gap={2}>

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
                          <BadgeIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#fff",
                        height: 48,
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#93C5FD" },
                        "&.Mui-focused fieldset": { borderColor: "#2563EB" }
                      }
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
                          <PersonIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#fff",
                        height: 48,
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#93C5FD" },
                        "&.Mui-focused fieldset": { borderColor: "#2563EB" }
                      }
                    }}
                  />

                  <TextField
                    label="Apellidos"
                    name="apellidos"
                    value={form.apellidos}
                    onChange={handleChange}
                    size="small"
                         sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#fff",
                        height: 48,
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#93C5FD" },
                        "&.Mui-focused fieldset": { borderColor: "#2563EB" }
                      }
                    }}
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
                          <PhoneIcon color="primary" />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#fff",
                        height: 48,
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#93C5FD" },
                        "&.Mui-focused fieldset": { borderColor: "#2563EB" }
                      }
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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#fff",
                        height: 48,
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#93C5FD" },
                        "&.Mui-focused fieldset": { borderColor: "#2563EB" }
                      }
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

                <Box display="grid"
                  gridTemplateColumns={{
                  xs:"1fr",
                  md:"repeat(2,1fr)"
                  }}
                  gap={2}>

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
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 3,
                        background: "#fff",
                        height: 48,
                        "& fieldset": { borderColor: "#E2E8F0" },
                        "&:hover fieldset": { borderColor: "#93C5FD" },
                        "&.Mui-focused fieldset": { borderColor: "#2563EB" }
                      }
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
      </Dialog>


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
  sx={{
    display: "flex",
    flexDirection: {
      xs: "column",
      sm: "row",
    },
    alignItems: {
      xs: "center",
      sm: "center",
    },
    justifyContent: "space-between",
    gap: 2,
    px: { xs: 2, sm: 3 },
    py: 2.5,
    background: "linear-gradient(180deg,#F8FAFC,#FFFFFF)",
    borderBottom: "1px solid #E2E8F0",
  }}
>
  {/* INFORMACIÓN DEL USUARIO */}
  <Box
    display="flex"
    alignItems="center"
    gap={2}
    width="100%"
    minWidth={0}
  >
    <Avatar
      src={selectedUsuario?.imagen || ""}
      sx={{
        width: { xs: 60, sm: 68 },
        height: { xs: 60, sm: 68 },
        fontSize: 24,
        fontWeight: 700,
        bgcolor: "#DBEAFE",
        color: "#2563EB",
        boxShadow: "0 8px 20px rgba(37,99,235,.15)",
      }}
    >
      {selectedUsuario?.nombres?.charAt(0)}
    </Avatar>

    <Box minWidth={0} flex={1}>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: {
            xs: 14,
            md: 18,
          },
          color: "#0F172A",
        }}
      >
        {selectedUsuario?.nombres} {selectedUsuario?.apellidos}
      </Typography>

      <Typography
        sx={{
          mt: .4,
          fontSize: 13,
          color: "#64748B",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {selectedUsuario?.email}
      </Typography>

      <Typography
        sx={{
          mt: .3,
          fontSize: 12,
          color: "#94A3B8",
        }}
      >
        {selectedUsuario?.tipo_identificacion} • {selectedUsuario?.identificacion}
      </Typography>
    </Box>
  </Box>

  {/* ROL */}
  <Box
    sx={{
      flexShrink: 0,
      alignSelf: {
        xs: "stretch",
        sm: "center",
      },
    }}
  >
    <Chip
      icon={<VerifiedUserIcon />}
      label={String(selectedUsuario?.rol || "").toUpperCase()}
      sx={{
        width: {
          xs: "100%",
          sm: "auto",
        },
        height: 38,
        px: 1,
        borderRadius: 3,
        bgcolor: "#EFF6FF",
        color: "#1D4ED8",
        border: "1px solid #BFDBFE",
        fontWeight: 700,
        fontSize: 12,

        "& .MuiChip-icon": {
          color: "#2563EB",
        },
      }}
    />
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
