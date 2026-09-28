export default {
  slug: "ai-image",

  name: "AI Image",

  description:
    "Generate gambar AI berdasarkan prompt dan negative prompt.",

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
        "Prompt atau deskripsi gambar yang ingin dibuat.",
      example:
        "anime girl with blue hair"
    },
    {
      name: "negative_prompt",
      type: "string",
      required: false,
      description:
        "Negative prompt untuk menentukan hal yang ingin dihindari pada gambar.",
      example:
        "bad quality, blurry, deformed"
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

      negative_prompt:
        "bad quality, blurry, deformed",

      result_image_url:
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
        "Waktu proses pembuatan gambar."
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
        "Prompt yang digunakan untuk membuat gambar."
    },
    {
      name: "data.negative_prompt",
      type: "string",
      description:
        "Negative prompt yang digunakan."
    },
    {
      name: "data.result_image_url",
      type: "string",
      description:
        "URL gambar hasil generate."
    }
  ],

  exampleRequest:
    "/api/ai-image?prompt=anime%20girl%20with%20blue%20hair&negative_prompt=bad%20quality%2C%20blurry"
};