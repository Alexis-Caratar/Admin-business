

/* ---------- /src/components/modales/CierreCaja.tsx ---------- */
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography } from "@mui/material";


type Props = {
open: boolean;
onClose: () => void;
totalVentas: number;
dineroTotal: number;
onCerrar: () => void;
};


export const CierreCajaModal: React.FC<Props> = ({ open, onClose, totalVentas, dineroTotal, onCerrar }) => {
return (
<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
<DialogTitle>Cerrar Caja</DialogTitle>
<DialogContent>
<Stack spacing={1}>
<Typography>Total ventas: {totalVentas}</Typography>
<Typography>Dinero total: ${dineroTotal.toLocaleString()}</Typography>
</Stack>
</DialogContent>
<DialogActions sx={{ px: 3, pb: 2 }}>
<Button onClick={onClose}>Cancelar</Button>
<Button color="error" variant="contained" onClick={onCerrar}>Cerrar Caja</Button>
</DialogActions>
</Dialog>
);
};