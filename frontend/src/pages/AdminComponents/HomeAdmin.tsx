import {
  Box,
  Typography,
  Paper,
  Avatar,
  Stack,
  Chip,
  Divider
} from "@mui/material";

import WavingHandIcon from "@mui/icons-material/WavingHand";


import BusinessIcon from "@mui/icons-material/Business";
import SettingsApplicationsIcon from "@mui/icons-material/SettingsApplications";
import PersonIcon from "@mui/icons-material/Person";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";

export default function HomeAdmin() {

  const nombre = localStorage.getItem("nombre") || "";
  const negocio =localStorage.getItem("nombre_negocio") || "Administración del Sistema";
  const tipoContexto =localStorage.getItem("tipo_contexto") || "SISTEMA";
  const imagen = localStorage.getItem("imagen") || "";
  const imagen_negocio = localStorage.getItem("imagen_negocio") || "";


  const cards = [
  {
    title: "Contexto",
    value:
      tipoContexto === "SISTEMA"
        ? "Administración del Sistema"
        : "Administración del Negocio",
    icon: <BusinessIcon />,
    color: "#2563eb",
  },
  {
    title: "Plataforma",
    value: "AdminBusiness v1.0",
    icon: <SettingsApplicationsIcon />,
    color: "#10b981",
  },
  {
    title: "Usuario",
    value: nombre,
    icon: <PersonIcon />,
    color: "#f59e0b",
  },
  {
    title: "Fecha",
    value: new Date().toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    icon: <CalendarMonthIcon />,
    color: "#ef4444",
  },
];

  return (
    <Box
       sx={{
    p: 2,
    minHeight: "80vh",
    bgcolor: "#F8FAFC",
  }}
    >
      {/* Bienvenida */}
 

<Paper
  elevation={0}
  sx={{
    position: "relative",
    overflow: "hidden",
    borderRadius: 4,
    p: { xs: 2, sm: 3, md: 4 },
    mb: 4,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: "#fff",
    boxShadow: "0 8px 30px rgba(15,23,42,.05)",

    "&::before": {
      content: '""',
      position: "absolute",
      top: 0,
      left: 0,
      width: 6,
      height: "100%",
      background:
        "linear-gradient(180deg,#2563EB,#3B82F6,#60A5FA)",
    },
  }}
>
  <Stack
    direction={{ xs: "column", lg: "row" }}
    spacing={{ xs: 3, md: 4 }}
    justifyContent="space-between"
    alignItems={{ xs: "center", lg: "flex-start" }}
  >
    {/* INFORMACIÓN */}
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={3}
      alignItems={{ xs: "center", sm: "center" }}
      sx={{ width: "100%" }}
    >
      <Avatar
        src={imagen}
        sx={{
          width: { xs: 60, sm: 70, md: 72 },
          height: { xs: 60, sm: 70, md: 72 },
          bgcolor: "#2563EB",
          fontSize: { xs: 24, md: 28 },
          fontWeight: 700,
          flexShrink: 0,
        }}
      />

      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          textAlign: { xs: "center", sm: "left" },
        }}
      >
        <Stack
          direction="row"
          spacing={1}
          justifyContent={{ xs: "center", sm: "flex-start" }}
          alignItems="center"
          mb={1}
        >
          <WavingHandIcon
            sx={{
              color: "#F59E0B",
              fontSize: 22,
            }}
          />

          <Typography
            sx={{
              fontWeight: 700,
              color: "#0F172A",
              fontSize: {
                xs: 24,
                sm: 28,
                md: 32,
              },
            }}
          >
            Hola, {nombre}
          </Typography>
        </Stack>

        <Typography
          color="text.secondary"
          sx={{
            mb: 2,
            fontSize: {
              xs: 13,
              sm: 14,
            },
          }}
        >
          Bienvenid@ al panel administrativo.
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ width: "100%" }}
        >
          <Chip
            avatar={
              <Avatar
                src={imagen_negocio}
                sx={{
                  width: 24,
                  height: 24,
                }}
              />
            }
            label={negocio}
            variant="outlined"
            sx={{
              width: { xs: "100%", sm: "auto" },
              justifyContent: "flex-start",
              height: 38,
              borderRadius: 3,
              fontWeight: 600,
            }}
          />

          <Chip
            label={tipoContexto}
            color="primary"
            sx={{
              width: { xs: "100%", sm: "auto" },
              height: 38,
              borderRadius: 3,
              fontWeight: 600,
            }}
          />
        </Stack>
      </Box>
    </Stack>

    {/* LATERAL */}
    <Stack
      spacing={1.5}
      alignItems={{
        xs: "center",
        lg: "flex-end",
      }}
      sx={{
        width: {
          xs: "100%",
          lg: "auto",
        },
      }}
    >
      <Typography
        variant="body2"
        color="text.secondary"
      >
        Hoy
      </Typography>

      <Typography
        sx={{
          fontWeight: 700,
          fontSize: {
            xs: 15,
            sm: 17,
          },
          textAlign: {
            xs: "center",
            lg: "right",
          },
        }}
      >
        {new Date().toLocaleDateString("es-CO", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </Typography>

      <Divider
        sx={{
          width: {
            xs: "100%",
            sm: 220,
          },
        }}
      />

      <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        justifyContent={{
          xs: "center",
          lg: "flex-end",
        }}
      >
        <CalendarMonthIcon color="primary" />

        <Typography
          color="text.secondary"
          fontSize={14}
        >
          Panel Administrativo
        </Typography>
      </Stack>
    </Stack>
  </Stack>
</Paper>



<Box
  sx={{
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(4, 1fr)",
      lg: "repeat(4, 1fr)",
    },
    gap: 3,
  }}
>
  {cards.map((item) => (
    <Paper
      key={item.title}
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "#E8EDF5",
        bgcolor: "#fff",
        position: "relative",
        overflow: "hidden",
        transition: "all .25s ease",

        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 20px 40px rgba(15,23,42,.08)",
          borderColor: item.color,
        },
      }}
    >
      {/* Barra superior */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: 4,
          bgcolor: item.color,
        }}
      />

      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="flex-start"
      >
        <Box>
          <Typography
            sx={{
              color: "#64748B",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            {item.title}
          </Typography>

          <Typography
            sx={{
              mt: 1.5,
              fontSize: 14,
              fontWeight: 700,
              color: "#0F172A",
              lineHeight: 1.3,
            }}
          >
            {item.value}
          </Typography>
        </Box>

        <Avatar
          sx={{
            width: 52,
            height: 52,
            background: `${item.color}15`,
            color: item.color,
          }}
        >
          {item.icon}
        </Avatar>
      </Box>

      <Box
        mt={3}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <Typography
          variant="caption"
          color="text.secondary"
        >
          Información
        </Typography>

        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: item.color,
          }}
        />
      </Box>
    </Paper>
  ))}
</Box>

<Paper
  elevation={0}
  sx={{
    mt: 1,
    borderRadius: 5,
    border: "1px solid",
    borderColor: "#E5E7EB",
    overflow: "hidden",
    bgcolor: "#fff",
    boxShadow: "0 10px 30px rgba(15,23,42,.04)",
  }}
>
  <Box
    sx={{
      display: "flex",
      flexDirection: {
        xs: "column",
        md: "row",
      },
      alignItems: "center",
    }}
  >
    {/* Información */}
 <Box
  sx={{
    flex: 1,
    p: 5,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}
>
  <Chip
    label="AdminBusiness"
    color="primary"
    size="small"
    sx={{
      alignSelf: "flex-start",
      mb: 3,
      px: 1,
      fontWeight: 700,
      borderRadius: 2,
    }}
  />

  <Typography
    variant="h5"
    sx={{
      fontWeight: 800,
      lineHeight: 1.15,
      color: "#0F172A",
      maxWidth: 520,
    }}
  >
    Bienvenido a
    <Box
      component="span"
      sx={{
        color: "#9e9e9e",
      }}
    >
      {" "}
      AdminBusiness
    </Box>
  </Typography>

  <Typography
    sx={{
      mt: 3,
      color: "#64748B",
      fontSize: 16,
      lineHeight: 1.9,
      maxWidth: 620,
    }}
  >
    Plataforma integral para la administración de empresas,
    usuarios y procesos. Centralice la información de su
    organización desde un único lugar con una interfaz moderna,
    segura y diseñada para optimizar la productividad.
  </Typography>

  <Stack
    direction="row"
    spacing={2}
    flexWrap="wrap"
    mt={4}
  >
    <Chip
      label="✓ Plataforma Activa"
      color="success"
      sx={{
        fontWeight: 600,
        borderRadius: 3,
      }}
    />

    <Chip
      label="Versión 1.0.0"
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderRadius: 3,
      }}
    />

    <Chip
      label="Disponible 24/7"
      variant="outlined"
      sx={{
        fontWeight: 600,
        borderRadius: 3,
      }}
    />
  </Stack>

  <Box
    sx={{
      mt: 5,
      display: "flex",
      gap: 4,
      flexWrap: "wrap",
    }}
  >
    <Box>
      <Typography
        variant="h4"
        fontWeight={700}
        color="primary"
      >
        100%
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        Plataforma web
      </Typography>
    </Box>

    <Box>
      <Typography
        variant="h4"
        fontWeight={700}
        color="primary"
      >
        24/7
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        Disponibilidad
      </Typography>
    </Box>

    <Box>
      <Typography
        variant="h4"
        fontWeight={700}
        color="primary"
      >
        1.0
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
      >
        Versión actual
      </Typography>
    </Box>
  </Box>
</Box>

{/* Imagen */}
<Box
  sx={{
    flex: 1,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    bgcolor: "#F8FAFC",
    p: 5,
    position: "relative",
    overflow: "hidden",

    "&::before": {
      content: '""',
      position: "absolute",
      width: 360,
      height: 360,
      borderRadius: "50%",
      background:
        "radial-gradient(circle, rgba(37,99,235,.10) 0%, rgba(37,99,235,0) 70%)",
    },

    "&::after": {
      content: '""',
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: "50%",
      top: 25,
      right: 40,
      bgcolor: "rgba(37,99,235,.04)",
    },
  }}
>
  <Stack
    spacing={3}
    alignItems="center"
    sx={{
      position: "relative",
      zIndex: 1,
      width: "100%",
      maxWidth: 360,
    }}
  >
    <Paper
      elevation={0}
      sx={{
        width: 220,
        height: 220,
        borderRadius: 6,
        bgcolor: "rgba(255,255,255,.75)",
        backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "0 20px 45px rgba(15,23,42,.08)",
        transition: ".3s",

        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: "0 28px 55px rgba(15,23,42,.12)",
        },
      }}
    >
      <Box
        component="img"
        src={imagen_negocio || "/logo-adminbusiness.png"}
        alt={negocio}
        sx={{
          width: "70%",
          maxHeight: 140,
          objectFit: "contain",
        }}
      />
    </Paper>

    <Stack spacing={0.5} alignItems="center">
      <Typography
        variant="h5"
        fontWeight={700}
        textAlign="center"
      >
        {negocio || "AdminBusiness"}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        textAlign="center"
      >
        Organización activa
      </Typography>

      <Box
        sx={{
          mt: 1,
          px: 2,
          py: 0.6,
          borderRadius: 10,
          bgcolor: "#ECFDF5",
          color: "#16A34A",
          fontWeight: 600,
          fontSize: 13,
        }}
      >
        ● Conectado
      </Box>
    </Stack>
  </Stack>
</Box>
  </Box>
</Paper>


    </Box>
  );
};

