import { Card, CardContent, Stack, Avatar, Typography, Chip, Box } from "@mui/material";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import LockIcon from "@mui/icons-material/Lock";

export default function CajaEstado({ cajaAbierta }: any) {
  return (
    <Card sx={{ borderRadius: 4, boxShadow: "0 8px 24px rgba(0,0,0,0.08)", p: 1 }}>
      <CardContent>
        <Stack spacing={2}>

          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              sx={{
                bgcolor: cajaAbierta ? "success.light" : "error.light",
                width: 48,
                height: 48
              }}
            >
              {cajaAbierta
                ? <LockOpenIcon sx={{ color: "success.dark" }} />
                : <LockIcon sx={{ color: "error.dark" }} />}
            </Avatar>

            <Box flex={1}>
              <Typography fontWeight={700}>Caja del día</Typography>

              <Chip
                label={cajaAbierta ? "Caja Abierta" : "Caja Cerrada"}
                color={cajaAbierta ? "success" : "error"}
                size="small"
              />
            </Box>

          </Stack>

        </Stack>
      </CardContent>
    </Card>
  );
}