export default {
  "slug": "weather",
  "name": "Weather Info",
  "description": "Get current weather conditions and forecasts for any city worldwide.",
  "category": "Utility",
  "method": "GET",
  "endpoint": "/api/weather",
  "icon": "CloudSun",
  "parameters": [
    {
      "name": "city",
      "type": "string",
      "required": true,
      "description": "City name to get weather for.",
      "example": "Jakarta"
    },
    {
      "name": "units",
      "type": "string",
      "required": false,
      "description": "Temperature units (metric, imperial).",
      "example": "metric"
    }
  ],
  "responseExample": {
    "success": true,
    "data": {
      "city": "Jakarta",
      "country": "Indonesia",
      "temperature": 31,
      "condition": "Partly Cloudy",
      "humidity": 75,
      "windSpeed": 12,
      "forecast": [
        {
          "day": "Mon",
          "high": 32,
          "low": 25,
          "condition": "Sunny"
        },
        {
          "day": "Tue",
          "high": 30,
          "low": 24,
          "condition": "Rain"
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
      "name": "data.city",
      "type": "string",
      "description": "City name."
    },
    {
      "name": "data.temperature",
      "type": "number",
      "description": "Current temperature."
    },
    {
      "name": "data.condition",
      "type": "string",
      "description": "Weather condition description."
    },
    {
      "name": "data.forecast",
      "type": "array",
      "description": "Multi-day forecast array."
    }
  ],
  "exampleRequest": "https://samapi.example.com/api/weather?city=Jakarta&units=metric"
};
