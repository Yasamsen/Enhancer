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

function getExtension(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return pathname.split(".").pop();
  } catch {
    return "";
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    const listResponse = await fetch(API_JSON, {
      headers: {
        Accept: "application/json"
      },
      cache: "no-store"
    });

    if (!listResponse.ok) {
      throw new Error(
        `Gagal mengambil api.json: HTTP ${listResponse.status}`
      );
    }

    const json = await listResponse.json();

    const mediaList = Array.isArray(json?.data)
      ? json.data.filter(
          (item) =>
            typeof item === "string" &&
            /^https?:\/\//i.test(item)
        )
      : [];

    if (!mediaList.length) {
      return res.status(404).json({
        status: false,
        message: "Tidak ada media di api.json"
      });
    }

    // Pilih media secara acak.
    const media =
      mediaList[Math.floor(Math.random() * mediaList.length)];

    const extension = getExtension(media);
    const contentType = MIME_TYPES[extension];

    if (!contentType) {
      return res.status(415).json({
        status: false,
        message: "Format media tidak didukung",
        extension
      });
    }

    const mediaResponse = await fetch(media, {
      headers: {
        Accept: contentType
      },
      cache: "no-store"
    });

    if (!mediaResponse.ok) {
      throw new Error(
        `Gagal mengambil media: HTTP ${mediaResponse.status}`
      );
    }

    const data = Buffer.from(await mediaResponse.arrayBuffer());

    res.statusCode = 200;
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", String(data.length));
    res.setHeader(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.setHeader("Content-Disposition", "inline");

    return res.end(data);
  } catch (error) {
    console.error("ALYA MEDIA ERROR:", error);

    return res.status(502).json({
      status: false,
      message: "Gagal mengambil media",
      error: error.message
    });
  }
}
