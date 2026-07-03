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
  text: string;
}

export default function ChatBot() {

  const [open, setOpen] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  const [mensaje, setMensaje] = useState<string>("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      from: "bot",
      text: "Hola 👋 Soy el asistente virtual de AdminBusiness. ¿En qué puedo ayudarte?"
    }
  ]);

  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {

    scrollRef.current?.scrollIntoView({
      behavior: "smooth"
    });

  }, [messages]);

  const enviar = async () => {

    if (!mensaje.trim() || loading) return;

    const texto = mensaje.trim();

    setMessages(prev => [
      ...prev,
      {
        from: "user",
        text: texto
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

      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          text: data.ok
            ? data.respuesta
            : data.error ?? "No fue posible obtener una respuesta."
        }
      ]);

    } catch (error) {

      setMessages(prev => [
        ...prev,
        {
          from: "bot",
          text: "❌ Ocurrió un error al comunicarme con el servidor."
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
          color="primary"
          onClick={() => setOpen(true)}
          sx={{
            position: "fixed",
            bottom:20,
            right: 40
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
              bgcolor: "#1976d2",
              color: "white",
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >

            <Box display="flex" alignItems="center" gap={1}>

              <Avatar>

                <ChatIcon />

              </Avatar>

              <Box>

                <Typography fontWeight="bold">

                  AdminBusiness IA

                </Typography>

                <Typography fontSize={12}>

                  En línea

                </Typography>

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
              p: 2,
              overflowY: "auto",
              bgcolor: "#f5f5f5"
            }}
          >

            {messages.map((m, index) => (

              <Box
                key={index}
                display="flex"
                justifyContent={
                  m.from === "user"
                    ? "flex-end"
                    : "flex-start"
                }
                mb={2}
              >

                <Box
                  display="flex"
                  gap={1}
                  alignItems="flex-end"
                  flexDirection={
                    m.from === "user"
                      ? "row-reverse"
                      : "row"
                  }
                >

                  <Avatar
                    sx={{
                      width: 32,
                      height: 32
                    }}
                  >
                    {m.from === "user"
                      ? <PersonIcon />
                      : <ChatIcon />}
                  </Avatar>

                  <Paper
                    sx={{
                      p: 1.5,
                      maxWidth: 240,
                      bgcolor:
                        m.from === "user"
                          ? "#1976d2"
                          : "white",
                      color:
                        m.from === "user"
                          ? "white"
                          : "black"
                    }}
                  >

                    {m.text}

                  </Paper>

                </Box>

              </Box>

            ))}

            {loading && (

              <Box display="flex" gap={1}>

                <CircularProgress size={18} />

                <Typography>

                  Escribiendo...

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
            />

            <IconButton
              color="primary"
              disabled={loading}
              onClick={enviar}
            >
              <SendIcon />
            </IconButton>

          </Box>

        </Paper>

      )}

    </>
  );


}