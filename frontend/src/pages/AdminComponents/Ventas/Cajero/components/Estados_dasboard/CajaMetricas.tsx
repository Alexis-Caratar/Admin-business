import { Card, CardContent, Stack, Avatar, Typography, Box } from "@mui/material";
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

  const items = [
    {
      label: "Monto inicial",
      value: caja?.monto_inicial,
      icon: <MonetizationOnIcon />,
      color: "primary.light"
    },
      {
      label: "Ventas / Recaudado",
      value: caja?.total_ventas,
      extra: caja?.dinero_recaudado,
      icon: <ShoppingCartIcon />,
      color: "#7c4dff",
      click: onVentas
    },
    {
      label: "Egresos",
      value: caja?.total_egresos,
      icon: <PaymentsIcon />,
      color: "error.light",
      click: onEgresos
    },
    {
      label: "Arqueo",
      value: null,
      icon: <ReceiptLongIcon />,
      color: "warning.light",
      click: onArqueo
    },
    {
      label: "Cerrar Caja",
      value: null,
      icon: <SavingsIcon />,
      color: "error.light",
      click: onCerrar
    }
  ];

  return (
  <Box display="flex" flexWrap="wrap" gap={2}>
  {items.map((item, i) => (
    <Box
      key={i}
      flex="1 1 calc(100% - 16px)"        // xs: full width
      sx={{
        '@media (min-width:600px)': { flex: '1 1 calc(50% - 16px)' },   // sm: 2 por fila
        '@media (min-width:900px)': { flex: '1 1 calc(25% - 16px)' },   // md: 4 por fila
      }}
    >
      <Card
        onClick={item.click}
        sx={{
          borderRadius: 3,
          cursor: item.click ? "pointer" : "default",
          boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
          transition: "all .2s ease",
          "&:hover": item.click && {
            transform: "translateY(-3px)",
            boxShadow: "0 10px 20px rgba(0,0,0,0.12)"
          }
        }}
      >
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar sx={{ bgcolor: item.color, width: 44, height: 44 }}>
              {item.icon}
            </Avatar>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                {item.label}
              </Typography>
              <Typography fontWeight={700} fontSize={16}>
                {item.extra != null && item.value != null
                  ? `${formatCOP(item.value)} - ${formatCOP(item.extra)}`
                  : item.value != null
                  ? formatCOP(item.value)
                  : ""}
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  ))}
</Box>
  );
}