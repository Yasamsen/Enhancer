export default {
  "slug": "tiktok",
  "name": "TikTok Downloader",
  "description": "Download TikTok videos without watermark in HD, including audio extraction support.",
  "category": "Downloader",
  "method": "GET",
  "endpoint": "/api/tiktok",
  "icon": "Music2",
  "parameters": [
    {
      "name": "url",
      "type": "string",
      "required": true,
      "description": "The TikTok video URL to download.",
      "example": "https://www.tiktok.com/@user/video/XXXXXXX"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "platform": "tiktok",
      "title": "Sample TikTok Video",
      "author": {
        "username": "@creator",
        "nickname": "Creator",
        "avatar": "https://cdn.tiktok.com/avatar.jpg"
      },
      "media": [
        {
          "url": "https://cdn.tiktok.com/video-no-wm.mp4",
          "type": "video",
          "quality": "HD",
          "noWatermark": true
        },
        {
          "url": "https://cdn.tiktok.com/audio.mp3",
          "type": "audio"
        }
      ],
      "statistics": {
        "plays": 1200000,
        "likes": 240000,
        "comments": 5600,
        "shares": 12000
      }
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
      "description": "Video title/caption."
    },
    {
      "name": "data.author",
      "type": "object",
      "description": "Creator profile information."
    },
    {
      "name": "data.media",
      "type": "array",
      "description": "Array of downloadable media (video + audio)."
    },
    {
      "name": "data.statistics",
      "type": "object",
      "description": "Video engagement statistics."
    }
  ],
  "exampleRequest": "https://samapi.example.com/api/tiktok?url=https://www.tiktok.com/@user/video/XXXXXXX"
};
