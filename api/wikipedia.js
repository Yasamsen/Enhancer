const WIKI_API = "https://id.wikipedia.org/w/api.php";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  const { query, limit = "10" } = req.query;

  if (!query) {
    return res.status(400).json({
      status: false,
      message: "Parameter query wajib diisi",
      example: "/api/wikipedia?query=Indonesia"
    });
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
      snippet: item.snippet
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, "&"),
      word_count: item.wordcount,
      timestamp: item.timestamp,
      url: `https://id.wikipedia.org/wiki/${encodeURIComponent(
        item.title.replace(/ /g, "_")
      )}`
    }));

    return res.status(200).json({
      status: true,
      source: "Wikipedia Indonesia",
      query: String(query),
      total: results.length,
      data: results
    });

  } catch (error) {
    console.error("Wikipedia API Error:", error);

    return res.status(502).json({
      status: false,
      source: "Wikipedia Indonesia",
      message: "Gagal mengambil data dari Wikipedia",
      error: error.message
    });
  }
}