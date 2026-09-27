export default {
  slug: "pinterest",

  name: "Pinterest",

  description:
    "Mencari gambar dan video dari Pinterest tanpa membutuhkan browser Chromium.",

  category: "Search",

  method: "GET",

  endpoint: "/api/pinterest",

  icon: "Image",

  parameters: [
    {
      name: "q",
      type: "string",
      required: true,
      description: "Kata kunci pencarian Pinterest.",
      example: "anime"
    },
    {
      name: "limit",
      type: "number",
      required: false,
      description: "Jumlah hasil yang ingin ditampilkan. Maksimal 25.",
      example: "10"
    }
  ],

  responseExample: {
    status: true,
    source: "Pinterest",
    query: "anime",
    total: 2,
    data: [
      {
        id: "123456789012",
        img: "https://i.pinimg.com/originals/example.jpg",
        thumb: "https://i.pinimg.com/236x/example.jpg",
        title: "Anime",
        description: "Anime image",
        isVideo: false,
        videoUrl: ""
      },
      {
        id: "987654321098",
        img: "https://i.pinimg.com/originals/example2.jpg",
        thumb: "https://i.pinimg.com/236x/example2.jpg",
        title: "Anime Wallpaper",
        description: "Anime wallpaper",
        isVideo: false,
        videoUrl: ""
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
      description: "Sumber data."
    },
    {
      name: "query",
      type: "string",
      description: "Kata kunci yang digunakan."
    },
    {
      name: "total",
      type: "number",
      description: "Jumlah hasil yang ditemukan."
    },
    {
      name: "data",
      type: "array",
      description: "Daftar hasil Pinterest."
    },
    {
      name: "data[].id",
      type: "string",
      description: "ID pin Pinterest."
    },
    {
      name: "data[].img",
      type: "string",
      description: "URL gambar utama."
    },
    {
      name: "data[].thumb",
      type: "string",
      description: "URL thumbnail."
    },
    {
      name: "data[].title",
      type: "string",
      description: "Judul pin."
    },
    {
      name: "data[].description",
      type: "string",
      description: "Deskripsi pin."
    },
    {
      name: "data[].isVideo",
      type: "boolean",
      description: "Menunjukkan apakah pin merupakan video."
    },
    {
      name: "data[].videoUrl",
      type: "string",
      description: "URL video jika tersedia."
    }
  ],

  exampleRequest:
    "/api/pinterest?q=anime&limit=10"
};