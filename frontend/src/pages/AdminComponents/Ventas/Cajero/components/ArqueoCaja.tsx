/* ---------- /src/components/modales/ArqueoCaja.tsx ---------- */
import React from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Box, CircularProgress } from "@mui/material";


type Props = {
open: boolean;
onClose: () => void;
arqueoInfo: any | null;
};


export const ArqueoCajaModal: React.FC<Props> = ({ open, onClose, arqueoInfo }) => {
return (
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
<DialogTitle>Arqueo de Caja</DialogTitle>
<DialogContent>
{arqueoInfo ? (
<Stack spacing={1}>
<Typography>Monto inicial: ${Number(arqueoInfo.monto_inicial).toLocaleString()}</Typography>
<Typography>Ventas totales: ${Number(arqueoInfo.total_ventas).toLocaleString()}</Typography>
<Typography>
Total en caja: ${(Number(arqueoInfo.monto_inicial) + Number(arqueoInfo.total_ventas)).toLocaleString()}
</Typography>
</Stack>
) : (
<Box display="flex" justifyContent="center" py={4}>
<CircularProgress />
</Box>
)}
</DialogContent>
<DialogActions>
<Button onClick={onClose}>Cerrar</Button>
</DialogActions>
</Dialog>
);
};