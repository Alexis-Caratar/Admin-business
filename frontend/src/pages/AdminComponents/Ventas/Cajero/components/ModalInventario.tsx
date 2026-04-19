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
  const [rowsPerPage, setRowsPerPage] = useState(8);  
  const [errores, setErrores] = useState<Record<number, boolean>>({});
  const [erroresObs, setErroresObs] = useState<Record<number, boolean>>({});


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

  const handleBlurFisico = (row: ProductoConteo) => {
  if (row.stockFisico === "") {
    setErrores((prev) => ({ ...prev, [row.id]: true }));
  } else {
    setErrores((prev) => ({ ...prev, [row.id]: false }));
  }
};

const handleBlurObs = (row: ProductoConteo) => {
  const diferencia =
    row.stockFisico === ""
      ? 0
      : Number(row.stockFisico) - row.stock_actual;

  if (diferencia !== 0 && (!row.observacion || row.observacion.trim().length < 3)) {
    setErroresObs((prev) => ({ ...prev, [row.id]: true }));
  } else {
    setErroresObs((prev) => ({ ...prev, [row.id]: false }));
  }
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
          px: 3,
          py: 2,
          borderRadius: 2,
          mb: 2
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography fontWeight="bold">
            {tipo === "APERTURA"
              ? "Inventario Inicial"
              : "Inventario de Cierre"}
          </Typography>

          <TextField
            size="small"
            placeholder="Buscar producto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{
              bgcolor: "white",
              borderRadius: 1,
              width: 220
            }}
          />
        </Stack>
      </Box>

      {/* TABLA */}
      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell align="center">Sistema</TableCell>
              <TableCell align="center">Físico</TableCell>
              <TableCell align="center">Dif</TableCell>
              <TableCell align="center">Obs</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedData.map((row) => {
              const diferencia =
                row.stockFisico === ""
                  ? null
                  : Number(row.stockFisico) - row.stock_actual;

              return (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={500}>
                      {row.nombre}
                    </Typography>
                  </TableCell>

                  <TableCell align="center">
                    {row.stock_actual}
                  </TableCell>

                  <TableCell align="center">
                   <TextField
                      value={row.stockFisico}
                      onChange={(e) => handleChange(row.id, e.target.value)}
                      onBlur={() => handleBlurFisico(row)}
                      size="small"
                      error={errores[row.id]}
                      helperText={errores[row.id] ? "Campo obligatorio" : ""}
                      sx={{ width: 80 }}
                    />
                                        
                  </TableCell>

                  <TableCell align="center">
                    {diferencia === null ? (
                      "-"
                    ) : (
                      <Chip
                        label={diferencia}
                        size="small"
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
                        onChange={(e) => handleObservacion(row.id, e.target.value)}
                        onBlur={() => handleBlurObs(row)}
                        size="small"
                        error={erroresObs[row.id]}
                        helperText={
                          erroresObs[row.id]
                            ? "Mínimo 3 caracteres"
                            : ""
                        }
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
        rowsPerPageOptions={[5, 8, 10, 20]}
      />
    </Box>
  );
};