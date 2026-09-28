export default {
  slug: "ai-image",

  name: "AI Image Generator",

  description:
    "Membuat gambar menggunakan AI berdasarkan prompt teks.",

  category: "AI",

  method: "GET",

  endpoint: "/api/ai-image",

  icon:
    "https://www.google.com/s2/favicons?domain=live3d.io&sz=128",

  parameters: [
    {
      name: "prompt",
      type: "string",
      required: true,
      description:
        "Deskripsi gambar yang ingin dibuat.",
      example:
        "anime girl with blue hair"
    }
  ],

  responseExample: {
    status: true,
    source: "Live3D",
    runtime: "15234 ms",
    data: {
      task_id:
        "example-task-id",

      prompt:
        "anime girl with blue hair",

      model:
        "AbsoluteReality_v1.8.1.safetensors",

      cfg: 7,

      image_url:
        "https://temp.live3d.io/example.jpg"
    }
  },

  responseFields: [
    {
      name: "status",
      type: "boolean",
      description:
        "Status request."
    },

    {
      name: "source",
      type: "string",
      description:
        "Sumber AI image."
    },

    {
      name: "runtime",
      type: "string",
      description:
        "Waktu yang diperlukan untuk menghasilkan gambar."
    },

    {
      name: "data.task_id",
      type: "string",
      description:
        "ID task dari server AI."
    },

    {
      name: "data.prompt",
      type: "string",
      description:
        "Prompt yang digunakan."
    },

    {
      name: "data.model",
      type: "string",
      description:
        "Model yang digunakan oleh server."
    },

    {
      name: "data.cfg",
      type: "number",
      description:
        "Nilai CFG yang digunakan."
    },

    {
      name: "data.image_url",
      type: "string",
      description:
        "URL hasil gambar."
    }
  ],

  exampleRequest:
    "/api/ai-image?prompt=anime%20girl%20with%20blue%20hair"
};