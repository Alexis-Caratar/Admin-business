import { useState, useRef, useEffect } from "react";
import {
  Fab,
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  CircularProgress
} from "@mui/material";

import ChatIcon from "@mui/icons-material/SmartToy";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";

interface ChatMessage {
  from: "user" | "bot";
  tipo: "texto" | "tabla" | "tarjetas" | "categorias" | "ranking";
  titulo?: string;
  mensaje: string;
  data?: any;
}
export default function ChatBot() {

  const [open, setOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      tipo: "texto",
      mensaje: "Hola 👋 Soy el asistente virtual de AdminBusiness."
    }
  ]);

  const DEFAULT_AVATAR =
    "https://e7.pngegg.com/pngimages/340/946/png-clipart-avatar-user-computer-icons-software-developer-avatar-child-face-thumbnail.png";

  const imagen = localStorage.getItem("imagen") || DEFAULT_AVATAR;

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    scrollRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);

  const enviar = async () => {

    if (!mensaje.trim() || loading) return;

    const texto = mensaje.trim();

    setMessages((prev) => [
      ...prev,
      {
        from: "user",
        tipo: "texto",
        mensaje: texto
      }
    ]);
    setMensaje("");

    setLoading(true);

    try {

      const response = await fetch(
        "http://192.168.80.25:4000/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            mensaje: texto
          })
        }
      );

      const data = await response.json();

      const ia = data.respuesta;

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          tipo: ia.tipo,
          titulo: ia.titulo,
          mensaje: ia.mensaje,
          data: ia.data
        }
      ]);
    } catch (error) {

      setMessages((prev) => [
        ...prev,
        {
          from: "bot",
          tipo: "texto",
          mensaje: "❌ Ocurrió un error al comunicarme con el servidor."
        }
      ]);

    } finally {

      setLoading(false);

    }

  };
  return (
    <>

      {!open && (

        <Fab
          color="success"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 80,
            top: 800,
            bgcolor: "#10B981"
          }}
        >
          <ChatIcon />
        </Fab>

      )}

      {open && (

        <Paper
          elevation={10}
          sx={{
            position: "fixed",
            bottom: 20,
            right: 20,
            width: 380,
            height: 600,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 3,
            zIndex: (theme) => theme.zIndex.modal + 1,
          }}
        >

          <Box
            sx={{
              background:
                "linear-gradient(135deg,#2563EB 0%, #10B981 100%)",
              color: "#fff",
              px: 2.5,
              py: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >





            <Box display="flex" alignItems="center" gap={1.5}>

              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,.18)",
                  width: 42,
                  height: 42
                }}
              >
                <ChatIcon />
              </Avatar>

              <Box display="flex" flexDirection="column">

                <Typography
                  fontWeight={700}
                  fontSize={14}
                  lineHeight={1.2}
                >
                  AdminBusiness IA
                </Typography>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={0.8}
                  mt={0.3}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: "#34D399",
                      boxShadow: "0 0 8px rgba(52,211,153,.8)"
                    }}
                  />

                  <Typography
                    fontSize={12}
                    sx={{
                      opacity: .9,
                      fontWeight: 500
                    }}
                  >
                    En línea
                  </Typography>

                </Box>

              </Box>



            </Box>

            <IconButton
              onClick={() => setOpen(false)}
              sx={{ color: "white" }}
            >
              <CloseIcon />
            </IconButton>

          </Box>

          <Box
            sx={{
              flex: 1,
              px: 2,
              py: 2,
              overflowY: "auto",
              bgcolor: "#F8FAFC",
            }}
          >
            {messages.map((m, index) => (
              <Box
                key={index}
                display="flex"
                justifyContent={m.from === "user" ? "flex-end" : "flex-start"}
                mb={2}
              >
                <Box
                  display="flex"
                  gap={1}
                  alignItems="flex-end"
                  flexDirection={m.from === "user" ? "row-reverse" : "row"}
                >
                  <Avatar
                    src={m.from === "user" ? imagen : undefined}
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: m.from === "user" ? "#2563EB" : "#10B981",
                      fontSize: 18,
                    }}
                  >
                    {m.from === "user"
                      ? <PersonIcon fontSize="small" />
                      : <ChatIcon fontSize="small" />}
                  </Avatar>

                  <Paper
                    elevation={0}
                    sx={{
                      px: 2,
                      py: 1.5,
                      maxWidth: 290,
                      borderRadius:
                        m.from === "user"
                          ? "18px 18px 6px 18px"
                          : "18px 18px 18px 6px",
                      bgcolor:
                        m.from === "user"
                          ? "#2563EB"
                          : "#FFFFFF",
                      color:
                        m.from === "user"
                          ? "#FFFFFF"
                          : "#334155",
                      border:
                        m.from === "bot"
                          ? "1px solid #E2E8F0"
                          : "none",
                      boxShadow: "0 3px 12px rgba(15,23,42,.06)"
                    }}
                  >

                    {m.tipo === "texto" && (

                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: 13,
                          lineHeight: 1.7
                        }}
                      >
                        {m.mensaje}
                      </Typography>

                    )}

                    {m.tipo === "tabla" && (

                      <>
                        <Typography
                          fontWeight={600}
                          mb={1}
                        >
                          {m.titulo}
                        </Typography>

                        <Typography
                          fontSize={11}
                          mb={1}
                        >
                          {m.mensaje}
                        </Typography>

                        {m.data.productos.map((p: any) => (

                          <Box
                            key={p.id}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              px: 1.5,
                              py: 1,
                              mb: 1,
                              borderRadius: 2,
                              bgcolor: "#F8FAFC",
                              border: "1px solid #E2E8F0",
                              transition: ".2s",
                              "&:hover": {
                                bgcolor: "#EFF6FF",
                                borderColor: "#BFDBFE",
                                transform: "translateY(-1px)"
                              }
                            }}
                          >

                            <Box>

                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: "#1E293B"
                                }}
                              >
                                {p.nombre}
                              </Typography>

                              <Typography
                                sx={{
                                  fontSize: 11,
                                  color: "#64748B"
                                }}
                              >
                                Producto
                              </Typography>

                            </Box>

                            <Box
                              sx={{
                                minWidth: 52,
                                px: 1.2,
                                py: .4,
                                borderRadius: 10,
                                bgcolor:
                                  p.stock_actual > 10
                                    ? "#DCFCE7"
                                    : p.stock_actual > 0
                                      ? "#FEF3C7"
                                      : "#FEE2E2",
                                color:
                                  p.stock_actual > 10
                                    ? "#15803D"
                                    : p.stock_actual > 0
                                      ? "#B45309"
                                      : "#DC2626",
                                textAlign: "center"
                              }}
                            >

                              <Typography
                                sx={{
                                  fontSize: 13,
                                  fontWeight: 700
                                }}
                              >
                                {p.stock_actual}
                              </Typography>

                            </Box>

                          </Box>

                        ))}

                      </>

                    )}

                    {m.tipo === "tarjetas" && (

                      <>
                        <Typography
                          fontWeight={500}
                          mb={2}
                        >
                          {m.titulo}
                        </Typography>

                        <Box
                          display="grid"
                          gridTemplateColumns="1fr 1fr"
                          gap={1}
                        >

                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 2
                            }}
                          >

                            <Typography
                              fontSize={10}
                              color="text.secondary"
                            >
                              Ventas
                            </Typography>

                            <Typography
                              fontWeight={700}
                              fontSize={12}
                            >
                              {m.data.resumen.cantidad}
                            </Typography>

                          </Paper>

                          <Paper
                            variant="outlined"
                            sx={{
                              p: 1.5,
                              borderRadius: 2
                            }}
                          >

                            <Typography
                              fontSize={11}
                              color="text.secondary"
                            >
                              Total
                            </Typography>

                            <Typography
                              fontWeight={700}
                              fontSize={12}
                            >
                              ${m.data.resumen.total.toLocaleString("es-CO")}
                            </Typography>

                          </Paper>

                        </Box>

                      </>

                    )}

                  </Paper>
                </Box>
              </Box>
            ))}

            {loading && (
              <Box
                display="flex"
                alignItems="center"
                gap={1.2}
                sx={{ ml: 5 }}
              >
                <CircularProgress
                  size={16}
                  thickness={5}
                  sx={{ color: "#10B981" }}
                />

                <Typography
                  sx={{
                    fontSize: "12px",
                    color: "#64748B",
                  }}
                >
                  AdminBusiness está escribiendo...
                </Typography>
              </Box>
            )}

            <div ref={scrollRef} />
          </Box>

          <Box
            p={1.5}
            display="flex"
            gap={1}
          >

            <TextField
              fullWidth
              size="small"
              placeholder="Escribe un mensaje..."
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              sx={{

                "& .MuiOutlinedInput-root": {

                  borderRadius: "30px",

                  background: "#fff",

                  "& fieldset": {

                    borderColor: "#D6E4F0"

                  },

                  "&:hover fieldset": {

                    borderColor: "#2563EB"

                  },

                  "&.Mui-focused fieldset": {

                    borderColor: "#10B981",

                    borderWidth: 2

                  }

                }

              }}
            />

            <IconButton
              sx={{
                width: 48,
                height: 48,
                background:
                  "linear-gradient(135deg,#2563EB,#10B981)",
                color: "#fff",
                transition: ".25s",

                "&:hover": {

                  transform: "scale(1.05)",

                  background:
                    "linear-gradient(135deg,#1D4ED8,#059669)"

                },

                "&:disabled": {

                  background: "#CBD5E1",
                  color: "#94A3B8"

                }

              }}
            >
              <SendIcon />
            </IconButton>

          </Box>

        </Paper>

      )}

    </>
  );


}