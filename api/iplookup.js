export default async function handler(req, res) {
  try {
    const { ip } = req.query;

    // Jika IP tidak diberikan, ambil IP dari request
    const clientIp =
      ip ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.socket?.remoteAddress;

    if (!clientIp) {
      return res.status(400).json({
        success: false,
        message: "IP address tidak ditemukan"
      });
    }

    // Bersihkan IPv6 localhost / IPv4-mapped IPv6
    const cleanIp = clientIp
      .replace(/^::ffff:/, "")
      .replace(/^::1$/, "127.0.0.1");

    const response = await fetch(
      `https://ipapi.co/${encodeURIComponent(cleanIp)}/json/`
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(400).json({
        success: false,
        message: data.reason || "Gagal melakukan IP lookup"
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ip: data.ip,
        city: data.city,
        region: data.region,
        regionCode: data.region_code,
        country: data.country_name,
        countryCode: data.country_code,
        continentCode: data.continent_code,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone,
        utcOffset: data.utc_offset,
        postal: data.postal,
        callingCode: data.country_calling_code,
        currency: data.currency,
        isp: data.org,
        organization: data.org,
        asn: data.asn,
        network: data.network
      }
    });

  } catch (error) {
    console.error("IP Lookup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat melakukan IP lookup",
      error: error.message
    });
  }
}