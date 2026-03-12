import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Box, Divider, Avatar, TextField,
} from "@mui/material";

import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import ReceiptIcon from '@mui/icons-material/Receipt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
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
  // Para la sub-modal de facturas pendientes
const [facturasPendientes, setFacturasPendientes] = useState<any[]>([]);
const [mesasOcupadas, setMesasOcupadas] = useState<any[]>([]);
const [alertaAbierta, setAlertaAbierta] = useState(false); // controla la modal combinada



  /* DINERO ESPERADO */
  const ventas = arqueoInfo?.total_ventas ?? 0;
  const egresos = arqueoInfo?.total_egresos ?? 0;
  const montoInicial = arqueoInfo?.monto_inicial ?? 0;

  const dineroEsperado = useMemo(() => Number(montoInicial) + Number(ventas) - Number(egresos), [ventas, egresos, montoInicial]);
  const ventaLibre = useMemo(() => (dineroContado === "" || baseCaja === "" ? 0 : Number(dineroContado) - Number(baseCaja)), [dineroContado, baseCaja]);
  const diferencia = useMemo(() => (dineroContado === "" ? 0 : Number(dineroContado) - dineroEsperado), [dineroContado, dineroEsperado]);


  useEffect(() => {
  if (!open) return; // Solo cuando la modal de cierre de caja se abre

  // Si hay facturas pendientes o mesas ocupadas, abrimos la modal combinada
  if ((arqueoInfo?.facturasPendientes?.length ?? 0) > 0 || (arqueoInfo?.mesasOcupadas?.length ?? 0) > 0) {
    setFacturasPendientes(arqueoInfo.facturasPendientes ?? []);
    setMesasOcupadas(arqueoInfo.mesasOcupadas ?? []);
    setAlertaAbierta(true); // Abrimos la modal combinada
  } else {
    setAlertaAbierta(false); // Cerramos por seguridad si no hay nada pendiente
  }

}, [open, arqueoInfo]);

  const puedeCerrarCaja = (arqueoInfo: any) => {
  return (
    (arqueoInfo?.facturasPendientes?.length ?? 0) === 0 &&
    (arqueoInfo?.mesasOcupadas?.length ?? 0) === 0
  );
};

const [confirmAbierta, setConfirmAbierta] = useState(false);


const handleConfirmarCierre = () => {
  const cierreData = {
    dinero_esperado: dineroEsperado,
    dinero_contado: dineroContado,
    diferencia,
    base_caja: baseCaja,
    venta_libre: ventaLibre,
    observacion
  };
  onCerrar(cierreData);

  // Limpiar campos
  setDineroContado("");
  setBaseCaja("");
  setObservacion("");
  setConfirmAbierta(false);
};

const camposValidos = () => {
  return dineroContado !== "" && baseCaja !== "";
};
  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>

     <DialogTitle
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 2,
    borderBottom: "1px solid #e0e0e0",
    pb: 1,
    mb: 2
  }}
>
  {/* Icono del header */}
  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
    <PointOfSaleIcon sx={{ fontSize: 32, color: "warning.main" }} />
    <Typography sx={{ fontWeight: "bold", fontSize: 18 }}>
      Arqueo y Cierre de Caja
    </Typography>
  </Box>

  {/* Botón de cierre */}
  <Button
    onClick={() => onClose()}
    sx={{
      minWidth: 0,
      padding: 0,
      color: "grey.500",
      fontSize: 20,
      lineHeight: 1,
      "&:hover": { backgroundColor: "transparent", color: "error.main" }
    }}
  >
    ✕
  </Button>
</DialogTitle>
        <DialogContent>
          {/* RESUMEN CAJA */}
          <Box
            sx={{p: 2,borderRadius: 3,bgcolor: "#f8f9fa",mb: 3}}>
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
            {/* BOTÓN MODERNO ESTILO BOX */}
      <Box
  onClick={puedeCerrarCaja(arqueoInfo) && camposValidos() ? () => setConfirmAbierta(true) : undefined}
  sx={{
    mt: 3,
    p: 2,
    borderRadius: 3,
    background: puedeCerrarCaja(arqueoInfo) && camposValidos()
      ? "linear-gradient(135deg, #09a58e, #2e7d32)"
      : "#9e9e9e",
    color: "#fff",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 1,
    cursor: puedeCerrarCaja(arqueoInfo) && camposValidos() ? "pointer" : "not-allowed",
    userSelect: "none",
    fontWeight: 700,
    boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
    transition: "all 0.25s ease",
    width: { xs: "90%", sm: "70%", md: "50%" },
    mx: "auto",
    fontSize: { xs: "0.9rem", sm: "1rem" },
    "&:hover": puedeCerrarCaja(arqueoInfo) && camposValidos()
      ? { transform: "translateY(-4px)", boxShadow: "0 10px 25px rgba(0,0,0,0.35)" }
      : {},
    "&:active": { transform: "scale(0.97)", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }
  }}
>
  <PointOfSaleIcon sx={{ fontSize: 20 }} />
  <Typography fontWeight={700} letterSpacing={0.5}>
    Cerrar Caja
  </Typography>
</Box>
        </DialogActions>

      </Dialog>


      {/*SUB MODAL PARA ALERTA DE FACTURAS PENDIENTES */}

    <Dialog
  open={alertaAbierta}
  onClose={( reason) => {
    if (reason === "backdropClick" || reason === "escapeKeyDown") {
      return; // bloquea cerrar por fuera o con ESC
    }
    setAlertaAbierta(false);
  }}
  disableEscapeKeyDown
  maxWidth="sm"
  fullWidth
>
  {/* HEADER */}
  <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
    <WarningAmberIcon sx={{ color: 'warning.main', fontSize: 32 }} />
    <Typography sx={{ fontWeight: 'bold', fontSize: 18 }}>Atención</Typography>
  </DialogTitle>

  <DialogContent sx={{ mt: 1 }}>
    {/* FACTURAS PENDIENTES */}
    {facturasPendientes.length > 0 && (
      <>
        <Typography sx={{ fontWeight: 'bold', mb: 1 }}>Facturas Pendientes:</Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
          {facturasPendientes.map(f => (
            <Box
              key={f.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                mb: 1,
                borderRadius: 2,
                bgcolor: 'grey.100',
                boxShadow: 1
              }}
            >
              <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                <ReceiptIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>{f.numero_factura} - {f.nombre}</Typography>
                <Typography fontSize={13}>Total: ${Number(f.total).toLocaleString()}</Typography>
                <Typography fontSize={12} color="text.secondary">Método: {f.metodo_pago}</Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </>
    )}

    {/* MESAS OCUPADAS */}
    {mesasOcupadas.length > 0 && (
      <>
        <Typography sx={{ fontWeight: 'bold', mb: 1 }}>Mesas Ocupadas:</Typography>
        <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
          {mesasOcupadas.map(mesa => (
            <Box
              key={mesa.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 1.5,
                mb: 1,
                borderRadius: 2,
                bgcolor: 'grey.100',
                boxShadow: 1
              }}
            >
              <Avatar sx={{ bgcolor: 'error.main', width: 40, height: 40 }}>
                <RestaurantIcon />
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>{mesa.nombre} - {mesa.estado}</Typography>
                <Typography fontSize={12} color="text.secondary">
                  Total: ${Number(mesa.total).toLocaleString()} | Pagado: ${Number(mesa.monto_pagado).toLocaleString()}
                </Typography>
                <Typography fontSize={12} color="text.secondary">
                  Método: {mesa.metodo_pago} | Fecha: {new Date(mesa.fecha).toLocaleString()}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </>
    )}

    {/* Mensaje si no hay pendientes ni mesas */}
    {facturasPendientes.length === 0 && mesasOcupadas.length === 0 && (
      <Typography sx={{ textAlign: 'center' }}>No hay facturas pendientes ni mesas ocupadas.</Typography>
    )}
  </DialogContent>

  <Divider />

 <DialogActions sx={{ px: 3, pb: 3, justifyContent: "center" }}>
  <Box
    onClick={() => {
      setAlertaAbierta(false);
      onClose();
    }}
    sx={{
      mt: 1,
      p: 2,
      borderRadius: 3,
      background: "linear-gradient(135deg, #ff6347, #d84315)", // tomate
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 1,
      cursor: "pointer",
      userSelect: "none",
      fontWeight: 700,
      letterSpacing: 0.5,
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
      transition: "all 0.25s ease",
      width: { xs: "95%", sm: "80%" },

      "&:hover": {
        transform: "translateY(-4px)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
        background: "linear-gradient(135deg, #ff7043, #bf360c)"
      },

      "&:active": {
        transform: "scale(0.97)",
        boxShadow: "0 4px 12px rgba(0,0,0,0.25)"
      }
    }}
  >
    <WarningAmberIcon />
    <Typography fontWeight={700}>
      Aceptar
    </Typography>
  </Box>
</DialogActions>
</Dialog>

{/*DIALOGO CERRAR CAJA */}
<Dialog
  open={confirmAbierta}
  onClose={() => setConfirmAbierta(false)}
  maxWidth="xs"
  fullWidth
>
  {/* HEADER CON ICONO Y X DE CIERRE */}
  <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <WarningAmberIcon sx={{ fontSize: 36, color: 'warning.main' }} />
      <Typography sx={{ fontWeight: 'bold', fontSize: 18 }}>Confirmar Cierre de Caja</Typography>
    </Box>
    <Button
      onClick={() => setConfirmAbierta(false)}
      sx={{ minWidth: 0, padding: 0, color: 'grey.500', fontSize: 18, lineHeight: 1 }}
    >
      ✕
    </Button>
  </DialogTitle>

  <DialogContent>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
      Revise cuidadosamente los datos antes de confirmar el cierre de caja. <strong>Una vez confirmado, no se podrán realizar cambios.</strong>
    </Typography>

    <Box sx={{ p: 2, borderRadius: 3, bgcolor: '#f4f6f8', boxShadow: 1 }}>
      <Stack spacing={1.5}>
        {/* Monto Inicial */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'info.main', width: 30, height: 30 }}>
            <PointOfSaleIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={600}>Monto inicial:</Typography>
          <Typography sx={{ ml: 'auto' }}>{formatCOP(montoInicial)}</Typography>
        </Box>

        {/* Ventas */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'success.main', width: 30, height: 30 }}>
            <ReceiptIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={600}>Ventas:</Typography>
          <Typography sx={{ ml: 'auto', color: 'success.main' }}>{formatCOP(ventas)}</Typography>
        </Box>

        {/* Egresos */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'error.main', width: 30, height: 30 }}>
            <RestaurantIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={600}>Egresos:</Typography>
          <Typography sx={{ ml: 'auto', color: 'error.main' }}>- {formatCOP(egresos)}</Typography>
        </Box>

        <Divider />

        {/* Dinero esperado */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'warning.main', width: 30, height: 30 }}>
            <WarningAmberIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={700}>Dinero esperado:</Typography>
          <Typography sx={{ ml: 'auto', fontWeight: 700 }}>{formatCOP(dineroEsperado)}</Typography>
        </Box>

        {/* Dinero contado */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'secondary.main', width: 30, height: 30 }}>
            <PointOfSaleIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={700}>Dinero contado:</Typography>
          <Typography sx={{ ml: 'auto', fontWeight: 700 }}>
            {dineroContado ? formatCOP(Number(dineroContado)) : "-"}
          </Typography>
        </Box>

        {/* Diferencia */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: '#9c27b0', width: 30, height: 30 }}>
            <WarningAmberIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={700}>Diferencia:</Typography>
          <Typography
            sx={{
              ml: 'auto',
              fontWeight: 700,
              color: diferencia === 0 ? 'success.main' : diferencia > 0 ? 'info.main' : 'error.main',
            }}
          >
            {formatCOP(diferencia)}
          </Typography>
        </Box>

        {/* Base en caja */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'grey.700', width: 30, height: 30 }}>
            <PointOfSaleIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={700}>Base en caja:</Typography>
          <Typography sx={{ ml: 'auto', fontWeight: 700 }}>{baseCaja ? formatCOP(Number(baseCaja)) : "-"}</Typography>
        </Box>

        {/* Venta libre */}
        <Box display="flex" alignItems="center" gap={1}>
          <Avatar sx={{ bgcolor: 'orange', width: 30, height: 30 }}>
            <ReceiptIcon sx={{ fontSize: 18, color: 'white' }} />
          </Avatar>
          <Typography fontWeight={700}>Venta libre:</Typography>
          <Typography sx={{ ml: 'auto', fontWeight: 700 }}>{formatCOP(ventaLibre)}</Typography>
        </Box>
      </Stack>
    </Box>
  </DialogContent>

  <Divider />

  {/* BOTÓN MODERNO ESTILO BOX */}
  <DialogActions sx={{ px: 3, pb: 2 }}>
  <Box
    onClick={handleConfirmarCierre}
    sx={{
      mt: 3,
      p: 2,
      borderRadius: 3,
      background: "linear-gradient(135deg, #f5613c, #f55f5f)",
      color: "#fff",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 1,
      cursor: "pointer",
      userSelect: "none",
      fontWeight: 700,
      boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
      transition: "all 0.25s ease",
      width: "90%",
      mx: "auto",
      fontSize: { xs: "0.9rem", sm: "1rem" },
      "&:hover": { transform: "translateY(-4px)", boxShadow: "0 10px 25px rgba(0,0,0,0.35)" },
      "&:active": { transform: "scale(0.97)", boxShadow: "0 4px 12px rgba(0,0,0,0.25)" }
    }}
  >
     <PointOfSaleIcon sx={{ fontSize: 20 }} />
    <Typography fontWeight={700} letterSpacing={0.5}>
      Confirmar Cierre
    </Typography>
  </Box>
  </DialogActions>
</Dialog>
    </>
  );
};