import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  IconButton,
  Stack,
  TextField,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CloseIcon from "@mui/icons-material/Close";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useEffect, useMemo, useState } from "react";
import Collapse from "@mui/material/Collapse";
import {
  egresosListar,
  egresoCrear,
  egresoActualizar,
  egresoEliminar
} from "../../../../../../api/cajero";

type Props = {
  idUsuario: void;
  id_negocio: number;
  id_caja: number;
  open: boolean;
  onClose: () => void;
};

export default function Egresos({ idUsuario,id_negocio, id_caja, open, onClose }: Props) {
  const [descripcion, setDescripcion] = useState("");
  const [metodo_pago, setMetodoPago] = useState("EFECTIVO");
  const [monto, setMonto] = useState<number | "">("");
  const [observacion, setObservacion] = useState("");
  const [egresos, setEgresos] = useState<any[]>([]);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  // Estados para dialogo de confirmación
  const [openConfirm, setOpenConfirm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  console.log("id_usuario",idUsuario);
  
  useEffect(() => {
    if (!open) return;
    cargarEgresos();
  }, [open, id_negocio, id_caja]);

  const cargarEgresos = async () => {
    const data = await egresosListar(id_negocio, id_caja);
    setEgresos(data);
  };

  const total = useMemo(() => {
    return egresos.reduce((acc, e) => acc + Number(e.monto), 0);
  }, [egresos]);

  const limpiar = () => {
    setDescripcion("");
    setMetodoPago("EFECTIVO");
    setMonto("");
    setObservacion("");
    setEditId(null);
  };

  const formatCOP = (value: number | "") => {
    if (!value) return "";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
    }).format(Number(value));
  };

  const handleGuardar = async () => {
    if (!descripcion || !monto) return;

    const payload = {idUsuario, id_negocio, id_caja, descripcion, metodo_pago, monto, observacion };
    if (editId) await egresoActualizar(editId, payload);
    else await egresoCrear(payload);

    await cargarEgresos();
    limpiar();
    setShowForm(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    await egresoEliminar(deleteId);
    await cargarEgresos();
    setOpenConfirm(false);
  };



  return (
    <>
      {/* MODAL PRINCIPAL */}
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="lg" PaperProps={{ sx: { borderRadius: 4 } }}>
        <DialogContent sx={{ p: 4 }}>


          {/* HEADER */}
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
            sx={{
              pb: 2,
              borderBottom: "1px solid #f1f5f9"
            }}
          >

            {/* TITULO */}
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  bgcolor: "#fee2e2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <PaymentsOutlinedIcon sx={{ color: "#dc2626" }} />
              </Box>

              <Box>
                <Typography fontWeight={700} fontSize={18}>
                  Egresos de Caja
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Registro y control de salidas de dinero
                </Typography>
              </Box>
            </Stack>

            {/* BOTON */}
            <Button
              variant="contained"
              startIcon={showForm ? <CloseIcon /> : <AddCircleOutlineIcon />}
              sx={{
                borderRadius: 3,
                textTransform: "none",
                fontWeight: 600,
                px: 3
              }}
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "" : "Ingresar egreso"}
            </Button>

          </Stack>


          <Collapse in={showForm} timeout={300} unmountOnExit>
            <Card
              elevation={0}
              sx={{
                mb: 4,
                borderRadius: 3,
                border: "1px solid #f0f0f0",
                transition: "all .25s ease"
              }}
            >
              <CardContent>
                <Stack spacing={3}>


                  {/* FORMULARIO */}
                  <Card elevation={0} sx={{ mb: 4, borderRadius: 3, border: "1px solid #f0f0f0" }}>
                    <CardContent>
                      <Stack spacing={3}>
                        <TextField
                          label="CONCEPTO DE EGRESO"
                          value={descripcion}
                          onChange={(e) => setDescripcion(e.target.value)}
                          fullWidth size="small"
                        />

                        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
                          <TextField
                            select
                            fullWidth
                            label="Método de Pago"
                            size="small"
                            value={metodo_pago}
                            onChange={(e) => setMetodoPago(e.target.value)}
                          >
                            <MenuItem value="EFECTIVO">💵 Efectivo</MenuItem>
                            <MenuItem value="TRANSFERENCIA">🏦 Transferencia</MenuItem>
                            <MenuItem value="TARJETA">💳 Tarjeta</MenuItem>
                            <MenuItem value="NEQUI">📱 Nequi</MenuItem>
                            <MenuItem value="DAVIPLATA">🏦 DaviPlata</MenuItem>
                          </TextField>

                          <TextField
                            label="Monto"
                            value={monto === "" ? "" : formatCOP(monto)}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              setMonto(raw === "" ? "" : Number(raw));
                            }}
                            fullWidth
                            size="small"
                          />
                        </Stack>

                        <TextField
                          label="Observación"
                          value={observacion}
                          onChange={(e) => setObservacion(e.target.value)}
                          fullWidth size="small" multiline rows={2}
                        />

                        <Box textAlign="right">
                          <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            sx={{ borderRadius: 3, px: 4, textTransform: "none", fontWeight: 600 }}
                            onClick={handleGuardar}
                          >
                            {editId ? "Actualizar" : "Registrar Egreso"}
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              </CardContent>
            </Card>
          </Collapse>

          {/* LISTADO DE EGRESOS ESTILO COMANDA */}
          <Box
            sx={{
              borderRadius: 3,
              border: "1px solid #e5e7eb",
              overflow: "hidden",
              bgcolor: "#fff"
            }}
          >
            {egresos.length === 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  No hay egresos registrados
                </Typography>
              </Box>
            )}

            {egresos.map((e, index) => (
              <Box
                key={e.id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  px: 2,
                  py: 1.4,
                  borderBottom:
                    index !== egresos.length - 1 ? "1px dashed #e5e7eb" : "none",
                  transition: "all .2s",
                  "&:hover": {
                    bgcolor: "#f9fafb"
                  }
                }}
              >
                {/* INFO IZQUIERDA */}
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip
                      label={e.numero_egreso}
                      size="small"
                      sx={{
                        fontSize: 11,
                        fontWeight: 700,
                        height: 20,
                        bgcolor: "#111827",
                        color: "#fff"
                      }}
                    />

                    <Typography fontSize={14} fontWeight={600}>
                      {e.descripcion}
                    </Typography>
                  </Stack>

                  <Typography variant="caption" color="text.secondary">
                    {e.metodo_pago}
                    {e.observacion && ` • ${e.observacion}`}
                  </Typography>
                </Box>

                {/* DERECHA */}
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography
                    fontWeight={700}
                    color="error.main"
                    fontSize={15}
                  >
                    -{formatCOP(e.monto)}
                  </Typography>

                  <Divider orientation="vertical" flexItem />

                  <IconButton
                    size="small"
                    onClick={() => {
                      setEditId(e.id);
                      setDescripcion(e.descripcion);
                      setMetodoPago(e.metodo_pago);
                      setMonto(e.monto);
                      setObservacion(e.observacion);

                      // Abrir el formulario automáticamente
                      setShowForm(true);
                    }}
                  >
                    <EditOutlinedIcon sx={{ fontSize: 18 }} />
                  </IconButton>

                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => {
                      setDeleteId(e.id);
                      setOpenConfirm(true);
                    }}
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              </Box>
            ))}
          </Box>

          {/* FOOTER TOTAL EGRESOS */}
          <Box
            sx={{
              mt: 2,
              borderTop: "2px solid #e5e7eb",
              pt: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              bgcolor: "#ee7676",
              color: "white",
              px: 2,
              py: 1.5,
              borderRadius: 2
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <PaymentsOutlinedIcon sx={{ color: "#ffffff", fontSize: 20 }} />
              <Typography fontWeight={600}>
                Total egresos registrados
              </Typography>
            </Stack>

            <Typography
              fontWeight={700}
              fontSize={20}
              color="white"
            >
              {formatCOP(total)}
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>

      {/* DIALOG CONFIRMACIÓN DE ELIMINAR */}
      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 3,
            minWidth: 360,
            maxWidth: 400,
            textAlign: "center",
            boxShadow: "0 8px 20px rgba(0,0,0,0.12)"
          }
        }}
      >
        <Box display="flex" flexDirection="column" alignItems="center" mb={2}>
          <Box
            sx={{
              bgcolor: "error.main",
              color: "white",
              borderRadius: "50%",
              width: 60,
              height: 60,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              fontSize: 32
            }}
          >
            ⚠️
          </Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Eliminar Egreso
          </Typography>
          <Typography variant="body2" color="text.secondary">
            ¿Está seguro de eliminar este egreso? <br />
            Esta acción no se puede deshacer.
          </Typography>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={2} mt={4}>
          <Button
            variant="outlined"
            onClick={() => setOpenConfirm(false)}
            sx={{ borderRadius: 3, px: 4, textTransform: "none" }}
          >
            Cancelar
          </Button>

          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmDelete}
            sx={{ borderRadius: 3, px: 4, textTransform: "none" }}
          >
            Eliminar
          </Button>
        </Stack>
      </Dialog>
    </>
  );
}