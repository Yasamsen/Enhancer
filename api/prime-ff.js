import axios from "axios";

function formatRupiah(angka) {
  return (
    "Rp " +
    Math.round(angka)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  );
}

async function hitungPrimeFF(poinPrime) {
  const poin = parseInt(
    String(poinPrime).replace(/[^0-9]/g, ""),
    10
  );

  if (!poin || poin <= 0) {
    return {
      status: false,
      message: "Jumlah Poin Prime tidak valid."
    };
  }

  let rate = 126;

  try {
    const response = await axios.get(
      "https://rifqistore.com/id/calculator-free-fire",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
        },
        timeout: 15000
      }
    );

    const html = response.data;

    const matchRate =
      html.match(
        /(?:Rp\s*|harga[:\s]*)(\d+)\s*\/\s*(?:1)?(?:dm|diamond)/i
      ) ||
      html.match(/(\d+)\s*\/\s*1dm/i) ||
      html.match(/rate\s*[:=]\s*(\d+)/i);

    if (matchRate?.[1]) {
      rate = parseInt(matchRate[1], 10);
    }
  } catch (error) {
    console.error("Scraping rate gagal:", error.message);
  }

  const totalDiamond = poin;
  const totalHarga = totalDiamond * rate;

  return {
    status: true,
    data: {
      poin_prime: poin,
      total_diamond: totalDiamond.toLocaleString("id-ID"),
      harga_per_dm: rate,
      total_harga: totalHarga,
      formatted_harga: formatRupiah(totalHarga)
    }
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  const { poin } = req.query;

  if (!poin) {
    return res.status(400).json({
      status: false,
      message: "Parameter poin wajib diisi.",
      example: "/api/prime-ff?poin=12900"
    });
  }

  try {
    const result = await hitungPrimeFF(poin);

    return res.status(200).json(result);
  } catch (error) {
    console.error("Prime FF Error:", error);

    return res.status(500).json({
      status: false,
      message: "Gagal memproses Prime Free Fire.",
      error: error.message
    });
  }
}