

/* ---------- /src/components/modales/AperturaCaja.tsx ---------- */
import React from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";


type Props = {
open: boolean;
onClose: () => void;
monto: string;
setMonto: (v: string) => void;
onAbrir: () => void;
};


export const AperturaCajaModal: React.FC<Props> = ({ open, onClose, monto, setMonto, onAbrir }) => {
return (
<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
<DialogTitle>Abrir Caja</DialogTitle>
<DialogContent>
<TextField fullWidth label="Monto inicial" type="number" sx={{ mt: 1 }} value={monto} onChange={(e) => setMonto(e.target.value)} />
</DialogContent>
<DialogActions sx={{ px: 3, pb: 2 }}>
<Button onClick={onClose}>Cancelar</Button>
<Button variant="contained" onClick={onAbrir}>Abrir</Button>
</DialogActions>
</Dialog>
);
};