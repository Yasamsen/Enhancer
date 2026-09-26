const API_JSON =
  "https://raw.githubusercontent.com/Yasamsen/media-repo/main/alya/api.json";

const MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",

  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v"
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    // Ambil api.json
    const listResponse = await fetch(API_JSON, {
      cache: "no-store"
    });

    if (!listResponse.ok) {
      return res.status(502).json({
        status: false,
        message: "Gagal mengambil api.json"
      });
    }

    const json = await listResponse.json();

    if (!Array.isArray(json.data) || json.data.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Media tidak ditemukan"
      });
    }

    // Pilih media secara acak
    const media =
      json.data[
        Math.floor(Math.random() * json.data.length)
      ];

    if (typeof media !== "string") {
      return res.status(500).json({
        status: false,
        message: "URL media tidak valid"
      });
    }

    // Ambil ekstensi
    const cleanUrl = media.split("?")[0].toLowerCase();
    const extension = cleanUrl.split(".").pop();

    const contentType = MIME_TYPES[extension];

    if (!contentType) {
      return res.status(415).json({
        status: false,
        message: "Format media tidak didukung",
        url: media
      });
    }

    // Ambil file media
    const mediaResponse = await fetch(media);

    if (!mediaResponse.ok) {
      return res.status(502).json({
        status: false,
        message: "Gagal mengambil media",
        http_status: mediaResponse.status
      });
    }

    const buffer = Buffer.from(
      await mediaResponse.arrayBuffer()
    );

    // Response langsung berupa gambar/video
    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );

    return res.status(200).send(buffer);

  } catch (error) {
    console.error("ALYA MEDIA ERROR:", error);

    return res.status(502).json({
      status: false,
      message: "Gagal mengambil media",
      error: error.message
    });
  }
}