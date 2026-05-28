const express = require("express");
const router = express.Router();

const { status } = require("../services/imprimir.service.js");

router.get("/status", async (req, res) => {
  try {
    const result = await status();
    console.log("result",result);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;