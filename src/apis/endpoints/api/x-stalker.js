const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

function send(res, status, body) {
  res.status(status).json(body);
}

function getMeta(html, key) {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`<meta[^>]+(?:name|property)=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["']${escaped}["'][^>]*>`, 'i')
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]);
  }
  return '';
}

function decodeHtml(value) {
  return String(value)
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return send(res, 405, {
      status: false,
      message: 'Method not allowed. Use GET.'
    });
  }

  const rawUsername = req.query?.username;
  const username = String(rawUsername || '').replace(/^@/, '').trim();

  if (!username) {
    return send(res, 400, {
      status: false,
      message: 'Parameter username wajib diisi.'
    });
  }

  if (!/^[A-Za-z0-9_]{1,15}$/.test(username)) {
    return send(res, 400, {
      status: false,
      message: 'Username X tidak valid.'
    });
  }

  const profileUrl = `https://x.com/${encodeURIComponent(username)}`;
  const started = Date.now();

  try {
    const response = await fetch(profileUrl, {
      headers: {
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': USER_AGENT,
        'upgrade-insecure-requests': '1'
      },
      redirect: 'follow'
    });

    const html = await response.text();

    if (!response.ok) {
      return send(res, response.status === 404 ? 404 : 502, {
        status: false,
        message: response.status === 404
          ? 'User X tidak ditemukan.'
          : `X mengembalikan HTTP ${response.status}.`,
        execution_time_ms: Date.now() - started
      });
    }

    const avatar = getMeta(html, 'og:image');
    const description = getMeta(html, 'description');
    const name = getMeta(html, 'profile:first_name') || getMeta(html, 'og:title').replace(/\s*\(@[^)]+\).*$/i, '');
    const banner = getMeta(html, 'twitter:image');
    const posts = getMeta(html, 'twitter:data1') || '0';
    const joined = getMeta(html, 'twitter:data2');

    const followerMatch = html.match(/followers:(\d+),following:(\d+)/i);
    const followers = followerMatch ? Number(followerMatch[1]) : 0;
    const following = followerMatch ? Number(followerMatch[2]) : 0;

    if (!name && !description && !avatar) {
      return send(res, 404, {
        status: false,
        message: 'Data user tidak ditemukan. Pastikan username valid.',
        execution_time_ms: Date.now() - started
      });
    }

    return send(res, 200, {
      status: true,
      data: {
        username,
        name,
        description,
        avatar,
        avatar_hd: avatar ? avatar.replace('_200x200', '').replace('_normal', '') : '',
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
    return send(res, 500, {
      status: false,
      message: `Gagal memproses data: ${error?.message || 'Unknown error'}`,
      execution_time_ms: Date.now() - started
    });
  }
}
