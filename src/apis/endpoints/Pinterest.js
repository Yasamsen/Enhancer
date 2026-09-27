export default {
  slug: "pinterest",
  name: "Pinterest Search",
  description: "Mencari gambar dan video dari Pinterest.",
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
      }
    ]
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
      description: "Sumber data."
    },
    {
      name: "query",
      type: "string",
      description: "Kata kunci pencarian."
    },
    {
      name: "total",
      type: "number",
      description: "Jumlah hasil."
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
      description: "Menandakan apakah pin memiliki video."
    },
    {
      name: "data[].videoUrl",
      type: "string",
      description: "URL video jika tersedia."
    }
  ],

  exampleRequest: "/api/pinterest?q=anime"
};