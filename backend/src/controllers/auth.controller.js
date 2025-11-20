import { authService } from "../services/auth.service.js";

export const register = async (req, res) => {
  try {
    const { nombre, email, password, rol, ...rest } = req.body;

    if (!nombre || !email || !password) {
      return res.status(400).json({ error: "nombre, email y password son requeridos" });
    }

    const user = await authService.register({ nombre, email, password, rol, ...rest });
    return res.status(201).json({ ok: true, user });

  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "email y password son requeridos" });
    }

    const data = await authService.login({ email, password });
    return res.json({ ok: true, ...data });

  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
};
