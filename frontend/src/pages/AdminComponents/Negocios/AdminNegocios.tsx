import React, { useEffect, useState, useMemo } from "react";
import {
  getNegocios,
  crearNegocio,
  actualizarNegocio,
  eliminarNegocio,
} from "../../../api/negocios";
import type { Negocio} from "../../../types";
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
} from "@mui/material";

import {asignarMenuEmpresa, getMenusempresaTotal,getMenusEmpresa} from "../../../api/negocios";
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


const AdminNegocios: React.FC = () => {
  const [negocios, setNegocios] = useState<Negocio[]>([]);
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
  const tiposNegocio = [
    "Restaurante",
    "Cafetería",
    "Bar",
    "Tienda",
    "Supermercado",
    "Panadería",
    "Comida rápida",
    "Servicios",
    "Otros",
  ];

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
    setIsModalOpen(true);
  };

  const openEditModal = (negocio: Negocio) => {
    setForm(negocio);
    setEditingId(negocio.id!);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await actualizarNegocio(editingId, form);
        Swal.fire("Actualizado", "El negocio ha sido actualizado.", "success");
      } else {
        await crearNegocio(form);
        Swal.fire("Creado", "El negocio ha sido creado.", "success");
      }
      closeModal();
      fetchNegocios();
    } catch (error) {
      Swal.fire("Error", "Hubo un problema al guardar el negocio.", "error");
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
          getMenusEmpresa(n.id||0), // tu API que trae los menús que tiene el usuario
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
        await asignarMenuEmpresa(selectedUsuario.id||0, menusUsuario); // tu API para guardar permisos
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
    <Box p={3}>
      {/* HEADER */}
      {/* HEADER */}
      {/* HEADER */}
      <Box mb={3}>

        {/* FILA 1: TÍTULO CENTRADO + BOTÓN DERECHA */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          {/* ESPACIO VACÍO PARA QUE EL TÍTULO QUEDE CENTRADO */}


          {/* TÍTULO Izquierda */}
          <Typography
            variant="h5"
            fontWeight={600}
            textAlign="left"
            flex={1}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <StoreIcon sx={{ fontSize: 30 }} />
            Administración de Negocios
          </Typography>

          <Box width="240px" />
          {/* BOTÓN DERECHA */}
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddBusinessIcon />}
            onClick={openCreateModal}
            sx={{ height: 38 }}
          >
            Agregar Negocio
          </Button>
        </Box>

        {/* FILA 2: BUSCADOR ABAJO A LA IZQUIERDA */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            background: "#f1f3f4",
            px: 1.5,
            borderRadius: 5,
            width: "460px",
            height: 36,
            boxShadow: "inset 0 0 4px rgba(0,0,0,0.1)",
          }}
        >
          <SearchIcon sx={{ opacity: 0.6, fontSize: 20, mr: 1 }} />
          <TextField
            variant="standard"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              disableUnderline: true,
              style: { fontSize: 14 },
            }}
            fullWidth
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
                <IconButton
                  size="small"
                  sx={{ bgcolor: "#eff6ff" }}
                  onClick={() => openEditModal(n)}
                >
                  <EditIcon fontSize="small" />
                </IconButton>

                <IconButton
                  size="small"
                  sx={{ bgcolor: "#fef2f2" }}
                  onClick={() => handleDelete(n.id)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>

                  <IconButton
                sx={{
                  bgcolor: "#f5f3ff",
                  "&:hover": { bgcolor: "#ede9fe" },
                }}
                onClick={() => handlePermisos(n)}
              >
                <MenuBookIcon fontSize="small" color="success" />
              </IconButton>

            <Tooltip title="Usuarios" arrow>
              <IconButton
                onClick={() => setOpenUsuarios(true)}
                 size="small"
                  sx={{ bgcolor: "#9dc1db" }}
              >
                <PeopleAltOutlinedIcon
                  sx={{
                    color: "#000000",
                    fontSize: 24,
                  }}
                />
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

      {/* MODAL */}

      <Dialog open={isModalOpen} onClose={closeModal} fullWidth maxWidth="md">
        <DialogTitle sx={{ fontWeight: 500, display: "flex", alignItems: "center", gap: 1 }}>
          <BusinessIcon />
          {editingId ? "Editar Negocio" : "Crear Negocio"}
        </DialogTitle>

        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 3 }}>
          <Box display="flex" flexWrap="wrap" gap={2}>
            {/* Primera columna */}
            <Box flex="1 1 45%" minWidth={250}>
              <TextField
                label="NIT"
                value={form.nit}
                onChange={(e) => setForm({ ...form, nit: e.target.value })}
                fullWidth
                InputProps={{ startAdornment: <BusinessIcon sx={{ mr: 1 }} /> }}
                sx={{ mt: 2 }} // <--- aumenta un poquito el margen superior
              />
              <TextField
                label="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                fullWidth
                InputProps={{ startAdornment: <ApartmentIcon sx={{ mr: 1 }} /> }}
                sx={{ mt: 1 }}
              />
              <TextField
                label="Dirección"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                fullWidth
                sx={{ mt: 1 }}
                InputProps={{ startAdornment: <LocationOnIcon sx={{ mr: 1 }} /> }}
              />
              <TextField
                label="Ciudad"
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                fullWidth
                sx={{ mt: 1 }}
                InputProps={{ startAdornment: <LocationOnIcon sx={{ mr: 1 }} /> }}
              />
              <TextField
                label="Teléfono"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                fullWidth
                sx={{ mt: 1 }}
                InputProps={{ startAdornment: <PhoneIcon sx={{ mr: 1 }} /> }}
              />
            </Box>

            {/* Segunda columna */}
            <Box flex="1 1 45%" minWidth={250}>
              <TextField
                label="Correo Electrónico"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                fullWidth
                sx={{ mt: 2 }}
                InputProps={{ startAdornment: <EmailIcon sx={{ mr: 1 }} /> }}
              />
              <Box display="flex" gap={2}>
                <TextField
                  label="Hora Apertura"
                  type="time"
                  value={form.hora_apertura || ""}
                  onChange={(e) => setForm({ ...form, hora_apertura: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
                <TextField
                  label="Hora Cierre"
                  type="time"
                  value={form.hora_cierre || ""}
                  onChange={(e) => setForm({ ...form, hora_cierre: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              </Box>

              <TextField
                select
                label="Tipo de negocio"
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                fullWidth
                sx={{ mt: 1 }}
                InputProps={{ startAdornment: <CategoryIcon sx={{ mr: 1 }} /> }}
              >
                {tiposNegocio.map((tipo) => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="URL Imagen"
                value={form.imagen}
                onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                fullWidth
                sx={{ mt: 1 }}
                InputProps={{ startAdornment: <ImageIcon sx={{ mr: 1 }} /> }}
              />
            </Box>

            {/* Descripción */}
            <Box flex="1 1 100%">
              <TextField
                label="Descripción"
                multiline
                rows={3}
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                fullWidth
                sx={{ mt: 1 }}
                InputProps={{ startAdornment: <DescriptionIcon sx={{ mr: 1 }} /> }}
              />
            </Box>

            {/* Switch Activo */}
            <Box display="flex" alignItems="center" gap={1}>
              <Typography>Activo:</Typography>
              <Switch
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                color="primary"
              />
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeModal}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editingId ? "Actualizar" : "Crear"}
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
             {selectedUsuario?.nombre?.charAt(0)}
            </Avatar>

            {/* INFO */}
            <Box flex={1}>
              <Typography fontWeight={600} fontSize={16}>
                {selectedUsuario?.nit} {selectedUsuario?.nombre}
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

    
    <Dialog
  open={openUsuarios}
  onClose={() => setOpenUsuarios(false)}
  maxWidth="xl"
  fullWidth
>
  <DialogTitle>
    Usuarios

    <IconButton
      onClick={() => setOpenUsuarios(false)}
      sx={{
        position: "absolute",
        right: 8,
        top: 8,
      }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  <DialogContent>
    <AdminUsuarios />
  </DialogContent>
</Dialog>
      </>
  );
};

export default AdminNegocios;
