export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    const response = await fetch(
      "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json",
      {
        headers: {
          "Accept": "application/json"
        }
      }
    );

    if (!response.ok) {
      return res.status(response.status).json({
        status: false,
        source: "BMKG",
        message: "BMKG menolak request",
        http_status: response.status
      });
    }

    const json = await response.json();
    const gempa = json?.Infogempa?.gempa;

    if (!gempa) {
      return res.status(502).json({
        status: false,
        source: "BMKG",
        message: "Data gempa BMKG tidak ditemukan"
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
        wilayah: gempa.Wilayah,
        potensi: gempa.Potensi,
        dirasakan: gempa.Dirasakan,
        shakemap: gempa.Shakemap
          ? `https://static.bmkg.go.id/${gempa.Shakemap}`
          : null
      }
    });

  } catch (error) {
    console.error("BMKG ERROR:", error);

    return res.status(502).json({
      status: false,
      source: "BMKG",
      message: "Gagal mengambil data BMKG",
      error: error.message
    });
  }
}