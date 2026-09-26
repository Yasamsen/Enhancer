export default {
  "slug": "twitter",
  "name": "Twitter/X Downloader",
  "description": "Download videos and GIFs from Twitter/X posts in original quality.",
  "category": "Downloader",
  "method": "GET",
  "endpoint": "/api/twitter",
  "icon": "Twitter",
  "parameters": [
    {
      "name": "url",
      "type": "string",
      "required": true,
      "description": "The Twitter/X post URL containing media.",
      "example": "https://twitter.com/user/status/XXXXXXX"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "platform": "twitter",
      "author": "@username",
      "text": "Sample tweet text",
      "media": [
        {
          "type": "video",
          "url": "https://cdn.twitter.com/video.mp4",
          "quality": "original"
        },
        {
          "type": "image",
          "url": "https://cdn.twitter.com/image.jpg"
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
      "name": "data.author",
      "type": "string",
      "description": "Tweet author handle."
    },
    {
      "name": "data.text",
      "type": "string",
      "description": "Tweet text content."
    },
    {
      "name": "data.media",
      "type": "array",
      "description": "Media attachments with download URLs."
    }
  ],
  "exampleRequest": "https://samapi.example.com/api/twitter?url=https://twitter.com/user/status/XXXXXXX"
};
