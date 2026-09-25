/**
 * Judul : Kalkulator Prime Free Fire
 * Base Url : https://rifqistore.com/
 * Author : Melvin
 * Deskripsi : Kalkulator Free Fire untuk mengonversi jumlah
 * Poin Prime menjadi estimasi total diamond dan harga rupiah.
 */

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

  if (isNaN(poin) || poin <= 0) {
    return {
      status: false,
      message: "Jumlah Poin Prime tidak valid."
    };
  }

  const url = "https://rifqistore.com/id/calculator-free-fire";

  // Rate default jika scraping gagal
  let rate = 126;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      }
    });

    const html = await res.text();

    const matchRate =
      html.match(
        /(?:Rp\s*|harga[:\s]*)(\d+)\s*\/\s*(?:1)?(?:dm|diamond)/i
      ) ||
      html.match(/(\d+)\s*\/\s*1dm/i) ||
      html.match(/rate\s*[:=]\s*(\d+)/i);

    if (matchRate && matchRate[1]) {
      rate = parseInt(matchRate[1], 10);
    }
  } catch (err) {
    // Tetap menggunakan rate default
    rate = 126;
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

module.exports = async function handler(req, res) {
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

    return res.status(result.status ? 200 : 400).json(result);
  } catch (error) {
    console.error("Prime FF Error:", error);

    return res.status(500).json({
      status: false,
      message: "Gagal menghitung Prime Free Fire.",
      error: error.message
    });
  }
};