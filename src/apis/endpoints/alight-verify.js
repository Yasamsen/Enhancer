export default {
  slug: "alight-verify",
  name: "AmPrem Verify",
  description: "Melakukan verifikasi akun AmPrem menggunakan email dan link verifikasi.",
  category: "Tools",
  method: "POST",
  endpoint: "/api/alight/verify",
  icon: "BadgeCheck",

  parameters: [
    {
      name: "apikey",
      type: "string",
      required: true,
      description: "API key AmPrem."
    },
    {
      name: "email",
      type: "string",
      required: true,
      description: "Email yang digunakan."
    },
    {
      name: "link",
      type: "string",
      required: true,
      description: "Link verifikasi."
    }
  ],

  responseExample: {
    status: true,
    message: "Verification berhasil diproses."
  },

  responseFields: [
    {
      name: "status",
      type: "boolean",
      description: "Status request."
    },
    {
      name: "message",
      type: "string",
      description: "Pesan dari API."
    }
  ]
};