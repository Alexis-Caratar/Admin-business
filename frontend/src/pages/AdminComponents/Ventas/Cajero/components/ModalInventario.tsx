import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField
} from "@mui/material";

type Producto = {
  id: number;
  nombre: string;
  stock_actual: number;
};

type ProductoConteo = Producto & {
  stockFisico: number | "";
  diferencia?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: (data: ProductoConteo[]) => void | Promise<void>;
  productos: Producto[];
  tipo: "APERTURA" | "CIERRE";
  id_caja: number | null;
};

export const ModalInventario: React.FC<Props> = ({
  open,
  onClose,
  onConfirm,
  productos,
  tipo,
  id_caja
}) => {
  const [data, setData] = useState<ProductoConteo[]>([]);
  const [loading, setLoading] = useState(false);

  console.log("productos",productos);
  
  // 🔥 Inicializar data
  useEffect(() => {
    if (open) {
      setData(
        (productos || []).map((p) => ({
          ...p,
          stockFisico: tipo === "APERTURA" ? p.stock_actual : ""
        }))
      );
    }
  }, [open, productos, tipo]);

  // 🔥 Manejo de cambio
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

  // 🔥 Validación fuerte
  const validar = () => {
    return data.every(
      (p) =>
        p.stockFisico !== "" &&
        Number(p.stockFisico) >= 0 &&
        Number(p.stockFisico) < 100000
    );
  };

  // 🔥 Ordenar por diferencia (los problemas arriba)
  const dataOrdenada = useMemo(() => {
    return [...data].sort((a, b) => {
      const diffA =
        a.stockFisico === "" ? 0 : Number(a.stockFisico) - a.stock_actual;
      const diffB =
        b.stockFisico === "" ? 0 : Number(b.stockFisico) - b.stock_actual;

      return Math.abs(diffB) - Math.abs(diffA);
    });
  }, [data]);

  // 🔥 Confirmar
  const handleConfirm = async () => {
    if (!validar() || !id_caja) return;

    try {
      setLoading(true);

      const payload = data.map((p) => ({
        ...p,
        diferencia:
          p.stockFisico === ""
            ? 0
            : Number(p.stockFisico) - p.stock_actual
      }));

      await onConfirm(payload);

    } catch (err) {
      console.error("Error confirmando inventario:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      onClose={(_e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        {tipo === "APERTURA"
          ? "Confirmar Inventario Inicial"
          : "Confirmar Inventario de Cierre"}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {tipo === "APERTURA"
            ? "Verifique el inventario físico antes de iniciar la jornada."
            : "Ingrese el inventario físico al finalizar la jornada."}
        </Typography>

        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><b>Producto</b></TableCell>
              <TableCell align="center"><b>Sistema</b></TableCell>
              <TableCell align="center"><b>Físico</b></TableCell>
              <TableCell align="center"><b>Diferencia</b></TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {dataOrdenada.map((row) => {
              const diferencia =
                row.stockFisico === ""
                  ? "-"
                  : Number(row.stockFisico) - row.stock_actual;

              return (
                <TableRow key={row.id}>
                  <TableCell>{row.nombre}</TableCell>

                  <TableCell align="center">
                    {row.stock_actual}
                  </TableCell>

                  <TableCell align="center">
                    <TextField
                      value={row.stockFisico}
                      onChange={(e) =>
                        handleChange(row.id, e.target.value)
                      }
                      size="small"
                      inputProps={{ style: { textAlign: "center" } }}
                      sx={{
                        width: 90,
                        backgroundColor:
                          row.stockFisico === ""
                            ? "transparent"
                            : Number(row.stockFisico) === row.stock_actual
                            ? "#e8f5e9"
                            : "#ffebee"
                      }}
                    />
                  </TableCell>

                  <TableCell
                    align="center"
                    sx={{
                      color:
                        diferencia === "-"
                          ? "inherit"
                          : diferencia === 0
                          ? "green"
                          : "red",
                      fontWeight: 600
                    }}
                  >
                    {diferencia}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button
          variant="contained"
          disabled={!validar() || loading}
          onClick={handleConfirm}
        >
          {loading ? "Guardando..." : "Confirmar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};