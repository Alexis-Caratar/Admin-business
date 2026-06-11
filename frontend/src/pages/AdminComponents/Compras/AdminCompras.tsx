import {
  Box,
  Button,
  Card,
  Chip,
  Typography,
  Stack,
  TextField,
  IconButton,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SearchIcon from "@mui/icons-material/Search";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";

import { DataGrid, type GridColDef } from "@mui/x-data-grid";

import { useEffect, useState } from "react";

import { getCompras } from "../../../api/compras";

export default function AdminCompras() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(false);

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

  const columns: GridColDef[] = [
    {
      field: "numero_compra",
      headerName: "Compra",
      flex: 1,
      renderCell: ({ value }) => (
        <Typography fontWeight={700}>
          {value}
        </Typography>
      ),
    },
    {
      field: "proveedor",
      headerName: "Proveedor",
      flex: 1.5,
    },
    {
      field: "fecha_compra",
      headerName: "Fecha",
      flex: 1,
    },
    {
      field: "numero_factura",
      headerName: "Factura",
      flex: 1,
    },
    {
      field: "estado",
      headerName: "Estado",
      flex: 1,
      renderCell: ({ value }) => (
        <Chip
          label={value}
          size="small"
          sx={{
            fontWeight: 700,
            borderRadius: "10px",
            bgcolor:
              value === "PAGADA"
                ? "#dcfce7"
                : value === "ANULADA"
                ? "#fee2e2"
                : "#fef3c7",
            color:
              value === "PAGADA"
                ? "#166534"
                : value === "ANULADA"
                ? "#991b1b"
                : "#92400e",
          }}
        />
      ),
    },
    {
      field: "total",
      headerName: "Total",
      flex: 1,
      renderCell: ({ value }) => (
        <Typography
          fontWeight={700}
          color="success.main"
        >
          $
          {Number(value).toLocaleString(
            "es-CO"
          )}
        </Typography>
      ),
    },
    {
      field: "acciones",
      headerName: "",
      sortable: false,
      width: 140,
      renderCell: () => (
        <Stack
          direction="row"
          spacing={0.5}
        >
          <IconButton size="small">
            <VisibilityOutlinedIcon fontSize="small" />
          </IconButton>

          <IconButton size="small">
            <EditOutlinedIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            color="error"
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "#f8fafc",
        minHeight: "100vh",
      }}
    >
      {/* HEADER */}

      <Card
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 4,
          boxShadow:
            "0 10px 30px rgba(0,0,0,.06)",
        }}
      >
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography
              variant="h4"
              fontWeight={800}
            >
              Compras
            </Typography>

            <Typography color="text.secondary">
              Gestión de compras y facturas
            </Typography>
          </Box>

          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 3,
              px: 3,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Nueva Compra
          </Button>
        </Box>
      </Card>

      {/* MÉTRICAS */}

      <Box
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          md: "repeat(3,1fr)",
        }}
        gap={2}
        mb={3}
      >
        <Card
          sx={{
            p: 2.5,
            borderRadius: 4,
          }}
        >
          <Typography color="text.secondary">
            Total Compras
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
          >
            {compras.length}
          </Typography>
        </Card>

        <Card
          sx={{
            p: 2.5,
            borderRadius: 4,
          }}
        >
          <Typography color="text.secondary">
            Pendientes
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
            color="warning.main"
          >
            {
              compras.filter(
                (x: any) =>
                  x.estado === "PENDIENTE"
              ).length
            }
          </Typography>
        </Card>

        <Card
          sx={{
            p: 2.5,
            borderRadius: 4,
          }}
        >
          <Typography color="text.secondary">
            Total Comprado
          </Typography>

          <Typography
            variant="h4"
            fontWeight={800}
            color="success.main"
          >
            $
            {compras
              .reduce(
                (a: number, b: any) =>
                  a + Number(b.total),
                0
              )
              .toLocaleString("es-CO")}
          </Typography>
        </Card>
      </Box>

      {/* TABLA */}

      <Card
        sx={{
          borderRadius: 4,
          overflow: "hidden",
          boxShadow:
            "0 10px 30px rgba(0,0,0,.06)",
        }}
      >
        <Box
          p={2}
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <TextField
            size="small"
            placeholder="Buscar compra..."
            InputProps={{
              startAdornment: (
                <SearchIcon />
              ),
            }}
            sx={{ width: 320 }}
          />

          <ShoppingCartOutlinedIcon />
        </Box>

        <DataGrid
          rows={compras}
          columns={columns}
          loading={loading}
          autoHeight
          disableRowSelectionOnClick
          pageSizeOptions={[10, 20, 50]}
          sx={{
            border: 0,

            "& .MuiDataGrid-columnHeaders":
              {
                bgcolor: "#f8fafc",
                borderBottom:
                  "1px solid #e2e8f0",
              },

            "& .MuiDataGrid-columnHeaderTitle":
              {
                fontWeight: 700,
                color: "#475569",
              },

            "& .MuiDataGrid-row:hover": {
              bgcolor: "#f8fafc",
            },
          }}
        />
      </Card>
    </Box>
  );
}