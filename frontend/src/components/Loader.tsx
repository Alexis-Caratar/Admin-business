// components/Loader.tsx
import React from "react";
import { Box, Typography, Avatar, CircularProgress } from "@mui/material";

interface LoaderProps {
  text?: string;
  logo?: string;
}

const Loader: React.FC<LoaderProps> = ({
  text = "Cargando...",
  logo,
}) => {
  return (
    <Box
      sx={{
        position: "absolute", // 🔥 clave (no fixed)
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2000,

        display: "flex",
        justifyContent: "center",
        alignItems: "center",

        // 🔥 AQUÍ la magia (transparente sin bloquear)
        backgroundColor: "rgba(0,0,0,0.15)",

        // animación suave
        animation: "fadeIn 0.25s ease",

        "@keyframes fadeIn": {
          from: { opacity: 0 },
          to: { opacity: 1 },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1.5,
          px: 3,
          py: 2,
          borderRadius: 3,

          // 🔥 tarjeta flotante elegante
          background: "rgba(255,255,255,0.9)",
          boxShadow: "0 8px 25px rgba(0,0,0,0.2)",
        }}
      >
        {logo && (
          <Avatar src={logo} sx={{ width: 50, height: 50 }} />
        )}

        <CircularProgress size={28} />

        <Typography fontSize={13} fontWeight={500}>
          {text}
        </Typography>
      </Box>
    </Box>
  );
};

export default Loader;