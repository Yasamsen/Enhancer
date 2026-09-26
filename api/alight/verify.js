import axios from "axios";

const API_KEY = "ptz";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({
        status: false,
        message: "Method not allowed"
      });
    }

    const email = req.body?.email || req.query?.email;
    const link = req.body?.link || req.query?.link;

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
      apikey: API_KEY,
      email: String(email),
      link: String(link)
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
    console.error("ALIGHT VERIFY ERROR:", error);

    return res.status(error.response?.status || 502).json(
      error.response?.data || {
        status: false,
        message: "Gagal terhubung ke server AmPrem",
        error: error.message
      }
    );
  }
}