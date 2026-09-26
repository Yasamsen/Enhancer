const axios = require("axios");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    const { apikey, email, link } = req.body || {};

    if (!apikey) {
      return res.status(400).json({
        status: false,
        message: "Parameter apikey wajib diisi"
      });
    }

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Parameter email wajib diisi"
      });
    }

    if (!link) {
      return res.status(400).json({
        status: false,
        message: "Parameter link wajib diisi"
      });
    }

    const body = new URLSearchParams({
      apikey,
      email,
      link
    }).toString();

    const response = await axios.post(
      "https://putzoffc.vercel.app/api/alight/verify",
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
    console.error("Alight Verify Error:", error.message);

    if (error.response) {
      return res.status(error.response.status).json(
        error.response.data || {
          status: false,
          message: "Request ke server Alight gagal"
        }
      );
    }

    return res.status(502).json({
      status: false,
      message: "Gagal terhubung ke server Alight",
      error: error.message
    });
  }
};