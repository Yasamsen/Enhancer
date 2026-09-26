export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        message: "Parameter city wajib diisi",
        example: "/api/weather?city=Jakarta"
      });
    }

    const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;

    const response = await fetch(url);

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: "Gagal mengambil data cuaca"
      });
    }

    const data = await response.json();

    const current = data.current_condition?.[0];
    const area = data.nearest_area?.[0];

    if (!current) {
      return res.status(404).json({
        success: false,
        message: "Data cuaca tidak ditemukan"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        city: area?.areaName?.[0]?.value || city,
        country: area?.country?.[0]?.value || null,
        region: area?.region?.[0]?.value || null,

        temperature: {
          celsius: Number(current.temp_C),
          fahrenheit: Number(current.temp_F),
          feelsLikeCelsius: Number(current.FeelsLikeC),
          feelsLikeFahrenheit: Number(current.FeelsLikeF)
        },

        condition: current.weatherDesc?.[0]?.value || null,

        humidity: Number(current.humidity),
        cloudCover: Number(current.cloudcover),
        visibilityKm: Number(current.visibility),
        pressureMb: Number(current.pressure),
        windSpeedKph: Number(current.windspeedKmph),
        windDirection: current.winddir16Point,
        uvIndex: Number(current.uvIndex),

        observationTime: current.localObsDateTime
      }
    });

  } catch (error) {
    console.error("Weather Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat mengambil data cuaca",
      error: error.message
    });
  }
}