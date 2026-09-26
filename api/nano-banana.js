import axios from "axios";
import formidable from "formidable";
import fs from "fs";

export const config = {
  api: {
    bodyParser: false
  }
};

const BANANA_API =
  "https://ibbo.ai/api/nano-banana-lite-image-to-image";

const HEADERS = {
  Accept: "*/*",
  Origin: "https://banana-nano.ai",
  Referer: "https://banana-nano.ai/ai-image-editor",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/109.0.0.0 Safari/537.36"
};

function parseForm(req) {
  return new Promise((resolve, reject) => {
    const form = formidable({
      multiples: false,
      keepExtensions: true
    });

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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    const { fields, files } = await parseForm(req);

    const prompt = getField(fields.prompt);

    const uploadedImage =
      files.image ||
      files.file;

    const imageFile = Array.isArray(uploadedImage)
      ? uploadedImage[0]
      : uploadedImage;

    if (!imageFile) {
      return res.status(400).json({
        status: false,
        message: "Parameter image wajib diisi"
      });
    }

    if (!prompt) {
      return res.status(400).json({
        status: false,
        message: "Parameter prompt wajib diisi"
      });
    }

    const imageBuffer = fs.readFileSync(imageFile.filepath);

    const formData = new FormData();

    const blob = new Blob(
      [imageBuffer],
      {
        type:
          imageFile.mimetype ||
          "image/jpeg"
      }
    );

    formData.append(
      "file",
      blob,
      imageFile.originalFilename ||
        "image.jpg"
    );

    formData.append(
      "prompt",
      String(prompt)
    );

    formData.append(
      "output_format",
      String(
        getField(fields.output_format) ||
          "jpg"
      )
    );

    formData.append(
      "generator_slug",
      "ai-image-editor"
    );

    const response = await axios.post(
      BANANA_API,
      formData,
      {
        headers: {
          ...HEADERS,
          ...formData.getHeaders()
        },
        timeout: 120000,
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    return res.status(200).json({
      status: true,
      source: "NanoBanana",
      data: response.data
    });

  } catch (error) {
    console.error(
      "NanoBanana Error:",
      error
    );

    return res.status(
      error.response?.status || 502
    ).json({
      status: false,
      source: "NanoBanana",
      message:
        "Gagal memproses gambar",
      error:
        error.response?.data ||
        error.message
    });
  }
}