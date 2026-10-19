import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Box, Button, Container, Skeleton, Typography } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { T, btnPrimario } from "./tokens";
import { SITE, waLink } from "./siteConfig";
import { Encabezado } from "./Comunes";
import { useMenu } from "./useMenu";
import type { Categoria, Opcion, Plato } from "./useMenu";

const pesos = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

function listaOpciones(opciones: Opcion[]): string {
  return opciones
    .map((o) => (o.extra > 0 ? `${o.nombre} (+${pesos.format(o.extra)})` : o.nombre))
    .join(" · ");
}

function FilaPlato({ plato }: { plato: Plato }) {
  const conFoto = SITE.mostrarFotosDeProductos && plato.imagen;

  return (
    <Box
      component="li"
      sx={{
        display: "grid",
        gridTemplateColumns: conFoto ? "72px 1fr" : "1fr",
        gap: 2,
        py: 2.5,
        borderBottom: `1px solid ${T.line}`,
        opacity: plato.agotado ? 0.55 : 1,
        "&:hover .pu-pedir": { opacity: 1 },
      }}
    >
      {conFoto && (
        <Box
          component="img"
          src={plato.imagen}
          alt={plato.nombre}
          loading="lazy"
          width={72}
          height={72}
          sx={{ borderRadius: 2, objectFit: "cover", bgcolor: T.surface2 }}
        />
      )}

      <Box sx={{ minWidth: 0 }}>
        {/* Nombre ······ precio */}
        <Box sx={{ display: "flex", alignItems: "baseline", gap: 1.5 }}>
          <Typography
            component="h4"
            sx={{
              fontFamily: T.body,
              fontWeight: 700,
              fontSize: { xs: 16, md: 17 },
              color: T.text,
            }}
          >
            {plato.nombre}
          </Typography>

          <Box
            aria-hidden
            sx={{
              flex: 1,
              minWidth: 16,
              borderBottom: `1px dotted ${T.soft}`,
              transform: "translateY(-4px)",
            }}
          />

          {plato.agotado ? (
            <Typography
              sx={{
                fontFamily: T.body,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: T.muted,
              }}
            >
              Agotado
            </Typography>
          ) : (
            plato.precio !== null && (
              <Typography
                sx={{
                  fontFamily: T.display,
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: 1,
                  color: T.accent,
                  whiteSpace: "nowrap",
                }}
              >
                {pesos.format(plato.precio)}
              </Typography>
            )
          )}
        </Box>

        {plato.aElegir.length > 0 && (
          <Typography
            sx={{ mt: 0.8, fontFamily: T.body, fontSize: 13.5, color: T.muted }}
          >
            <Box component="span" sx={{ color: T.text2, fontWeight: 600 }}>
              Incluye a elegir:
            </Box>{" "}
            {listaOpciones(plato.aElegir)}
          </Typography>
        )}

        {plato.adiciones.length > 0 && (
          <Typography
            sx={{ mt: 0.5, fontFamily: T.body, fontSize: 13.5, color: T.muted }}
          >
            <Box component="span" sx={{ color: T.text2, fontWeight: 600 }}>
              Adiciones:
            </Box>{" "}
            {listaOpciones(plato.adiciones)}
          </Typography>
        )}

        {!plato.agotado && (
          <Box
            className="pu-pedir"
            component="a"
            href={waLink(`Hola Punto Urbano, quiero pedir: ${plato.nombre}.`)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Pedir ${plato.nombre} por WhatsApp`}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.6,
              mt: 1.2,
              py: 0.5,
              fontFamily: T.body,
              fontSize: 13,
              fontWeight: 700,
              color: T.accent,
              textDecoration: "none",
              opacity: { xs: 1, md: 0.55 },
              transition: "opacity .2s ease",
              "&:hover, &:focus-visible": {
                opacity: 1,
                textDecoration: "underline",
              },
            }}
          >
            <WhatsAppIcon sx={{ fontSize: 16 }} />
            Pedir este plato
          </Box>
        )}
      </Box>
    </Box>
  );
}

function BloqueCategoria({ categoria }: { categoria: Categoria }) {
  return (
    <Box sx={{ breakInside: "avoid", mb: 6 }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 2,
          pb: 1.5,
          borderBottom: `2px solid ${T.text}`,
        }}
      >
        <Typography
          component="h3"
          sx={{
            fontFamily: T.display,
            fontWeight: 800,
            fontSize: { xs: 34, md: 42 },
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {categoria.nombre}
        </Typography>

        <Typography sx={{ fontFamily: T.body, fontSize: 13, color: T.muted }}>
          {categoria.platos.length}{" "}
          {categoria.platos.length === 1 ? "plato" : "platos"}
        </Typography>
      </Box>

      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0 }}>
        {categoria.platos.map((p) => (
          <FilaPlato key={p.id} plato={p} />
        ))}
      </Box>
    </Box>
  );
}

function Filtro({
  activo,
  onClick,
  children,
}: {
  activo: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-pressed={activo}
      sx={{
        flexShrink: 0,
        px: 2.2,
        minHeight: 44,
        borderRadius: 999,
        cursor: "pointer",
        fontFamily: T.body,
        fontSize: 14,
        fontWeight: 700,
        border: "1px solid",
        borderColor: activo ? T.accent : T.soft,
        bgcolor: activo ? T.accent : "transparent",
        color: activo ? T.accentInk : T.text,
        transition: "background-color .2s ease, border-color .2s ease",
        "&:hover": { borderColor: activo ? T.accent : T.text },
      }}
    >
      {children}
    </Box>
  );
}

export default function Menu() {
  const { estado, categorias } = useMenu();
  const [filtro, setFiltro] = useState<number | "todo">("todo");
  const reducido = useReducedMotion();

  const visibles =
    filtro === "todo" ? categorias : categorias.filter((c) => c.id === filtro);

  return (
    <Box
      component="section"
      id="menu"
      sx={{
        py: { xs: 10, md: 16 },
        bgcolor: T.surface,
        borderTop: `1px solid ${T.line}`,
      }}
    >
      <Container maxWidth="lg">
        <Encabezado etiqueta="Menú" titulo="La carta">
          Precios y platos actualizados directamente desde nuestro sistema.
        </Encabezado>

        {/* CARGANDO */}
        {estado === "cargando" && (
          <Box aria-busy="true" aria-label="Cargando la carta">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={64}
                sx={{ mb: 1.5, bgcolor: T.wash }}
              />
            ))}
          </Box>
        )}

        {/* SIN CONEXIÓN CON LA CARTA: salida real por WhatsApp */}
        {estado === "error" && (
          <Box
            role="status"
            sx={{
              p: { xs: 3, md: 5 },
              border: `1px solid ${T.line}`,
              borderRadius: 4,
              maxWidth: 620,
            }}
          >
            <Typography
              sx={{
                fontFamily: T.display,
                fontWeight: 700,
                fontSize: 30,
                lineHeight: 1.05,
                textTransform: "uppercase",
              }}
            >
              No pudimos cargar la carta en este momento
            </Typography>
            <Typography
              sx={{ mt: 1.5, mb: 3, fontFamily: T.body, color: T.muted }}
            >
              Escríbenos y te la enviamos de inmediato por WhatsApp.
            </Typography>
            <Button
              href={waLink("Hola Punto Urbano, ¿me comparten la carta de hoy?")}
              target="_blank"
              rel="noopener noreferrer"
              startIcon={<WhatsAppIcon />}
              sx={btnPrimario}
            >
              Pedir la carta
            </Button>
          </Box>
        )}

        {estado === "listo" && (
          <>
            {/* FILTROS */}
            {categorias.length > 1 && (
              <Box
                role="group"
                aria-label="Filtrar la carta por categoría"
                sx={{
                  display: "flex",
                  gap: 1,
                  mb: 6,
                  pb: 1,
                  overflowX: "auto",
                  scrollbarWidth: "none",
                  "&::-webkit-scrollbar": { display: "none" },
                }}
              >
                <Filtro
                  activo={filtro === "todo"}
                  onClick={() => setFiltro("todo")}
                >
                  Todo
                </Filtro>
                {categorias.map((c) => (
                  <Filtro
                    key={c.id}
                    activo={filtro === c.id}
                    onClick={() => setFiltro(c.id)}
                  >
                    {c.nombre}
                  </Filtro>
                ))}
              </Box>
            )}

            {/* CARTA */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={String(filtro)}
                initial={reducido ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducido ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                <Box
                  sx={{
                    columnCount: { xs: 1, md: visibles.length > 1 ? 2 : 1 },
                    columnGap: "72px",
                    maxWidth: visibles.length > 1 ? "none" : 720,
                  }}
                >
                  {visibles.map((c) => (
                    <BloqueCategoria key={c.id} categoria={c} />
                  ))}
                </Box>
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </Container>
    </Box>
  );
}
