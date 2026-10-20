/*
 * Galería de producto: imagen principal (object-fit: contain sobre fondo
 * limpio), miniaturas, deslizamiento táctil, flechas, teclado y zoom.
 * No escala artificialmente: muestra la imagen original en su resolución.
 */
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box, Dialog, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import CloseIcon from "@mui/icons-material/Close";
import ImageNotSupportedOutlinedIcon from "@mui/icons-material/ImageNotSupportedOutlined";
import { T } from "../landing/tokens";

export default function Galeria({ imagenes, nombre, inicial }: { imagenes: string[]; nombre: string; inicial: string }) {
  const reducido = useReducedMotion();
  const [i, setI] = useState(0);
  const [dir, setDir] = useState(1);
  const [cargadas, setCargadas] = useState<Set<string>>(new Set());
  const [fallidas, setFallidas] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(false);
  const total = imagenes.length;
  const actual = imagenes[i];

  const ir = useCallback((n: number) => {
    if (!total) return;
    setDir(n > i || (i === total - 1 && n === 0) ? 1 : -1);
    setI(((n % total) + total) % total);
  }, [i, total]);

  // Flechas del teclado mientras la galería tiene el foco o el zoom está abierto
  const teclas = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); ir(i + 1); }
    if (e.key === "ArrowLeft") { e.preventDefault(); ir(i - 1); }
  };

  if (!total) {
    return (
      <Box sx={{ aspectRatio: "1 / 1", borderRadius: 5, display: "grid", placeItems: "center", background: `linear-gradient(135deg, ${T.surface2}, color-mix(in srgb, ${T.accent} 14%, transparent))` }}>
        <Typography aria-hidden sx={{ fontFamily: T.display, fontWeight: 600, fontSize: 120, opacity: 0.2 }}>{inicial}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box
        tabIndex={0}
        role="region"
        aria-roledescription="galería"
        aria-label={`Fotos de ${nombre}, ${i + 1} de ${total}`}
        onKeyDown={teclas}
        sx={{ position: "relative", aspectRatio: "1 / 1", borderRadius: 5, overflow: "hidden", bgcolor: "#ffffff", border: `1px solid ${T.line}`, cursor: "zoom-in",
          "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 3 }, "&:hover .pu-flechas": { opacity: 1 } }}
      >
        {!cargadas.has(actual) && !fallidas.has(actual) && <Skeleton variant="rectangular" sx={{ position: "absolute", inset: 0, height: "100%", bgcolor: "#f1f1f1" }} />}
        <AnimatePresence initial={false} custom={dir} mode="popLayout">
          <motion.div
            key={actual}
            custom={dir}
            initial={reducido ? false : { x: dir * 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={reducido ? undefined : { x: dir * -60, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            drag={total > 1 && !reducido ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => { if (info.offset.x < -60) ir(i + 1); else if (info.offset.x > 60) ir(i - 1); }}
            onClick={() => setZoom(true)}
            style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", touchAction: "pan-y" }}
          >
            {fallidas.has(actual) ? (
              <Stack alignItems="center" spacing={1} sx={{ color: "#9ca3af" }}>
                <ImageNotSupportedOutlinedIcon sx={{ fontSize: 48 }} />
                <Typography sx={{ fontSize: 13 }}>No se pudo cargar la imagen</Typography>
              </Stack>
            ) : (
              <img
                src={actual}
                alt={`${nombre}, foto ${i + 1} de ${total}`}
                width={1000}
                height={1000}
                draggable={false}
                loading={i === 0 ? "eager" : "lazy"}
                decoding="async"
                {...(i === 0 ? { fetchPriority: "high" } : {})}
                onLoad={() => setCargadas((s) => new Set(s).add(actual))}
                onError={() => setFallidas((s) => new Set(s).add(actual))}
                style={{ width: "100%", height: "100%", objectFit: "contain", padding: "6%", boxSizing: "border-box", userSelect: "none" }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {total > 1 && (
          <>
            {[-1, 1].map((d) => (
              <IconButton key={d} className="pu-flechas" onClick={(e) => { e.stopPropagation(); ir(i + d); }} aria-label={d < 0 ? "Foto anterior" : "Foto siguiente"}
                sx={{ position: "absolute", top: "50%", [d < 0 ? "left" : "right"]: 12, transform: "translateY(-50%)", opacity: { xs: 1, md: 0 }, transition: "opacity .2s ease",
                  bgcolor: "rgba(255,255,255,.92)", color: "#111", boxShadow: "0 4px 14px rgba(0,0,0,.15)", "&:hover": { bgcolor: "#fff" } }}>
                {d < 0 ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </IconButton>
            ))}
            <Stack direction="row" spacing={0.6} sx={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", display: { xs: "flex", md: "none" } }}>
              {imagenes.map((_, k) => (
                <Box key={k} sx={{ width: k === i ? 18 : 7, height: 7, borderRadius: 999, bgcolor: k === i ? "#111" : "rgba(0,0,0,.25)", transition: "all .25s ease" }} />
              ))}
            </Stack>
          </>
        )}
        <Box sx={{ position: "absolute", top: 12, right: 12, width: 36, height: 36, borderRadius: "50%", display: "grid", placeItems: "center", bgcolor: "rgba(255,255,255,.92)", color: "#111", pointerEvents: "none" }}>
          <ZoomInIcon fontSize="small" />
        </Box>
      </Box>

      {/* Miniaturas */}
      {total > 1 && (
        <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: "auto", pb: 0.5, scrollbarWidth: "thin" }}>
          {imagenes.map((src, k) => (
            <Box key={src + k} component="button" type="button" onClick={() => ir(k)} aria-label={`Ver foto ${k + 1}`} aria-current={k === i}
              sx={{ flexShrink: 0, width: { xs: 64, md: 76 }, height: { xs: 64, md: 76 }, p: 0.5, borderRadius: 3, cursor: "pointer", bgcolor: "#fff",
                border: `2px solid ${k === i ? T.accent : T.line}`, opacity: k === i ? 1 : 0.7, transition: "all .2s ease", "&:hover": { opacity: 1 },
                "&:focus-visible": { outline: `2px solid ${T.accent}`, outlineOffset: 2 } }}>
              <img src={src} alt="" loading="lazy" decoding="async" width={76} height={76} style={{ width: "100%", height: "100%", objectFit: "contain" }}
                onError={(e) => { e.currentTarget.style.visibility = "hidden"; }} />
            </Box>
          ))}
        </Stack>
      )}

      <Zoom abierto={zoom} onCerrar={() => setZoom(false)} imagenes={imagenes} indice={i} onIndice={ir} nombre={nombre} />
    </Box>
  );
}

/* Vista ampliada: clic para acercar y mover el cursor para recorrer la foto */
function Zoom({ abierto, onCerrar, imagenes, indice, onIndice, nombre }: {
  abierto: boolean; onCerrar: () => void; imagenes: string[]; indice: number; onIndice: (n: number) => void; nombre: string;
}) {
  const [acercado, setAcercado] = useState(false);
  const [origen, setOrigen] = useState("50% 50%");
  useEffect(() => {
    if (!abierto) return;
    const f = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") onIndice(indice + 1);
      if (e.key === "ArrowLeft") onIndice(indice - 1);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [abierto, indice, onIndice]);

  return (
    <Dialog open={abierto} onClose={() => { setAcercado(false); onCerrar(); }} fullScreen PaperProps={{ sx: { bgcolor: "#ffffff", color: "#111" } }}>
      <IconButton onClick={() => { setAcercado(false); onCerrar(); }} aria-label="Cerrar" sx={{ position: "absolute", top: 16, right: 16, zIndex: 2, bgcolor: "#f3f4f6", "&:hover": { bgcolor: "#e5e7eb" } }}><CloseIcon /></IconButton>
      <Box
        onClick={() => setAcercado((v) => !v)}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setOrigen(`${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`);
        }}
        sx={{ flex: 1, overflow: "hidden", display: "grid", placeItems: "center", cursor: acercado ? "zoom-out" : "zoom-in" }}
      >
        <img src={imagenes[indice]} alt={`${nombre}, foto ${indice + 1} ampliada`}
          style={{ maxWidth: "92vw", maxHeight: "86vh", objectFit: "contain", transformOrigin: origen, transform: acercado ? "scale(2.2)" : "scale(1)", transition: "transform .3s ease" }} />
      </Box>
      {imagenes.length > 1 && (
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ pb: 3 }}>
          <IconButton onClick={() => { setAcercado(false); onIndice(indice - 1); }} aria-label="Foto anterior" sx={{ bgcolor: "#f3f4f6" }}><ChevronLeftIcon /></IconButton>
          <Typography sx={{ fontWeight: 700 }}>{indice + 1} / {imagenes.length}</Typography>
          <IconButton onClick={() => { setAcercado(false); onIndice(indice + 1); }} aria-label="Foto siguiente" sx={{ bgcolor: "#f3f4f6" }}><ChevronRightIcon /></IconButton>
        </Stack>
      )}
    </Dialog>
  );
}
