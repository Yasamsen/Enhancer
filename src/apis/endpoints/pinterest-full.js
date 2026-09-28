export default {
  slug: "pinterest-full",

  name: "Pinterest Full Scraper",

  description:
    "Mengambil data lengkap pin Pinterest, profil pembuat, pin milik pembuat, komentar, dan balasan komentar.",

  category: "Scraper",

  method: "GET",

  endpoint: "/api/pinterest-full",

  icon:
    "https://www.google.com/s2/favicons?domain=pinterest.com&sz=128",

  parameters: [
    {
      name: "url",
      type: "string",
      required: true,
      description: "URL pin Pinterest.",
      example:
        "https://id.pinterest.com/pin/986218018420964709/"
    },
    {
      name: "max-comments",
      type: "number",
      required: false,
      description:
        "Maksimum komentar yang diambil. Default 100, maksimum 500. Isi 0 untuk melewati komentar.",
      example: "100"
    },
    {
      name: "user-pins",
      type: "number",
      required: false,
      description:
        "Jumlah halaman pin pembuat yang diambil. Setiap halaman dapat berisi hingga 25 pin. Default 3, maksimum 20.",
      example: "3"
    },
    {
      name: "delay",
      type: "number",
      required: false,
      description:
        "Jeda antar-request dalam milidetik. Default 700, maksimum 3000.",
      example: "700"
    }
  ],

  responseExample: {
    status: true,
    source: "Pinterest",
    data: {
      scraped_at: "2026-09-28T08:00:00.000Z",
      source_url:
        "https://id.pinterest.com/pin/986218018420964709/",
      pin: {
        id: "986218018420964709",
        url:
          "https://id.pinterest.com/pin/986218018420964709/",
        title: "Contoh judul pin",
        description: "Deskripsi pin",
        alt_text: null,
        created_at: null,
        domain: null,
        source_link: null,
        is_video: false,
        repin_count: 0,
        saves: 0,
        dominant_color: null,
        category: null,
        comments_disabled: false,
        board: null,
        images: {
          orig: "https://i.pinimg.com/originals/example.jpg",
          x736: null,
          x564: null,
          x474: null,
          x236: null
        },
        video: null,
        pinner_username: "username",
        creator: {
          id: "123456",
          username: "username",
          full_name: "Nama Pembuat",
          bio: null,
          profile_url:
            "https://id.pinterest.com/username/",
          avatar: null,
          cover_image: null,
          website: null,
          followers: 100,
          following: 50,
          pins_count: 200,
          boards_count: 10,
          is_verified: false,
          is_verified_merchant: false,
          created_at: null,
          location: null,
          country: null,
          is_private_profile: false
        }
      },
      creator_pins: [],
      comments: [],
      stats: {
        total_creator_pins: 0,
        total_comments: 0,
        total_replies: 0
      }
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
      description: "Sumber data."
    },
    {
      name: "data",
      type: "object",
      description: "Seluruh data hasil scraping."
    },
    {
      name: "data.scraped_at",
      type: "string",
      description: "Waktu scraping dalam format ISO."
    },
    {
      name: "data.source_url",
      type: "string",
      description: "URL pin Pinterest."
    },
    {
      name: "data.pin",
      type: "object",
      description: "Detail pin dan profil pembuat."
    },
    {
      name: "data.pin.images",
      type: "object",
      description: "URL gambar dalam beberapa ukuran."
    },
    {
      name: "data.pin.video",
      type: "string | object",
      description: "URL atau data video jika tersedia."
    },
    {
      name: "data.pin.creator",
      type: "object",
      description: "Profil pembuat pin."
    },
    {
      name: "data.creator_pins",
      type: "array",
      description: "Daftar pin milik pembuat."
    },
    {
      name: "data.comments",
      type: "array",
      description: "Komentar beserta balasan yang berhasil diambil."
    },
    {
      name: "data.stats",
      type: "object",
      description: "Jumlah pin, komentar, dan balasan."
    },
    {
      name: "data.stats.total_creator_pins",
      type: "number",
      description: "Jumlah pin pembuat yang dikembalikan."
    },
    {
      name: "data.stats.total_comments",
      type: "number",
      description: "Jumlah komentar yang dikembalikan."
    },
    {
      name: "data.stats.total_replies",
      type: "number",
      description: "Jumlah balasan yang dikembalikan."
    }
  ],

  exampleRequest:
    "/api/pinterest-full?url=https://id.pinterest.com/pin/986218018420964709/&max-comments=100&user-pins=3&delay=700"
};