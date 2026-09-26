async function handleWaifuimg(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).send("Method harus GET.");
    }

    const response = await fetch(
      "https://raw.githubusercontent.com/Yasamsen/media-repo/main/waifuimg/api.json"
    );

    if (!response.ok) {
      throw new Error(`Gagal mengambil api.json: ${response.status}`);
    }

    const json = await response.json();

    if (!Array.isArray(json.data) || json.data.length === 0) {
      return res.status(404).send("Data gambar tidak ditemukan.");
    }

    const validImages = json.data.filter(
      url => typeof url === "string" && /^https?:\/\//i.test(url)
    );

    if (validImages.length === 0) {
      return res.status(404).send("Tidak ada URL gambar yang valid.");
    }

    const imageUrl =
      validImages[Math.floor(Math.random() * validImages.length)];

    const imageResponse = await fetch(imageUrl);

    if (!imageResponse.ok) {
      throw new Error(`Gagal mengambil gambar: ${imageResponse.status}`);
    }

    const contentType =
      imageResponse.headers.get("content-type") || "image/jpeg";

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());

    res.status(200);
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");

    return res.send(imageBuffer);

  } catch (error) {
    return res.status(500).send(
      `Gagal mengambil gambar WaifuImg: ${error.message}`
    );
  }
}