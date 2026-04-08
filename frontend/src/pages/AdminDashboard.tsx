import React, { useState, useEffect } from "react";
import {
  Box, List, ListItemButton, ListItemIcon, ListItemText, Paper,
  Typography, Divider, IconButton, Avatar, Tooltip,
  AppBar, Toolbar, Menu, MenuItem,
  useMediaQuery, useTheme, Drawer
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";

import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LockResetIcon from "@mui/icons-material/LockReset";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import PersonIcon from "@mui/icons-material/Person";
import { getModulos } from "../api/menusistema";
import { iconMap } from "../utils/mapIcons";
import { componentMap } from "../utils/mapComponents";
import { useIdleLogout } from "../hooks/useIdleLogout";
import CambiarPasswordModal from "../components/CambiarPasswordModal";
import {cambiopassword} from "./../api/auth"
const DEFAULT_AVATAR =
  "https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png";

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED = 90;

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { modulo } = useParams();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("md"));
  const [menus, setMenus] = useState<any[]>([]);
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [nombre_negocio, setNombreNegocio] = useState("Mi Negocio");
  const [imagen_negocio, setImagenNegocio] = useState("");
  const [id_usuario, setid_usuario] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState("");
  const [sinModulos, setSinModulos] = useState(false);
  const [imagen, setImagen] = useState(DEFAULT_AVATAR);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);
  const [openPasswordModal, setOpenPasswordModal] = useState(false);

  useEffect(() => {
  const handleStorage = (e: StorageEvent) => {
    if (e.key === "logout") {
      navigate("/");
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("storage", handleStorage);
  };
}, [navigate]);

const cerrarSesion = () => {
  localStorage.clear();
  localStorage.setItem("logout", Date.now().toString());
  navigate("/login");
};

  useIdleLogout({
    timeout: 120 * 60 * 1000, // 2 horas de inactividad
    warningTime: 120 * 1000, // aviso 2 min antes
    onLogout: cerrarSesion,
  });

  // 🔥 CONTROL RESPONSIVE
  useEffect(() => {
    if (isSmallScreen) {
      setCollapsed(false); // móvil SIEMPRE abierto dentro del drawer
    } else {
      setCollapsed(false);
      setDrawerOpen(false);
    }
  }, [isSmallScreen]);

  // 🔥 CARGA DE DATOS
  useEffect(() => {
    const storedIdNegocio = localStorage.getItem("id_negocio") || "";
    const storedNegocio = localStorage.getItem("nombre_negocio") || "Mi Negocio";
    const imagenNegocio = localStorage.getItem("imagen_negocio") || "";
    const storedNombre = localStorage.getItem("nombre") || "";
    const storedRol = localStorage.getItem("rol") || "";
    const rawImagen = localStorage.getItem("imagen");
    const id_usuario = localStorage.getItem("id_usuario")||"";

    setNombreNegocio(storedNegocio);
    setImagenNegocio(imagenNegocio);
    setNombre(storedNombre);
    setRol(storedRol);
    setImagen(rawImagen || DEFAULT_AVATAR);
    setid_usuario(id_usuario);

    const loadMenus = async () => {
      const data = await getModulos(storedIdNegocio, Number(id_usuario));
      setMenus(data);

      if (!modulo && data.length > 0) {
        navigate(`/admin/${data[0].url}`);
      }

      if (data.length === 0) {
        setSinModulos(true);
      }
    };

    loadMenus();
  }, []);

  const ActiveComponent = modulo ? componentMap[modulo] : null;

  // 🔥 SIDEBAR
  const sidebar = (
   <Box
  sx={{
    width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH,
    ...(isSmallScreen
      ? { height: "100%",}
      : {
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          height: "100vh",
        }),
    bgcolor: "#25313F",
    display: "flex",
    flexDirection: "column",
    overflowY: "auto",
    transition: "all 0.3s ease",
    zIndex:20
  }}
>
      {/* HEADER */}
      <Box display="flex" alignItems="center" justifyContent="space-between" p={1}>
       <Box display="flex" alignItems="center" gap={1.5}>
  
        {/* Logo */}
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "12px",
            overflow: "hidden",
            background: "rgba(255,255,255,0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {imagen_negocio ? (
            <img
              src={imagen_negocio}
              alt="Negocio"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          ) : (
            <StorefrontIcon sx={{ color: "#fff", fontSize: 20 }} />
          )}
        </Box>

        {/* Nombre */}
        {!collapsed && (
          <Box sx={{ maxWidth: 150 }}>
            <Typography
              sx={{
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                lineHeight: 1.2,
                wordBreak: "break-word", // 🔥 clave
              }}
            >
              {nombre_negocio}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: "#9AA7B6",
                fontSize: 11,
              }}
            >
              Mi negocio
            </Typography>
          </Box>
        )}
      </Box>

        {!isSmallScreen && (
          <IconButton
            onClick={() => setCollapsed(!collapsed)}
            sx={{ color: "#9AA7B6", zIndex: 10 }}
          >
            {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
        )}
      </Box>

      {/* USER */}
      <Box display="flex" flexDirection="column" alignItems="center" p={2}>
        <Avatar src={imagen} sx={{ width: 50, height: 50 }} />
        {!collapsed && (
          <>
            <Typography sx={{ color: "#fff",fontSize: 13}}>{nombre}</Typography>
            <Typography sx={{ color: "#fff" }} variant="caption">{rol}</Typography>
          </>
        )}
      </Box>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

      {/* MENU */}
      <List sx={{ flex: 1 }}>
        {menus.map((menu) => {
          const selected = modulo === menu.url;

          return (
            <Tooltip
              key={menu.id}
              title={!isSmallScreen && collapsed ? menu.nombre : ""}
              placement="right"
            >
              <ListItemButton
                selected={selected}
                onClick={() => {
                  navigate(`/admin/${menu.url}`);
                  if (isSmallScreen) setDrawerOpen(false);
                }}
                sx={{
                  color: selected ? "#fff" : "#9AA7B6",
                  "&.Mui-selected": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon sx={{ color: "inherit" }}>
                  {iconMap[menu.icono ?? "default"] ?? <MenuIcon />}
                </ListItemIcon>

                {!collapsed && <ListItemText primary={menu.nombre} />}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box display="flex" height="100vh" width="100%">
      
      {/* DESKTOP */}
      {!isSmallScreen && sidebar}

      {/* MO BILE */}
      {isSmallScreen && (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          PaperProps={{
            sx: { width: 245 }, 
          }}
        >
          {sidebar}
        </Drawer>
      )}

      {/* CONTENIDO */}
      <Box flex={1} display="flex" flexDirection="column" bgcolor="#f3f4f6">
        
        <AppBar position="static" sx={{ bgcolor: "#25313F" }}>
          <Toolbar>
            {isSmallScreen && (
              <IconButton onClick={() => setDrawerOpen(true)} sx={{ color: "#fff" }}>
                <MenuIcon />
              </IconButton>
            )}

            <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
              <IconButton sx={{ color: "#fff" }}>
                <NotificationsIcon />
              </IconButton>

              <IconButton sx={{ color: "#fff" }}>
              <MenuItem onClick={() => setOpenPasswordModal(true)}>
               <LockResetIcon sx={{ mr: 1, color: "#f59e0b" }} />
                Cambiar contraseña
              </MenuItem>
              </IconButton>

              <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
                <Avatar src={imagen} />
                <ArrowDropDownIcon />
              </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={() => setAnchorEl(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                PaperProps={{
                  sx: {
                    borderRadius: 2,
                    minWidth: 180,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    px: 1,
                    py: 0.5,
                  },
                }}
              >
                {/* Menu Items */}
                <MenuItem
                  sx={{
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    mb: 0.5,
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "#E3F2FD" },
                  }}
                >
                  <PersonIcon sx={{ mr: 1, color: "#1976d2" }} /> Perfil
                </MenuItem>

                <MenuItem
                  onClick={() => cerrarSesion()}
                  sx={{
                    borderRadius: 1,
                    px: 2,
                    py: 1,
                    transition: "all 0.2s",
                    "&:hover": { bgcolor: "#FFEBEE" },
                  }}
                >
                  <LogoutIcon sx={{ mr: 1, color: "#D32F2F" }} /> Salir
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        <Box flex={1} p={0.5}
         sx={{
    ...(isSmallScreen
      ? {}
      : {
          ml: `${collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_WIDTH}px`,
        }),
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
  }}
  >
          <Paper sx={{ p: 1 }}>
            {sinModulos ? (
              <Typography>Sin acceso</Typography>
            ) : ActiveComponent ? (
              <ActiveComponent /> //aqui van los modulos principales
            ) : (
              <Typography>Módulo no encontrado</Typography>
            )}
          </Paper>
        </Box>
      </Box>
      {/*Modal cambio de contraseña */}
            <CambiarPasswordModal
        open={openPasswordModal}
        onClose={() => setOpenPasswordModal(false)}
       onSubmit={async ({ currentPassword, newPassword }) => {
        const payload = {currentPassword,newPassword,id_usuario,};
        await cambiopassword(payload);

        localStorage.clear();
        localStorage.setItem("logout", Date.now().toString()); // multi-tab
        navigate("/login");
      }}
      />

    </Box>
    
  );
};

export default AdminDashboard;