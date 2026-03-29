const express = require("express");
const router = express.Router();

const { imprimirFactura } = require("../services/imprimir.service.js");

router.post("/imprimir", async (req, res) => {
  try {
    const result = await imprimirFactura(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;