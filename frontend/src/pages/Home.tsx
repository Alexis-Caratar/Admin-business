import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  Button,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Stack,
  CardMedia,
  Fab,
} from "@mui/material";

import RestaurantIcon from "@mui/icons-material/Restaurant";
import LocalDiningIcon from "@mui/icons-material/LocalDining";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { useNavigate } from "react-router-dom";
import logo from './../assets/img/img_puntourbano/logosinfondo.jpeg'

export default function Home() {
  const [filter, setFilter] = useState("todo");
  const navigate = useNavigate();

  
// SEO
useEffect(() => {
  document.title =
    "Punto Urbano | Restaurante de Comidas Rápidas, Almuerzos y Cenas en Pasto";

  const description =
    "Punto Urbano en Pasto, Nariño. Restaurante de comidas rápidas, hamburguesas artesanales, almuerzos, cenas, fast food premium, domicilios y bebidas. Disfruta un ambiente moderno y el mejor sabor en Pasto.";

  // DESCRIPTION
  let metaDescription = document.querySelector(
    'meta[name="description"]'
  );

  if (metaDescription) {
    metaDescription.setAttribute(
      "content",
      description
    );
  } else {
    metaDescription =
      document.createElement("meta");

    metaDescription.setAttribute(
      "name",
      "description"
    );

    metaDescription.setAttribute(
      "content",
      description
    );

    document.head.appendChild(metaDescription);
  }

  // KEYWORDS
  const keywords = `
    restaurante en Pasto,
    comidas rápidas Pasto,
    hamburguesas en Pasto,
    fast food Pasto,
    almuerzos en Pasto,
    cenas en Pasto,
    comida casera Pasto,
    domicilios Pasto,
    restaurante moderno Pasto,
    combos hamburguesas,
    mejor restaurante en Pasto,
    Punto Urbano Pasto
  `;

  let metaKeywords = document.querySelector(
    'meta[name="keywords"]'
  );

  if (metaKeywords) {
    metaKeywords.setAttribute(
      "content",
      keywords
    );
  } else {
    metaKeywords =
      document.createElement("meta");

    metaKeywords.setAttribute(
      "name",
      "keywords"
    );

    metaKeywords.setAttribute(
      "content",
      keywords
    );

    document.head.appendChild(metaKeywords);
  }
}, []);

 const frases = [
  "🍔 Restaurante en el corazón de Pasto",
  "🔥 Hamburguesas artesanales, carnes y experiencias únicas",
  "🌆 Buen ambiente, buena música y el mejor sabor",  
  "✨ Punto Urbano: donde cada comida se convierte en experiencia",
];

  const [texto, setTexto] = useState("");
  const [fraseIndex, setFraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

const menu = [
  {
    name: "Hamburguesa Urbana",
    category: "comidas",
    price: 0,
    image:
      "https://images.unsplash.com/photo-1550547660-d9450f859349",
  },
  {
    name: "Pizza Pepperoni",
    category: "comidas",
    price: 0,
    image:
      "https://images.unsplash.com/photo-1513104890138-7c749659a591",
  },
  {
    name: "Salchipapa Urbana",
    category: "comidas",
    price: 0,
    image:
      "https://img.magnific.com/foto-gratis/ternera-parrilla-papas-fritas-plato-rustico-generado-ia_188544-43099.jpg?semt=ais_hybrid&w=740&q=80",
  },
  {
    name: "Tacos Mexicanos",
    category: "comidas",
    price: 0,
    image:
      "https://images.unsplash.com/photo-1552332386-f8dd00dc2f85",
  },
  {
    name: "Limonada Natural",
    category: "bebidas",
    price: 0,
    image:
      "https://img.freepik.com/fotos-premium/limonada-natural-menta-fruta-fresca-mesa-madera_158023-2865.jpg",
  },
  {
    name: "Café Especial",
    category: "bebidas",
    price: 0,
    image:
      "https://images.unsplash.com/photo-1509042239860-f550ce710b93",
  },
  {
    name: "Malteada de Chocolate",
    category: "bebidas",
    price: 0,
    image:
      "https://images.unsplash.com/photo-1577805947697-89e18249d767",
  },
  {
    name: "Combo Punto Urbano",
    category: "combos",
    price: 0,
    image:
      "https://images.unsplash.com/photo-1550317138-10000687a72b",
  },
];

  const filtered =
    filter === "todo"
      ? menu
      : menu.filter((m) => m.category === filter);

  useEffect(() => {
    const fraseActual = frases[fraseIndex];

    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setTexto(
          fraseActual.substring(0, texto.length + 1)
        );

        if (texto === fraseActual) {
          setTimeout(() => {
            setIsDeleting(true);
          }, 100);
        }
      } else {
        setTexto(
          fraseActual.substring(0, texto.length - 1)
        );

        if (texto === "") {
          setIsDeleting(false);
          setFraseIndex(
            (prev) => (prev + 1) % frases.length
          );
        }
      }
    }, isDeleting ? 35 : 65);

    return () => clearTimeout(timeout);
  }, [texto, isDeleting, fraseIndex]);

  return (
    <Box
      sx={{
        bgcolor: "#0f172a",
        color: "white",
        minHeight: "100vh",
      }}
    >

      <Box
      sx={{
        position: "fixed",
        top: 20,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        pr: 5,
      }}
    >
      <Stack
        direction="row"
        spacing={2}
        alignItems="center"
      >
      
        <Button
          onClick={() => navigate("/login")}
          sx={{
            color: "#22c55e",
            textTransform: "none",
            fontWeight: 800,
          }}
        >
          Acceso al sistema
        </Button>
      </Stack>
    </Box>

      {/* HERO */}
      <Box
        sx={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
          backgroundImage:
            "url('https://thumbs.dreamstime.com/b/impresionante-maqueta-de-logotipo-para-restaurante-carne-y-parrilla-alta-calidad-muestra-tu-marca-con-352794062.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",

          "@keyframes blinkCursor": {
            "0%": {
              borderColor: "transparent",
            },
            "50%": {
              borderColor: "#22c55e",
            },
            "100%": {
              borderColor: "transparent",
            },
          },
        }}
      >
        {/* OVERLAY */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.78))",
            backdropFilter: "blur(2px)",
          }}
        />

        {/* CONTENIDO */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            padding: "20px",
          }}
        >
          {/* LOGO */}
          <CardMedia
            component="img"
            image={logo}
            alt="Punto Urbano Pasto"
            sx={{
              width: 180,
              height: 180,
              objectFit: "cover",
              borderRadius: "50%",
              mx: "auto",
              mb: 4,
              border:
                "5px solid rgba(255,255,255,0.15)",
              boxShadow:
                "0 20px 60px rgba(0,0,0,0.45)",
            }}
          />

          {/* TITULO SEO */}
          <Typography
            component="h1"
            sx={{
              fontSize: {
                xs: "3rem",
                md: "5rem",
              },
              fontWeight: 900,
              color: "white",
              letterSpacing: "-2px",
              textShadow:
                "0 10px 30px rgba(0,0,0,0.4)",
            }}
          >
            Restaurante Punto Urbano
          </Typography>

          {/* TYPEWRITER */}
          <Typography
            component="h2"
            sx={{
              mt: 3,
              color: "#e2e8f0",
              fontSize: {
                xs: "1rem",
                md: "1.5rem",
              },
              fontWeight: 500,
              maxWidth: 950,
              mx: "auto",
              minHeight: 60,
              overflow: "hidden",
              whiteSpace: "nowrap",
              borderRight:
                "3px solid #22c55e",
              animation:
                "blinkCursor 0.8s infinite",
            }}
          >
            {texto}
          </Typography>

          {/* BOTONES */}
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            justifyContent="center"
            sx={{ mt: 5 }}
          >
            <Button
              variant="contained"
              href="https://wa.me/573226665512"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Punto Urbano"
              sx={{
                bgcolor: "#22c55e",
                borderRadius: 4,
                px: 5,
                py: 1.4,
                fontSize: 16,
                textTransform: "none",
                fontWeight: 700,
                boxShadow:
                  "0 12px 30px rgba(34,197,94,0.35)",

                "&:hover": {
                  bgcolor: "#16a34a",
                  transform:
                    "translateY(-2px)",
                },
              }}
            >
              Ver menú
            </Button>

            <Button
            href="https://wa.me/573226665512"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp Punto Urbano"
              variant="outlined"
              sx={{
                borderRadius: 4,
                px: 5,
                py: 1.4,
                fontSize: 16,
                textTransform: "none",
                fontWeight: 700,
                color: "white",
                borderColor:
                  "rgba(255,255,255,0.5)",

                "&:hover": {
                  borderColor: "white",
                  bgcolor:
                    "rgba(255,255,255,0.08)",
                },
              }}
            >
              Reservar mesa
            </Button>
          </Stack>
        </motion.div>
      </Box>

      {/* ABOUT */}
      <Container sx={{ py: 10 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          textAlign="center"
        >
          Restaurante moderno en Pasto
        </Typography>

        <Typography
          sx={{
            mt: 2,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 700,
            mx: "auto",
          }}
        >
          En Punto Urbano combinamos
          hamburguesas artesanales,
          comida rápida premium y una
          experiencia moderna en el corazón
          de Pasto.
        </Typography>

        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={3}
          sx={{ mt: 6 }}
        >
          <Card
            sx={{
              flex: 1,
              borderRadius: 4,
              bgcolor: "#1e293b",
              color: "white",
            }}
          >
            <CardContent>
              <RestaurantIcon />
              <Typography
                fontWeight={700}
                mt={1}
              >
                Comida urbana
              </Typography>

              <Typography
                sx={{ color: "#94a3b8" }}
              >
                Sabores intensos con identidad
                local.
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              borderRadius: 4,
              bgcolor: "#1e293b",
              color: "white",
            }}
          >
            <CardContent>
              <LocalDiningIcon />
              <Typography
                fontWeight={700}
                mt={1}
              >
                Ambiente moderno
              </Typography>

              <Typography
                sx={{ color: "#94a3b8" }}
              >
                Diseño pensado para una
                experiencia única.
              </Typography>
            </CardContent>
          </Card>

          <Card
            sx={{
              flex: 1,
              borderRadius: 4,
              bgcolor: "#1e293b",
              color: "white",
            }}
          >
            <CardContent>
              <DeliveryDiningIcon />
              <Typography
                fontWeight={700}
                mt={1}
              >
                Domicilios rápidos
              </Typography>

              <Typography
                sx={{ color: "#94a3b8" }}
              >
                Llevamos el sabor hasta tu
                puerta.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Container>

      {/* MENU */}
      <Box
        sx={{
          bgcolor: "#0b1220",
          py: 10,
        }}
      >
        <Container>
          <Typography
            variant="h4"
            textAlign="center"
            fontWeight={700}
          >
            Menú Punto Urbano
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            justifyContent="center"
            sx={{ mt: 4 }}
          >
            {[
              "todo",
              "comidas",
              "bebidas",
              "combos",
            ].map((cat) => (
              <Chip
                key={cat}
                label={cat.toUpperCase()}
                onClick={() => setFilter(cat)}
                sx={{
                  bgcolor:
                    filter === cat
                      ? "#22c55e"
                      : "#1e293b",
                  color: "white",
                  cursor: "pointer",
                }}
              />
            ))}
          </Stack>

          <Stack
            direction={{
              xs: "column",
              md: "row",
            }}
            spacing={3}
            sx={{
              mt: 6,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {filtered.map((item, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  scale: 0.9,
                }}
                whileInView={{
                  opacity: 1,
                  scale: 1,
                }}
                transition={{
                  delay: i * 0.05,
                }}
              >
                <Card
                  sx={{
                    width: 280,
                    borderRadius: 4,
                    bgcolor: "#1e293b",
                    color: "white",
                    overflow: "hidden",
                    transition: "0.3s",

                    "&:hover": {
                      transform:
                        "translateY(-6px)",
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="160"
                    image={item.image}
                    alt={item.name}
                  />

                  <CardContent>
                    <Typography fontWeight={700}>
                      {item.name}
                    </Typography>

                    <Typography
                      sx={{
                        color: "#94a3b8",
                        fontSize: 13,
                      }}
                    >
                      {item.category}
                    </Typography>

                    <Typography
                      sx={{
                        mt: 2,
                        fontWeight: 800,
                        color: "#22c55e",
                      }}
                    >
                      $
                      {item.price.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* UBICACIÓN / GOOGLE MAPS */}
<Box
  sx={{
    py: 10,
    px: 2,
    background:
      "linear-gradient(180deg,#0f172a 0%, #111827 100%)",
  }}
>
  <Container maxWidth="md">
    <Card
      sx={{
        position: "relative",
        overflow: "hidden",
        borderRadius: 6,
        bgcolor: "#111827",
        color: "white",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
      }}
    >
      {/* EFECTO */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(34,197,94,0.18), transparent 35%)",
          pointerEvents: "none",
        }}
      />

      <CardContent
        sx={{
          p: { xs: 4, md: 6 },
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* ICONO */}
        <Box
          sx={{
            width: 90,
            height: 90,
            mx: "auto",
            mb: 3,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "linear-gradient(135deg,#22c55e,#16a34a)",
            boxShadow:
              "0 12px 30px rgba(34,197,94,0.35)",
          }}
        >
          <DeliveryDiningIcon
            sx={{
              fontSize: 45,
              color: "white",
            }}
          />
        </Box>

        {/* TITULO */}
        <Typography
          textAlign="center"
          fontWeight={900}
          sx={{
            fontSize: {
              xs: "1.8rem",
              md: "2.5rem",
            },
            mb: 2,
          }}
        >
          ¿Quieres llegar a Punto Urbano?
        </Typography>

        {/* TEXTO */}
        <Typography
          textAlign="center"
          sx={{
            color: "#cbd5e1",
            maxWidth: 700,
            mx: "auto",
            fontSize: {
              xs: 14,
              md: 17,
            },
            lineHeight: 1.8,
          }}
        >
          🍔 Vive la experiencia Punto Urbano.
          Hamburguesas, comida rápida premium y
          el mejor ambiente en Pasto.
          <br />
          <br />
          🚗 Da clic en el botón y deja que Google
          Maps te guíe directamente hasta nosotros.
        </Typography>

        {/* BOTON */}
        <Box textAlign="center" mt={5}>
          <Button
            component="a"
            href="https://maps.app.goo.gl/ZxZo7wb9VQ38qcht6"
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size="large"
            startIcon={<DeliveryDiningIcon />}
            sx={{
              borderRadius: 4,
              px: 5,
              py: 1.6,
              textTransform: "none",
              fontWeight: 800,
              fontSize: 16,
              background:
                "linear-gradient(135deg,#22c55e,#16a34a)",
              boxShadow:
                "0 12px 30px rgba(34,197,94,0.35)",

              transition: "all .25s ease",

              "&:hover": {
                transform: "translateY(-3px) scale(1.02)",
                boxShadow:
                  "0 18px 40px rgba(34,197,94,0.45)",
              },
            }}
          >
            Quiero llegar a Punto Urbano
          </Button>
        </Box>

       
      </CardContent>
    </Card>
  </Container>
</Box>


{/* CONTACTO */}
<Box
  sx={{
    py: 10,
    bgcolor: "#111827",
    borderTop: "1px solid rgba(255,255,255,0.06)",
  }}
>
  <Container maxWidth="md">
    <Typography
      variant="h4"
      fontWeight={800}
      textAlign="center"
      mb={2}
    >
      Encuéntranos aquí
    </Typography>

    <Typography
      textAlign="center"
      color="#94a3b8"
      mb={6}
      sx={{ maxWidth: 700, mx: "auto" }}
    >
      Visítanos y disfruta una experiencia única
      en Punto Urbano. Atención rápida, ambiente
      moderno y el mejor sabor de Pasto.
    </Typography>

    <Stack spacing={3}>
      {/* DIRECCIÓN */}
      <Card
        sx={{
          borderRadius: 4,
          bgcolor: "#1e293b",
          color: "white",
          p: 2,
        }}
      >
        <CardContent>
          <Typography fontWeight={700} mb={1}>
            📍 Información de Contacto
          </Typography>

          <Typography color="#cbd5e1">
            Cra. 40 #16d-29, Pasto, Nariño
          </Typography>
        </CardContent>
      </Card>

      {/* HORARIO */}
      <Card
        sx={{
          borderRadius: 4,
          bgcolor: "#1e293b",
          color: "white",
          p: 2,
        }}
      >
        <CardContent>
          <Typography fontWeight={700} mb={1}>
            🕒 Horario de atención
          </Typography>

          <Typography color="#cbd5e1">
            Abierto · Lunes a Sábado de 7:00 a.m.
            a 4:00 p.m.
          </Typography>
        </CardContent>
      </Card>

      {/* TELÉFONO */}
      <Card
        sx={{
          borderRadius: 4,
          bgcolor: "#1e293b",
          color: "white",
          p: 2,
        }}
      >
        <CardContent>
          <Typography fontWeight={700} mb={1}>
            📞 Teléfono
          </Typography>

          <Typography color="#22c55e" fontWeight={700}>
            322 6665512
          </Typography>
        </CardContent>
      </Card>

      {/* SERVICIOS */}
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={2}
      >
        <Card
          sx={{
            flex: 1,
            borderRadius: 4,
            bgcolor: "#1e293b",
            color: "white",
          }}
        >
          <CardContent>
            <Typography fontWeight={700} mb={1}>
              🛵 Domicilios
            </Typography>

            <Typography color="#cbd5e1">
              Servicio a domicilio disponible
            </Typography>
          </CardContent>
        </Card>

        <Card
          sx={{
            flex: 1,
            borderRadius: 4,
            bgcolor: "#1e293b",
            color: "white",
          }}
        >
          <CardContent>
            <Typography fontWeight={700} mb={1}>
              🍽 Reservas
            </Typography>

            <Typography color="#cbd5e1">
              Reservas disponibles por teléfono
            </Typography>
          </CardContent>
        </Card>
      </Stack>
    </Stack>
  </Container>
</Box>

      {/* FOOTER */}
      <Box
        sx={{
          py: 5,
          textAlign: "center",
          color: "#94a3b8",
        }}
      >
        <Typography>
          © {new Date().getFullYear()} Punto
          Urbano · Pasto, Colombia 
        </Typography>
          <Typography>
            Enterprise Software by Eng. Alexis Caratar 
        </Typography>
      </Box>

      {/* BOTON WHATSAPP */}
      <Box
        sx={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
        }}
      >
        <Fab
          component="a"
          href="https://wa.me/573226665512"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp Punto Urbano"
          sx={{
            position: "relative",
            bgcolor: "#22c55e",
            color: "white",
            width: 65,
            height: 65,
            boxShadow:
              "0 10px 30px rgba(34,197,94,0.4)",

            "@keyframes pulse": {
              "0%": {
                transform: "scale(1)",
              },
              "50%": {
                transform: "scale(1.15)",
              },
              "100%": {
                transform: "scale(1)",
              },
            },

            "&:hover": {
              bgcolor: "#16a34a",
              transform: "scale(1.08)",
            },
          }}
        >
          {/* ICONO */}
          <WhatsAppIcon sx={{ fontSize: 36 }} />

          {/* NOTIFICACIÓN */}
          <Box
            sx={{
              position: "absolute",
              top: -8,
              m: 0,
              right: 6,
              width: 22,
              height: 22,
              borderRadius: "50%",
              bgcolor: "#ef4444",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              border: "2px solid white",
              animation: "pulse 1.5s infinite",
            }}
          >
            1
          </Box>
        </Fab>
      </Box>
    </Box>
  );
}