export default {
  "slug": "youtube",
  "name": "YouTube Downloader",
  "description": "Download YouTube videos in multiple resolutions, extract audio as MP3, and fetch metadata.",
  "category": "Downloader",
  "method": "GET",
  "endpoint": "/api/youtube",
  "icon": "Youtube",
  "parameters": [
    {
      "name": "url",
      "type": "string",
      "required": true,
      "description": "The YouTube video URL.",
      "example": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      "name": "quality",
      "type": "string",
      "required": false,
      "description": "Preferred video quality (144p, 360p, 720p, 1080p).",
      "example": "1080p"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "platform": "youtube",
      "videoId": "dQw4w9WgXcQ",
      "title": "Sample YouTube Video",
      "author": "Channel Name",
      "duration": "3:32",
      "thumbnail": "https://cdn.youtube.com/thumb.jpg",
      "formats": [
        {
          "quality": "1080p",
          "url": "https://cdn.youtube.com/1080.mp4",
          "type": "video",
          "size": "45.2 MB"
        },
        {
          "quality": "720p",
          "url": "https://cdn.youtube.com/720.mp4",
          "type": "video",
          "size": "28.1 MB"
        },
        {
          "quality": "mp3",
          "url": "https://cdn.youtube.com/audio.mp3",
          "type": "audio",
          "size": "5.1 MB"
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
      "name": "data.videoId",
      "type": "string",
      "description": "YouTube video ID."
    },
    {
      "name": "data.title",
      "type": "string",
      "description": "Video title."
    },
    {
      "name": "data.duration",
      "type": "string",
      "description": "Video duration."
    },
    {
      "name": "data.formats",
      "type": "array",
      "description": "Available download formats with direct URLs."
    }
  ],
  "exampleRequest": "https://samapi.example.com/api/youtube?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&quality=1080p"
};
