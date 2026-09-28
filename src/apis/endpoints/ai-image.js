export default {
  slug: "ai-image",

  name: "AI Image Generator",

  description:
    "Generate gambar menggunakan AI berdasarkan prompt. Endpoint dapat mencoba menggunakan URL foto terlebih dahulu dan otomatis menggunakan mode text jika URL foto tidak dapat diproses.",

  category: "AI",

  method: "GET",

  endpoint:
    "/api/ai-image",

  icon:
    "https://www.google.com/s2/favicons?domain=aifaceswap.io&sz=128",

  parameters: [
    {
      name: "prompt",

      type: "string",

      required: true,

      description:
        "Prompt atau deskripsi gambar yang ingin dibuat.",

      example:
        "anime girl with blue hair"
    },

    {
      name: "url",

      type: "string",

      required: false,

      description:
        "URL gambar yang ingin dicoba sebagai input foto. Jika URL kosong atau tidak dapat diproses, endpoint otomatis menggunakan mode text.",

      example:
        "https://example.com/image.jpg"
    },

    {
      name: "negative_prompt",

      type: "string",

      required: false,

      description:
        "Prompt untuk memberi tahu AI elemen yang ingin dihindari.",

      example:
        "low quality, blurry, deformed"
    },

    {
      name: "model",

      type: "string",

      required: false,

      description:
        "Model AI yang digunakan untuk generate gambar.",

      example:
        "AbsoluteReality_v1.8.1.safetensors"
    },

    {
      name: "cfg",

      type: "number",

      required: false,

      description:
        "Nilai CFG untuk pengaturan kekuatan prompt.",

      example:
        7
    }
  ],

  responseExample: {
    status: true,

    creator: "yasamDev",

    runtime: "12500 ms",

    mode: "text",

    message:
      "URL foto tidak dapat diproses, otomatis menggunakan prompt text.",

    fallback_reason:
      "Mode foto tidak didukung.",

    result: {
      task_id:
        "example-task-id",

      prompt:
        "anime girl with blue hair",

      negative_prompt:
        "low quality, blurry",

      result_image_url:
        "https://temp.live3d.io/example-image.jpg"
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
      name: "creator",

      type: "string",

      description:
        "Nama pembuat endpoint."
    },

    {
      name: "runtime",

      type: "string",

      description:
        "Waktu yang diperlukan untuk memproses request."
    },

    {
      name: "mode",

      type: "string",

      description:
        "Mode yang digunakan. Nilainya dapat berupa photo atau text."
    },

    {
      name: "message",

      type: "string",

      description:
        "Pesan fallback jika URL foto tidak dapat diproses."
    },

    {
      name: "fallback_reason",

      type: "string",

      description:
        "Alasan mode foto gagal dan endpoint menggunakan mode text."
    },

    {
      name: "result",

      type: "object",

      description:
        "Hasil generate AI."
    },

    {
      name: "result.task_id",

      type: "string",

      description:
        "ID task generate AI."
    },

    {
      name: "result.prompt",

      type: "string",

      description:
        "Prompt yang digunakan."
    },

    {
      name: "result.negative_prompt",

      type: "string",

      description:
        "Negative prompt yang digunakan."
    },

    {
      name: "result.result_image_url",

      type: "string",

      description:
        "URL gambar hasil generate."
    }
  ],

  exampleRequest:
    "/api/ai-image?prompt=anime%20girl%20with%20blue%20hair"
};