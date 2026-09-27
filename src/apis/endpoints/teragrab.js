export default {
  slug: "teragrab",

  name: "TeraGrab",

  description:
    "Resolve link TeraBox menggunakan resolver TeraGrab dan mengembalikan ID file, informasi file, play URL, serta play token.",

  category: "Downloader",

  method: "GET",

  endpoint: "/api/teragrab",

  icon: "https://www.google.com/s2/favicons?domain=teragrab.com&sz=128",

  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      description: "URL share TeraBox yang ingin di-resolve.",
      example:
        "https://www.terabox.com/wap/share/filelist?surl=DYFUrKYWrkCp6M-eewEQ0w"
    }
  ],

  responseExample: {
    status: true,
    source: "TeraGrab",
    query:
      "https://www.terabox.com/wap/share/filelist?surl=DYFUrKYWrkCp6M-eewEQ0w",
    data: {
      id: "example-id",
      file: {
        name: "example.mp4",
        size: 10485760,
        type: "video"
      },
      play_url: "https://example.com/play/example.mp4",
      play_token: "example-token"
    }
  },

  responseFields: [
    {
      name: "status",
      type: "boolean",
      description: "Status request."
    },
    {
      name: "source",
      type: "string",
      description: "Sumber resolver yang digunakan."
    },
    {
      name: "query",
      type: "string",
      description: "URL TeraBox yang diproses."
    },
    {
      name: "data",
      type: "object",
      description: "Data hasil resolve dari TeraGrab."
    },
    {
      name: "data.id",
      type: "string",
      description: "ID hasil resolve TeraGrab."
    },
    {
      name: "data.file",
      type: "object",
      description: "Informasi file yang dikembalikan TeraGrab."
    },
    {
      name: "data.play_url",
      type: "string",
      description: "URL untuk memutar atau mengakses file."
    },
    {
      name: "data.play_token",
      type: "string",
      description: "Token yang digunakan bersama play URL jika tersedia."
    }
  ],

  exampleRequest:
    "/api/teragrab?url=https://www.terabox.com/wap/share/filelist?surl=DYFUrKYWrkCp6M-eewEQ0w"
};