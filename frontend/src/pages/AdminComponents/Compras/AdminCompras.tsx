import {
  Box,
  Card,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Divider,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";

import { useEffect, useState } from "react";

import { getCompras } from "../../../api/compras";
import type { Compra } from "../../../types/compras";

export default function AdminCompras() {
  const [loading, setLoading] = useState(true);
  const [compras, setCompras] = useState<Compra[]>([]);

  const cargarCompras = async () => {
    try {
      setLoading(true);

      const resp = await getCompras();

      setCompras(resp.compras || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarCompras();
  }, []);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        mt={5}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Card
        sx={{
          p: 3,
          borderRadius: 4,
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography
            variant="h5"
            fontWeight={700}
          >
            Compras
          </Typography>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
          >
            Nueva Compra
          </Button>
        </Box>

        <Box display="flex" flexDirection="column" gap={2}>
          {compras.map((c) => (
            <Card
              key={c.id}
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 3,
                transition: "0.2s",
                "&:hover": {
                  boxShadow: 3,
                },
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                flexWrap="wrap"
                gap={2}
              >
                <Box>
                  <Typography
                    fontWeight={700}
                    fontSize={16}
                  >
                    Factura #{c.numero_factura}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {c.proveedor}
                  </Typography>
                </Box>

                <Chip
                  label={c.estado}
                  color={
                    c.estado === "activa"
                      ? "success"
                      : "error"
                  }
                  size="small"
                />
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box
                display="grid"
                gridTemplateColumns={{
                  xs: "1fr",
                  md: "repeat(4,1fr)",
                }}
                gap={2}
              >
                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Fecha
                  </Typography>

                  <Typography fontWeight={600}>
                    {c.fecha_compra}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Método Pago
                  </Typography>

                  <Typography fontWeight={600}>
                    {c.metodo_pago}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Tipo Compra
                  </Typography>

                  <Typography fontWeight={600}>
                    {c.tipo_compra}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Total
                  </Typography>

                  <Typography
                    fontWeight={700}
                    color="success.main"
                  >
                    $
                    {Number(
                      c.total
                    ).toLocaleString("es-CO")}
                  </Typography>
                </Box>
              </Box>
            </Card>
          ))}
        </Box>
      </Card>
    </Box>
  );
}