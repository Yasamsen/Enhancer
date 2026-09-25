const axios = require("axios");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    const response = await axios.get(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
      {
        timeout: 10000
      }
    );

    const gempa = response.data?.Infogempa?.gempa;

    if (!gempa) {
      return res.status(502).json({
        status: false,
        message: "Data gempa dari BMKG tidak tersedia"
      });
    }

    return res.status(200).json({
      status: true,
      source: "BMKG",
      data: {
        tanggal: gempa.Tanggal,
        jam: gempa.Jam,
        datetime: gempa.DateTime,
        magnitude: gempa.Magnitude,
        kedalaman: gempa.Kedalaman,
        koordinat: gempa.Coordinates,
        lintang: gempa.Lintang,
        bujur: gempa.Bujur,
        lokasi: gempa.Wilayah,
        potensi: gempa.Potensi,
        dirasakan: gempa.Dirasakan,
        shakemap: gempa.Shakemap
          ? `https://static.bmkg.go.id/${gempa.Shakemap}`
          : null
      }
    });
  } catch (error) {
    console.error("BMKG Error:", error.message);

    return res.status(502).json({
      status: false,
      message: "Gagal mengambil data gempa dari BMKG"
    });
  }
};