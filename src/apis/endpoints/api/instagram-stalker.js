const axios = require("axios");
const cheerio = require("cheerio");

async function stalkIG(username) {
  username = String(username || "").replace(/^@/, "").trim();

  if (!username) {
    return {
      status: false,
      message: "Username wajib diisi."
    };
  }

  const url = `https://www.instagram.com/${encodeURIComponent(username)}/`;

  const headers = {
    accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "user-agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/114.0.0.0 Safari/537.36",
    "upgrade-insecure-requests": "1"
  };

  try {
    const response = await axios.get(url, {
      headers,
      timeout: 15000
    });

    const html = response.data;
    const $ = cheerio.load(html);

    let userData = null;

    $('script[type="application/json"]').each((i, el) => {
      const text = $(el).html();

      if (!text || !text.includes("follower_count")) return;

      try {
        const usernameMatch = text.match(/"username":"([^"]+)"/);
        const pkMatch = text.match(/"pk":"([^"]+)"/);
        const hdPpMatch = text.match(
          /"hd_profile_pic_version":\{"url":"([^"]+)"/
        );
        const ppMatch = text.match(/"profile_pic_url":"([^"]+)"/);
        const nameMatch = text.match(/"full_name":"([^"]*)"/);
        const followersMatch = text.match(/"follower_count":(\d+)/);
        const followingMatch = text.match(/"following_count":(\d+)/);
        const mediaMatch = text.match(/"media_count":(\d+)/);
        const bioMatch = text.match(
          /"biography":("(?:[^"\\]|\\.)*")/
        );
        const verifiedMatch = text.match(
          /"is_verified":(true|false)/
        );

        if (
          usernameMatch &&
          usernameMatch[1].toLowerCase() === username.toLowerCase()
        ) {
          let biography = "";

          if (bioMatch) {
            try {
              biography = JSON.parse(bioMatch[1]);
            } catch {
              biography = bioMatch[1];
            }
          }

          let avatar = hdPpMatch
            ? hdPpMatch[1]
            : ppMatch
              ? ppMatch[1]
              : "";

          try {
            avatar = JSON.parse(`"${avatar}"`);
          } catch {}

          userData = {
            username: usernameMatch[1],
            id: pkMatch ? pkMatch[1] : null,
            full_name: nameMatch
              ? JSON.parse(`"${nameMatch[1]}"`)
              : null,
            profile_pic: avatar,
            followers: followersMatch
              ? parseInt(followersMatch[1])
              : 0,
            following: followingMatch
              ? parseInt(followingMatch[1])
              : 0,
            posts: mediaMatch
              ? parseInt(mediaMatch[1])
              : 0,
            biography,
            is_verified: verifiedMatch
              ? verifiedMatch[1] === "true"
              : false,
            profile_url: url
          };
        }
      } catch {}
    });

    if (!userData) {
      return {
        status: false,
        message:
          "Data user tidak ditemukan. Pastikan username valid atau data profil tidak tersedia."
      };
    }

    return {
      status: true,
      data: userData
    };
  } catch (error) {
    return {
      status: false,
      message: `Gagal memproses data: ${error.message}`
    };
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method Not Allowed"
    });
  }

  const username = req.query?.username;

  const result = await stalkIG(username);

  return res.status(result.status ? 200 : 400).json(result);
};