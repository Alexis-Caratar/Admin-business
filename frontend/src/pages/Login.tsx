import React, { useState } from "react";
import { login } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

import {
  Box,
  TextField,
  Button,
  InputAdornment,
  Typography,
  Paper,
} from "@mui/material";

import MailOutlineIcon from "@mui/icons-material/MailOutline";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import LoginIcon from "@mui/icons-material/Login";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { token, user } = await login({ email, password });
      localStorage.setItem("token", token);
      localStorage.setItem("id_usuario", String(user.id));
      localStorage.setItem("id_persona", String(user.id_persona));
      localStorage.setItem("id_negocio", String(user.id_negocio));
      localStorage.setItem("nombre_negocio", String(user.nombre_negocio));
      localStorage.setItem("imagen_negocio", String(user.imagen_negocio));
      localStorage.setItem("nombre", user.nombre);
      localStorage.setItem("email", user.email);
      localStorage.setItem("rol", user.rol);
      localStorage.setItem("imagen", user.imagen);

      navigate("/admin");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: error.response?.data?.error || "Contraseña incorrecta",
        confirmButtonColor: "#1d4ed8",
      });
    }
  };

  return (
      <Box
        sx={{
          width: "100%",              
          minHeight: "100vh",
          overflowX: "hidden",        
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#f3f4f6",
          boxSizing: "border-box",    
          px: 2,                      
          py: 2,
        }}
      >
     <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ width: "100%", display: "flex", justifyContent: "center" }} // 🔥 clave
        >
     <Paper
            elevation={10}
            sx={{
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              width: "100%",
              maxWidth: { xs: "100%", sm: 700, md: 900, lg: 900 },
              mx: "auto",
              borderRadius: 4,
              overflow: "hidden",
            }}
          >
          {/* Lado izquierdo azul */}
          <Box
            sx={{
              flex: 1,
              background: "linear-gradient(135deg, #5acf8d, #0d45a0)",
              color: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              p: { xs: 3, sm: 4 },
              textAlign: "center",
              position: "relative"
            }}
          >
            {/* Logo */}
            <Box
              component="img"
              src="https://cdn-icons-png.flaticon.com/512/8214/8214962.png"
              alt="Logo"
              sx={{ width: 80, mb: 2, background: "#ffffff", borderRadius:10}}
            />
            <Typography variant="h5" fontWeight={700}>
              Bienvenido
            </Typography>
            <Typography variant="body2" sx={{ mt: 2 }}>
              AdminBusiness: el sistema empresarial 
            </Typography>
             <Typography variant="body2" sx={{ mt: 2 }}>
              versátil para todo tipo de negocios y establecimientos.
            </Typography>

            {/* Curva decorativa */}
           <Box
            sx={{
              position: "absolute",
              right: 0,
              transform: "translateX(50%)",   // 🔥 efecto sin romper layout
              bottom: 0,
              width: 100,
              height: "100%",
              background: "#fff",
              borderTopLeftRadius: "50% 50%",
              borderBottomLeftRadius: "50% 50%",
              display: { xs: "none", md: "block" }, // 🔥 oculta en móvil
            }}
          />
          </Box>

          {/* Lado derecho blanco */}
          <Box
            sx={{
              flex: 1,
              background: "#fff",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              p: { xs: 3, sm: 6 },
            }}
          >
            <Typography variant="h6" fontWeight={600} mb={4}>
              Inicio de sesión
            </Typography>

            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: 18 }}
            >
              <TextField
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail Address"
                required
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <MailOutlineIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                required
                fullWidth
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockOutlinedIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={<LoginIcon />}
                sx={{
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: 16,
                  textTransform: "none",
                  borderRadius: 3,
                  "&:hover": {
                    background: "#1d4ed8",
                  },
                }}
              >
                Sign Up
              </Button>
            </form>
          </Box>
        </Paper>
      </motion.div>
     </Box> 

      {/* Footer */}
      <Box
        sx={{
          mt: 4,
          textAlign: "center",
          color: "#6b7280",
          fontSize: 14,
        }}
      >
        Derechos reservados por AdminBusiness v 0.1 | By Ing. Alexis Caratar | Pasto - Nariño 2026
      </Box>
    </Box>
  );
};

export default Login;