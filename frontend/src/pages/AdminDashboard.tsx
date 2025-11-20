import React, { useState, useEffect } from "react";
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Tooltip,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
} from "@mui/material";

import { useNavigate, useParams } from "react-router-dom";

import MenuOpenIcon from "@mui/icons-material/MenuOpen";
import MenuIcon from "@mui/icons-material/Menu";
import NotificationsIcon from "@mui/icons-material/Notifications";
import RestoreIcon from "@mui/icons-material/Restore";
import StorefrontIcon from "@mui/icons-material/Storefront";
import LogoutIcon from "@mui/icons-material/Logout";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

import { getModulos } from "../api/menusistema";
import { iconMap } from "../utils/mapIcons";
import { componentMap } from "../utils/mapComponents";

const FONT = `"Inter", "Roboto", sans-serif`;
const DEFAULT_AVATAR =
  "https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png";

type Modulo = {
  id: number;
  url: string;
  nombre: string;
  icono: string | null;
  orden: number;
  activo: number;
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { modulo } = useParams(); // ← lee el código desde la URL

  const [menus, setMenus] = useState<Modulo[]>([]);
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [id_negocio, setIdNegocio] = useState<string>("");
  const [nombre_negocio, setNombreNegocio] = useState<string>("Mi Negocio");
  const [nombre, setNombre] = useState<string>("Administrador");
  const [rol, setRol] = useState<string>("admin");
  const [imagen, setImagen] = useState<string>(DEFAULT_AVATAR);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(anchorEl);

  useEffect(() => {
    const storedIdNegocio = localStorage.getItem("id_negocio") || "";
    const storedNegocio = localStorage.getItem("nombre_negocio") || "Mi Negocio";
    const storedNombre = localStorage.getItem("nombre") || "Administrador";
    const storedRol = localStorage.getItem("rol") || "admin";
    const rawImagen = localStorage.getItem("imagen");

    const storedImagen =
      !rawImagen || rawImagen === "null" || rawImagen === "undefined"
        ? DEFAULT_AVATAR
        : rawImagen;

    setIdNegocio(storedIdNegocio);
    setNombreNegocio(storedNegocio);
    setNombre(storedNombre);
    setRol(storedRol);
    setImagen(storedImagen);

    const loadMenus = async () => {
      const data = await getModulos(storedIdNegocio, storedRol);
      setMenus(data);
      

      if (!modulo && data.length > 0) {
        navigate(`/admin/${data[0].url}`);
      }
    };

    loadMenus();
  }, []);

  const safeImage = (img: any) => {
    if (!img || img === "null" || img === "undefined") {
      return DEFAULT_AVATAR;
    }
    return img;
  };

  const ActiveComponent = modulo ? componentMap[modulo] : null;

  return (
    <Box display="flex" height="100vh" width="100vw">
      {/* SIDEBAR */}
      <Paper
        elevation={0}
        sx={{
          width: collapsed ? 60 : 220,
          bgcolor: "#25313F",
          color: "#9AA7B6",
          transition: "width 0.3s ease",
          height: "100vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: FONT,
          borderRadius: 0,
        }}
      >
        {/* HEADER */}
        <Box
          display="flex"
          alignItems="center"
          justifyContent={collapsed ? "center" : "space-between"}
          p={2}
        >
          {!collapsed && (
            <Box display="flex" alignItems="center" gap={1}>
              <StorefrontIcon sx={{ color: "#FFFFFF", fontSize: 20 }} />
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#FFFFFF", fontFamily: FONT }}
              >
                {nombre_negocio}
              </Typography>
            </Box>
          )}

          <IconButton
            size="small"
            sx={{ color: "#9AA7B6" }}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <MenuIcon /> : <MenuOpenIcon />}
          </IconButton>
        </Box>

        {/* AVATAR */}
        <Box display="flex" flexDirection="column" alignItems="center" p={2}>
          <Avatar
            src={safeImage(imagen)}
            sx={{ width: 50, height: 50, mb: collapsed ? 0 : 1 }}
          >
            {nombre?.charAt(0).toUpperCase()}
          </Avatar>

          {!collapsed && (
            <>
              <Typography variant="body2" sx={{ color: "#FFFFFF" }}>
                {nombre}
              </Typography>
              <Typography variant="caption" sx={{ color: "#9AA7B6" }}>
                {rol}
              </Typography>
            </>
          )}
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.1)" }} />

        {/* MENÚ */}
        <List sx={{ flex: 1, p: 0 }}>
          {menus.map((menu) => {
            const selected = modulo === menu.url;

            return (
              <ListItemButton
                key={menu.id}
                selected={selected}
                onClick={() => navigate(`/admin/${menu.url}`)}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  px: collapsed ? 1 : 2,
                  color: selected ? "#FFFFFF" : "#9AA7B6",

                  "& .MuiListItemIcon-root": {
                    color: selected ? "#FFFFFF" : "#9AA7B6",
                  },
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.08)",
                  },
                  "&:hover": {
                    bgcolor: "rgba(255,255,255,0.12)",
                    color: "#FFFFFF",

                    "& .MuiListItemIcon-root": { color: "#FFFFFF" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: "center" }}>
                  {iconMap[menu.icono ?? "default"] ?? <MenuIcon />}
                </ListItemIcon>

                {!collapsed && (
                  <ListItemText
                    primary={menu.nombre}
                    sx={{
                      ml: 2,
                      ".MuiTypography-root": {
                        fontFamily: FONT,
                        fontSize: 14,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>
      </Paper>

      {/* CONTENIDO */}
      <Box flex={1} display="flex" flexDirection="column" bgcolor="#f3f4f6">
        <AppBar
          position="static"
          sx={{ bgcolor: "#25313F", boxShadow: "none", fontFamily: FONT }}
        >
          <Toolbar sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
            <Tooltip title="Notificaciones">
              <IconButton sx={{ color: "#9AA7B6" }}>
                <NotificationsIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Restaurar contraseña">
              <IconButton sx={{ color: "#9AA7B6" }}>
                <RestoreIcon />
              </IconButton>
            </Tooltip>

            {/* Avatar */}
            <IconButton
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ p: 0 }}
            >
              <Avatar src={imagen}>{nombre.charAt(0)}</Avatar>
              <ArrowDropDownIcon sx={{ color: "#FFFFFF" }} />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={openMenu}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              <MenuItem
                onClick={() => {
                  localStorage.clear();
                  window.location.href = "/login";
                }}
              >
                <LogoutIcon sx={{ mr: 1 }} /> Salir
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* RENDER DEL COMPONENTE */}
        <Box flex={1} sx={{ width: "100%", overflow: "auto", p: 3 }}>
          <Paper elevation={3} sx={{ p: 3 }}>
            {ActiveComponent ? <ActiveComponent /> : <h2>Módulo no encontrado</h2>}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
