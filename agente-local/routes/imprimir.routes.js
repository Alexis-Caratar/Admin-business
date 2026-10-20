const express = require("express");
const router = express.Router();

const agente = require("../socket.client");

router.get("/status", async (req, res) => {
  try {
    res.json(agente.estado());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;