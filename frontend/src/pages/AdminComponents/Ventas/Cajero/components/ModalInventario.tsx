import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Box,
  TableContainer,
  Paper,
  TablePagination,
  Chip,
  Stack
} from "@mui/material";

type Producto = {
  id: number;
  nombre: string;
  stock_actual: number;
};

type ProductoConteo = Producto & {
  stockFisico: number | "";
  diferencia?: number;
  observacion?: string;
};

type Props = {
  productos: Producto[];
  tipo: "APERTURA" | "CIERRE";
  onChangeData?: (data: ProductoConteo[]) => void;
};

export const ModalInventario: React.FC<Props> = ({
  productos,
  tipo,
  onChangeData
}) => {
  const [data, setData] = useState<ProductoConteo[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(30);


  const prevRef = useRef<any>(null);

  useEffect(() => {
    const payload = data.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      stock_actual: p.stock_actual,
      stockFisico: p.stockFisico === "" ? 0 : Number(p.stockFisico),
      diferencia:
        p.stockFisico === ""
          ? 0
          : Number(p.stockFisico) - p.stock_actual,
      observacion: p.observacion || ""
    }));

    const json = JSON.stringify(payload);

    if (prevRef.current === json) return;

    prevRef.current = json;
    onChangeData?.(payload);
  }, [data]);

  // 🔄 cargar productos
  useEffect(() => {
    setData(
      (productos || []).map((p) => ({
        ...p,
        stockFisico: tipo === "APERTURA" ? p.stock_actual : "",
        observacion: ""
      }))
    );
  }, [productos, tipo]);

  // 🔍 filtro búsqueda
  const filteredData = useMemo(() => {
    return data.filter((p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase())
    );
  }, [data, search]);

  // 📄 paginación
  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, page, rowsPerPage]);

  const handleChange = (id: number, value: string) => {
    const limpio = value.replace(/\D/g, "");

    setData((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, stockFisico: limpio === "" ? "" : Number(limpio) }
          : p
      )
    );
  };

 

  const handleObservacion = (id: number, value: string) => {
    setData((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, observacion: value } : p
      )
    );
  };

  return (
    <Box>
      {/* HEADER */}
      <Box
        sx={{
          background: "linear-gradient(135deg,#0f172a,#1e293b)",
          color: "white",
          px: 2,
          py: 1.2,
          borderRadius: 2,
          mb: 1.5
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontSize={14} fontWeight="bold">
            {tipo === "APERTURA"
              ? "Inventario Inicial"
              : "Inventario de Cierre"}
          </Typography>

          <TextField
            size="small"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              bgcolor: "white",
              borderRadius: 1,
              width: 180,
              '& .MuiInputBase-root': {
                height: 30,
                fontSize: 12
              }
            }}
          />
        </Stack>
      </Box>

      {/* TABLA */}
      <TableContainer component={Paper} sx={{ maxHeight: 380 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow sx={{ '& th': { py: 0.8, fontSize: 12 } }}>
              <TableCell>Producto</TableCell>
              <TableCell align="center">Sistema</TableCell>
              <TableCell align="center">Fisico</TableCell>
              <TableCell align="center">Diferencia</TableCell>
              <TableCell align="center">Obs</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.map((row) => {
              const errorFisico = row.stockFisico === "";
              const diferenciaVal =
                row.stockFisico === ""
                  ? null
                  : Number(row.stockFisico) - row.stock_actual;

              const errorObs =
                diferenciaVal !== null &&
                diferenciaVal !== 0 &&
                (!row.observacion || row.observacion.trim().length < 3);
                
              const diferencia =
                row.stockFisico === ""
                  ? null
                  : Number(row.stockFisico) - row.stock_actual;

              return (
                <TableRow
                key={row.id}
                hover
                sx={{
                  '& td': { py: 0.5, fontSize: 12 },
                  backgroundColor: errorFisico ? '#fff4f4' : 'inherit'
                }}
              >
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Typography
                      fontSize={12}
                      noWrap
                      title={row.nombre}
                    >
                      {row.nombre}
                    </Typography>
                  </TableCell>

                  <TableCell align="center" sx={{ fontSize: 12 }}>
                    {row.stock_actual}
                  </TableCell>

                  <TableCell align="center">
                   <TextField
                        value={row.stockFisico}
                        onChange={(e) => handleChange(row.id, e.target.value)}
                        size="small"
                        error={errorFisico}
                        helperText={errorFisico ? "cantidad real" : ""}
                        variant="outlined"
                        InputProps={{
                          sx: {
                            fontSize: 12,
                            height: 28,
                            px: 1
                          }
                        }}
                        sx={{ width: 120 }}
                      />
                  </TableCell>

                  <TableCell align="center">
                    {diferencia === null ? (
                      "-"
                    ) : (
                      <Chip
                        label={diferencia}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: 11
                        }}
                        color={
                          diferencia === 0
                            ? "success"
                            : diferencia > 0
                              ? "info"
                              : "error"
                        }
                      />
                    )}
                  </TableCell>

                  <TableCell align="center">
                    {diferencia !== null && diferencia !== 0 ? (
                      <TextField
                        value={row.observacion || ""}
                        onChange={(e) =>
                          handleObservacion(row.id, e.target.value)
                        }
                        size="small"
                        error={errorObs}
                        helperText={errorObs ? "Mínimo 3 caracteres" : ""}
                        variant="outlined"
                        InputProps={{
                          sx: {
                            fontSize: 12,
                            height: 28,
                            px: 1
                          }
                        }}
                        sx={{ width: 130 }}
                      />
                    ) : (
                      "-"
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINACIÓN */}
      <TablePagination
        component="div"
        count={filteredData.length}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[30, 50, 100]}
      />
    </Box>
  );
};