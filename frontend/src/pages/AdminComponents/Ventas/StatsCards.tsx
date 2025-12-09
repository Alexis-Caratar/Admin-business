// StatsCards.tsx
import React from "react";
import { Grid, Paper, Typography, Skeleton } from "@mui/material";

interface Props {
  stats: {
    totalVentas: number;
    totalDinero: number;
    ventaMayor: number;
  };
  loading: boolean;
}

const CardStat = ({
  title,
  value,
  loading,
}: {
  title: string;
  value: string | number;
  loading: boolean;
}) => (
  <Paper
    elevation={3}
    style={{
      padding: 20,
      borderRadius: 16,
      textAlign: "center",
      height: "100%",
    }}
  >
    <Typography variant="subtitle1" sx={{ opacity: 0.7 }}>
      {title}
    </Typography>

    {loading ? (
      <Skeleton variant="text" height={40} />
    ) : (
      <Typography variant="h4" fontWeight={700}>
        {value}
      </Typography>
    )}
  </Paper>
);

const StatsCards: React.FC<Props> = ({ stats, loading }) => {
  return (
    <Grid container spacing={2} mb={3}>
      <Grid size={4}>
        <CardStat
          title="Total Ventas"
          value={stats.totalVentas}
          loading={loading}
        />
      </Grid>

      <Grid size={4}>
        <CardStat
          title="Total Dinero"
          value={`$${stats.totalDinero.toLocaleString()}`}
          loading={loading}
        />
      </Grid>

      <Grid size={4}>
        <CardStat
          title="Venta Mayor"
          value={`$${stats.ventaMayor.toLocaleString()}`}
          loading={loading}
        />
      </Grid>
    </Grid>
  );
};

export default StatsCards;
