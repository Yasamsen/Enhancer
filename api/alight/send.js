const axios = require("axios");

const API_KEY = "ptz";

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        status: false,
        message: "Method not allowed"
      });
    }

    const email = req.body?.email || req.query?.email;

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Parameter email wajib diisi"
      });
    }

    const body = new URLSearchParams({
      apikey: API_KEY,
      email: String(email)
    }).toString();

    const response = await axios.post(
      "https://putzoffc.vercel.app/api/alight/send",
      body,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "application/json",
          "User-Agent": "Mozilla/5.0"
        },
        timeout: 15000
      }
    );

    return res.status(response.status).json(response.data);

  } catch (error) {
    console.error("ALIGHT SEND ERROR:", error);

    return res.status(error.response?.status || 502).json(
      error.response?.data || {
        status: false,
        message: "Gagal terhubung ke server AmPrem",
        error: error.message
      }
    );
  }
};