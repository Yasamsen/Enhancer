export default {
  "slug": "qrcode",
  "name": "QR Code Generator",
  "description": "Generate QR codes from any text, URL, or data with customizable size and color.",
  "category": "Utility",
  "method": "GET",
  "endpoint": "/api/qrcode",
  "icon": "QrCode",
  "parameters": [
    {
      "name": "text",
      "type": "string",
      "required": true,
      "description": "The text or URL to encode into the QR code.",
      "example": "https://example.com"
    },
    {
      "name": "size",
      "type": "number",
      "required": false,
      "description": "QR code size in pixels (default 300).",
      "example": "500"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "url": "https://cdn.samapi.com/qr/XXXX.png",
      "text": "https://example.com",
      "size": 500,
      "format": "png"
    }
  },
  "responseFields": [
    {
      "name": "success",
      "type": "boolean",
      "description": "Whether the request succeeded."
    },
    {
      "name": "data.url",
      "type": "string",
      "description": "URL of the generated QR code image."
    },
    {
      "name": "data.text",
      "type": "string",
      "description": "Encoded text content."
    },
    {
      "name": "data.size",
      "type": "number",
      "description": "Image size in pixels."
    }
  ],
  "exampleRequest": "https://samapi.example.com/api/qrcode?text=https://example.com&size=500"
};
