/*
 * Vista del ticket para imprimir desde el navegador (impresora del sistema,
 * Bluetooth en Android, PDF) o compartirlo (WhatsApp, correo…). Se ve igual
 * que el papel térmico: letra monoespaciada al ancho configurado del negocio.
 */
import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack } from "@mui/material";
import PrintIcon from "@mui/icons-material/Print";
import ShareIcon from "@mui/icons-material/Share";
import CloseIcon from "@mui/icons-material/Close";
import QRCode from "qrcode";
import { registrarVisor } from "./ticket";
import type { DocumentoTicket, LineaTicket } from "./ticket";

function Qr({ texto }: { texto: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let vivo = true;
    QRCode.toDataURL(texto, { margin: 0, width: 220 }).then((u) => { if (vivo) setSrc(u); }, () => {});
    return () => { vivo = false; };
  }, [texto]);
  return src ? <img src={src} alt="Código QR" style={{ width: 132, height: 132, display: "block", margin: "6px auto" }} /> : null;
}

const comoTexto = (doc: DocumentoTicket) => doc.lineas.map((l: LineaTicket) => {
  if (l.t === "sep") return "-".repeat(doc.ancho);
  if (l.t === "vacio" || l.t === "qr") return l.t === "qr" ? l.v : "";
  if (l.t === "cols") return l.i + " ".repeat(Math.max(1, doc.ancho - l.i.length - l.d.length)) + l.d;
  return l.v;
}).join("\n");

export default function VisorTicket() {
  const [doc, setDoc] = useState<DocumentoTicket | null>(null);
  useEffect(() => { registrarVisor(setDoc); return () => registrarVisor(null); }, []);
  if (!doc) return null;

  const compartir = async () => {
    const texto = comoTexto(doc);
    try {
      if (navigator.share) await navigator.share({ title: "Comprobante", text: texto });
      else await navigator.clipboard.writeText(texto);
    } catch { /* cancelado */ }
  };

  return (
    <Dialog open onClose={() => setDoc(null)} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        Comprobante
        <IconButton onClick={() => setDoc(null)} aria-label="Cerrar"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: "#F1F5F9", py: 3 }}>
        {/* Solo esto sale en la impresión */}
        <Box id="pu-ticket" sx={{
          mx: "auto", bgcolor: "#fff", color: "#000", p: 1.5, boxShadow: "0 6px 24px rgba(15,23,42,.12)",
          width: `${doc.ancho + 2}ch`, maxWidth: "100%", fontFamily: '"Courier New", ui-monospace, monospace', fontSize: 12.5, lineHeight: 1.35,
        }}>
          {doc.lineas.map((l, k) => {
            if (l.t === "sep") return <Box key={k} sx={{ borderTop: "1px dashed #000", my: 0.6 }} />;
            if (l.t === "vacio") return <Box key={k} sx={{ height: "1em" }} />;
            if (l.t === "qr") return <Qr key={k} texto={l.v} />;
            if (l.t === "cols") return (
              <Box key={k} sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontWeight: l.b ? 700 : 400, whiteSpace: "pre" }}>
                <span>{l.i}</span><span>{l.d}</span>
              </Box>
            );
            return (
              <Box key={k} sx={{ textAlign: l.a === "c" ? "center" : l.a === "d" ? "right" : "left", fontWeight: l.b ? 700 : 400,
                fontSize: l.g ? "1.35em" : undefined, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{l.v}</Box>
            );
          })}
        </Box>
        {/* Al imprimir, solo el ticket y al ancho del papel */}
        <style>{`@media print {
          body * { visibility: hidden !important; }
          #pu-ticket, #pu-ticket * { visibility: visible !important; }
          #pu-ticket { position: fixed; left: 0; top: 0; box-shadow: none !important; width: 100% !important; }
          @page { margin: 4mm; }
        }`}</style>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Stack direction="row" spacing={1} sx={{ width: "100%" }}>
          <Button fullWidth variant="outlined" startIcon={<ShareIcon />} onClick={compartir} sx={{ textTransform: "none", fontWeight: 600, borderRadius: 2 }}>Compartir</Button>
          <Button fullWidth variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}>Imprimir</Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
