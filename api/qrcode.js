import QRCode from "qrcode";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: "Method not allowed"
      });
    }

    const { text } = req.query;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Parameter text wajib diisi",
        example: "/api/qrcode?text=https://example.com"
      });
    }

    const qrBuffer = await QRCode.toBuffer(text, {
      type: "png",
      width: 800,
      margin: 2,
      errorCorrectionLevel: "M"
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Content-Disposition", "inline; filename=qrcode.png");

    return res.status(200).send(qrBuffer);
  } catch (error) {
    console.error("QR Code Error:", error);

    return res.status(500).json({
      success: false,
      message: "Gagal membuat QR Code",
      error: error.message
    });
  }
}