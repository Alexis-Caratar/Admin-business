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
      localStorage.setItem("nombre", user.nombre);
      localStorage.setItem("email", user.email);
      localStorage.setItem("rol", user.rol);
      localStorage.setItem("imagen", user.imagen);

      navigate("/admin");
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Acceso denegado",
        text: error.response?.data?.error || "Contraseña incorrecta”",
        confirmButtonColor: "#1d4ed8",
      });
    }
  };

  return (
    <Box
      sx={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        background: "linear-gradient(135deg, #eef2ff, #e0e7ff, #c7d2fe)",
        fontFamily: `"Inter", sans-serif`,
      }}
    >
      {/* Overlay oscuro suave */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.15)",
          backdropFilter: "blur(3px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <Paper
          elevation={8}
          sx={{
            position: "relative",
            width: 400,
            p: 5,
            borderRadius: 3,
            background: "rgba(255,255,255,0.85)",
            backdropFilter: "blur(12px)",
            display: "flex",
            flexDirection: "column",
            gap: 3,
            boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
          }}
        >
          <Typography
            variant="h5"
            sx={{ textAlign: "center", fontWeight: 700, color: "#0f172a" }}
          >
            Sistema Empresarial
          </Typography>
          <Typography
            variant="body2"
            sx={{ textAlign: "center", color: "#475569", mb: 2 }}
          >
            Accede al panel administrativo
          </Typography>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <TextField
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
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
              placeholder="Contraseña"
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
                boxShadow: "0 5px 15px rgba(37,78,216,0.35)",
                "&:hover": {
                  boxShadow: "0 6px 18px rgba(37,78,216,0.45)",
                },
              }}
            >
              Ingresar
            </Button>
          </form>
        </Paper>
      </motion.div>
    </Box>
  );
};

export default Login;
