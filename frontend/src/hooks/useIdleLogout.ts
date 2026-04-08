import { useEffect, useRef } from "react";
import Swal from "sweetalert2";

interface Props {
  timeout?: number;
  warningTime?: number;
  onLogout: () => void;
}

export const useIdleLogout = ({
  timeout = 120 * 60 * 1000, // 2 horas de inactividad 
  warningTime = 120 * 1000, // 2 min antes
  onLogout,
}: Props) => {

  const timer = useRef<number | null>(null);
  const warningTimer = useRef<number | null>(null);
  const isWarningVisible = useRef(false);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);

    // ⏰ Advertencia antes de cerrar sesión
  warningTimer.current = window.setTimeout(() => {
  if (isWarningVisible.current) return; // 🔥 evita duplicados

  isWarningVisible.current = true;

  Swal.fire({
    title: "Sesión por expirar",
    text: "Serás desconectado por inactividad",
    icon: "warning",
    confirmButtonText: "Seguir activo",
    confirmButtonColor: "#1d4ed8",
  }).then((result) => {
    isWarningVisible.current = false;

    if (result.isConfirmed) {
      resetTimer(); // 🔄 reinicia si el usuario responde
    }
  });
}, timeout - warningTime);

    // 🚪 Logout automático
    timer.current = window.setTimeout(() => {
      onLogout();
    }, timeout);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "scroll", "click"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    resetTimer();

    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);
};