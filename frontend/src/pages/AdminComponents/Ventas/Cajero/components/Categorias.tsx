import React from "react";
import { Card, Avatar, Typography, Box } from "@mui/material";
import type { CategoriaCajero } from "../../../../../types/cajero";

type Props = {
  categorias: CategoriaCajero[];
  loading: boolean;
  onOpen: (c: CategoriaCajero) => void;
};

export const Categorias: React.FC<Props> = ({ categorias, loading, onOpen }) => {
  return (
    <Box>
     <Typography
  variant="h6"
  fontWeight="bold"
  mb={2}
  sx={{
    fontSize: { xs: 16, md: 20 }, // 🔹 Más pequeño en móviles, más grande en escritorio
  }}
>
  Categorías
</Typography>

      {loading ? (
        <Typography color="text.secondary">Cargando categorías...</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.2,
            gridTemplateColumns: "1fr", // Siempre una por fila
          }}
        >
          {categorias.map((cat) => (
            <Card
              key={cat.id}
              onClick={() => onOpen(cat)}
              sx={{
                display: "flex",
                flexDirection: { xs: "column", md: "row" }, // Columna en móvil, fila en escritorio
                alignItems: "center",
                justifyContent: { xs: "center", md: "flex-start" },
                p: 1.3,
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
                src={cat.imagen}
                sx={{
                  width: { xs: 50, md: 40 },
                  height: { xs: 50, md: 40 },
                  mb: { xs: 1, md: 0 },
                  mr: { xs: 0, md: 2 },
                  borderRadius: 2,
                  bgcolor: "#f5f5f5",
                }}
              />

              <Typography
                fontSize={{ xs: 12, md: 14 }} // 🔹 Letra más pequeña en móviles
                fontWeight={600}
                textAlign={{ xs: "center", md: "left" }}
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
