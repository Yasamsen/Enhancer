export default {
  "slug": "ai-image",
  "name": "AI Image Generator",
  "description": "Generate images from text descriptions using advanced diffusion models.",
  "category": "AI",
  "method": "POST",
  "endpoint": "/api/ai-image",
  "icon": "ImagePlus",
  "parameters": [
    {
      "name": "prompt",
      "type": "string",
      "required": true,
      "description": "Text description of the image to generate.",
      "example": "A serene mountain lake at sunset"
    },
    {
      "name": "size",
      "type": "string",
      "required": false,
      "description": "Image dimensions (256x256, 512x512, 1024x1024).",
      "example": "1024x1024"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "url": "https://cdn.samapi.com/generated/image.png",
      "size": "1024x1024",
      "seed": 42,
      "created": "2024-01-15T10:30:00Z"
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
      "description": "URL of the generated image."
    },
    {
      "name": "data.size",
      "type": "string",
      "description": "Image dimensions."
    },
    {
      "name": "data.seed",
      "type": "number",
      "description": "Random seed used for generation."
    }
  ],
  "exampleRequest": "POST https://samapi.example.com/api/ai-image\nContent-Type: application/json\n\n{\"prompt\":\"A serene mountain lake at sunset\",\"size\":\"1024x1024\"}"
};
