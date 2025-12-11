/* ---------- /src/components/Categorias.tsx ---------- */
import React from "react";
import { Card, CardContent, Avatar, Typography, Box } from "@mui/material";
import type { CategoriaCajero } from "../../../../../types/cajero";

type Props = {
  categorias: CategoriaCajero[];
  loading: boolean;
  onOpen: (c: CategoriaCajero) => void;
};

export const Categorias: React.FC<Props> = ({ categorias, loading, onOpen }) => {
  return (
    <Box>
      <Typography variant="h6" fontWeight="bold" mb={2}>
        Categorías
      </Typography>

      {loading ? (
        <Typography color="text.secondary">Cargando categorías...</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.2,
            gridTemplateColumns: "1fr", // 🔥 SIEMPRE UNA POR FILA
          }}
        >
          {categorias.map((cat) => (
            <Card
              key={cat.id}
              onClick={() => onOpen(cat)}
              sx={{
                display: "flex",
                alignItems: "center",
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
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                  mr: 2,
                  borderRadius: 2,
                  bgcolor: "#f5f5f5",
                }}
              />

              <Typography
                fontSize={{ xs: 13, md: 14 }}
                fontWeight={600}
                noWrap
                sx={{
                  flex: 1,
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
