/*
 * Carga el sitio del negocio y lo entrega a toda la página pública.
 *  - Con `negocio` (ruta /:negocio): se busca por url_negocio.
 *  - Sin él: se busca por el dominio que se está visitando (puntourbano.co) y,
 *    si no hay uno registrado (localhost), por VITE_NEGOCIO_DEFAULT.
 */
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, CircularProgress, Typography } from "@mui/material";
import { API, ContextoSitio, adaptarSitio } from "./siteConfig";
import type { RespuestaSitio, Sitio } from "./siteConfig";
import { TemaPuntoUrbano } from "./Tema";
import type { Estilo } from "./Tema";

const POR_DEFECTO = String(import.meta.env.VITE_NEGOCIO_DEFAULT ?? "punto-urbano");

async function pedir(url: string, signal: AbortSignal): Promise<RespuestaSitio | null> {
  const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

type Estado = { tipo: "cargando" } | { tipo: "listo"; sitio: Sitio } | { tipo: "no-existe" } | { tipo: "error" };

export default function SitioProvider({ negocio, children, estilo }: { negocio?: string; children: ReactNode; estilo?: Estilo }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        if (negocio) {
          const r = await pedir(`${API}/sitio/${encodeURIComponent(negocio)}`, ctrl.signal);
          setEstado(r ? { tipo: "listo", sitio: adaptarSitio(r, false) } : { tipo: "no-existe" });
          return;
        }
        const porDominio = await pedir(`${API}/sitio/dominio/${encodeURIComponent(window.location.hostname)}`, ctrl.signal);
        const r = porDominio ?? (await pedir(`${API}/sitio/${encodeURIComponent(POR_DEFECTO)}`, ctrl.signal));
        setEstado(r ? { tipo: "listo", sitio: adaptarSitio(r, true) } : { tipo: "no-existe" });
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        setEstado({ tipo: "error" });
      }
    })();
    return () => ctrl.abort();
  }, [negocio]);

  if (estado.tipo !== "listo") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", p: 3, textAlign: "center",
        ...(estilo === "tienda" ? { bgcolor: "#f5f5f7", color: "#1d1d1f" } : { bgcolor: "#0a0a0a", color: "#f5f5f4" }) }}>
        {estado.tipo === "cargando" ? (
          <CircularProgress color="inherit" aria-label="Cargando" />
        ) : (
          <Box>
            <Typography sx={{ fontSize: 28, fontWeight: 800 }}>
              {estado.tipo === "no-existe" ? "Esta página no existe" : "No pudimos cargar la página"}
            </Typography>
            <Typography sx={{ mt: 1, mb: 3, color: "#a3a3a3" }}>
              {estado.tipo === "no-existe" ? "Revisa la dirección o vuelve más tarde." : "Revisa tu conexión e intenta de nuevo."}
            </Typography>
            {estado.tipo === "error"
              ? <Button variant="outlined" color="inherit" onClick={() => window.location.reload()}>Reintentar</Button>
              : <Button variant="outlined" color="inherit" component={RouterLink} to="/">Ir al inicio</Button>}
          </Box>
        )}
      </Box>
    );
  }

  return (
    <ContextoSitio.Provider value={estado.sitio}>
      <TemaPuntoUrbano temaInicial={estado.sitio.tema} estilo={estilo}>{children}</TemaPuntoUrbano>
    </ContextoSitio.Provider>
  );
}
