const BASE = "https://cleantempmail.com";

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: "application/json",
      "User-Agent":
        "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/131.0.0.0 Mobile Safari/537.36",
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
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message || `HTTP ${response.status}`
    );
  }

  return data;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    const action = req.query?.action || "random";

    // =========================
    // RANDOM EMAIL
    // =========================
    if (action === "random") {
      const data = await request(
        `${BASE}/api/generate-email`
      );

      return res.status(200).json({
        status: true,
        source: "CleanTempMail",
        action: "random",
        data
      });
    }

    // =========================
    // CUSTOM EMAIL
    // =========================
    if (action === "custom") {
      const prefix = req.query?.prefix;
      const domain = req.query?.domain;

      if (!prefix) {
        return res.status(400).json({
          status: false,
          message: "Parameter prefix wajib diisi",
          example:
            "/api/tempmail?action=custom&prefix=testuser&domain=example.com"
        });
      }

      if (!domain) {
        return res.status(400).json({
          status: false,
          message: "Parameter domain wajib diisi",
          example:
            "/api/tempmail?action=custom&prefix=testuser&domain=example.com"
        });
      }

      const data = await request(
        `${BASE}/api/generate-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            prefix: String(prefix),
            domain: String(domain)
          })
        }
      );

      return res.status(200).json({
        status: true,
        source: "CleanTempMail",
        action: "custom",
        data
      });
    }

    return res.status(400).json({
      status: false,
      message: "Action tidak valid",
      available: ["random", "custom"]
    });

  } catch (error) {
    console.error("TempMail Error:", error);

    return res.status(502).json({
      status: false,
      source: "CleanTempMail",
      message: "Gagal memproses temporary email",
      error: error.message
    });
  }
}