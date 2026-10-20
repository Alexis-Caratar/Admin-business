import React, { useEffect, useState, useMemo } from "react";
import {
  getNegocios,
  crearNegocio,
  actualizarNegocio,
  eliminarNegocio,
} from "../../../api/negocios";
import type { Negocio } from "../../../types";
import Swal from "sweetalert2";

import {
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Pagination,
  Switch,
  MenuItem,
  Stack,
  Avatar,
  CircularProgress,
  Checkbox,
  Tooltip,
  Paper,
  Chip,
} from "@mui/material";

import { aplicarSugeridos, asignarMenuEmpresa, getMenusempresaTotal, getMenusEmpresa, getSitioNegocio, getTiposNegocio, guardarSitioNegocio, sitioVacio } from "../../../api/negocios";
import type { SitioNegocio, TipoNegocio } from "../../../api/negocios";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { SeccionHorarios, SeccionSitioWeb, SeccionTienda } from "./SeccionesSitio";
import SeccionIntegraciones from "./SeccionIntegraciones";
import SeccionImpresion from "./SeccionImpresion";
import PrintIcon from "@mui/icons-material/Print";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddBusinessIcon from "@mui/icons-material/AddBusiness";
import SearchIcon from "@mui/icons-material/Search";
import StoreIcon from "@mui/icons-material/Store";
import EmailIcon from "@mui/icons-material/Email";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import DescriptionIcon from "@mui/icons-material/Description";
import ImageIcon from "@mui/icons-material/Image";
import ApartmentIcon from "@mui/icons-material/Apartment";
import CategoryIcon from "@mui/icons-material/Category";
import { useTheme, useMediaQuery } from "@mui/material";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import StorefrontIcon from "@mui/icons-material/Storefront";
import AdminUsuarios from "../Usuarios/AdminUsuarios";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import SettingsIcon from "@mui/icons-material/Settings";
import LanguageIcon from "@mui/icons-material/Language";
import ScheduleIcon from "@mui/icons-material/Schedule";

const ScheduleTabIcon = () => <ScheduleIcon fontSize="small" />;

const AdminNegocios: React.FC = () => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
  // Sitio web, horarios y tienda del negocio que se edita (mismo modal)
  const [sitio, setSitio] = useState<SitioNegocio | null>(null);
  const [tabModal, setTabModal] = useState(0);
  const [erroresSitio, setErroresSitio] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const setCampoSitio = <K extends keyof SitioNegocio>(k: K, v: SitioNegocio[K]) =>
    setSitio((x) => (x ? { ...x, [k]: v } : x));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));


  const [selectedUsuario, setSelectedUsuario] = useState<Negocio | null>(null);
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  const [savingPermisos, setSavingPermisos] = useState(false);
  const [openPermisos, setOpenPermisos] = useState(false);
  const [menusNegocio, setMenusNegocio] = useState<{ id: number; nombre: string, icono: string, url: string }[]>([]);
  const [menusUsuario, setMenusUsuario] = useState<number[]>([]);
  const [openUsuarios, setOpenUsuarios] = useState(false);
  const [negocioSeleccionado, setNegocioSeleccionado] =
    useState<Negocio | null>(null);

  // Tipos de negocio desde la base (tipos_negocio): definen cómo se ve su página web
  const [tipos, setTipos] = useState<TipoNegocio[]>([]);
  useEffect(() => { getTiposNegocio().then(setTipos).catch(() => setTipos([])); }, []);
  const tiposNegocio = tipos.map((t) => t.nombre);
  const tipoActual = (nombre?: string) => tipos.find((t) => t.nombre === nombre || t.codigo === nombre);

  const [form, setForm] = useState<Negocio>({
    nit: "",
    nombre: "",
    direccion: "",
    telefono: "",
    descripcion: "",
    imagen: "",
    correo: "",
    ciudad: "",
    hora_apertura: "",
    hora_cierre: "",
    tipo: "",
    activo: true,
  });

  const [editingId, setEditingId] = useState<number | null>(null);

  // 🔍 Buscador
  const [search, setSearch] = useState("");

  // 📄 Paginación
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const fetchNegocios = async () => {
    const data = await getNegocios();
    setNegocios(data);
  };

  useEffect(() => {
    fetchNegocios();
  }, []);

  // Filtrar por buscador
  const filtered = useMemo(() => {
    return negocios.filter((n) =>
      n.nombre.toLowerCase().includes(search.toLowerCase()) ||
      n.direccion?.toLowerCase().includes(search.toLowerCase()) ||
      n.descripcion?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, negocios]);

  // Calcular paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const negociosPaginated = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, page]);

  const openCreateModal = () => {
    setForm({
      nit: "",
      nombre: "",
      direccion: "",
      telefono: "",
      descripcion: "",
      imagen: "",
      correo: "",
      ciudad: "",
      hora_apertura: "",
      hora_cierre: "",
      tipo: "",
      activo: true,

    });
    setEditingId(null);
    setSitio(sitioVacio());
    setTabModal(0);
    setErroresSitio({});
    setIsModalOpen(true);
  };

  const openEditModal = (negocio: Negocio, tab = 0) => {
    setForm(negocio);
    setEditingId(negocio.id!);
    setSitio(null);
    setTabModal(tab);
    setErroresSitio({});
    setIsModalOpen(true);
    getSitioNegocio(negocio.id!)
      .then(setSitio)
      .catch(() => Swal.fire("Error", "No se pudo cargar el sitio web del negocio.", "error"));
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  // Pestaña donde está cada error del sitio, para llevar al usuario a corregirlo
  const tabDeError = (campos: string[]) =>
    campos.some((c) => c === "horarios") ? 2 : campos.some((c) => c.startsWith("tienda")) ? 3 : 1;

  // Un solo Guardar: datos del negocio y luego sitio web, horarios y tienda
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    let id = editingId;
    try {
      if (editingId) {
        await actualizarNegocio(editingId, form);
      } else {
        const creado = await crearNegocio(form);
        id = creado.id;
        // Si el sitio falla, el siguiente Guardar actualiza este negocio en vez de crear otro
        setEditingId(creado.id);
        if (sitio && !sitio.url_negocio) setSitio({ ...sitio, url_negocio: creado.url_negocio });
        if (sitio) sitio.url_negocio = sitio.url_negocio || creado.url_negocio;
      }
    } catch (error) {
      setGuardando(false);
      const msg = (error as { response?: { data?: { error?: string } } }).response?.data?.error;
      Swal.fire("Error", msg ?? "Hubo un problema al guardar el negocio.", "error");
      return;
    }

    try {
      if (sitio && id) setSitio(await guardarSitioNegocio(id, sitio));
      setErroresSitio({});
      Swal.fire(editingId ? "Actualizado" : "Creado", "El negocio, su sitio web y la tienda quedaron guardados.", "success");
      closeModal();
      fetchNegocios();
    } catch (error) {
      const r = (error as { response?: { data?: { error?: string; errores?: Record<string, string> } } }).response?.data;
      const errores = r?.errores ?? {};
      setErroresSitio(errores);
      if (Object.keys(errores).length) setTabModal(tabDeError(Object.keys(errores)));
      fetchNegocios();
      Swal.fire("Revisa el sitio web", r?.error ?? "Los datos del negocio se guardaron, pero no el sitio web.", "warning");
    } finally {
      setGuardando(false);
    }
  };

  const handleDelete = async (id?: number) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      try {
        await eliminarNegocio(id);
        fetchNegocios();
        Swal.fire("Eliminado", "El negocio ha sido eliminado.", "success");
      } catch (error) {
        Swal.fire("Error", "No se pudo eliminar.", "error");
      }
    }
  };

  const handlePermisos = async (n: Negocio) => {
    setSelectedUsuario(n);
    setLoadingPermisos(true);
    setOpenPermisos(true);

    try {
      const [allMenus, userMenus] = await Promise.all([
        getMenusempresaTotal(),    // tu API que trae todos los menús del negocio
        getMenusEmpresa(n.id || 0), // tu API que trae los menús que tiene el usuario
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
      await asignarMenuEmpresa(selectedUsuario.id || 0, menusUsuario); // tu API para guardar permisos
      Swal.fire("Éxito", "Permisos actualizados", "success");
      setOpenPermisos(false);
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "No se pudieron guardar los permisos", "error");
    } finally {
      setSavingPermisos(false);
    }
  };

  const handleUsuarios = (negocio: Negocio) => {
    setNegocioSeleccionado(negocio);
    setOpenUsuarios(true);
  };

  return (
    <>
      <Box p={3}>
        {/* HEADER */}
        {/* HEADER */}
        {/* HEADER */}
        <Box mb={3}>

        <Box
    sx={{
      mb: 3,
      display: "flex",
      flexDirection: { xs: "column", md: "row" },
      alignItems: { xs: "flex-start", md: "center" },
      justifyContent: "space-between",
      gap: 2,
    }}
  >
    {/* IZQUIERDA */}
    <Box
      display="flex"
      alignItems="center"
      gap={2}
    >
      <Avatar
        sx={{
          width: 54,
          height: 54,
          bgcolor: "#EFF6FF",
          color: "#2563EB",
        }}
      >
        <StoreIcon fontSize="medium" />
      </Avatar>

      <Box>
        <Typography
          variant="h5"
          fontWeight={700}
          color="#0F172A"
          lineHeight={1.2}
        >
          Administración de Negocios
        </Typography>

        <Typography
          variant="body2"
          color="#64748B"
        >
          Administre la información, configuración y estado de los negocios registrados.
        </Typography>
      </Box>
    </Box>

    {/* DERECHA */}
    <Button
      variant="contained"
      startIcon={<AddBusinessIcon />}
      onClick={openCreateModal}
      sx={{
        height: 46,
        px: 3,
        borderRadius: 3,
        textTransform: "none",
        fontWeight: 600,
        boxShadow: "none",
        minWidth: { xs: "100%", sm: 220 },

        "&:hover": {
          boxShadow: "0 8px 20px rgba(37,99,235,.18)",
        },
      }}
    >
      Agregar negocio
    </Button>
        </Box>

        <Box
    sx={{
      display: "flex",
      alignItems: "center",
      width: {
        xs: "100%",
        sm: 320,
        md: 420,
        lg: 460,
      },
      height: 44,
      px: 2,
      borderRadius: 3,
      bgcolor: "#FFFFFF",
      border: "1px solid #E2E8F0",
      boxShadow: "0 2px 10px rgba(15,23,42,.04)",
      transition: ".25s",

      "&:hover": {
        borderColor: "#93C5FD",
        boxShadow: "0 6px 18px rgba(37,99,235,.08)",
      },

      "&:focus-within": {
        borderColor: "#2563EB",
        boxShadow: "0 0 0 4px rgba(37,99,235,.08)",
      },
    }}
  >
    <SearchIcon
      sx={{
        color: "#64748B",
        fontSize: 20,
        mr: 1.5,
      }}
    />

    <TextField
      variant="standard"
      placeholder="Buscar negocio..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      fullWidth
      InputProps={{
        disableUnderline: true,
        sx: {
          fontSize: 14,
          color: "#0F172A",

          "& input::placeholder": {
            color: "#94A3B8",
            opacity: 1,
          },
        },
      }}
    />
        </Box>
        </Box>

        {/* GRID DE TARJETAS */}
        <Box display="flex" flexWrap="wrap" gap={3}>
          {negociosPaginated.map((n) => (
            <Box
              key={n.id}
              flex="1 1 calc(100% - 24px)" // xs: 1 por fila
              sx={{
                '@media (min-width:600px)': { flex: '1 1 calc(50% - 24px)' },  // sm: 2 por fila
                '@media (min-width:900px)': { flex: '1 1 calc(33.33% - 24px)' }, // md: 3 por fila
                '@media (min-width:1200px)': { flex: '1 1 calc(25% - 24px)' },  // lg: 4 por fila
                maxWidth: 350, // opcional: ancho máximo de la tarjeta
              }}
            >
              <Card
                sx={{
                  height: "100%",
                  borderRadius: "20px",
                  overflow: "hidden",
                  bgcolor: "#fff",
                  border: "1px solid rgba(15,23,42,0.06)",
                  boxShadow: "0 6px 18px rgba(15,23,42,0.06)",
                  display: "flex",
                  flexDirection: "column",
                  transition: "0.25s ease",

                  "&:hover": {
                    transform: "translateY(-4px)",
                    boxShadow: "0 14px 30px rgba(15,23,42,0.12)",
                  },
                }}
              >
                {/* IMAGE */}
                <CardMedia
                  component="img"
                  height="120"
                  image={
                    n.imagen ||
                    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQde1Zuns3SWsvZyR31zNW6hWWyf8N20bmBFA&s"
                  }
                  alt={n.nombre}
                  sx={{
                    objectFit: "cover",
                  }}
                />

                <CardContent sx={{ py: 1.5, px: 2, flex: 1 }}>
                  {/* TITLE */}
                  <Typography
                    fontWeight={800}
                    fontSize={14}
                    noWrap
                    sx={{ color: "#0f172a" }}
                  >
                    {n.nombre}
                  </Typography>

                  {/* DESCRIPTION */}
                  <Typography
                    fontSize={12}
                    color="text.secondary"
                    sx={{
                      mt: 0.5,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      minHeight: 32, // 🔥 elimina espacio raro abajo
                    }}
                  >
                    {n.descripcion || "Sin descripción"}
                  </Typography>

                  {/* INFO */}
                  <Box mt={1}>
                    <Typography fontSize={11} color="text.secondary">
                      📍 {n.direccion}
                    </Typography>

                    <Typography fontSize={11} color="text.secondary">
                      📞 {n.telefono}
                    </Typography>
                  </Box>
                </CardContent>

                {/* ACTIONS */}
                <Box
                  sx={{
                    px: 1,
                    pb: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 0.5,
                  }}
                >
                  <Tooltip title="Editar negocio" arrow>
                    <IconButton
                      onClick={() => openEditModal(n)}
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        color: "#2563EB",
                        border: "1px solid #E2E8F0",
                        transition: "all .25s ease",

                        "&:hover": {
                          bgcolor: "#2563EB",
                          color: "#FFF",
                          borderColor: "#2563EB",
                          boxShadow: "0 12px 24px rgba(37,99,235,.20)",
                          transform: "translateY(-3px)",
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Eliminar negocio" arrow>
                    <IconButton
                      onClick={() => handleDelete(n.id)}
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        color: "#EF4444",
                        border: "1px solid #E2E8F0",
                        transition: "all .25s ease",

                        "&:hover": {
                          bgcolor: "#EF4444",
                          color: "#FFF",
                          borderColor: "#EF4444",
                          boxShadow: "0 12px 24px rgba(239,68,68,.20)",
                          transform: "translateY(-3px)",
                        },
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Permisos y módulos" arrow>
                    <IconButton
                      onClick={() => handlePermisos(n)}
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        color: "#10B981",
                        border: "1px solid #E2E8F0",
                        transition: "all .25s ease",

                        "&:hover": {
                          bgcolor: "#10B981",
                          color: "#FFF",
                          borderColor: "#10B981",
                          boxShadow: "0 12px 24px rgba(16,185,129,.20)",
                          transform: "translateY(-3px)",
                        },
                      }}
                    >
                      <MenuBookIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Usuarios del negocio" arrow>
                    <IconButton
                      onClick={() => handleUsuarios(n)}
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        color: "#0EA5E9",
                        border: "1px solid #E2E8F0",
                        transition: "all .25s ease",

                        "&:hover": {
                          bgcolor: "#0EA5E9",
                          color: "#FFF",
                          borderColor: "#0EA5E9",
                          boxShadow: "0 12px 24px rgba(14,165,233,.20)",
                          transform: "translateY(-3px)",
                        },
                      }}
                    >
                      <PeopleAltOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Sitio web y tienda en línea" arrow>
                    <IconButton
                      onClick={() => openEditModal(n, 1)}
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 3,
                        bgcolor: "#FFFFFF",
                        color: "#0F172A",
                        border: "1px solid #E2E8F0",
                        transition: "all .25s ease",

                        "&:hover": {
                          bgcolor: "#0F172A",
                          color: "#FFF",
                          borderColor: "#0F172A",
                          boxShadow: "0 12px 24px rgba(15,23,42,.20)",
                          transform: "translateY(-3px)",
                        },
                      }}
                    >
                      <LanguageIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>

                </Box>
              </Card>
            </Box>
          ))}
        </Box>

        {/* PAGINACIÓN */}

        {totalPages > 1 && (
          <Stack alignItems="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              shape="rounded"

              size={isMobile ? "small" : "medium"}   // 👈 más compacto en móvil

              siblingCount={isMobile ? 0 : 1}        // 👈 menos botones en móvil
              boundaryCount={isMobile ? 1 : 2}

              showFirstButton={!isMobile}            // 👈 ocultar en móvil
              showLastButton={!isMobile}

            />
          </Stack>
        )}

        {/* MODAL EDITAR ADICIONAR */}

        <Dialog
          open={isModalOpen}
          onClose={closeModal}
          fullWidth
          maxWidth="lg"
          PaperProps={{
            sx: {
              borderRadius: 5,
              overflow: "hidden",
              boxShadow: "0 18px 45px rgba(15,23,42,.12)",
              bgcolor: "#F8FAFC",
            },
          }}
        >
          <DialogTitle sx={{ p: 0 }}>
            <Box
              sx={{
                background: "linear-gradient(135deg,#F8FAFC,#EEF6FF)",
                borderBottom: "1px solid #E2E8F0",
                px: { xs: 2, sm: 3, md: 4 },
                py: { xs: 2, md: 2.5 },

                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              {/* INFORMACIÓN */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: { xs: 1.5, md: 2.5 },
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Avatar
                  sx={{
                    width: { xs: 46, md: 58 },
                    height: { xs: 46, md: 58 },
                    bgcolor: "#DBEAFE",
                    color: "#2563EB",
                    boxShadow: "0 6px 16px rgba(37,99,235,.10)",
                    flexShrink: 0,
                  }}
                >
                  <BusinessIcon
                    sx={{
                      fontSize: { xs: 24, md: 30 },
                    }}
                  />
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: {
                        xs: 18,
                        sm: 20,
                        md: 22,
                      },
                      fontWeight: 700,
                      color: "#0F172A",
                      lineHeight: 1.2,
                    }}
                  >
                    {editingId ? "Editar negocio" : "Nuevo negocio"}
                  </Typography>

                  <Typography
                    sx={{
                      mt: 0.5,
                      fontSize: {
                        xs: 12,
                        md: 13,
                      },
                      color: "#64748B",
                      lineHeight: 1.4,

                      display: {
                        xs: "none",
                        sm: "block",
                      },
                    }}
                  >
                    {editingId ? "Datos del negocio, su página web, horarios, tienda en línea, pagos y WhatsApp." : "Complete la información del establecimiento para continuar."}
                  </Typography>
                </Box>
              </Box>

              {/* BOTÓN CERRAR */}
              <IconButton
                onClick={closeModal}
                sx={{
                  width: { xs: 38, md: 42 },
                  height: { xs: 38, md: 42 },
                  bgcolor: "#FFFFFF",
                  color: "#64748B",
                  border: "1px solid #E2E8F0",
                  flexShrink: 0,

                  transition: ".25s",

                  "&:hover": {
                    bgcolor: "#F1F5F9",
                    color: "#0F172A",
                    transform: "rotate(90deg)",
                  },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </DialogTitle>

          {/* PESTAÑAS: mismo modal para el negocio, su web y su tienda */}
          <Box sx={{ px: { xs: 1, md: 3 }, bgcolor: "#FFFFFF", borderBottom: "1px solid #E2E8F0", display: "flex", alignItems: "center" }}>
            <Tabs
              value={tabModal}
              onChange={(_, v) => setTabModal(v)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                flex: 1,
                "& .MuiTab-root": { textTransform: "none", fontWeight: 600, fontSize: 14, minHeight: 52 },
                "& .Mui-selected": { color: "#2563EB" },
                "& .MuiTabs-indicator": { height: 3, borderRadius: 3, bgcolor: "#2563EB" },
              }}
            >
              <Tab icon={<BusinessIcon fontSize="small" />} iconPosition="start" label="Datos del negocio" />
              <Tab icon={<LanguageIcon fontSize="small" />} iconPosition="start" label="Sitio web" />
              <Tab icon={<ScheduleTabIcon />} iconPosition="start" label="Horarios" />
              <Tab icon={<StorefrontIcon fontSize="small" />} iconPosition="start" label="Tienda en línea" />
              <Tab icon={<CreditCardIcon fontSize="small" />} iconPosition="start" label="Pagos y WhatsApp" />
              <Tab icon={<PrintIcon fontSize="small" />} iconPosition="start" label="Impresión" />
            </Tabs>
            {editingId && sitio?.publicado && (
              <Button size="small" startIcon={<OpenInNewIcon />} href={`/${sitio.url_negocio}`} target="_blank" rel="noopener noreferrer"
                sx={{ textTransform: "none", fontWeight: 600, display: { xs: "none", md: "inline-flex" } }}>
                Ver sitio
              </Button>
            )}
          </Box>

          <DialogContent
            sx={{
              bgcolor: "#F8FAFC",
              p: 4
            }}
          >
            {tabModal > 0 && tabModal < 4 && !sitio && (
              <Box sx={{ display: "grid", placeItems: "center", py: 8 }}><CircularProgress /></Box>
            )}
            {tabModal === 1 && sitio && (
              <SeccionSitioWeb sitio={sitio} set={setCampoSitio} errores={erroresSitio}
                tipoNombre={tipoActual(form.tipo)?.nombre ?? "Otros"}
                onSugeridos={tipoActual(form.tipo) ? () => {
                  const t = tipoActual(form.tipo)!;
                  Swal.fire({
                    title: `Textos sugeridos para ${t.nombre}`,
                    text: "Se reemplazan frases, Nosotros, franja, servicios, mensaje de WhatsApp y SEO. Las fotos se conservan.",
                    icon: "question", showCancelButton: true, confirmButtonText: "Usar sugeridos", cancelButtonText: "Cancelar",
                  }).then((r) => { if (r.isConfirmed) setSitio(aplicarSugeridos(sitio, t, form.nombre || "tu negocio", form.ciudad ?? null)); });
                } : undefined} />
            )}
            {tabModal === 2 && sitio && <SeccionHorarios sitio={sitio} set={setCampoSitio} errores={erroresSitio} />}
            {tabModal === 3 && sitio && <SeccionTienda sitio={sitio} set={setCampoSitio} errores={erroresSitio} />}
            {/* Tiene su propio botón Guardar: los secretos no viajan con el resto del formulario */}
            {tabModal === 4 && <SeccionIntegraciones idNegocio={editingId} />}
            {tabModal === 5 && <SeccionImpresion idNegocio={editingId} />}

            {tabModal === 0 && (

            <Box
              display="grid"
              gridTemplateColumns={{
                xs: "1fr",
                lg: "1fr 1fr"
              }}
              gap={3}
            >
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF"
                }}
              >

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >

                  <BusinessIcon color="primary" />

                  <Typography
                    fontWeight={700}
                    fontSize={17}
                  >

                    Información General

                  </Typography>

                </Box>

                <TextField
                  label="NIT"
                  value={form.nit}
                  onChange={(e) => setForm({ ...form, nit: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: <BusinessIcon sx={{ mr: 1 }} /> }}
                 sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                />
                <TextField
                  label="Nombre"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  fullWidth
                  InputProps={{ startAdornment: <ApartmentIcon sx={{ mr: 1 }} /> }}
                  sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                />
                <TextField
                  label="Dirección"
                  value={form.direccion}
                  onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                  InputProps={{ startAdornment: <LocationOnIcon sx={{ mr: 1 }} /> }}
                />
                <TextField
                  label="Ciudad"
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                  InputProps={{ startAdornment: <LocationOnIcon sx={{ mr: 1 }} /> }}
                />
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 4,
                  border: "1px solid #E2E8F0",
                  background: "#FFFFFF"
                }}
              >

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >

                  <PhoneIcon color="success" />

                  <Typography
                    fontWeight={700}
                    fontSize={17}
                  >

                    Información de contacto

                  </Typography>


                </Box>

                <TextField
                  label="Correo Electrónico"
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  fullWidth
                  sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                  InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1 }} /> }}
                />
                <TextField
                  label="Teléfono"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                  InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1 }} /> }}
                />
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  mt: 0,
                  p: 2,
                  borderRadius: 4,
                  border: "1px solid #E2E8F0"
                }}
              >

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >

                  <SettingsIcon color="warning" />

                  <Typography
                    fontWeight={700}
                    fontSize={17}
                  >

                    Configuración

                  </Typography>

                </Box>

                <TextField
                  select
                  label="Tipo de negocio"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                  InputProps={{ startAdornment: <CategoryIcon sx={{ mr: 1 }} /> }}
                >
                  {tiposNegocio.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </TextField>


                <TextField
                  label="Hora Apertura"
                  type="time"
                  value={form.hora_apertura || ""}
                  onChange={(e) => setForm({ ...form, hora_apertura: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                />
                <TextField
                  label="Hora Cierre"
                  type="time"
                  value={form.hora_cierre || ""}
                  onChange={(e) => setForm({ ...form, hora_cierre: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                />

                <TextField
                  label="URL Imagen"
                  value={form.imagen}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                  InputProps={{ startAdornment: <ImageIcon sx={{ mr: 1 }} /> }}
                />
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  mt: 0,
                  p: 2,
                  borderRadius: 4,
                  border: "1px solid #E2E8F0"
                }}
              >

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  mb={1}
                >

                  <DescriptionIcon color="info" />

                  <Typography
                    fontWeight={700}
                  >

                    Descripción

                  </Typography>

                </Box>
                {/* Descripción */}
                <TextField
                  label="Descripción"
                  multiline
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  fullWidth
                   sx={{
                  mt: 1,
                  "& .MuiOutlinedInput-root": {
                    minHeight: 42, // antes ~56px
                    borderRadius: 3,
                    background: "#FFFFFF",
                    fontSize: 13,
                    "& fieldset": {borderColor: "#E2E8F0",},
                    "&:hover fieldset": {borderColor: "#93C5FD",},
                    "&.Mui-focused fieldset": {borderColor: "#2563EB",borderWidth: 2,},
                    "& input": {padding: "10px 14px",},},
                  "& .MuiInputLabel-root": {fontSize: 13,},
                  "& .MuiInputAdornment-root .MuiSvgIcon-root": {
                    fontSize: 18,
                    color: "#64748B",
                  },
                }}
                
                  InputProps={{ startAdornment: <DescriptionIcon sx={{ mr: 1 }} /> }}
                />
              </Paper>
            </Box>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              py: 2.5,
              borderTop: "1px solid #E2E8F0",
              bgcolor: "#F8FAFC",

              display: "flex",
              flexDirection: {
                xs: "column",
                md: "row",
              },

              alignItems: "stretch",
              justifyContent: "space-between",
              gap: 2,
            }}
          >
            {/* ESTADO */}
            <Paper
              elevation={0}
              sx={{
                flex: 1,
                width: "100%",
                maxWidth: { xs: "100%", md: 420 },

                px: 2,
                py: 1.5,

                borderRadius: 3,
                border: "1px solid #E2E8F0",
                bgcolor: "#FFFFFF",

                display: "flex",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Avatar
                sx={{
                  width: 42,
                  height: 42,
                  bgcolor: form.activo ? "#ECFDF5" : "#FEF2F2",
                  color: form.activo ? "#16A34A" : "#DC2626",
                  flexShrink: 0,
                }}
              >
                <BusinessIcon fontSize="small" />
              </Avatar>

              <Box flex={1} minWidth={0}>
                <Typography
                  fontSize={13}
                  fontWeight={700}
                  color="#0F172A"
                >
                  Estado del negocio
                </Typography>

                <Typography
                  fontSize={12}
                  color="#64748B"
                  noWrap
                >
                  {form.activo
                    ? "Disponible para operar."
                    : "Actualmente deshabilitado."}
                </Typography>
              </Box>

              <Box
                display="flex"
                alignItems="center"
                gap={1}
                flexShrink={0}
              >
                <Chip
                  size="small"
                  label={form.activo ? "ACTIVO" : "INACTIVO"}
                  color={form.activo ? "success" : "error"}
                  variant="filled"
                  sx={{
                    fontWeight: 700,
                    minWidth: 90,
                  }}
                />

                <Switch
                  checked={form.activo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      activo: e.target.checked,
                    })
                  }
                />
              </Box>
            </Paper>

            {/* BOTONES */}
            <Box
              sx={{
                display: "flex",
                gap: 2,
                width: {
                  xs: "100%",
                  md: "auto",
                },
                flexDirection: "row",
                justifyContent: "flex-end",
              }}
            >
              <Button
                variant="outlined"
                onClick={closeModal}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  height: 46,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 600,
                  borderColor: "#CBD5E1",
                  color: "#475569",

                  "&:hover": {
                    bgcolor: "#F8FAFC",
                    borderColor: "#94A3B8",
                  },
                }}
              >
                Cancelar
              </Button>

              {tabModal < 4 && <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={guardando}
                sx={{
                  flex: 1,
                  minWidth: 0,
                  height: 46,
                  borderRadius: 3,
                  textTransform: "none",
                  fontWeight: 700,
                  background: "linear-gradient(135deg,#2563EB,#3B82F6)",
                  boxShadow: "0 8px 20px rgba(37,99,235,.20)",

                  "&:hover": {
                    background: "linear-gradient(135deg,#1D4ED8,#2563EB)",
                    transform: "translateY(-1px)",
                  },
                }}
              >
                {guardando ? <CircularProgress size={22} color="inherit" /> : editingId ? "Guardar" : "Crear"}
              </Button>}
            </Box>
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
              {selectedUsuario?.nombre?.charAt(0)}
            </Avatar>

            {/* INFO */}
            <Box flex={1}>
              <Typography fontWeight={600} fontSize={16}>
                Nit: {selectedUsuario?.nit}
              </Typography>
              <Typography fontSize={16}>
                empresa: {selectedUsuario?.nombre}
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
              {selectedUsuario?.tipo}
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

      {/* MODAL PARA USUARIOS DEL NEGOCIO */}
      <Dialog
        open={openUsuarios}
        onClose={() => setOpenUsuarios(false)}
        maxWidth="xl"
        fullWidth
      >
        <DialogTitle
          sx={{
            p: 0,
            overflow: "hidden",
            borderBottom: "1px solid #BFDBFE",
          }}
        >
          <Box
            sx={{
              bgcolor: "#DBEAFE",
              px: 3,
              py: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box display="flex" alignItems="center" gap={2}>
              <Avatar
                sx={{
                  bgcolor: "#2563EB",
                  color: "#FFFFFF",
                  width: 48,
                  height: 48,
                }}
              >
                <PeopleAltOutlinedIcon />
              </Avatar>

              <Box
                sx={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <Typography
                  noWrap
                  title={negocioSeleccionado?.nombre}
                  sx={{
                    fontWeight: 700,
                    fontSize: {
                      xs: 16,
                      sm: 18,
                      md: 20,
                    },
                    color: "#1E3A8A",
                    lineHeight: 1.2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {negocioSeleccionado?.nombre}
                </Typography>

                <Typography
                  sx={{
                    mt: 0.5,
                    fontSize: {
                      xs: 12,
                      sm: 13,
                    },
                    color: "#64748B",
                    display: {
                      xs: "none",
                      sm: "block",
                    },
                  }}
                >
                  Administración de usuarios
                </Typography>
              </Box>
            </Box>

            <IconButton
              onClick={() => setOpenUsuarios(false)}
              sx={{
                color: "#1E40AF",
                bgcolor: "#FFFFFF",
                border: "1px solid #BFDBFE",
                transition: "all .2s",

                "&:hover": {
                  bgcolor: "#EFF6FF",
                  borderColor: "#93C5FD",
                  transform: "rotate(90deg)",
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 5 }}>
          <AdminUsuarios
            idNegocio={negocioSeleccionado?.id}
          />
        </DialogContent>
      </Dialog>

    </>
  );
};

export default AdminNegocios;
