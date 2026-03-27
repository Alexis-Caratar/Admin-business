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
      <Typography
        variant="h6"
        fontWeight="bold"
        mb={2}
        sx={{
          fontSize: { xs: 16, md: 20 },
        }}
      >
        Categorías
      </Typography>

      {loading ? (
        <Typography color="text.secondary">
          Cargando categorías...
        </Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.2,

            // 👇 AQUÍ ESTA LA MAGIA
            gridTemplateColumns: esCarrito
              ? { xs: "repeat(4, 1fr)", md: "4" } // 📱 3 por fila en carrito
              : "1fr", // Dashboard normal
          }}
        >
          {categorias.map((cat) => (
            <Card
              key={cat.id}
              onClick={() => onOpen(cat)}
              sx={{
                display: "flex",

                flexDirection: esCarrito
                  ? "column"
                  : { xs: "column", md: "row" },

                alignItems: "left",
                justifyContent: "left",

                p: esCarrito ? 0.8 : 1,
                borderRadius: 3,
                cursor: "pointer",
                transition: "0.25s",
                boxShadow: 2,
                border: "1px solid #e5e5e5",

                "&:hover": {
                  boxShadow: 5,
                  transform: "translateY(-3px)",
                },
              }}
            >
              <Avatar
                src={cat.imagen ?? undefined}
                sx={{
                  width: esCarrito
                    ? 38
                    : { xs: 50, md: 40 },

                  height: esCarrito
                    ? 38
                    : { xs: 50, md: 40 },

                  mb: esCarrito ? 0.5 : { xs: 1, md: 0 },

                  mr: esCarrito
                    ? 0
                    : { xs: 0, md: 2 },

                  borderRadius: 2,
                  bgcolor: "#f5f5f5",
                }}
              />

              <Typography
                fontSize={
                  esCarrito
                    ? 10
                    : { xs: 8, md: 12 }
                }
                fontWeight={600}
                textAlign="center"
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