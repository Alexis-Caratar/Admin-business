import { useCallback, useEffect, useRef, useState } from "react";

import * as maplibregl from "maplibre-gl";
import { setWorkerUrl } from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import "maplibre-gl/dist/maplibre-gl.css";
setWorkerUrl(workerUrl);
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import NearMeIcon from "@mui/icons-material/NearMe";
import RefreshIcon from "@mui/icons-material/Refresh";
import ZoomOutMapIcon from "@mui/icons-material/ZoomOutMap";
import MapIcon from "@mui/icons-material/Map";
import ReplayIcon from "@mui/icons-material/Replay";
import ThreeDRotationIcon from "@mui/icons-material/ThreeDRotation";

import { T, btnPrimario, btnSecundario } from "./landing/tokens";
import { useSitio } from "./landing/siteConfig";
import type { Sitio } from "./landing/siteConfig";
import { useTema } from "./landing/Tema";
import { Encabezado } from "./landing/Comunes";

/*
 * Configuración del Worker de MapLibre para Vite
 */

/*
 * Información del establecimiento: se completa con el sitio del negocio
 * (fijarLugar) antes de dibujar el mapa.
 */
const LUGAR = {
  nombre: "",
  direccion: "",
  lat: NaN,
  lng: NaN,
  horario: "",
  telefono: "",
  telefonoLink: "",
  googleMaps: "",
};

function fijarLugar(sitio: Sitio) {
  Object.assign(LUGAR, {
    nombre: sitio.nombre,
    direccion: [sitio.direccion, sitio.ciudad].filter(Boolean).join(", "),
    lat: sitio.lat ?? NaN,
    lng: sitio.lng ?? NaN,
    horario: sitio.horarioTexto,
    telefono: sitio.telefono ?? "",
    telefonoLink: sitio.telefonoLink ?? "",
    googleMaps: sitio.googleMaps ?? "",
  });
  VISTA_LOCAL.center = [LUGAR.lng, LUGAR.lat];
}

type Coord = [number, number];

type Linea = {
  type: "LineString";
  coordinates: Coord[];
};

/*
 * Vista inicial: Colombia
 */
const VISTA_INICIO = {
  center: [-74.3, 4.6] as Coord,
  zoom: 4.6,
  pitch: 0,
  bearing: 0,
};

/*
 * Vista final: el negocio
 */
const VISTA_LOCAL = {
  center: [0, 0] as Coord,
  zoom: 17.4,
  pitch: 62,
  bearing: -25,
};

/*
 * Mapa base y edificios por tema. El mapa se dibuja en un canvas,
 * así que necesita colores reales (no variables CSS).
 */
const MAPA = {
  dark: {
    estilo: "https://tiles.openfreemap.org/styles/dark",
    edificioBajo: "#1f1f1f",
    edificioAlto: "#333333",
  },
  light: {
    estilo: "https://tiles.openfreemap.org/styles/positron",
    edificioBajo: "#ddd4c1",
    edificioAlto: "#c6bba4",
  },
} as const;

/*
 * Estilos del marcador personalizado
 */
const estilosMarcador = `
  .pu-marker {
    position: relative;
    width: 0;
    height: 0;
    cursor: pointer;
  }

  .pu-pulse {
    position: absolute;
    left: -30px;
    top: -30px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: color-mix(in srgb, var(--pu-accent) 35%, transparent);
    animation: puPulse 2s ease-out infinite;
  }

  .pu-pulse.dos {
    animation-delay: 1s;
  }

  .pu-pin {
    position: absolute;
    left: -24px;
    top: -66px;
    width: 48px;
    height: 48px;
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    background: var(--pu-accent);
    border: 3px solid #ffffff;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.55);

    display: flex;
    align-items: center;
    justify-content: center;

    animation: puRebote 1.8s ease-in-out infinite;
  }

  .pu-pin span {
    transform: rotate(45deg);
    font-size: 22px;
    line-height: 1;
  }

  .pu-label {
    position: absolute;
    top: -104px;
    left: 0;
    transform: translateX(-50%);

    white-space: nowrap;

    padding: 5px 12px;
    border-radius: 999px;

    background: var(--pu-glass);
    color: var(--pu-text);

    font: 800 13px Manrope, system-ui, sans-serif;

    border: 1px solid var(--pu-accent);

    box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);
  }

  .pu-yo {
    width: 18px;
    height: 18px;
    border-radius: 50%;

    background: #38bdf8;
    border: 3px solid #ffffff;

    box-shadow:
      0 0 0 6px rgba(56, 189, 248, 0.3);
  }

  @keyframes puPulse {
    0% {
      transform: scale(0.3);
      opacity: 1;
    }

    100% {
      transform: scale(1.7);
      opacity: 0;
    }
  }

  @keyframes puRebote {
    0%,
    100% {
      transform: rotate(-45deg) translate(0, 0);
    }

    50% {
      transform: rotate(-45deg) translate(5px, -5px);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .pu-pulse,
    .pu-pin {
      animation: none;
    }
  }
`;

/*
 * ---------------------------------------------------------
 * RUTAS: tipos y utilidades
 * ---------------------------------------------------------
 */

type RutaActiva = { geometria: Linea; origen: Coord };

type ResumenRuta = { metros: number; segundos: number; hora: string };

type Fase = "inactivo" | "ubicando" | "calculando" | "lista" | "error";

/*
 * Servidor público de demostración de OSRM: no garantiza disponibilidad
 * y no tiene en cuenta el tráfico. Para producción conviene un OSRM o
 * Valhalla propio, o un servicio de rutas detrás de tu backend (nunca
 * una clave secreta en el frontend).
 */
const OSRM = "https://router.project-osrm.org/route/v1/driving/";

const AZUL_ORIGEN = "#38bdf8";

function coordValida(lng: number, lat: number): boolean {
  return (
    Number.isFinite(lng) &&
    Number.isFinite(lat) &&
    Math.abs(lng) <= 180 &&
    Math.abs(lat) <= 90
  );
}

const destinoValido = () => coordValida(LUGAR.lng, LUGAR.lat);

/* Indicaciones en Google Maps (formato oficial de Maps URLs) */
function urlIndicaciones(origen: Coord | null): string | null {
  if (!destinoValido()) return null;

  const params = new URLSearchParams({
    api: "1",
    destination: `${LUGAR.lat},${LUGAR.lng}`,
    travelmode: "driving",
  });

  // Sin origen, Google Maps usa la ubicación actual del visitante
  if (origen) params.set("origin", `${origen[1]},${origen[0]}`);

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

const formatoKm = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

function formatoDuracion(segundos: number): string {
  const minutos = Math.max(1, Math.round(segundos / 60));
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
}

function esLinea(g: unknown): g is Linea {
  if (typeof g !== "object" || g === null) return false;
  const linea = g as { type?: unknown; coordinates?: unknown };
  return (
    linea.type === "LineString" &&
    Array.isArray(linea.coordinates) &&
    linea.coordinates.length >= 2 &&
    linea.coordinates.every(
      (c) =>
        Array.isArray(c) &&
        typeof c[0] === "number" &&
        typeof c[1] === "number" &&
        coordValida(c[0], c[1])
    )
  );
}

/* Valida la respuesta de OSRM. Lanza "sin-ruta" o "servicio". */
function leerRuta(data: unknown): {
  geometria: Linea;
  metros: number;
  segundos: number;
} {
  const d = (data ?? {}) as { code?: unknown; routes?: unknown };

  if (d.code === "NoRoute") throw new Error("sin-ruta");
  if (d.code !== "Ok") throw new Error("servicio");
  if (!Array.isArray(d.routes) || d.routes.length === 0) {
    throw new Error("sin-ruta");
  }

  const r = d.routes[0] as {
    geometry?: unknown;
    distance?: unknown;
    duration?: unknown;
  };

  if (
    !esLinea(r.geometry) ||
    typeof r.distance !== "number" ||
    typeof r.duration !== "number" ||
    !Number.isFinite(r.distance) ||
    !Number.isFinite(r.duration)
  ) {
    throw new Error("servicio");
  }

  return { geometria: r.geometry, metros: r.distance, segundos: r.duration };
}

function obtenerPosicion(
  opciones: PositionOptions
): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, opciones);
  });
}

function codigoGeo(error: unknown): number {
  return typeof error === "object" && error !== null && "code" in error
    ? Number((error as { code: unknown }).code)
    : 0;
}

function mensajeGeo(codigo: number): string {
  if (codigo === 1) {
    return "No diste permiso para usar tu ubicación. Actívalo en el candado de la barra de direcciones y vuelve a intentarlo.";
  }
  if (codigo === 3) {
    return "Tu dispositivo tardó demasiado en ubicarte. Revisa que el GPS esté encendido y vuelve a intentarlo.";
  }
  return "Tu dispositivo no pudo determinar dónde estás en este momento.";
}

/* Sin coordenadas registradas no se muestra la sección del mapa */
export default function Ubicacion() {
  const sitio = useSitio();
  if (sitio.lat === null || sitio.lng === null) return null;
  fijarLugar(sitio);
  return <MapaUbicacion key={sitio.id} />;
}

function MapaUbicacion() {
  const seccionRef = useRef<HTMLDivElement | null>(null);

  const contenedorRef = useRef<HTMLDivElement | null>(null);

  const mapRef = useRef<maplibregl.Map | null>(null);

  const orbitaRef = useRef<number | null>(null);

  const marcadorYoRef =
    useRef<maplibregl.Marker | null>(null);

  const marcadorLugarRef =
    useRef<maplibregl.Marker | null>(null);

  const { mode: modo, tokens } = useTema();

  // Tras el primer vuelo, un cambio de tema ya no repite la animación
  const yaVolo = useRef(false);

  const estado = useRef({
    cargado: false,
    visible: false,
    volo: false,
  });

  const [es3D, setEs3D] = useState(true);

  const [fase, setFase] = useState<Fase>("inactivo");

  const [ruta, setRuta] = useState<ResumenRuta | null>(null);

  // Solo en memoria: la ubicación del visitante nunca se guarda
  const [origen, setOrigen] = useState<Coord | null>(null);

  // Ruta activa: sobrevive al cambio de tema, que vuelve a crear el mapa
  const rutaRef = useRef<RutaActiva | null>(null);

  // Cada consulta lleva un número; las respuestas viejas se descartan
  const consultaRef = useRef(0);

  const abortRef = useRef<AbortController | null>(null);

  const montadoRef = useRef(true);

  const dibujarRutaRef = useRef<
    (geometria: Linea, origen: Coord, animar: boolean) => void
  >(() => undefined);

  const cargando = fase === "ubicando" || fase === "calculando";

  const [aviso, setAviso] = useState("");

  const sinAnimacion =
    typeof window !== "undefined" &&
    window
      .matchMedia?.(
        "(prefers-reduced-motion: reduce)"
      )
      .matches;

  /*
   * ---------------------------------------------------------
   * DETENER ÓRBITA
   * ---------------------------------------------------------
   */

  const detenerOrbita = useCallback(() => {
    if (orbitaRef.current !== null) {
      cancelAnimationFrame(orbitaRef.current);
    }

    orbitaRef.current = null;
  }, []);

  /*
   * ---------------------------------------------------------
   * INICIAR ÓRBITA
   * ---------------------------------------------------------
   */

  const iniciarOrbita = useCallback(() => {
    // Con una ruta en pantalla el mapa se queda quieto
    if (sinAnimacion || rutaRef.current) {
      return;
    }

    detenerOrbita();

    const girar = () => {
      const map = mapRef.current;

      if (!map) {
        return;
      }

      map.setBearing(map.getBearing() + 0.06);

      orbitaRef.current =
        requestAnimationFrame(girar);
    };

    orbitaRef.current =
      requestAnimationFrame(girar);
  }, [detenerOrbita, sinAnimacion]);

  /*
   * ---------------------------------------------------------
   * VUELO COLOMBIA → PUNTO URBANO
   * ---------------------------------------------------------
   */

  const volarAlLocal = useCallback(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    detenerOrbita();

    setEs3D(true);

    yaVolo.current = true;

    if (sinAnimacion) {
      map.jumpTo(VISTA_LOCAL);
      return;
    }

    map.jumpTo(VISTA_INICIO);

    map.flyTo({
      ...VISTA_LOCAL,
      duration: 7000,
      curve: 1.6,
      essential: true,
    });

    map.once("moveend", () => {
      iniciarOrbita();
    });
  }, [
    detenerOrbita,
    iniciarOrbita,
    sinAnimacion,
  ]);

  /*
   * ---------------------------------------------------------
   * CREAR MAPA
   * ---------------------------------------------------------
   */

  useEffect(() => {
    if (!contenedorRef.current) {
      return;
    }

    if (!seccionRef.current) {
      return;
    }

    const st = estado.current;

    // Al cambiar de tema el mapa se vuelve a crear con su estilo:
    // se queda en el local, sin repetir el vuelo, y la ruta activa
    // se vuelve a dibujar cuando termina de cargar.
    st.volo = yaVolo.current;
    setEs3D(true);

    const map = new maplibregl.Map({
      container: contenedorRef.current,
      style: MAPA[modo].estilo,
      ...(yaVolo.current ? VISTA_LOCAL : VISTA_INICIO),
      maxPitch: 75,
      cooperativeGestures: true,
    });

    mapRef.current = map;

    /*
     * Controles de navegación
     */

    map.addControl(
      new maplibregl.NavigationControl({
        visualizePitch: true,
      }),
      "bottom-right"
    );

    /*
     * -------------------------------------------------------
     * MAPA CARGADO
     * -------------------------------------------------------
     */

    map.on("load", () => {
      /*
       * ---------------------------------------------------
       * COLORES PERSONALIZADOS
       * ---------------------------------------------------
       */



      type PropiedadPintura =
        Parameters<
          typeof map.setPaintProperty
        >[1];

      const pintar = (
        id: string,
        propiedad: PropiedadPintura,
        valor: string
      ) => {
        // El mapa claro conserva sus propios colores
        if (modo !== "dark" || !map.getLayer(id)) {
          return;
        }

        try {
          map.setPaintProperty(
            id,
            propiedad,
            valor
          );
        } catch {
          // La capa puede no admitir esta propiedad.
        }
      };
      
 

      pintar(
        "background",
        "background-color",
        "#0a0a0a"
      );

      pintar(
        "water",
        "fill-color",
        "#0b1a1f"
      );

      pintar(
        "landuse_park",
        "fill-color",
        "#0d1f16"
      );

      pintar(
        "building",
        "fill-color",
        "#171717"
      );

      pintar(
        "highway_minor",
        "line-color",
        "#333333"
      );

      pintar(
        "highway_major_casing",
        "line-color",
        "#1f1f1f"
      );

      pintar(
        "highway_major_inner",
        "line-color",
        "#4a4a4a"
      );

      pintar(
        "highway_name_other",
        "text-color",
        "#d4d4d4"
      );

      pintar(
        "highway_name_other",
        "text-halo-color",
        "#0a0a0a"
      );

      /*
       * ---------------------------------------------------
       * EDIFICIOS 3D
       * ---------------------------------------------------
       */

      const fuentes = map.getStyle().sources;

      const fuenteVectorial =
        Object.entries(fuentes).find(
          ([, source]) =>
            source.type === "vector"
        )?.[0];

      const primeraEtiqueta =
        map
          .getStyle()
          .layers?.find(
            (layer: any) =>
              layer.type === "symbol" &&
              [
                "transportation_name",
                "place",
              ].includes(
                layer["source-layer"] ?? ""
              )
          )?.id;

      if (
        fuenteVectorial &&
        !map.getLayer("pu-edificios-3d")
      ) {
        try {
          map.addLayer(
            {
              id: "pu-edificios-3d",

              type: "fill-extrusion",

              source: fuenteVectorial,

              "source-layer": "building",

              minzoom: 14,

              paint: {
                "fill-extrusion-color": [
                  "interpolate",
                  ["linear"],
                  [
                    "coalesce",
                    ["get", "render_height"],
                    6,
                  ],
                  0,
                  MAPA[modo].edificioBajo,
                  30,
                  MAPA[modo].edificioAlto,
                ],

                "fill-extrusion-height": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  14,
                  0,
                  15.5,
                  [
                    "coalesce",
                    ["get", "render_height"],
                    6,
                  ],
                ],

                "fill-extrusion-base": [
                  "coalesce",
                  ["get", "render_min_height"],
                  0,
                ],

                "fill-extrusion-opacity": 0.88,
              },
            },
            primeraEtiqueta
          );
        } catch {
          // Si el estilo no permite edificios 3D,
          // el mapa continúa funcionando normalmente.
        }
      }

      /*
       * ---------------------------------------------------
       * MARCADOR PUNTO URBANO
       * ---------------------------------------------------
       */

      const el =
        document.createElement("div");

      el.className = "pu-marker";

      el.innerHTML = `
        <div class="pu-pulse"></div>

        <div class="pu-pulse dos"></div>

        <div class="pu-pin">
          <span>🍔</span>
        </div>

        <div class="pu-label">
          ${LUGAR.nombre}
        </div>
      `;

      el.addEventListener("click", () => {
        window.open(
          LUGAR.googleMaps,
          "_blank",
          "noopener,noreferrer"
        );
      });

      const marcador =
        new maplibregl.Marker({
          element: el,
        })
          .setLngLat([
            LUGAR.lng,
            LUGAR.lat,
          ])
          .addTo(map);

      marcadorLugarRef.current = marcador;

      st.cargado = true;

      // Ruta que estaba activa antes de recrear el mapa
      if (rutaRef.current) {
        dibujarRutaRef.current(
          rutaRef.current.geometria,
          rutaRef.current.origen,
          false
        );
      }

      /*
       * Si la sección ya está visible,
       * iniciar automáticamente el vuelo.
       */

      if (
        st.visible &&
        !st.volo &&
        !rutaRef.current
      ) {
        st.volo = true;

        setTimeout(() => {
          volarAlLocal();
        }, 300);
      }
    });

    /*
     * ---------------------------------------------------------
     * DETENER GIRO AL INTERACTUAR
     * ---------------------------------------------------------
     */

    const contenedor =
      contenedorRef.current;

    const detenerPorInteraccion = () => {
      detenerOrbita();
    };

    contenedor.addEventListener(
      "pointerdown",
      detenerPorInteraccion
    );

    contenedor.addEventListener(
      "wheel",
      detenerPorInteraccion,
      { passive: true }
    );

    /*
     * ---------------------------------------------------------
     * INTERSECTION OBSERVER
     * ---------------------------------------------------------
     */

    const observador =
      new IntersectionObserver(
        ([entrada]) => {
          if (!entrada.isIntersecting) {
            return;
          }

          st.visible = true;

          if (
            st.cargado &&
            !st.volo &&
            !rutaRef.current
          ) {
            st.volo = true;

            setTimeout(() => {
              volarAlLocal();
            }, 300);
          }
        },
        {
          threshold: 0.35,
        }
      );

    observador.observe(
      seccionRef.current
    );

    /*
     * ---------------------------------------------------------
     * LIMPIEZA
     * ---------------------------------------------------------
     */

    return () => {
      observador.disconnect();

      contenedor.removeEventListener(
        "pointerdown",
        detenerPorInteraccion
      );

      contenedor.removeEventListener(
        "wheel",
        detenerPorInteraccion
      );

      detenerOrbita();

      if (marcadorYoRef.current) {
        marcadorYoRef.current.remove();
        marcadorYoRef.current = null;
      }

      if (marcadorLugarRef.current) {
        marcadorLugarRef.current.remove();
        marcadorLugarRef.current = null;
      }

      map.remove();

      mapRef.current = null;

      st.cargado = false;
      st.volo = false;
      st.visible = false;
    };
  }, [
    detenerOrbita,
    volarAlLocal,
    modo,
  ]);

  /*
   * ---------------------------------------------------------
   * CAMBIAR VISTA 2D / 3D
   * ---------------------------------------------------------
   */

  const cambiarVista = () => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    detenerOrbita();

    const siguienteEs3D = !es3D;

    map.easeTo({
      pitch: siguienteEs3D
        ? VISTA_LOCAL.pitch
        : 0,

      bearing: siguienteEs3D
        ? VISTA_LOCAL.bearing
        : 0,

      duration: sinAnimacion
        ? 0
        : 1000,
    });

    setEs3D(siguienteEs3D);
  };

  /*
   * ---------------------------------------------------------
   * CICLO DE VIDA: nada de actualizar estado tras desmontar
   * ---------------------------------------------------------
   */

  useEffect(() => {
    montadoRef.current = true;

    return () => {
      montadoRef.current = false;
      consultaRef.current += 1;
      abortRef.current?.abort();
    };
  }, []);

  /*
   * ---------------------------------------------------------
   * QUITAR LA RUTA DEL MAPA
   * ---------------------------------------------------------
   */

  const quitarRutaDelMapa = () => {
    marcadorYoRef.current?.remove();

    const map = mapRef.current;

    if (!map || !estado.current.cargado) {
      return;
    }

    ["pu-ruta-linea", "pu-ruta-brillo"].forEach((id) => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
    });

    if (map.getSource("pu-ruta")) {
      map.removeSource("pu-ruta");
    }
  };

  /*
   * ---------------------------------------------------------
   * ENCUADRAR ORIGEN, DESTINO Y RECORRIDO
   * ---------------------------------------------------------
   */

  const encuadrarRuta = (animar = true) => {
    const map = mapRef.current;
    const activa = rutaRef.current;

    if (!map || !activa || !estado.current.cargado) {
      return;
    }

    detenerOrbita();

    const limites = activa.geometria.coordinates.reduce(
      (bounds, coordenada) => bounds.extend(coordenada),
      new maplibregl.LngLatBounds(activa.origen, activa.origen)
    );

    limites.extend([LUGAR.lng, LUGAR.lat]);

    // En escritorio la tarjeta tapa la esquina izquierda del mapa
    const conTarjeta = map.getContainer().clientWidth >= 860;

    map.fitBounds(limites, {
      padding: {
        top: 84,
        bottom: 64,
        right: 64,
        left: conTarjeta ? 410 : 48,
      },

      pitch: 0,
      bearing: 0,
      maxZoom: 16.5,

      duration: animar && !sinAnimacion ? 2200 : 0,
    });

    setEs3D(false);
  };

  /*
   * ---------------------------------------------------------
   * DIBUJAR RUTA
   * ---------------------------------------------------------
   */

  const dibujarRuta = (
    geometria: Linea,
    puntoOrigen: Coord,
    animar: boolean
  ) => {
    const map = mapRef.current;

    // Si el mapa se está recreando (cambio de tema), la ruta guardada
    // en rutaRef se dibuja sola cuando termine de cargar.
    if (!map || !estado.current.cargado) {
      return;
    }

    const datos = {
      type: "Feature" as const,

      properties: {},

      geometry: geometria,
    };

    const fuenteRuta =
      map.getSource("pu-ruta") as
        | maplibregl.GeoJSONSource
        | undefined;

    if (fuenteRuta) {
      // Ruta nueva sobre la misma fuente: no se duplican capas
      fuenteRuta.setData(datos);
    } else {
      map.addSource("pu-ruta", {
        type: "geojson",
        data: datos,
      });

      const antes =
        map.getLayer("pu-edificios-3d")
          ? "pu-edificios-3d"
          : undefined;

      /*
       * BRILLO DE LA RUTA
       */

      map.addLayer(
        {
          id: "pu-ruta-brillo",

          type: "line",

          source: "pu-ruta",

          layout: {
            "line-cap": "round",
            "line-join": "round",
          },

          paint: {
            "line-color": tokens.accent,
            "line-width": 14,
            "line-opacity": 0.25,
            "line-blur": 6,
          },
        },
        antes
      );

      /*
       * LÍNEA PRINCIPAL
       */

      map.addLayer(
        {
          id: "pu-ruta-linea",

          type: "line",

          source: "pu-ruta",

          layout: {
            "line-cap": "round",
            "line-join": "round",
          },

          paint: {
            "line-color": tokens.accent,
            "line-width": 5,
          },
        },
        antes
      );
    }

    /*
     * -------------------------------------------------------
     * MARCADOR DEL USUARIO
     * -------------------------------------------------------
     */

    if (!marcadorYoRef.current) {
      const yo =
        document.createElement("div");

      yo.className = "pu-yo";
      yo.setAttribute("role", "img");
      yo.setAttribute("aria-label", "Tu ubicación actual");

      marcadorYoRef.current =
        new maplibregl.Marker({
          element: yo,
        });
    }

    marcadorYoRef.current
      .setLngLat(puntoOrigen)
      .addTo(map);

    encuadrarRuta(animar);
  };

  // El mapa (al cargar) y las respuestas asíncronas usan siempre la
  // versión más reciente, con los colores del tema activo.
  dibujarRutaRef.current = dibujarRuta;

  /*
   * ---------------------------------------------------------
   * CÓMO LLEGAR
   * ---------------------------------------------------------
   */

  const fallar = (mensaje: string) => {
    setFase("error");
    setAviso(mensaje);
  };

  const comoLlegar = async () => {
    // Evita solicitudes duplicadas
    if (cargando) {
      return;
    }

    consultaRef.current += 1;
    const consulta = consultaRef.current;
    const vigente = () =>
      montadoRef.current && consulta === consultaRef.current;

    // Una consulta nueva nunca muestra datos de la anterior
    setAviso("");
    setRuta(null);
    rutaRef.current = null;
    quitarRutaDelMapa();

    if (!destinoValido()) {
      fallar(
        "La ubicación del restaurante no está bien configurada. Usa el enlace de Google Maps."
      );
      return;
    }

    if (
      typeof navigator === "undefined" ||
      !("geolocation" in navigator)
    ) {
      fallar(
        "Tu navegador no permite obtener tu ubicación. Puedes ver las indicaciones en Google Maps."
      );
      return;
    }

    if (window.isSecureContext === false) {
      fallar(
        "La ubicación solo funciona en una conexión segura (https). Puedes ver las indicaciones en Google Maps."
      );
      return;
    }

    detenerOrbita();

    setFase("ubicando");

    /*
     * 1. Ubicación del visitante: primero con alta precisión y, si
     *    tarda o no está disponible, un segundo intento más rápido.
     */

    let posicion: GeolocationPosition;

    try {
      try {
        posicion = await obtenerPosicion({
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 30000,
        });
      } catch (error) {
        if (codigoGeo(error) === 1) {
          throw error;
        }

        posicion = await obtenerPosicion({
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 120000,
        });
      }
    } catch (error) {
      if (vigente()) {
        fallar(mensajeGeo(codigoGeo(error)));
      }
      return;
    }

    if (!vigente()) {
      return;
    }

    const puntoOrigen: Coord = [
      posicion.coords.longitude,
      posicion.coords.latitude,
    ];

    if (!coordValida(puntoOrigen[0], puntoOrigen[1])) {
      fallar(mensajeGeo(2));
      return;
    }

    setOrigen(puntoOrigen);

    setFase("calculando");

    /*
     * 2. Ruta por carretera (OSRM). Orden: longitud,latitud.
     */

    abortRef.current?.abort();

    const control = new AbortController();
    abortRef.current = control;

    const limite = window.setTimeout(
      () => control.abort(),
      12000
    );

    try {
      const url =
        OSRM +
        `${puntoOrigen[0]},${puntoOrigen[1]};${LUGAR.lng},${LUGAR.lat}` +
        "?overview=full&geometries=geojson&alternatives=false&steps=false";

      const respuesta = await fetch(url, {
        signal: control.signal,
      });

      if (!respuesta.ok) {
        throw new Error("servicio");
      }

      const calculada = leerRuta(
        (await respuesta.json()) as unknown
      );

      if (!vigente()) {
        return;
      }

      rutaRef.current = {
        geometria: calculada.geometria,
        origen: puntoOrigen,
      };

      dibujarRutaRef.current(
        calculada.geometria,
        puntoOrigen,
        true
      );

      setRuta({
        metros: calculada.metros,
        segundos: calculada.segundos,
        hora: new Date().toLocaleTimeString("es-CO", {
          hour: "numeric",
          minute: "2-digit",
        }),
      });

      setFase("lista");
    } catch (error) {
      if (!vigente()) {
        return;
      }

      const sinRuta =
        error instanceof Error && error.message === "sin-ruta";

      fallar(
        sinRuta
          ? "No encontramos una ruta por carretera desde donde estás. Prueba con las indicaciones de Google Maps."
          : "El servicio de rutas no respondió. Puedes ver las indicaciones en Google Maps."
      );
    } finally {
      window.clearTimeout(limite);
    }
  };

  /*
   * ---------------------------------------------------------
   * QUITAR RUTA (volver a la vista del local)
   * ---------------------------------------------------------
   */

  const quitarRuta = () => {
    consultaRef.current += 1;
    abortRef.current?.abort();

    rutaRef.current = null;
    quitarRutaDelMapa();

    setRuta(null);
    setOrigen(null);
    setAviso("");
    setFase("inactivo");
    setEs3D(true);

    const map = mapRef.current;

    if (!map) {
      return;
    }

    map.easeTo({
      ...VISTA_LOCAL,
      duration: sinAnimacion ? 0 : 1800,
    });

    map.once("moveend", () => {
      iniciarOrbita();
    });
  };

  const urlNavegacion = urlIndicaciones(origen);

  /*
   * ---------------------------------------------------------
   * ESTILOS DE BOTONES
   * ---------------------------------------------------------
   */

  const botonCristal = {
    bgcolor: T.glass,

    color: T.text,

    backdropFilter: "blur(8px)",

    border:
      `1px solid ${T.line}`,

    fontWeight: 700,

    "&:hover": {
      bgcolor:
        T.glassHover,
    },

    "& .MuiChip-icon": {
      color: T.accent,
    },
  };

  /*
   * ---------------------------------------------------------
   * UI
   * ---------------------------------------------------------
   */

  return (
    <Box
      component="section"
      id="ubicacion"
      ref={seccionRef}
      sx={{
        py: { xs: 10, md: 16 },

        bgcolor: T.bg,

        borderTop: `1px solid ${T.line}`,
      }}
    >
      <style>
        {estilosMarcador}
      </style>

      <Container maxWidth="lg">
        <Encabezado etiqueta="Ubicación" titulo="Cómo llegar">
          Sobrevuela Pasto y aterriza justo en nuestra puerta. Mueve el mapa,
          gíralo o pide la ruta desde donde estás.
        </Encabezado>

        {/* MAPA */}

        <Box
          sx={{
            position: "relative",

            borderRadius: 6,

            overflow: "hidden",

            border:
              `1px solid ${T.line}`,

            boxShadow:
              `0 20px 60px ${T.shadow}`,
          }}
        >
          <Box
            ref={contenedorRef}
            role="application"
            aria-label={`Mapa 3D con la ubicación de ${LUGAR.nombre}: ${LUGAR.direccion}`}
            sx={{
              height: {
                xs: 460,
                md: 620,
              },

              width: "100%",
            }}
          />

          {/* CONTROLES SUPERIORES */}

          <Stack
            direction="row"
            spacing={1}
            sx={{
              position: "absolute",

              top: 16,

              right: 16,

              zIndex: 2,
            }}
          >
            <Chip
              icon={
                es3D ? (
                  <MapIcon />
                ) : (
                  <ThreeDRotationIcon />
                )
              }
              label={
                es3D
                  ? "Desde arriba"
                  : "Vista 3D"
              }
              onClick={cambiarVista}
              sx={botonCristal}
            />

            {ruta ? (
              <Chip
                icon={<ZoomOutMapIcon />}
                label="Ver recorrido"
                onClick={() => encuadrarRuta()}
                sx={botonCristal}
              />
            ) : (
              <Chip
                icon={<ReplayIcon />}
                label="Repetir vuelo"
                onClick={volarAlLocal}
                sx={botonCristal}
              />
            )}
          </Stack>

          {/* TARJETA DE INFORMACIÓN */}

          <Box
            sx={{
              position: {
                xs: "static",
                md: "absolute",
              },

              left: 24,

              bottom: 24,

              zIndex: 2,

              width: {
                xs: "100%",
                md: 360,
              },

              p: 3,

              borderRadius: {
                xs: 0,
                md: 4,
              },

              bgcolor: {
                xs: T.surface,
                md: T.glass,
              },

              backdropFilter: "blur(10px)",

              // Con la ruta la tarjeta crece: en escritorio se desplaza por dentro
              maxHeight: { md: "calc(100% - 48px)" },
              overflowY: { md: "auto" },

              border: {
                md:
                  `1px solid ${T.line}`,
              },
            }}
          >
            <Typography
              fontWeight={900}
              fontSize={20}
            >
              📍 {LUGAR.direccion}
            </Typography>

            <Typography
              sx={{
                color: T.text2,

                mt: 1.5,

                fontSize: 14,
              }}
            >
              🕒 {LUGAR.horario}
            </Typography>

            <Typography
              sx={{
                mt: 0.5,

                fontSize: 14,
              }}
            >
              📞{" "}
              <Box
                component="a"
                href={LUGAR.telefonoLink}
                sx={{
                  color: T.accent,

                  fontWeight: 700,

                  textDecoration: "none",
                }}
              >
                {LUGAR.telefono}
              </Box>
            </Typography>

            <Typography
              sx={{
                color: T.muted,

                mt: 0.5,

                fontSize: 13,
              }}
            >
              🛵 Domicilios · 🍽 Reservas por
              teléfono
            </Typography>

            {/* RECORRIDO CALCULADO */}

            {ruta && fase === "lista" && (
              <Box
                sx={{
                  mt: 2,

                  p: 2,

                  borderRadius: 3,

                  bgcolor:
                    `color-mix(in srgb, ${T.accent} 12%, transparent)`,

                  border:
                    `1px solid color-mix(in srgb, ${T.accent} 35%, transparent)`,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 2,
                  }}
                >
                  {[
                    ["Distancia", `${formatoKm.format(ruta.metros / 1000)} km`],
                    ["En carro", `≈ ${formatoDuracion(ruta.segundos)}`],
                  ].map(([etiqueta, valor]) => (
                    <Box key={etiqueta}>
                      <Typography
                        sx={{
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.14em",
                          textTransform: "uppercase",
                          color: T.muted,
                        }}
                      >
                        {etiqueta}
                      </Typography>

                      <Typography
                        sx={{
                          fontFamily: T.display,
                          fontWeight: 800,
                          fontSize: 34,
                          lineHeight: 1.05,
                          color: T.text,
                        }}
                      >
                        {valor}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box
                  component="ol"
                  sx={{
                    listStyle: "none",
                    m: 0,
                    mt: 1.5,
                    p: 0,
                    display: "grid",
                    gap: 0.6,
                    fontSize: 14,
                    color: T.text2,
                  }}
                >
                  {[
                    ["Origen", "Tu ubicación actual", AZUL_ORIGEN],
                    ["Destino", LUGAR.nombre, T.accent],
                  ].map(([rol, nombre, color]) => (
                    <Box
                      key={rol}
                      component="li"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        aria-hidden
                        sx={{
                          width: 10,
                          height: 10,
                          borderRadius: "50%",
                          flexShrink: 0,
                          bgcolor: color,
                        }}
                      />
                      <span>
                        <b>{rol}:</b> {nombre}
                      </span>
                    </Box>
                  ))}
                </Box>

                <Typography
                  role="status"
                  sx={{
                    mt: 1.5,
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    color: T.muted,
                  }}
                >
                  Ruta calculada a las {ruta.hora}. El tiempo es
                  aproximado: no incluye tráfico, cierres ni clima.
                </Typography>
              </Box>
            )}

            {/* ESTADO DE CARGA (para lectores de pantalla) */}

            {cargando && (
              <Typography
                role="status"
                sx={{
                  mt: 2,
                  fontSize: 13,
                  color: T.muted,
                }}
              >
                {fase === "ubicando"
                  ? "Esperando la ubicación de tu dispositivo…"
                  : "Calculando el recorrido por carretera…"}
              </Typography>
            )}

            {/* MENSAJE DE ERROR */}

            {aviso && (
              <Typography
                role="alert"
                sx={{
                  mt: 2,

                  p: 1.5,

                  borderRadius: 2,

                  fontSize: 13,

                  lineHeight: 1.5,

                  color: T.warn,

                  bgcolor: T.wash,

                  border: `1px solid ${T.line}`,
                }}
              >
                {aviso}
              </Typography>
            )}

            {/* BOTONES */}

            <Stack
              spacing={1.2}
              sx={{
                mt: 2.5,
              }}
            >
              <Button
                onClick={comoLlegar}
                disabled={cargando}
                aria-busy={cargando}
                startIcon={
                  cargando ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : ruta ? (
                    <RefreshIcon />
                  ) : (
                    <NearMeIcon />
                  )
                }
                sx={{
                  ...btnPrimario,
                  "&.Mui-disabled": {
                    bgcolor: T.accent,
                    color: T.accentInk,
                    opacity: 0.7,
                  },
                }}
              >
                {fase === "ubicando"
                  ? "Buscando tu ubicación…"
                  : fase === "calculando"
                    ? "Calculando la ruta…"
                    : ruta
                      ? "Actualizar recorrido"
                      : "Cómo llegar desde mi ubicación"}
              </Button>

              {urlNavegacion && (
                <Button
                  component="a"
                  href={urlNavegacion}
                  target="_blank"
                  rel="noopener noreferrer"
                  startIcon={<DirectionsCarIcon />}
                  sx={btnSecundario}
                >
                  Navegar con Google Maps
                </Button>
              )}
            </Stack>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                mt: 1.5,
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {LUGAR.googleMaps && (
                <Box
                  component="a"
                  href={LUGAR.googleMaps}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    py: 1,
                    color: T.text,
                    textDecorationColor: T.soft,
                    textUnderlineOffset: "4px",
                    "&:hover": { color: T.accent },
                  }}
                >
                  Abrir en Google Maps
                </Box>
              )}

              {(ruta || fase === "error") && (
                <Box
                  component="button"
                  type="button"
                  onClick={quitarRuta}
                  sx={{
                    py: 1,
                    px: 0,
                    border: 0,
                    bgcolor: "transparent",
                    cursor: "pointer",
                    font: "inherit",
                    color: T.muted,
                    textDecoration: "underline",
                    textDecorationColor: T.soft,
                    textUnderlineOffset: "4px",
                    "&:hover": { color: T.text },
                  }}
                >
                  {ruta ? "Quitar ruta" : "Cerrar aviso"}
                </Box>
              )}
            </Box>

            <Typography
              sx={{
                mt: 0.5,
                fontSize: 12,
                lineHeight: 1.5,
                color: T.muted,
              }}
            >
              Google Maps puede proponer otro recorrido y otro tiempo,
              porque usa el tráfico del momento.
            </Typography>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}