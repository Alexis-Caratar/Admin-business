import React from "react";
import { Box, Typography, Container, Card, CardContent, CardMedia, Stack } from "@mui/material";
import { motion } from "framer-motion";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ScheduleIcon from "@mui/icons-material/Schedule";
import LocalPhoneIcon from "@mui/icons-material/LocalPhone";
import DeliveryDiningIcon from "@mui/icons-material/DeliveryDining";
import BookOnlineIcon from "@mui/icons-material/BookOnline";


const Home: React.FC = () => {
  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh",  width: "100vw",fontFamily: "Roboto" }}>
      {/* Hero Section */}
      <Box
        sx={{
          textAlign: "center",
          py: 1,
          bgcolor: "linear-gradient(135deg, #ff6f00, #ffb74d)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 3,
          color: "#fff",
        }}
      >
        {/* Logo animado */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, type: "spring", stiffness: 120 }}
        >
          <Box
            component="img"
            src="https://scontent.fpso2-1.fna.fbcdn.net/v/t39.30808-6/654550237_1636080677540571_5948649793158553684_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeFo9acJvskQkbXlCu8GkHMQRNzXqs_y1spE3Neqz_LWyqGsXZUgf0WTC3vxihy9JCm1bzgOmTmF0ajPUfprbfpr&_nc_ohc=wW9Hzs9jvoQQ7kNvwFYARWw&_nc_oc=AdogaJyZhzDnr-t61O-zxm0Eisb518qxLHk-Xz-Iat1wyqe531EnuIHv7ynMSFBjR-k&_nc_zt=23&_nc_ht=scontent.fpso2-1.fna&_nc_gid=7KTKeRWKvYZQIIYw4pjsRg&_nc_ss=7a32e&oh=00_Afx9TGpFdAo5qsAmI47lXz6q1RqS-pFmNbQHeIfz_HVf9g&oe=69CC3AB9" // reemplaza con tu logo
            alt="Punto Urbano Logo"
            sx={{ width: { xs: 150, sm: 200 },height:{xs:120,sm:150}, mb: 2 ,borderRadius:10}}
            
          />
        </motion.div>
 <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, color: "green"}}>
            Restaurante -Fast-food  Punto Urbano Pasto
          </Typography>
        {/* Mensaje animado */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1, color: "black"}}>
            ¡Estamos trabajando para ti!
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: 500, mx: "auto", color: "black" }}>
            Pronto podrás disfrutar de una experiencia renovada en nuestra página
            web de Punto Urbano.
          </Typography>
        </motion.div>
      </Box>

      {/* Sección de menús (preview) */}
      <Container sx={{ py: 10 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", textAlign: "center", mb: 6, color: "black" }}
        >
          Pronto conocerás nuestros menús
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 4,
          }}
        >
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ width: 300 }}>
              <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                <Card sx={{ height: "100%", display: "flex", flexDirection: "column", boxShadow: 3, borderRadius: 3 }}>
                  <CardMedia
                    component="img"
                    height="180"
                    image="https://png.pngtree.com/thumb_back/fh260/background/20230712/pngtree-3d-rendered-burger-with-explosive-presentation-image_3841356.jpg"
                    alt={`Menu ${item}`}
                    sx={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                  />
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ff6f00" }}>
                      Menú {item}
                    </Typography>
                    <Typography color="textSecondary">
                      Próximamente podrás ver más detalles.
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Mapa interactivo */}
      <Box sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", mb: 4, color: "black",}}>
          Encuéntranos aquí
        </Typography>
        <Box
          component="iframe"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.9088414346297!2d-77.2862206!3d1.2233920000000003!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e2ed50011f1f199%3A0xa60292ceadf8990e!2sMestizo%20Restaurante%20Pasto!5e0!3m2!1ses!2sco!4v1774627619597!5m2!1ses!2sco"
          width="100%"
          height="450"
          style={{ border: 80, borderRadius: 12, maxWidth: 800,}}
          allowFullScreen
          loading="lazy"
        ></Box>
      </Box>

<Box
  sx={{
    bgcolor: "#f9f9f9", // fondo claro y limpio
    p: { xs: 4, md: 6 }, // padding responsivo
    borderRadius: 4, // bordes más redondeados
    boxShadow: "0px 8px 24px rgba(0,0,0,0.1)", // sombra suave y profesional
    maxWidth: 600, // más ancho para pantallas grandes
    mx: "auto",
    mt: 8,
  }}
>
  <Typography
    variant="h5"
    sx={{
      fontWeight: "bold",
      mb: 4,
      textAlign: "center",
      color: "#ff7f50", // naranja más limpio y moderno
      letterSpacing: 1,
    }}
  >
    Información de Contacto
  </Typography>

  <Stack spacing={3}>
    {/* Dirección */}
    <Stack direction="row" alignItems="center" spacing={2}>
      <LocationOnIcon sx={{ color: "#ff7f50" }} />
      <Typography sx={{ fontWeight: 500, color: "#333" }}>
        Cra. 40 #16d-29, Pasto, Nariño
      </Typography>
    </Stack>

    {/* Horarios */}
    <Stack direction="row" alignItems="center" spacing={2}>
      <ScheduleIcon sx={{ color: "#ff7f50" }} />
      <Typography sx={{ fontWeight: 500, color: "#333" }}>
        Abierto · Lunes a Sábado de 7:00 a.m. a 4:00 p.m.
      </Typography>
    </Stack>

    {/* Teléfono */}
    <Stack direction="row" alignItems="center" spacing={2}>
      <LocalPhoneIcon sx={{ color: "#ff7f50" }} />
      <Typography sx={{ fontWeight: 500, color: "#333" }}>
        322 6665512
      </Typography>
    </Stack>

    {/* Domicilios */}
    <Stack direction="row" alignItems="center" spacing={2}>
      <DeliveryDiningIcon sx={{ color: "#ff7f50" }} />
      <Typography sx={{ fontWeight: 500, color: "#333" }}>
        Servicio a domicilio disponible
      </Typography>
    </Stack>

    {/* Reservas */}
    <Stack direction="row" alignItems="center" spacing={2}>
      <BookOnlineIcon sx={{ color: "#ff7f50" }} />
      <Typography sx={{ fontWeight: 500, color: "#333" }}>
        Reservas disponibles por teléfono
      </Typography>
    </Stack>
  </Stack>
</Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "#333", py: 10, textAlign: "center", color: "#fff" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
          Punto Urbano
        </Typography>
        <Typography>
          Derechos reservados por Punto Urbano | By Ing. Alexis Caratar | Pasto - Nariño 2026
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;