import React from "react";
import {
  Box,
  Typography,
  AppBar,
  Toolbar,
  Button,
  Card,
  CardContent,
  CardMedia,
  Container,
} from "@mui/material";
import { motion } from "framer-motion";

const menus = [
  {
    nombre: "Desayuno",
    descripcion: "Huevos, tostadas, café y jugo.",
    imagen:
      "https://stronglify-1.s3.sa-east-1.amazonaws.com/vajillascorona/Como-definir-el-menu-de-un-restaurante_1.png",
  },
  {
    nombre: "Almuerzo",
    descripcion: "Platos típicos y saludables.",
    imagen:
      "https://stronglify-1.s3.sa-east-1.amazonaws.com/vajillascorona/Como-definir-el-menu-de-un-restaurante_1.png",
  },
  {
    nombre: "Cena",
    descripcion: "Opciones ligeras y deliciosas.",
    imagen:
      "https://stronglify-1.s3.sa-east-1.amazonaws.com/vajillascorona/Como-definir-el-menu-de-un-restaurante_1.png",
  },
];

const especiales = [
  {
    nombre: "Ceviche Mestizo",
    descripcion: "Ceviche fresco con toques autóctonos.",
    imagen:
      "https://stronglify-1.s3.sa-east-1.amazonaws.com/vajillascorona/Como-definir-el-menu-de-un-restaurante_1.png",
  },
  {
    nombre: "Arroz Mestizo",
    descripcion: "Arroz con especias y mariscos.",
    imagen:
      "https://stronglify-1.s3.sa-east-1.amazonaws.com/vajillascorona/Como-definir-el-menu-de-un-restaurante_1.png",
  },
  {
    nombre: "Postre Mestizo",
    descripcion: "Dulces tradicionales reinventados.",
    imagen:
      "https://stronglify-1.s3.sa-east-1.amazonaws.com/vajillascorona/Como-definir-el-menu-de-un-restaurante_1.png",
  },
];

const Home: React.FC = () => {
  return (
    <Box sx={{ bgcolor: "#f5f5f5", minHeight: "100vh", fontFamily: "Roboto" }}>
      {/* Navbar */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ff6f00" }}>
            Restaurante Mestizo
          </Typography>
          <Box>
            <Button color="success">Menús</Button>
            <Button color="success">Platos Especiales</Button>
            <Button color="success">Contacto</Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ textAlign: "center", py: 10, bgcolor: "#fff3e0" }}>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <Typography variant="h3" sx={{ fontWeight: "bold", color: "#ff6f00", mb: 2 }}>
            Bienvenido a Restaurante Mestizo
          </Typography>
        </motion.div>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <Typography variant="h6" color="textSecondary">
            Disfruta de la fusión de sabores auténticos con un toque moderno y minimalista.
          </Typography>
        </motion.div>
      </Box>

      {/* Menús */}
      <Container sx={{ py: 10 }}>
        <Typography variant="h4" sx={{ fontWeight: "bold", textAlign: "center", mb: 6 ,color:"black"}}>
          Nuestros Menús
        </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
  {menus.map((menu, index) => (
    <Box key={index} sx={{ width: 300 }}>
      <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: 3,
                    borderRadius: 3,
                  }}
                >
                  <CardMedia
                    component="img"
                    height="180"
                    image={menu.imagen}
                    alt={menu.nombre}
                    sx={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                  />
                  <CardContent>
                    <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ff6f00" }}>
                      {menu.nombre}
                    </Typography>
                    <Typography color="textSecondary">{menu.descripcion}</Typography>
                  </CardContent>
                </Card>
              </motion.div>
            </Box>
          ))}
        </Box>
      </Container>

      {/* Platos Especiales */}
      <Box sx={{ py: 10, bgcolor: "#eeeeee" }}>
        <Container>
          <Typography variant="h4" sx={{ fontWeight: "bold", textAlign: "center", mb: 6,color:"black" }}>
            Platos Especiales
          </Typography>
              <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
        {especiales.map((plato, index) => (
          <Box key={index} sx={{ width: 300 }}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 }}
                >
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: 3,
                      borderRadius: 3,
                    }}
                  >
                    <CardMedia
                      component="img"
                      height="180"
                      image={plato.imagen}
                      alt={plato.nombre}
                      sx={{ borderTopLeftRadius: 12, borderTopRightRadius: 12 }}
                    />
                    <CardContent>
                      <Typography variant="h6" sx={{ fontWeight: "bold", color: "#ff6f00" }}>
                        {plato.nombre}
                      </Typography>
                      <Typography color="textSecondary">{plato.descripcion}</Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{ bgcolor: "#fff", py: 6, textAlign: "center" }}>
        <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
          Contacto
        </Typography>
        <Typography color="textSecondary">Calle 123, Ciudad, País</Typography>
        <Typography color="textSecondary">Teléfono: +57 123 456 7890</Typography>
        <Typography color="textSecondary" sx={{ mt: 2 }}>
          &copy; 2026 Restaurante Mestizo
        </Typography>
      </Box>
    </Box>
  );
};

export default Home;