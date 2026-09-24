export default {
  "slug": "facebook",
  "name": "Facebook Downloader",
  "description": "Download Facebook videos in HD or SD quality from public posts and reels.",
  "category": "Downloader",
  "method": "GET",
  "endpoint": "/api/facebook",
  "icon": "Facebook",
  "parameters": [
    {
      "name": "url",
      "type": "string",
      "required": true,
      "description": "The Facebook video URL.",
      "example": "https://www.facebook.com/watch?v=XXXXXXX"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "platform": "facebook",
      "title": "Sample Facebook Video",
      "author": "Page Name",
      "thumbnail": "https://cdn.facebook.com/thumb.jpg",
      "media": [
        {
          "quality": "HD",
          "url": "https://cdn.facebook.com/hd.mp4",
          "type": "video"
        },
        {
          "quality": "SD",
          "url": "https://cdn.facebook.com/sd.mp4",
          "type": "video"
        }
      ]
    }
  },
  "responseFields": [
    {
      "name": "success",
      "type": "boolean",
      "description": "Whether the request succeeded."
    },
    {
      "name": "data.title",
      "type": "string",
      "description": "Video title."
    },
    {
      "name": "data.author",
      "type": "string",
      "description": "Uploader page name."
    },
    {
      "name": "data.media",
      "type": "array",
      "description": "Available video qualities with download URLs."
    }
  ],
  "exampleRequest": "https://samapi.example.com/api/facebook?url=https://www.facebook.com/watch?v=XXXXXXX"
};
