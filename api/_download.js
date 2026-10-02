// Proxy download same-origin: /api/download?url=<media>&filename=<nama>
// - mode=attachment (default): browser langsung menyimpan file, tanpa pindah/tab baru
// - mode=inline: untuk preview <img>/<video>/<audio> (mendukung Range / seek)
// - mode=probe : hanya mengembalikan content-type + ukuran sebagai JSON
// Awalan "_" membuat Vercel tidak menghitung file ini sebagai function terpisah.
import dns from "node:dns";
import net from "node:net";
import http from "node:http";
import https from "node:https";

const EXT = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif",
  "image/avif": "avif", "image/svg+xml": "svg", "video/mp4": "mp4", "video/webm": "webm",
  "video/quicktime": "mov", "audio/mpeg": "mp3", "audio/mp4": "m4a", "audio/aac": "aac",
  "audio/wav": "wav", "audio/ogg": "ogg", "audio/webm": "weba", "application/pdf": "pdf",
  "application/zip": "zip", "application/vnd.android.package-archive": "apk"
};

export function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  const v = ip.toLowerCase();
  if (v.startsWith("::ffff:")) return isPrivateIp(v.slice(7));
  return v === "::" || v === "::1" || v.startsWith("fc") || v.startsWith("fd") || v.startsWith("fe80");
}

// Validasi IP saat koneksi dibuat -> aman dari DNS rebinding.
function safeLookup(hostname, options, cb) {
  dns.lookup(hostname, options, (err, address, family) => {
    if (err) return cb(err);
    const list = Array.isArray(address) ? address : [{ address }];
    if (list.some((item) => isPrivateIp(item.address))) return cb(new Error("BLOCKED_HOST"));
    cb(null, address, family);
  });
}

function openUpstream(target, headers, hops = 0) {
  return new Promise((resolve, reject) => {
    let u;
    try { u = new URL(target); } catch { return reject(new Error("INVALID_URL")); }
    if (!/^https?:$/.test(u.protocol)) return reject(new Error("INVALID_URL"));
    const bare = u.hostname.replace(/^\[|\]$/g, "");
    if (net.isIP(bare) && isPrivateIp(bare)) return reject(new Error("BLOCKED_HOST"));

    const lib = u.protocol === "https:" ? https : http;
    const req = lib.request(u, { method: "GET", headers, lookup: safeLookup, timeout: 20000 }, (up) => {
      if ([301, 302, 303, 307, 308].includes(up.statusCode) && up.headers.location) {
        up.resume();
        if (hops >= 5) return reject(new Error("TOO_MANY_REDIRECTS"));
        return resolve(openUpstream(new URL(up.headers.location, u).href, headers, hops + 1));
      }
      resolve({ up, finalUrl: u });
    });
    req.on("timeout", () => req.destroy(new Error("UPSTREAM_TIMEOUT")));
    req.on("error", reject);
    req.end();
  });
}

export function buildFilename(requested, finalUrl, mime) {
  let name = String(requested || "").replace(/[\\/:*?"<>|\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  if (!name) {
    try { name = decodeURIComponent(finalUrl.pathname.split("/").pop() || ""); } catch { name = ""; }
  }
  name = (name || "download").slice(0, 120);
  const ext = EXT[mime];
  if (ext && !/\.[a-z0-9]{2,5}$/i.test(name)) name += `.${ext}`;
  return name;
}

export async function handleDownload(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return res.status(405).json({ status: false, message: "Method not allowed" });
  }

  const host = req.headers?.host || "localhost";
  const query = Object.fromEntries(new URL(req.url, `http://${host}`).searchParams);
  const { url, filename, mode = "attachment" } = query;

  if (!url) {
    return res.status(400).json({ status: false, message: "Parameter url wajib diisi", example: "/api/download?url=https://example.com/video.mp4&filename=video.mp4" });
  }

  const headers = { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36", Accept: "*/*" };
  if (req.headers.range && mode !== "probe") headers.Range = req.headers.range;

  try {
    const { up, finalUrl } = await openUpstream(String(url), headers);
    const mime = String(up.headers["content-type"] || "application/octet-stream").split(";")[0].trim().toLowerCase();

    if (up.statusCode >= 400) {
      up.destroy();
      return res.status(502).json({ status: false, message: `Server sumber membalas ${up.statusCode}` });
    }
    if (mode === "probe") {
      up.destroy();
      return res.status(200).json({ status: true, contentType: mime, size: Number(up.headers["content-length"]) || null, filename: buildFilename(filename, finalUrl, mime) });
    }
    // Halaman web bukan media; jangan pernah disajikan dari origin kita.
    if (mime === "text/html" || mime === "application/xhtml+xml") {
      up.destroy();
      return res.status(415).json({ status: false, message: "Link ini halaman web, bukan file media." });
    }

    const name = buildFilename(filename, finalUrl, mime);
    const ascii = name.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "");
    res.statusCode = up.statusCode;
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", `${mode === "inline" ? "inline" : "attachment"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
    res.setHeader("Cache-Control", mode === "inline" ? "public, max-age=3600" : "private, no-store");
    res.setHeader("Accept-Ranges", up.headers["accept-ranges"] || "bytes");
    if (up.headers["content-length"]) res.setHeader("Content-Length", up.headers["content-length"]);
    if (up.headers["content-range"]) res.setHeader("Content-Range", up.headers["content-range"]);

    if (req.method === "HEAD") { up.destroy(); return res.end(); }
    res.on("close", () => up.destroy());
    up.on("error", () => res.destroy());
    up.pipe(res);
  } catch (error) {
    const blocked = error.message === "BLOCKED_HOST" || error.message === "INVALID_URL";
    return res.status(blocked ? 400 : 502).json({
      status: false,
      message: blocked ? "URL tidak diizinkan." : "Gagal mengambil file dari server sumber.",
      error: error.message
    });
  }
}
