import React from "react";
import { Card, Avatar, Typography, Box } from "@mui/material";
import type { CategoriaCajero } from "../../../../../types/cajero";

type Props = {
  categorias: CategoriaCajero[];
  loading: boolean;
  onOpen: (c: CategoriaCajero) => void;
  modo?: "dashboard" | "carrito"; // 👈 nuevo
};

export const Categorias: React.FC<Props> = ({
  categorias,
  loading,
  onOpen,
  modo = "dashboard",
}) => {
  const esCarrito = modo === "carrito";

  return (
  <Box>
  {/* Título */}
  <Typography
    sx={{
      fontSize: { xs: 14, md: 18 },
      fontWeight: 800,
      color: "#0F172A",
      mb: 1.5,
    }}
  >
    Categorías
  </Typography>

  {loading ? (
    <Typography
      sx={{
        color: "#64748B",
        fontSize: 13,
      }}
    >
      Cargando categorías...
    </Typography>
  ) : (
    <Box
      sx={{
        display: "grid",
        gap: .5,
        gridTemplateColumns: esCarrito
          ? {
              xs: "repeat(4,1fr)",
              sm: "repeat(5,1fr)",
              md: "repeat(4,1fr)",
            }
          : "1fr",
      }}
    >
      {categorias.map((cat) => (
        <Card
          key={cat.id}
          onClick={() => onOpen(cat)}
          sx={{
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: esCarrito
              ? "column"
              : { xs: "column", md: "row" },

            alignItems: "center",
            gap: esCarrito ? 0.8 : 1.5,
            p: esCarrito ? 0.8 : 0.4,
            borderRadius: "18px",
            cursor: "pointer",
            bgcolor: "#FFFFFF",
            border: "1px solid rgba(15,23,42,.06)",
            boxShadow: "0 4px 18px rgba(15,23,42,.05)",
            transition: ".25s ease",

            "&:hover": {
              transform: "translateY(-3px)",
              boxShadow: "0 12px 30px rgba(15,23,42,.10)",
              borderColor: "#BFDBFE",
            },
          }}
        >
          {/* Decoración */}
          <Box
            sx={{
              position: "absolute",
              top: -20,
              right: -20,
              width: 60,
              height: 60,
              borderRadius: "50%",
              background:
                "linear-gradient(135deg,#2563EB,#60A5FA)",
              opacity: 0.08,
            }}
          />

          {/* Imagen */}
          <Avatar
            src={cat.imagen ?? undefined}
            sx={{
              width: esCarrito ? 42 : 48,
              height: esCarrito ? 42 : 48,
              bgcolor: "#F8FAFC",
              borderRadius: 3,
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 10px rgba(0,0,0,.05)",
            }}
          />

          {/* Nombre */}
          <Typography
            sx={{
              flex: 1,
              textAlign: esCarrito
                ? "center"
                : { xs: "center", md: "left" },
              fontWeight: 700,
              color: "#0F172A",
              fontSize: esCarrito? 10: { xs: 11, md: 13 },
              lineHeight: 1.2,
            }}
          >
            {cat.categoria}
          </Typography>
        </Card>
      ))}
    </Box>
  )}
</Box>
  );
};