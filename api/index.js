import axios from "axios";
import * as cheerio from "cheerio";
import NodeFormData from "form-data";
import formidable from "formidable";
import fs from "fs";
import QRCode from "qrcode";

// Semua endpoint digabung ke 1 file supaya hanya dihitung 1 Serverless
// Function oleh Vercel (Hobby plan cuma boleh maksimal 12 function).
// Body parser dimatikan secara global karena nano-banana butuh raw stream
// untuk multipart/form-data (via formidable). Untuk route lain yang butuh
// JSON body (alight/verify, alight/send), body diparse manual lewat
// ensureJsonBody().
export const config = {
  api: {
    bodyParser: false
  }
};

/* ============================================================
 * HELPER: manual body parsing (dipakai selain nano-banana)
 * ============================================================ */
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

async function ensureJsonBody(req) {
  if (req.body && typeof req.body === "object") return;

  const contentType = req.headers["content-type"] || "";
  const raw = await readRawBody(req);

  if (contentType.includes("application/json")) {
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
  } else if (contentType.includes("application/x-www-form-urlencoded")) {
    req.body = Object.fromEntries(new URLSearchParams(raw));
  } else {
    req.body = {};
  }
}

/* ============================================================
 * TIKTOK
 * ============================================================ */
async function handleTiktok(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
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
    const response = await axios.get(url.replace(/\/+$/, ""), {
      headers: {
        "User-Agent": userAgent,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
      },
      timeout: 20000
    });

    const rawCookies = response.headers["set-cookie"] || [];
    const cookiesString = rawCookies.map((cookie) => cookie.split(";")[0]).join("; ");

    const $ = cheerio.load(response.data);
    const scriptData = $("#__UNIVERSAL_DATA_FOR_REHYDRATION__").text();

    if (!scriptData) {
      throw new Error("Data rehydration tidak ditemukan.");
    }

    const data = JSON.parse(scriptData);
    const videoDetail = data["__DEFAULT_SCOPE__"]?.["webapp.video-detail"];
    const item = videoDetail?.itemInfo?.itemStruct;

    if (!item) {
      throw new Error("Data video TikTok tidak ditemukan.");
    }

    const videoUrl = item.video?.playAddr;

    if (!videoUrl) {
      throw new Error("URL video tidak ditemukan.");
    }

    const videoResponse = await axios.get(videoUrl, {
      headers: {
        "User-Agent": userAgent,
        Referer: "https://www.tiktok.com/",
        Cookie: cookiesString
      },
      responseType: "arraybuffer",
      timeout: 60000
    });

    const form = new NodeFormData();

    form.append("file", Buffer.from(videoResponse.data), {
      filename: `${item.author?.uniqueId || "tiktok"}_video.mp4`,
      contentType: "video/mp4"
    });

    const uploadResponse = await axios.post("https://cdn.zass.in/upload", form, {
      headers: { ...form.getHeaders() },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      timeout: 60000
    });

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
      message: `Gagal memproses data: ${error.response?.data?.message || error.message || "Unknown error"}`
    });
  }
}

/* ============================================================
 * INSTAGRAM STALKER
 * ============================================================ */
async function stalkIG(username) {
  username = String(username || "").replace(/^@/, "").trim();

  if (!username) {
    return { status: false, message: "Username wajib diisi." };
  }

  const url = `https://www.instagram.com/${encodeURIComponent(username)}/`;

  const headers = {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36",
    "upgrade-insecure-requests": "1"
  };

  try {
    const response = await axios.get(url, { headers, timeout: 15000 });
    const html = response.data;
    const $ = cheerio.load(html);

    let userData = null;

    $('script[type="application/json"]').each((i, el) => {
      const text = $(el).html();
      if (!text || !text.includes("follower_count")) return;

      try {
        const usernameMatch = text.match(/"username":"([^"]+)"/);
        const pkMatch = text.match(/"pk":"([^"]+)"/);
        const hdPpMatch = text.match(/"hd_profile_pic_version":\{"url":"([^"]+)"/);
        const ppMatch = text.match(/"profile_pic_url":"([^"]+)"/);
        const nameMatch = text.match(/"full_name":"([^"]*)"/);
        const followersMatch = text.match(/"follower_count":(\d+)/);
        const followingMatch = text.match(/"following_count":(\d+)/);
        const mediaMatch = text.match(/"media_count":(\d+)/);
        const bioMatch = text.match(/"biography":("(?:[^"\\]|\\.)*")/);
        const verifiedMatch = text.match(/"is_verified":(true|false)/);

        if (usernameMatch && usernameMatch[1].toLowerCase() === username.toLowerCase()) {
          let biography = "";

          if (bioMatch) {
            try {
              biography = JSON.parse(bioMatch[1]);
            } catch {
              biography = bioMatch[1];
            }
          }

          let avatar = hdPpMatch ? hdPpMatch[1] : ppMatch ? ppMatch[1] : "";

          try {
            avatar = JSON.parse(`"${avatar}"`);
          } catch {}

          userData = {
            username: usernameMatch[1],
            id: pkMatch ? pkMatch[1] : null,
            full_name: nameMatch ? JSON.parse(`"${nameMatch[1]}"`) : null,
            profile_pic: avatar,
            followers: followersMatch ? parseInt(followersMatch[1], 10) : 0,
            following: followingMatch ? parseInt(followingMatch[1], 10) : 0,
            posts: mediaMatch ? parseInt(mediaMatch[1], 10) : 0,
            biography,
            is_verified: verifiedMatch ? verifiedMatch[1] === "true" : false,
            profile_url: url
          };
        }
      } catch {}
    });

    if (!userData) {
      return {
        status: false,
        message: "Data user tidak ditemukan. Pastikan username valid atau data profil tidak tersedia."
      };
    }

    return { status: true, data: userData };
  } catch (error) {
    return { status: false, message: `Gagal memproses data: ${error.message}` };
  }
}

async function handleInstagramStalker(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method Not Allowed" });
  }

  const username = req.query?.username;
  const result = await stalkIG(username);

  return res.status(result.status ? 200 : 400).json(result);
}

/* ============================================================
 * NANO BANANA
 * ============================================================ */
function parseNanoBananaForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: false, keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) {
        reject(err);
        return;
      }

      resolve({ fields, files });
    });
  });
}

function getField(value) {
  if (Array.isArray(value)) return value[0];
  return value;
}

async function handleNanoBanana(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  const BANANA_API = "https://ibbo.ai/api/nano-banana-lite-image-to-image";
  const HEADERS = {
    Accept: "*/*",
    Origin: "https://banana-nano.ai",
    Referer: "https://banana-nano.ai/ai-image-editor",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/109.0.0.0 Safari/537.36"
  };

  try {
    const { fields, files } = await parseNanoBananaForm(req);

    const prompt = getField(fields.prompt);
    const uploadedImage = files.image || files.file;
    const imageFile = Array.isArray(uploadedImage) ? uploadedImage[0] : uploadedImage;

    if (!imageFile) {
      return res.status(400).json({ status: false, message: "Parameter image wajib diisi" });
    }

    if (!prompt) {
      return res.status(400).json({ status: false, message: "Parameter prompt wajib diisi" });
    }

    const imageBuffer = fs.readFileSync(imageFile.filepath);

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: imageFile.mimetype || "image/jpeg" });

    formData.append("file", blob, imageFile.originalFilename || "image.jpg");
    formData.append("prompt", String(prompt));
    formData.append("output_format", String(getField(fields.output_format) || "jpg"));
    formData.append("generator_slug", "ai-image-editor");

    const response = await axios.post(BANANA_API, formData, {
      headers: { ...HEADERS, ...formData.getHeaders?.() },
      timeout: 120000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    return res.status(200).json({ status: true, source: "NanoBanana", data: response.data });
  } catch (error) {
    console.error("NanoBanana Error:", error);
    return res.status(error.response?.status || 502).json({
      status: false,
      source: "NanoBanana",
      message: "Gagal memproses gambar",
      error: error.response?.data || error.message
    });
  }
}

/* ============================================================
 * IP LOOKUP
 * ============================================================ */
async function handleIplookup(req, res) {
  try {
    const { ip } = req.query;

    const clientIp =
      ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress;

    if (!clientIp) {
      return res.status(400).json({ success: false, message: "IP address tidak ditemukan" });
    }

    const cleanIp = clientIp.replace(/^::ffff:/, "").replace(/^::1$/, "127.0.0.1");

    const response = await fetch(`https://ipapi.co/${encodeURIComponent(cleanIp)}/json/`);
    const data = await response.json();

    if (!response.ok || data.error) {
      return res.status(400).json({ success: false, message: data.reason || "Gagal melakukan IP lookup" });
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

/* ============================================================
 * WEATHER
 * ============================================================ */
async function handleWeather(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
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
      return res.status(400).json({ success: false, message: "Gagal mengambil data cuaca" });
    }

    const data = await response.json();
    const current = data.current_condition?.[0];
    const area = data.nearest_area?.[0];

    if (!current) {
      return res.status(404).json({ success: false, message: "Data cuaca tidak ditemukan" });
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

/* ============================================================
 * QR CODE
 * ============================================================ */
async function handleQrcode(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ success: false, message: "Method not allowed" });
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
    return res.status(500).json({ success: false, message: "Gagal membuat QR Code", error: error.message });
  }
}

/* ============================================================
 * EARTHQUAKE (BMKG)
 * ============================================================ */
async function handleEarthquake(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  try {
    const response = await fetch("https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json", {
      headers: { Accept: "application/json" }
    });

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
      return res.status(502).json({ status: false, source: "BMKG", message: "Data gempa BMKG tidak ditemukan" });
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
        shakemap: gempa.Shakemap ? `https://static.bmkg.go.id/${gempa.Shakemap}` : null
      }
    });
  } catch (error) {
    console.error("BMKG ERROR:", error);
    return res.status(502).json({ status: false, source: "BMKG", message: "Gagal mengambil data BMKG", error: error.message });
  }
}

/* ============================================================
 * MEALDB
 * ============================================================ */
async function mealdbRequest(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheMealDB HTTP ${response.status}`);
  }

  return response.json();
}

function formatMeal(meal) {
  if (!meal) return null;

  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (ingredient) {
      ingredients.push({ ingredient, measure: measure || null });
    }
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    thumbnail: meal.strMealThumb,
    youtube: meal.strYoutube || null,
    source: meal.strSource || null,
    ingredients
  };
}

async function handleMealdb(req, res) {
  const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  try {
    const { action = "search", query, id } = req.query;
    let data;

    if (action === "search") {
      if (!query) {
        return res.status(400).json({
          status: false,
          message: "Parameter query wajib diisi",
          example: "/api/mealdb?action=search&query=chicken"
        });
      }

      data = await mealdbRequest(`${BASE_URL}/search.php?s=${encodeURIComponent(query)}`);
      const meals = (data.meals || []).map(formatMeal);

      return res.status(200).json({ status: true, source: "TheMealDB", action: "search", total: meals.length, data: meals });
    }

    if (action === "detail") {
      if (!id) {
        return res.status(400).json({
          status: false,
          message: "Parameter id wajib diisi",
          example: "/api/mealdb?action=detail&id=52772"
        });
      }

      data = await mealdbRequest(`${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`);
      const meal = data.meals?.[0];

      if (!meal) {
        return res.status(404).json({ status: false, message: "Resep tidak ditemukan" });
      }

      return res.status(200).json({ status: true, source: "TheMealDB", action: "detail", data: formatMeal(meal) });
    }

    if (action === "random") {
      data = await mealdbRequest(`${BASE_URL}/random.php`);
      const meal = data.meals?.[0];

      if (!meal) {
        return res.status(404).json({ status: false, message: "Resep tidak ditemukan" });
      }

      return res.status(200).json({ status: true, source: "TheMealDB", action: "random", data: formatMeal(meal) });
    }

    return res.status(400).json({ status: false, message: "Action tidak valid", available: ["search", "detail", "random"] });
  } catch (error) {
    console.error("TheMealDB Error:", error);
    return res.status(502).json({ status: false, source: "TheMealDB", message: "Gagal mengambil data resep", error: error.message });
  }
}

/* ============================================================
 * PRIME FF
 * ============================================================ */
function formatRupiah(angka) {
  return "Rp " + Math.round(angka).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function hitungPrimeFF(poinPrime) {
  const poin = parseInt(String(poinPrime).replace(/[^0-9]/g, ""), 10);

  if (!poin || poin <= 0) {
    return { status: false, message: "Jumlah Poin Prime tidak valid." };
  }

  let rate = 126;

  try {
    const response = await axios.get("https://rifqistore.com/id/calculator-free-fire", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      },
      timeout: 15000
    });

    const html = response.data;

    const matchRate =
      html.match(/(?:Rp\s*|harga[:\s]*)(\d+)\s*\/\s*(?:1)?(?:dm|diamond)/i) ||
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

async function handlePrimeFf(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  const { poin } = req.query;

  if (!poin) {
    return res.status(400).json({ status: false, message: "Parameter poin wajib diisi.", example: "/api/prime-ff?poin=12900" });
  }

  try {
    const result = await hitungPrimeFF(poin);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Prime FF Error:", error);
    return res.status(500).json({ status: false, message: "Gagal memproses Prime Free Fire.", error: error.message });
  }
}

/* ============================================================
 * YT PLAY
 * ============================================================ */
const YT_BASE = "https://m.youtube.com";
const YT_API = "https://m.youtube.com/youtubei/v1";
const YT_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

let ytConfig = null;

async function ytBootstrap() {
  if (ytConfig) return ytConfig;

  const res = await fetch(`${YT_BASE}/`, {
    headers: { "User-Agent": YT_UA, "Accept-Language": "en-US,en;q=0.9" }
  });

  const html = await res.text();

  const key = (html.match(/INNERTUBE_API_KEY":"([^"]+)"/) || html.match(/"innertubeApiKey":"([^"]+)"/) || [])[1];
  const version =
    (html.match(/INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/) || html.match(/"clientVersion":"([^"]+)"/) || [])[1] ||
    "2.20240101.00.00";
  const visitorData = (html.match(/visitorData":"([^"]+)"/) || [])[1] || "";
  const gl = (html.match(/"GL":"([^"]+)"/) || [])[1] || "US";

  if (!key) {
    throw new Error("Gagal mengambil YouTube API key");
  }

  ytConfig = { key, version, visitorData, gl };
  return ytConfig;
}

function ytFindAll(obj, key, out = []) {
  if (!obj || typeof obj !== "object") return out;

  if (Array.isArray(obj)) {
    for (const item of obj) {
      ytFindAll(item, key, out);
    }
    return out;
  }

  for (const [k, v] of Object.entries(obj)) {
    if (k === key) {
      out.push(v);
    } else {
      ytFindAll(v, key, out);
    }
  }

  return out;
}

function ytText(runs) {
  return (runs || []).map((r) => r.text).join("").trim();
}

function ytThumb(thumbnails) {
  if (!thumbnails?.length) return null;
  return [...thumbnails].sort((a, b) => (b.width || 0) - (a.width || 0))[0].url;
}

function ytParseItem(item) {
  const v = item.videoWithContextRenderer;
  if (!v) return null;

  return {
    id: v.videoId,
    title: ytText(v.headline?.runs),
    channel: ytText(v.shortBylineText?.runs),
    thumbnail: ytThumb(v.thumbnail?.thumbnails)
  };
}

async function ytSearch(query) {
  const cfg = await ytBootstrap();

  const res = await fetch(`${YT_API}/search?key=${cfg.key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": YT_UA, Origin: YT_BASE },
    body: JSON.stringify({
      context: {
        client: { clientName: "MWEB", clientVersion: cfg.version, visitorData: cfg.visitorData, hl: "en", gl: cfg.gl }
      },
      query
    })
  });

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message);
  }

  const items = [];

  for (const section of ytFindAll(json, "itemSectionRenderer")) {
    for (const item of section.contents || []) {
      const parsed = ytParseItem(item);
      if (parsed?.id) {
        items.push(parsed);
      }
    }
  }

  return items;
}

async function insvidConvert(videoId, fileType = "MP3") {
  const response = await fetch("https://ac.insvid.com/converter", {
    method: "POST",
    headers: {
      accept: "*/*",
      "content-type": "application/json",
      origin: "https://ac.insvid.com",
      referer: `https://ac.insvid.com/widget?url=https://www.youtube.com/watch?v=${videoId}&el=147`,
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    },
    body: JSON.stringify({ id: videoId, fileType })
  });

  const data = await response.json();

  if (!data || data.status !== "ok" || !data.link) {
    throw new Error("Gagal mengonversi audio");
  }

  return data.link;
}

async function getLyrics(query) {
  try {
    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) return null;

    const data = await res.json();
    const song = (data || []).find((item) => item.syncedLyrics?.trim() || item.plainLyrics?.trim());

    if (!song) return null;

    return {
      title: song.trackName || song.name || "",
      artist: song.artistName || "",
      album: song.albumName || "",
      lyrics: song.syncedLyrics || song.plainLyrics || "",
      synced: Boolean(song.syncedLyrics),
      duration: song.duration || null
    };
  } catch {
    return null;
  }
}

async function YouTubeplay(query) {
  const items = await ytSearch(query);
  const video = items.find((v) => v.id);

  if (!video) {
    return { success: false, message: "Video tidak ditemukan" };
  }

  const audioUrl = await insvidConvert(video.id, "MP3");
  const lyrics = await getLyrics(video.title || query);

  return {
    success: true,
    result: {
      video_id: video.id,
      title: video.title,
      channel: video.channel,
      thumbnail: video.thumbnail,
      audio_url: audioUrl,
      lyrics
    }
  };
}

async function handleYtplay(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  const query = String(req.query?.query || "").trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      message: "Parameter query wajib diisi.",
      example: "/api/ytplay?query=alan%20walker%20faded"
    });
  }

  try {
    const result = await YouTubeplay(query);
    return res.status(result.success ? 200 : 404).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message || "Gagal memproses YouTube." });
  }
}

/* ============================================================
 * X STALKER
 * ============================================================ */
function xStalkerSend(res, status, body) {
  res.status(status).json(body);
}

function xStalkerGetMeta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, "i")
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return xStalkerDecodeHtml(match[1]);
  }

  return "";
}

function xStalkerDecodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function handleXStalker(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return xStalkerSend(res, 405, { status: false, message: "Method not allowed. Use GET." });
  }

  const rawUsername = req.query?.username;
  const username = String(rawUsername || "").replace(/^@/, "").trim();

  if (!username) {
    return xStalkerSend(res, 400, { status: false, message: "Parameter username wajib diisi." });
  }

  if (!/^[A-Za-z0-9_]{1,15}$/.test(username)) {
    return xStalkerSend(res, 400, { status: false, message: "Username X tidak valid." });
  }

  const profileUrl = `https://x.com/${encodeURIComponent(username)}`;
  const started = Date.now();

  try {
    const response = await fetch(profileUrl, {
      headers: {
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "upgrade-insecure-requests": "1"
      },
      redirect: "follow"
    });

    const html = await response.text();

    if (!response.ok) {
      return xStalkerSend(res, response.status === 404 ? 404 : 502, {
        status: false,
        message: response.status === 404 ? "User X tidak ditemukan." : `X mengembalikan HTTP ${response.status}.`,
        execution_time_ms: Date.now() - started
      });
    }

    const avatar = xStalkerGetMeta(html, "og:image");
    const description = xStalkerGetMeta(html, "description");
    const name =
      xStalkerGetMeta(html, "profile:first_name") ||
      xStalkerGetMeta(html, "og:title").replace(/\s*\(@[^)]+\).*$/i, "");
    const banner = xStalkerGetMeta(html, "twitter:image");
    const posts = xStalkerGetMeta(html, "twitter:data1") || "0";
    const joined = xStalkerGetMeta(html, "twitter:data2");

    const followerMatch = html.match(/followers:(\d+),following:(\d+)/i);
    const followers = followerMatch ? Number(followerMatch[1]) : 0;
    const following = followerMatch ? Number(followerMatch[2]) : 0;

    if (!name && !description && !avatar) {
      return xStalkerSend(res, 404, {
        status: false,
        message: "Data user tidak ditemukan. Pastikan username valid.",
        execution_time_ms: Date.now() - started
      });
    }

    return xStalkerSend(res, 200, {
      status: true,
      data: {
        username,
        name,
        description,
        avatar,
        avatar_hd: avatar ? avatar.replace("_200x200", "").replace("_normal", "") : "",
        banner,
        banner_hd: banner,
        posts,
        joined,
        followers,
        following,
        profile_url: profileUrl
      },
      execution_time_ms: Date.now() - started
    });
  } catch (error) {
    return xStalkerSend(res, 500, {
      status: false,
      message: `Gagal memproses data: ${error?.message || "Unknown error"}`,
      execution_time_ms: Date.now() - started
    });
  }
}

/* ============================================================
 * ALYA
 * ============================================================ */
async function handleAlya(req, res) {
  const API_JSON = "https://raw.githubusercontent.com/Yasamsen/media-repo/main/alya/api.json";
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

  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  try {
    const listResponse = await fetch(API_JSON, { cache: "no-store" });

    if (!listResponse.ok) {
      return res.status(502).json({ status: false, message: "Gagal mengambil api.json" });
    }

    const json = await listResponse.json();

    if (!Array.isArray(json.data) || json.data.length === 0) {
      return res.status(404).json({ status: false, message: "Media tidak ditemukan" });
    }

    const media = json.data[Math.floor(Math.random() * json.data.length)];

    if (typeof media !== "string") {
      return res.status(500).json({ status: false, message: "URL media tidak valid" });
    }

    const cleanUrl = media.split("?")[0].toLowerCase();
    const extension = cleanUrl.split(".").pop();
    const contentType = MIME_TYPES[extension];

    if (!contentType) {
      return res.status(415).json({ status: false, message: "Format media tidak didukung", url: media });
    }

    const mediaResponse = await fetch(media);

    if (!mediaResponse.ok) {
      return res.status(502).json({ status: false, message: "Gagal mengambil media", http_status: mediaResponse.status });
    }

    const buffer = Buffer.from(await mediaResponse.arrayBuffer());

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate");

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("ALYA MEDIA ERROR:", error);
    return res.status(502).json({ status: false, message: "Gagal mengambil media", error: error.message });
  }
}

/* ============================================================
 * ALIGHT VERIFY / SEND
 * ============================================================ */
const ALIGHT_API_KEY = "ptz";

async function handleAlightVerify(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ status: false, message: "Method not allowed" });
    }

    await ensureJsonBody(req);

    const email = req.body?.email || req.query?.email;
    const link = req.body?.link || req.query?.link;

    if (!email) {
      return res.status(400).json({ status: false, message: "Parameter email wajib diisi" });
    }

    if (!link) {
      return res.status(400).json({ status: false, message: "Parameter link wajib diisi" });
    }

    const body = new URLSearchParams({ apikey: ALIGHT_API_KEY, email: String(email), link: String(link) }).toString();

    const response = await axios.post("https://putzoffc.vercel.app/api/alight/verify", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      timeout: 15000
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("ALIGHT VERIFY ERROR:", error);
    return res.status(error.response?.status || 502).json(
      error.response?.data || { status: false, message: "Gagal terhubung ke server AmPrem", error: error.message }
    );
  }
}

async function handleAlightSend(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ status: false, message: "Method not allowed" });
    }

    await ensureJsonBody(req);

    const email = req.body?.email || req.query?.email;

    if (!email) {
      return res.status(400).json({ status: false, message: "Parameter email wajib diisi" });
    }

    const body = new URLSearchParams({ apikey: ALIGHT_API_KEY, email: String(email) }).toString();

    const response = await axios.post("https://putzoffc.vercel.app/api/alight/send", body, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        "User-Agent": "Mozilla/5.0"
      },
      timeout: 15000
    });

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("ALIGHT SEND ERROR:", error);
    return res.status(error.response?.status || 502).json(
      error.response?.data || { status: false, message: "Gagal terhubung ke server AmPrem", error: error.message }
    );
  }
}

/* ============================================================
 * WIKIPEDIA
 * ============================================================ */
async function handleWikipedia(req, res) {
  const WIKI_API = "https://id.wikipedia.org/w/api.php";

  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  const { query, limit = "10" } = req.query;

  if (!query) {
    return res.status(400).json({ status: false, message: "Parameter query wajib diisi", example: "/api/wikipedia?query=Indonesia" });
  }

  try {
    const searchParams = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: String(query),
      srlimit: String(Math.min(Number(limit) || 10, 20)),
      format: "json",
      origin: "*"
    });

    const response = await fetch(`${WIKI_API}?${searchParams}`);

    if (!response.ok) {
      throw new Error(`Wikipedia HTTP ${response.status}`);
    }

    const result = await response.json();

    const results = (result.query?.search || []).map((item) => ({
      title: item.title,
      page_id: item.pageid,
      snippet: item.snippet.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&"),
      word_count: item.wordcount,
      timestamp: item.timestamp,
      url: `https://id.wikipedia.org/wiki/${encodeURIComponent(item.title.replace(/ /g, "_"))}`
    }));

    return res.status(200).json({ status: true, source: "Wikipedia Indonesia", query: String(query), total: results.length, data: results });
  } catch (error) {
    console.error("Wikipedia API Error:", error);
    return res.status(502).json({ status: false, source: "Wikipedia Indonesia", message: "Gagal mengambil data dari Wikipedia", error: error.message });
  }
}

/* ============================================================
 * TEMPMAIL
 * ============================================================ */
async function tempmailRequest(url, options = {}) {
  const BASE = "https://cleantempmail.com";

  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "User-Agent": "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",
      Origin: BASE,
      Referer: `${BASE}/`,
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data;

  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }

  if (!response.ok) {
    throw new Error(typeof data === "string" ? data : data?.message || `HTTP ${response.status}`);
  }

  return data;
}

async function handleTempmail(req, res) {
  const BASE = "https://cleantempmail.com";

  if (req.method !== "GET") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  try {
    const action = req.query?.action || "random";

    if (action === "random") {
      const data = await tempmailRequest(`${BASE}/api/generate-email`);
      return res.status(200).json({ status: true, source: "CleanTempMail", action: "random", data });
    }

    if (action === "custom") {
      const prefix = req.query?.prefix;
      const domain = req.query?.domain;

      if (!prefix) {
        return res.status(400).json({
          status: false,
          message: "Parameter prefix wajib diisi",
          example: "/api/tempmail?action=custom&prefix=testuser&domain=example.com"
        });
      }

      if (!domain) {
        return res.status(400).json({
          status: false,
          message: "Parameter domain wajib diisi",
          example: "/api/tempmail?action=custom&prefix=testuser&domain=example.com"
        });
      }

      const data = await tempmailRequest(`${BASE}/api/generate-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefix: String(prefix), domain: String(domain) })
      });

      return res.status(200).json({ status: true, source: "CleanTempMail", action: "custom", data });
    }

    return res.status(400).json({ status: false, message: "Action tidak valid", available: ["random", "custom"] });
  } catch (error) {
    console.error("TempMail Error:", error);
    return res.status(502).json({ status: false, source: "CleanTempMail", message: "Gagal memproses temporary email", error: error.message });
  }
}

/* ============================================================
 * ROUTER UTAMA
 *
 * Route ditentukan dari path URL asli (req.url), BUKAN dari
 * req.query.route. Ini karena project ini bukan Next.js, jadi
 * dynamic bracket file ([...route].js) tidak selalu dikenali
 * Vercel. Sebagai gantinya, vercel.json mem-rewrite semua
 * /api/* ke file statis ini (/api/index), dan kita parse sendiri
 * path aslinya dari req.url (Vercel selalu mempertahankan path
 * request asli di req.url meski di-rewrite ke file lain).
 * ============================================================ */
function getRouteKey(req) {
  const host = req.headers?.host || "localhost";
  const fullUrl = new URL(req.url, `http://${host}`);
  const segments = fullUrl.pathname
    .replace(/^\/api\/?/, "")
    .split("/")
    .filter(Boolean);

  return segments.join("/");
}

export default async function handler(req, res) {
  const routeKey = getRouteKey(req);

  switch (routeKey) {
    case "tiktok":
      return handleTiktok(req, res);
    case "instagram-stalker":
      return handleInstagramStalker(req, res);
    case "nano-banana":
      return handleNanoBanana(req, res);
    case "iplookup":
      return handleIplookup(req, res);
    case "weather":
      return handleWeather(req, res);
    case "qrcode":
      return handleQrcode(req, res);
    case "earthquake":
      return handleEarthquake(req, res);
    case "mealdb":
      return handleMealdb(req, res);
    case "prime-ff":
      return handlePrimeFf(req, res);
    case "ytplay":
      return handleYtplay(req, res);
    case "x-stalker":
      return handleXStalker(req, res);
    case "alya":
      return handleAlya(req, res);
    case "alight/verify":
      return handleAlightVerify(req, res);
    case "alight/send":
      return handleAlightSend(req, res);
    case "wikipedia":
      return handleWikipedia(req, res);
    case "tempmail":
      return handleTempmail(req, res);
    default:
      return res.status(404).json({
        status: false,
        message: "Endpoint tidak ditemukan",
        route: `/api/${routeKey}`
      });
  }
}
