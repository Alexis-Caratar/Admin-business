import React, { useState, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Typography,
  Box,
  Divider,
  Avatar,
  TextField,
} from "@mui/material";

import PointOfSaleIcon from "@mui/icons-material/PointOfSale";

type Props = {
  open: boolean;
  onClose: () => void;
  arqueoInfo: any;
  onCerrar: (data: any) => void;
  formatCOP: (n: number) => string;
};

export const CierreCajaModal: React.FC<Props> = ({
  open,
  onClose,
  arqueoInfo,
  onCerrar,
  formatCOP
}) => {

  const [dineroContado, setDineroContado] = useState<number | "">("");
  const [baseCaja, setBaseCaja] = useState<number | "">("");
  const [observacion, setObservacion] = useState("");

  console.log("arqueoInfo",arqueoInfo);
  
  /* DATOS DEL ARQUEO */
  const ventas = arqueoInfo?.total_ventas ?? 0;
  const egresos = arqueoInfo?.total_egresos ?? 0;
  const montoInicial = arqueoInfo?.monto_inicial ?? 0;

  /* DINERO ESPERADO */
 const dineroEsperado = useMemo(() => {
  return (
    Number(montoInicial || 0) +
    Number(ventas || 0) -
    Number(egresos || 0)
  );
}, [ventas, egresos, montoInicial]);
  console.log("dineroEsperado",dineroEsperado);


  const ventaLibre = useMemo(() => {
  if (dineroContado === "" || baseCaja === "") return 0;

  return Number(dineroContado) - Number(baseCaja);
}, [dineroContado, baseCaja]);
  
  /* DIFERENCIA */
  const diferencia = useMemo(() => {
    if (dineroContado === "") return 0;
    return Number(dineroContado) - dineroEsperado;
  }, [dineroContado, dineroEsperado]);

  const handleCerrar = () => {

    onCerrar({
      dinero_esperado: dineroEsperado,
      dinero_contado: dineroContado,
      diferencia,
      base_caja: baseCaja,
      observacion
    });

  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>

      {/* HEADER */}
      <DialogTitle sx={{ textAlign: "center", fontWeight: "bold" }}>
        Arqueo y Cierre de Caja
      </DialogTitle>

      <DialogContent>

        <Box display="flex" justifyContent="center" mb={3}>
          <Avatar
            sx={{
              bgcolor: "warning.light",
              width: 70,
              height: 70
            }}
          >
            <PointOfSaleIcon sx={{ fontSize: 40, color: "warning.dark" }} />
          </Avatar>
        </Box>

        {/* RESUMEN CAJA */}
        <Box
          sx={{
            p: 2,
            borderRadius: 3,
            bgcolor: "#f8f9fa",
            mb: 3
          }}
        >

          <Stack spacing={2}>

            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">
                Monto inicial
              </Typography>

              <Typography fontWeight={600}>
                {formatCOP(montoInicial)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">
                Ventas
              </Typography>

              <Typography fontWeight={600} color="success.main">
                {formatCOP(ventas)}
              </Typography>
            </Box>

            <Box display="flex" justifyContent="space-between">
              <Typography color="text.secondary">
                Egresos
              </Typography>

              <Typography fontWeight={600} color="error.main">
                - {formatCOP(egresos)}
              </Typography>
            </Box>

            <Divider />

            <Box display="flex" justifyContent="space-between">
              <Typography fontWeight={700}>
                Dinero esperado en caja
              </Typography>

              <Typography fontWeight={700} fontSize={18}>
                {formatCOP(dineroEsperado)}
              </Typography>
            </Box>

          </Stack>

        </Box>

        {/* DINERO CONTADO */}
 <TextField
  fullWidth
  type="text"
  label="Dinero contado en caja"
  placeholder="Ingrese el dinero contado"
  value={dineroContado === "" ? "" : formatCOP(Number(dineroContado))}
  onChange={(e) => {
    const valor = e.target.value.replace(/\D/g, ""); // solo números
    setDineroContado(valor === "" ? "" : Number(valor));
  }}
  sx={{ mb: 2 }}
/>

        {/* DIFERENCIA */}
        {dineroContado !== "" && (

          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor:
                diferencia === 0
                  ? "#e8f5e9"
                  : diferencia > 0
                  ? "#e3f2fd"
                  : "#ffebee",
              mb: 2
            }}
          >

            <Typography fontWeight={600}>
              Diferencia: {formatCOP(diferencia)}
            </Typography>

            <Typography fontSize={13} color="text.secondary">

              {diferencia === 0 && "Caja exacta"}

              {diferencia > 0 && "Sobrante de caja"}

              {diferencia < 0 && "Faltante de caja"}

            </Typography>

          </Box>

        )}

        {/* BASE QUE QUEDA */}
       <TextField
  fullWidth
  type="text"
  label="Base que queda en caja"
  placeholder="Ej: $ 50.000"
  value={baseCaja === "" ? "" : formatCOP(Number(baseCaja))}
  onChange={(e) => {
    const valor = e.target.value.replace(/\D/g, "");
    setBaseCaja(valor === "" ? "" : Number(valor));
  }}
  sx={{ mb: 2 }}
/>

<Box
  sx={{
    p: 2,
    borderRadius: 2,
    bgcolor: "#f5f5f5",
    mt: 1
  }}
>
  <Typography fontSize={13} color="text.secondary">
    Venta libre / Retiro de caja
  </Typography>

  <Typography fontWeight={700} fontSize={18} color="success.main">
    {formatCOP(ventaLibre)}
  </Typography>
</Box>

        {/* OBSERVACIONES */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Observaciones"
          placeholder="Notas del cierre de caja..."
          value={observacion}
          onChange={(e) => setObservacion(e.target.value)}
        />

      </DialogContent>

      {/* BOTONES */}
      <DialogActions sx={{ px: 3, pb: 2 }}>

        <Button fullWidth onClick={onClose}>
          Cancelar
        </Button>

        <Button
          fullWidth
          variant="contained"
          color="error"
          onClick={handleCerrar}
        >
          Cerrar Caja
        </Button>

      </DialogActions>

    </Dialog>
  );
};