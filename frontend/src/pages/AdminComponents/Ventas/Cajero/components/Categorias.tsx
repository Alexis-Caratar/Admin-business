/* ---------- /src/components/Categorias.tsx ---------- */
import React from "react";
import { Card, CardContent, Avatar, Typography } from "@mui/material";
import type { CategoriaCajero } from "../../../../../types/cajero";

type Props = {
  categorias: CategoriaCajero[];
  loading: boolean;
  onOpen: (c: CategoriaCajero) => void;
};

export const Categorias: React.FC<Props> = ({ categorias, loading, onOpen }) => {
  return (
    <div>
      <Typography variant="h6" fontWeight="bold" mb={1}>
        Categorías
      </Typography>

      {loading ? (
        <Typography>Cargando...</Typography>
      ) : (
        categorias.map((cat) => (
          <Card
            key={cat.id}
            sx={{ mb: 1.5, cursor: "pointer", display: "flex", alignItems: "center", px: 1, py: 1, borderRadius: 2 }}
            onClick={() => onOpen(cat)}
          >
            <Avatar src={cat.imagen} sx={{ width: 40, height: 40, mr: 1 }} />
            <Typography fontSize={14} fontWeight={600}>
              {cat.categoria}
            </Typography>
          </Card>
        ))
      )}
    </div>
  );
};