const axios = require("axios");
const cheerio = require("cheerio");
const FormData = require("form-data");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "Parameter url wajib diisi",
      example: "/api/tiktok?url=https://www.tiktok.com/@user/video/123456"
    });
  }

  const userAgent =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";

  try {
    // 1. Ambil halaman TikTok
    const response = await axios.get(url.replace(/\/+$/, ""), {
      headers: {
        "User-Agent": userAgent,
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      },
      timeout: 20000
    });

    // 2. Ambil cookies
    const rawCookies = response.headers["set-cookie"] || [];
    const cookiesString = rawCookies
      .map((cookie) => cookie.split(";")[0])
      .join("; ");

    // 3. Parse data TikTok
    const $ = cheerio.load(response.data);
    const scriptData = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();

    if (!scriptData) {
      throw new Error("Data rehydration tidak ditemukan.");
    }

    const data = JSON.parse(scriptData);

    const videoDetail =
      data["__DEFAULT_SCOPE__"]?.["webapp.video-detail"];

    const item = videoDetail?.itemInfo?.itemStruct;

    if (!item) {
      throw new Error("Data video TikTok tidak ditemukan.");
    }

    const videoUrl = item.video?.playAddr;

    if (!videoUrl) {
      throw new Error("URL video tidak ditemukan.");
    }

    // 4. Download video sebagai buffer
    const videoResponse = await axios.get(videoUrl, {
      headers: {
        "User-Agent": userAgent,
        Referer: "https://www.tiktok.com/",
        Cookie: cookiesString
      },
      responseType: "arraybuffer",
      timeout: 60000
    });

    // 5. Upload langsung ke CDN
    const form = new FormData();

    form.append("file", Buffer.from(videoResponse.data), {
      filename: `${item.author?.uniqueId || "tiktok"}_video.mp4`,
      contentType: "video/mp4"
    });

    const uploadResponse = await axios.post(
      "https://cdn.zass.in/upload",
      form,
      {
        headers: {
          ...form.getHeaders()
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 60000
      }
    );

    return res.status(200).json({
      status: true,
      data: {
        source_url: url,
        cdn_url: uploadResponse.data?.url,
        file_size: uploadResponse.data?.size,

        description: item.desc,

        author: {
          username: item.author?.uniqueId,
          nickname: item.author?.nickname,
          avatar: item.author?.avatarLarger
        },

        stats: {
          play_count: item.stats?.playCount,
          like_count: item.stats?.diggCount,
          comment_count: item.stats?.commentCount,
          share_count: item.stats?.shareCount
        },

        video: {
          duration: item.video?.duration,
          cover: item.video?.cover,
          format: item.video?.format
        }
      }
    });
  } catch (error) {
    console.error("TikTok API Error:", error);

    return res.status(500).json({
      status: false,
      message: `Gagal memproses data: ${
        error.response?.data?.message ||
        error.message ||
        "Unknown error"
      }`
    });
  }
};