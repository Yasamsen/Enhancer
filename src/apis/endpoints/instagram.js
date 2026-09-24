export default {
  "slug": "instagram",
  "name": "Instagram Downloader",
  "description": "Download photos, videos, reels, and stories from Instagram links with high quality output.",
  "category": "Downloader",
  "method": "GET",
  "endpoint": "/api/instagram",
  "icon": "Instagram",
  "parameters": [
    {
      "name": "url",
      "type": "string",
      "required": true,
      "description": "The Instagram post, reel, or story URL to download from.",
      "example": "https://www.instagram.com/reel/XXXXXXX/"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "platform": "instagram",
      "type": "reel",
      "media": [
        {
          "url": "https://cdn.instagram.com/media.mp4",
          "thumbnail": "https://cdn.instagram.com/thumb.jpg",
          "type": "video",
          "quality": "HD"
        }
      ],
      "author": {
        "username": "@username",
        "name": "User Name"
      },
      "caption": "Sample caption text"
    }
  },
  "responseFields": [
    {
      "name": "success",
      "type": "boolean",
      "description": "Whether the request succeeded."
    },
    {
      "name": "data.platform",
      "type": "string",
      "description": "Source platform name."
    },
    {
      "name": "data.type",
      "type": "string",
      "description": "Type of media (post, reel, story)."
    },
    {
      "name": "data.media",
      "type": "array",
      "description": "Array of downloadable media objects."
    },
    {
      "name": "data.media[].url",
      "type": "string",
      "description": "Direct download URL."
    },
    {
      "name": "data.media[].thumbnail",
      "type": "string",
      "description": "Thumbnail image URL."
    },
    {
      "name": "data.author",
      "type": "object",
      "description": "Author profile information."
    }
  ],
  "exampleRequest": "https://samapi.example.com/api/instagram?url=https://www.instagram.com/reel/XXXXXXX/"
};
