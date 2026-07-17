import { Stack, Avatar, Typography, Box, Paper } from "@mui/material";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaymentsIcon from "@mui/icons-material/Payments";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import SavingsIcon from "@mui/icons-material/Savings";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";

export default function CajaMetricas({
  caja,
  formatCOP,
  onVentas,
  onEgresos,
  onArqueo,
  onCerrar
}: any) {

const CardStat = ({
  title,
  value,
  subtitle,
  icon,
  gradient,
  onClick,
}: any) => (
  <Paper
    elevation={0}
    onClick={onClick}
    sx={{
      position: "relative",
      overflow: "hidden",
      p: 2,
      borderRadius: "22px",
      background: "#fff",
      cursor: onClick ? "pointer" : "default",
      border: "1px solid rgba(15,23,42,0.06)",
      boxShadow: "0 8px 24px rgba(15,23,42,.05)",
      transition: ".25s",

      "&:hover": onClick && {
        transform: "translateY(-4px)",
        boxShadow: "0 15px 35px rgba(15,23,42,.10)",
      },
    }}
  >
    {/* Decoración */}
    <Box
      sx={{
        position: "absolute",
        top: -40,
        right: -40,
        width: 110,
        height: 110,
        borderRadius: "50%",
        background: gradient,
        opacity: .12,
      }}
    />

    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start"
    >
      <Box flex={1}>
        <Typography
          sx={{
            fontSize: 12,
            fontWeight: 700,
            color: "#64748B",
            textTransform: "uppercase",
          }}
        >
          {title}
        </Typography>

        <Typography
          sx={{
            mt: .5,
            fontWeight: 900,
            fontSize: 18,
            color: "#0F172A",
          }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            sx={{
              mt: .5,
              fontSize: 11,
              color: "#94A3B8",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>

      <Avatar
        sx={{
          width: 46,
          height: 46,
          background: gradient,
          boxShadow: "0 10px 20px rgba(0,0,0,.10)",

          "& svg": {
            fontSize: 22,
          },
        }}
      >
        {icon}
      </Avatar>
    </Stack>
  </Paper>
);

const cards = [
  {
    title: "Monto Inicial",
    value: formatCOP(caja?.monto_inicial),
    subtitle: "Base de apertura",
    icon: <MonetizationOnIcon />,
    gradient: "linear-gradient(135deg,#2563eb,#60a5fa)",
  },

  {
    title: "Recaudado",
    value: formatCOP(caja?.dinero_recaudado),
    subtitle: `Ventas ${formatCOP(caja?.total_ventas)}`,
    icon: <ShoppingCartIcon />,
    gradient: "linear-gradient(135deg,#16a34a,#4ade80)",
    click: onVentas,
  },

  {
    title: "Egresos",
    value: formatCOP(caja?.total_egresos),
    subtitle: "Dinero retirado",
    icon: <PaymentsIcon />,
    gradient: "linear-gradient(135deg,#dc2626,#f87171)",
    click: onEgresos,
  },

  {
    title: "Arqueo",
    value: "Ver detalle",
    subtitle: "Inventario y cierre",
    icon: <ReceiptLongIcon />,
    gradient: "linear-gradient(135deg,#d97706,#fbbf24)",
    click: onArqueo,
  },

  {
    title: "Cerrar Caja",
    value: "Finalizar",
    subtitle: "Cerrar jornada",
    icon: <SavingsIcon />,
    gradient: "linear-gradient(135deg,#7c3aed,#a78bfa)",
    click: onCerrar,
  },
];

return (
  <Box
  sx={{
    display: "flex",
    flexWrap: "wrap",
    gap: 1,
  }}
>
  {cards.map((card, index) => (
    <Box
      key={index}
      sx={{
        flex: {
          xs: "1 1 100%",
          sm: "1 1 calc(50% - 8px)",
          md: "1 1 calc(33.33% - 12px)",
          lg: "1 1 calc(20% - 10px)",
        },
      }}
    >
      <CardStat
        title={card.title}
        value={card.value}
        subtitle={card.subtitle}
        icon={card.icon}
        gradient={card.gradient}
        onClick={card.click}
      />
    </Box>
  ))}
</Box>
);
}