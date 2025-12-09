import React from "react";
import { Grid, Card, Typography, Box, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RestaurantIcon from "@mui/icons-material/Restaurant";
import EventSeatIcon from "@mui/icons-material/EventSeat";

type Mesa = { id: number; numero: number; estado: string };

type Props = {
    mesas: Mesa[];
    onSelect: (m: Mesa) => void;
};

export const Mesas: React.FC<Props> = ({ mesas, onSelect }) => {

    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case "Disponible":
                return { color: "success", icon: <CheckCircleIcon sx={{ fontSize: 28, color: "#2e7d32" }} />, bg: "#e8f5e9", chipColor: "success" };
            case "Ocupada":
                return { color: "error", icon: <RestaurantIcon sx={{ fontSize: 28, color: "#c62828" }} />, bg: "#ffebee", chipColor: "error" };
            case "Reservada":
                return { color: "warning", icon: <EventSeatIcon sx={{ fontSize: 28, color: "#d84315" }} />, bg: "#fff3e0", chipColor: "warning" };
            default:
                return { color: "default", icon: null, bg: "#eeeeee", chipColor: "default" };
        }
    };

    return (
        <Box>
            <Typography variant="h6" fontWeight="bold" mb={2}>
                Mesas del Restaurante
            </Typography>

            <Grid container spacing={2}>
                {mesas.map((mesa) => {
                    const config = getEstadoConfig(mesa.estado);

                    return (
                        <Grid item xs={6} sm={4} md={2} key={mesa.id}>
                            <Card
                                onClick={() => onSelect(mesa)}
                                sx={{
                                    p: 2,
                                    textAlign: "center",
                                    borderRadius: 3,
                                    cursor: "pointer",
                                    height: 120,
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "center",
                                    alignItems: "center",
                                    background: config.bg,
                                    boxShadow: 2,
                                    transition: "0.25s",
                                    "&:hover": {
                                        boxShadow: 6,
                                        transform: "translateY(-4px)",
                                    },
                                }}
                            >
                                <Box mb={1}>{config.icon}</Box>
                                <Typography variant="h6" fontWeight="bold">
                                    Mesa {mesa.numero}
                                </Typography>
                                <Chip label={mesa.estado} color={config.chipColor} size="small" sx={{ mt: 1, fontWeight: "bold" }} />
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Box>
    );
};
