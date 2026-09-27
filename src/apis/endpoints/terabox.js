export default {
  slug: "terabox",

  name: "TeraBox",

  description:
    "Scrape link TeraBox untuk mengambil daftar gambar dan video di dalam file maupun folder secara rekursif.",

  category: "Downloader",

  method: "GET",

  endpoint: "/api/terabox",

  icon: "Cloud",

  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      description: "Link share TeraBox yang ingin di-scrape.",
      example: "https://terabox.com/s/XXXXXXXX"
    },
    {
      name: "limit",
      type: "number",
      required: false,
      description:
        "Batas jumlah gambar dan video yang dikembalikan. Default 100, maksimal 500.",
      example: "100"
    }
  ],

  responseExample: {
    status: true,
    source: "TeraBox",
    url: "https://terabox.com/s/XXXXXXXX",
    total: 3,
    images: 2,
    videos: 1,
    limit: 100,
    data: [
      {
        name: "foto.jpg",
        type: "image",
        size: 123456,
        path: "/",
        thumbnail: "https://example.com/thumbnail.jpg",
        url: "https://example.com/image.jpg"
      },
      {
        name: "wallpaper.png",
        type: "image",
        size: 234567,
        path: "Folder Gambar",
        thumbnail: "https://example.com/thumbnail.png",
        url: "https://example.com/image.png"
      },
      {
        name: "video.mp4",
        type: "video",
        size: 9876543,
        path: "Folder Video",
        thumbnail: "https://example.com/video-thumb.jpg",
        url: "https://example.com/video.mp4"
      }
    ]
  },

  responseFields: [
    {
      name: "status",
      type: "boolean",
      description: "Status permintaan."
    },
    {
      name: "source",
      type: "string",
      description: "Sumber data, yaitu TeraBox."
    },
    {
      name: "url",
      type: "string",
      description: "Link TeraBox yang di-scrape."
    },
    {
      name: "total",
      type: "number",
      description: "Total gambar dan video yang ditemukan."
    },
    {
      name: "images",
      type: "number",
      description: "Jumlah gambar yang ditemukan."
    },
    {
      name: "videos",
      type: "number",
      description: "Jumlah video yang ditemukan."
    },
    {
      name: "limit",
      type: "number",
      description: "Batas maksimum media yang diproses."
    },
    {
      name: "data",
      type: "array",
      description: "Daftar gambar dan video dari TeraBox."
    },
    {
      name: "data[].name",
      type: "string",
      description: "Nama file."
    },
    {
      name: "data[].type",
      type: "string",
      description: "Jenis file: image atau video."
    },
    {
      name: "data[].size",
      type: "number",
      description: "Ukuran file dalam byte."
    },
    {
      name: "data[].path",
      type: "string",
      description: "Lokasi folder file