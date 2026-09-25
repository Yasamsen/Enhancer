const YT_BASE = "https://m.youtube.com";
const YT_API = "https://m.youtube.com/youtubei/v1";

const YT_UA =
  "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

let ytConfig = null;

async function ytBootstrap() {
  if (ytConfig) return ytConfig;

  const res = await fetch(`${YT_BASE}/`, {
    headers: {
      "User-Agent": YT_UA,
      "Accept-Language": "en-US,en;q=0.9"
    }
  });

  const html = await res.text();

  const key =
    (html.match(/INNERTUBE_API_KEY":"([^"]+)"/) ||
      html.match(/"innertubeApiKey":"([^"]+)"/) || [])[1];

  const version =
    (html.match(/INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/) ||
      html.match(/"clientVersion":"([^"]+)"/) || [])[1] ||
    "2.20240101.00.00";

  const visitorData =
    (html.match(/visitorData":"([^"]+)"/) || [])[1] || "";

  const gl =
    (html.match(/"GL":"([^"]+)"/) || [])[1] || "US";

  if (!key) {
    throw new Error("Gagal mengambil YouTube API key");
  }

  ytConfig = {
    key,
    version,
    visitorData,
    gl
  };

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
  return (runs || [])
    .map(r => r.text)
    .join("")
    .trim();
}

function ytThumb(thumbnails) {
  if (!thumbnails?.length) return null;

  return [...thumbnails].sort(
    (a, b) => (b.width || 0) - (a.width || 0)
  )[0].url;
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

  const res = await fetch(
    `${YT_API}/search?key=${cfg.key}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": YT_UA,
        Origin: YT_BASE
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: "MWEB",
            clientVersion: cfg.version,
            visitorData: cfg.visitorData,
            hl: "en",
            gl: cfg.gl
          }
        },
        query
      })
    }
  );

  const json = await res.json();

  if (json.error) {
    throw new Error(json.error.message);
  }

  const items = [];

  for (const section of ytFindAll(
    json,
    "itemSectionRenderer"
  )) {
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
  const response = await fetch(
    "https://ac.insvid.com/converter",
    {
      method: "POST",
      headers: {
        accept: "*/*",
        "content-type": "application/json",
        origin: "https://ac.insvid.com",
        referer:
          `https://ac.insvid.com/widget?url=https://www.youtube.com/watch?v=${videoId}&el=147`,
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      },
      body: JSON.stringify({
        id: videoId,
        fileType
      })
    }
  );

  const data = await response.json();

  if (
    !data ||
    data.status !== "ok" ||
    !data.link
  ) {
    throw new Error("Gagal mengonversi audio");
  }

  return data.link;
}

async function getLyrics(query) {
  try {
    const res = await fetch(
      `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`
    );

    if (!res.ok) return null;

    const data = await res.json();

    const song = (data || []).find(
      item =>
        item.syncedLyrics?.trim() ||
        item.plainLyrics?.trim()
    );

    if (!song) return null;

    return {
      title: song.trackName || song.name || "",
      artist: song.artistName || "",
      album: song.albumName || "",
      lyrics:
        song.syncedLyrics ||
        song.plainLyrics ||
        "",
      synced: Boolean(song.syncedLyrics),
      duration: song.duration || null
    };
  } catch {
    return null;
  }
}

async function YouTubeplay(query) {
  const items = await ytSearch(query);

  const video = items.find(v => v.id);

  if (!video) {
    return {
      success: false,
      message: "Video tidak ditemukan"
    };
  }

  const audioUrl = await insvidConvert(
    video.id,
    "MP3"
  );

  const lyrics = await getLyrics(
    video.title || query
  );

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

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed"
    });
  }

  const query = String(
    req.query?.query || ""
  ).trim();

  if (!query) {
    return res.status(400).json({
      success: false,
      message:
        "Parameter query wajib diisi.",
      example:
        "/api/ytplay?query=alan%20walker%20faded"
    });
  }

  try {
    const result = await YouTubeplay(query);

    return res.status(
      result.success ? 200 : 404
    ).json(result);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message:
        error?.message ||
        "Gagal memproses YouTube."
    });
  }
};