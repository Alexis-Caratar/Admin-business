import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  TextField,
  Stack
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ModalInventario } from "./ModalInventario";
import { apiObtenerInventario } from "../../../../../api/cajero";
import Swal from "sweetalert2";

type Props = {
  open: boolean;
  onClose: () => void;
  monto: string;
  setMonto: (v: string) => void;
  onAbrir: (payload: any) => Promise<any>;
  id_negocio: Number;
};

export const AperturaCajaModal: React.FC<Props> = ({
  open,
  onClose,
  monto,
  setMonto,
  onAbrir,
  id_negocio
}) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [productos, setProductos] = useState<any[]>([]);
  const [inventarioData, setInventarioData] = useState<any[]>([]);
  const [inventarioOk, setInventarioOk] = useState(false);

  useEffect(() => {
    if (step !== 1) return;

    const cargarInventario = async () => {
      try {

        const { data } = await apiObtenerInventario(id_negocio);
        setProductos(data?.result || []);
      } catch (err) {
        console.error("Error cargando inventario", err);
      } finally {

      }
    };

    cargarInventario();
  }, [step, id_negocio]);

  // 🔥 FINAL → enviar TODO junto
 const handleFinalizar = async () => {
  const confirm = await Swal.fire({
  title: "¿Abrir caja?",
  text: "Verifica el monto inicial y el inventario antes de continuar.",
  icon: "warning",
  showCancelButton: true,
  confirmButtonText: "Sí, abrir",
  cancelButtonText: "Cancelar",
  backdrop: true,
  allowOutsideClick: false,
  didOpen: () => {
    const swal = document.querySelector('.swal2-container') as HTMLElement;
    if (swal) swal.style.zIndex = '2000';
  }
});

  if (!confirm.isConfirmed) return;

  try {
    const payload = {
      monto_inicial: Number(monto),
      inventario: inventarioData
    };

    await onAbrir(payload);

    Swal.fire("Listo", "Caja abierta correctamente", "success");

    // reset
    setStep(0);
    setInventarioData([]);
    setProductos([]);

    onClose();

  } catch (err) {
    console.error(err);

    Swal.fire("Error", "No se pudo abrir la caja", "error");
  }
};

const hayErroresInventario = (data: any[]) => {
  return data.some((p) => {
    if (p.stockFisico === "" || p.stockFisico === null) return true;

    const diferencia = Number(p.stockFisico) - Number(p.stock_actual);

    if (diferencia !== 0) {
      return !p.observacion || p.observacion.trim().length < 3;
    }

    return false;
  });
};

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown
      onClose={(_e, reason) => {
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        onClose();
      }}
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* HEADER */}
      <DialogTitle sx={{ textAlign: "center", fontWeight: 700 }}>
        {step === 0 ? "Apertura de Caja" : "Inventario Inicial"}
      </DialogTitle>

      {/* STEPS VISUALES */}
      <Box sx={{ px: 3, pb: 1 }}>
        <Stack direction="row" justifyContent="space-between">
          {["Monto", "Inventario"].map((label, i) => (
            <Box key={i} textAlign="center" flex={1}>
              <Box
                sx={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  mx: "auto",
                  bgcolor: step === i ? "primary.main" : "#ddd",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12
                }}
              >
                {i + 1}
              </Box>
              <Typography fontSize={12}>{label}</Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      <DialogContent>

        {/* 🔹 STEP 0 */}
        {step === 0 && (
          <>
            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 2 }}
            >
              Ingrese el monto inicial
            </Typography>

            <TextField
              fullWidth
              label="Monto inicial"
              value={new Intl.NumberFormat("es-CO").format(Number(monto) || 0)}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setMonto(raw);
              }}
            />
          </>
        )}

        {/* 🔹 STEP 1 */}
        {step === 1 && (
          <>
              <ModalInventario
                productos={productos}
                tipo="APERTURA"
                onChangeData={(data) => {
                  setInventarioData(data);
                  const tieneErrores = hayErroresInventario(data);
                  setInventarioOk(!tieneErrores);
                }}
              />
          </>
        )}
      </DialogContent>

      {/* FOOTER */}
      <DialogActions sx={{ px: 3, pb: 2 }}>
        {step === 0 && (
          <>
            <Button onClick={() => navigate("/admin/home")}>
              Cancelar
            </Button>

            <Button
              variant="contained"
              onClick={() => setStep(1)}
              disabled={!monto}
            >
              Siguiente
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <Button onClick={() => setStep(0)}>
              Atrás
            </Button>

            <Button
              variant="contained"
              color="success"
              onClick={handleFinalizar}
              disabled={!inventarioOk}
            >
              Abrir Caja
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};