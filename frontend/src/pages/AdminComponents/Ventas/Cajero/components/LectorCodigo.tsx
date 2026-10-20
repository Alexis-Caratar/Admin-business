/*
 * Barra "Escanear código" de la caja (minimarket, tiendas, droguerías…).
 * - Lector USB/Bluetooth: escanea y el producto entra al carrito.
 * - Escribir el código a mano + Enter, o "3*código" para varias unidades.
 * - Celular/tablet: botón de cámara (si el navegador lo permite).
 * Productos con opciones obligatorias abren su categoría para elegir.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Dialog, DialogContent, DialogTitle, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography } from "@mui/material";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import toastr from "toastr";
import type { CategoriaCajero, ProductoCajero } from "../../../../../types/cajero";
import { buscarPorCodigo, leerEntrada, useLectorGlobal } from "./codigoBarras";

type Resultado = { ok: boolean; texto: string; cuando: number };

// BarcodeDetector todavía no está en los tipos de TypeScript
type Detector = { detect: (v: HTMLVideoElement) => Promise<{ rawValue: string }[]> };
type ConstructorDetector = new (o: { formats: string[] }) => Detector;
const DetectorNativo = (globalThis as unknown as { BarcodeDetector?: ConstructorDetector }).BarcodeDetector;

const formatCOP = (n: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);

export default function LectorCodigo({ categorias, onAgregar, onConOpciones }: {
  categorias: CategoriaCajero[];
  onAgregar: (p: ProductoCajero, cantidad: number) => void;
  onConOpciones: (c: CategoriaCajero) => void;
}) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [camara, setCamara] = useState(false);
  const campo = useRef<HTMLInputElement | null>(null);

  const procesar = useCallback((entrada: string) => {
    const { cantidad, codigo } = leerEntrada(entrada);
    if (!codigo) return;
    const r = buscarPorCodigo(categorias, codigo);
    if (!r) {
      setResultado({ ok: false, texto: `Código ${codigo} no encontrado (no existe o está fuera de su horario de venta)`, cuando: Date.now() });
      toastr.error(`Código ${codigo} no encontrado`);
      return;
    }
    const { producto, categoria } = r;
    if (producto.productos_complementos?.some((c) => (c as unknown as { obligatorio?: boolean }).obligatorio)) {
      setResultado({ ok: true, texto: `${producto.nombre}: elige sus opciones`, cuando: Date.now() });
      onConOpciones(categoria);
      return;
    }
    // Misma forma que cuando se toca la tarjeta del producto
    const plato = {
      id: producto.id, codigo_barra: producto.codigo_barra, nombre: producto.nombre, imagen: producto.imagen_plato ?? null,
      precio_venta: producto.precio_venta, stock_actual: producto.stock_actual, cantidad: 1, tipo: "plato",
    } as unknown as ProductoCajero;
    onAgregar(plato, cantidad);
    setResultado({ ok: true, texto: `${cantidad > 1 ? `${cantidad} × ` : ""}${producto.nombre} · ${formatCOP(Number(producto.precio_venta) * cantidad)}`, cuando: Date.now() });
  }, [categorias, onAgregar, onConOpciones]);

  // El lector también funciona sin tener el cursor en la barra
  useLectorGlobal(procesar, !camara);

  const enviar = () => { procesar(texto); setTexto(""); };

  return (
    <Box sx={{ mb: 1.5, p: 1.25, borderRadius: "14px", bgcolor: "#FFFFFF", border: "1px solid #E2E8F0", display: "flex", gap: 1.25, alignItems: "center", flexWrap: { xs: "wrap", md: "nowrap" } }}>
      <TextField
        inputRef={campo}
        size="small"
        fullWidth
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); enviar(); } }}
        placeholder="Escanea o escribe el código de barras y presiona Enter  ·  3*código = 3 unidades"
        autoComplete="off"
        inputProps={{ "aria-label": "Código de barras", inputMode: "numeric" }}
        InputProps={{
          startAdornment: <InputAdornment position="start"><QrCodeScannerIcon sx={{ color: "#2563EB" }} /></InputAdornment>,
          endAdornment: DetectorNativo ? (
            <InputAdornment position="end">
              <Tooltip title="Escanear con la cámara">
                <IconButton size="small" onClick={() => setCamara(true)} aria-label="Escanear con la cámara"><PhotoCameraIcon fontSize="small" /></IconButton>
              </Tooltip>
            </InputAdornment>
          ) : undefined,
        }}
        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#F8FAFC", "& fieldset": { borderColor: "#E2E8F0" }, "&.Mui-focused fieldset": { borderColor: "#2563EB" } } }}
      />
      {resultado && (
        <Stack key={resultado.cuando} direction="row" spacing={0.75} alignItems="center"
          sx={{ flexShrink: 0, maxWidth: { md: 420 }, color: resultado.ok ? "#15803D" : "#B91C1C", animation: "puLector .35s ease" ,
            "@keyframes puLector": { from: { opacity: 0, transform: "translateY(4px)" }, to: { opacity: 1, transform: "none" } } }}>
          {resultado.ok ? <CheckCircleIcon fontSize="small" /> : <ErrorOutlineIcon fontSize="small" />}
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 600 }}>{resultado.texto}</Typography>
        </Stack>
      )}
      {camara && DetectorNativo && (
        <EscanerCamara onCerrar={() => { setCamara(false); campo.current?.focus(); }} onCodigo={(c) => { procesar(c); }} />
      )}
    </Box>
  );
}

/* Cámara del celular/tablet con BarcodeDetector (Chrome Android, Edge, Safari reciente) */
function EscanerCamara({ onCerrar, onCodigo }: { onCerrar: () => void; onCodigo: (c: string) => void }) {
  const video = useRef<HTMLVideoElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ultimo = useRef<{ c: string; t: number }>({ c: "", t: 0 });

  useEffect(() => {
    let flujo: MediaStream | null = null;
    let vivo = true;
    let temporizador = 0;
    const detector = new DetectorNativo!({ formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "itf", "qr_code"] });
    (async () => {
      try {
        flujo = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        if (!vivo || !video.current) return;
        video.current.srcObject = flujo;
        await video.current.play();
        const buscar = async () => {
          if (!vivo || !video.current) return;
          try {
            const [r] = await detector.detect(video.current);
            // El mismo código no se vuelve a sumar antes de 1,5 s
            if (r?.rawValue && (r.rawValue !== ultimo.current.c || Date.now() - ultimo.current.t > 1500)) {
              ultimo.current = { c: r.rawValue, t: Date.now() };
              navigator.vibrate?.(60);
              onCodigo(r.rawValue);
            }
          } catch { /* cuadro sin código */ }
          temporizador = window.setTimeout(buscar, 250);
        };
        buscar();
      } catch {
        setError("No se pudo abrir la cámara. Revisa el permiso del navegador (requiere HTTPS o localhost).");
      }
    })();
    return () => { vivo = false; window.clearTimeout(temporizador); flujo?.getTracks().forEach((t) => t.stop()); };
  }, [onCodigo]);

  return (
    <Dialog open onClose={onCerrar} fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontWeight: 700 }}>
        Escanear con la cámara
        <IconButton onClick={onCerrar} aria-label="Cerrar"><CloseIcon /></IconButton>
      </DialogTitle>
      <DialogContent>
        {error ? <Typography color="error">{error}</Typography> : (
          <Box sx={{ position: "relative", borderRadius: 3, overflow: "hidden", bgcolor: "#000", aspectRatio: "3 / 4" }}>
            <video ref={video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            <Box sx={{ position: "absolute", left: "10%", right: "10%", top: "42%", height: "16%", border: "2px solid rgba(255,255,255,.9)", borderRadius: 2, boxShadow: "0 0 0 9999px rgba(0,0,0,.35)" }} />
          </Box>
        )}
        <Typography fontSize={13} color="text.secondary" sx={{ mt: 1.5 }}>Apunta al código de barras. Cada lectura suma una unidad al carrito.</Typography>
        <Button fullWidth variant="contained" onClick={onCerrar} sx={{ mt: 2, textTransform: "none", fontWeight: 700, borderRadius: 2 }}>Listo</Button>
      </DialogContent>
    </Dialog>
  );
}
