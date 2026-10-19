import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Box, Typography } from "@mui/material";
import { T } from "./tokens";
import type { Foto } from "./siteConfig";

/* Aparición suave al entrar en pantalla (se desactiva con movimiento reducido) */
export function Reveal({
  children,
  delay = 0,
}: {
  children: ReactNode;
  delay?: number;
}) {
  const reducido = useReducedMotion();

  if (reducido) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* Foto que llena a su contenedor; se oculta sola si no carga */
export function Imagen({
  foto,
  sizes,
  zoom = false,
}: {
  foto: Foto;
  sizes: string;
  zoom?: boolean;
}) {
  return (
    <Box
      component="img"
      src={foto.src}
      srcSet={foto.srcSet}
      sizes={sizes}
      alt={foto.alt}
      loading="lazy"
      decoding="async"
      onError={(e: { currentTarget: HTMLImageElement }) => {
        e.currentTarget.style.visibility = "hidden";
      }}
      sx={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transition: "transform .7s cubic-bezier(.22,1,.36,1)",
        ...(zoom ? { "&:hover": { transform: "scale(1.05)" } } : {}),
      }}
    />
  );
}

/* El "punto" verde: la firma visual de la marca */
export function Punto({ size = 10 }: { size?: number }) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-block",
        width: size,
        height: size,
        borderRadius: "50%",
        bgcolor: T.accent,
        flexShrink: 0,
      }}
    />
  );
}

/* Encabezado de sección: etiqueta pequeña + título grande */
export function Encabezado({
  etiqueta,
  titulo,
  children,
}: {
  etiqueta: string;
  titulo: string;
  children?: ReactNode;
}) {
  return (
    <Reveal>
      <Box sx={{ mb: { xs: 5, md: 7 }, maxWidth: 760 }}>
        <Typography
          component="p"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.2,
            fontFamily: T.body,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: T.muted,
            mb: 2,
          }}
        >
          <Punto size={8} />
          {etiqueta}
        </Typography>

        <Typography
          component="h2"
          sx={{
            fontFamily: T.display,
            fontWeight: 800,
            textTransform: "uppercase",
            lineHeight: 0.92,
            letterSpacing: "-0.01em",
            fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
            color: T.text,
          }}
        >
          {titulo}
        </Typography>

        {children && (
          <Typography
            sx={{
              mt: 2.5,
              fontFamily: T.body,
              fontSize: { xs: 16, md: 18 },
              lineHeight: 1.7,
              color: T.muted,
            }}
          >
            {children}
          </Typography>
        )}
      </Box>
    </Reveal>
  );
}
