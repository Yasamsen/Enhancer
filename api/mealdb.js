const BASE_URL = "https://www.themealdb.com/api/json/v1/1";

async function request(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TheMealDB HTTP ${response.status}`);
  }

  return response.json();
}

function formatMeal(meal) {
  if (!meal) return null;

  const ingredients = [];

  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`]?.trim();
    const measure = meal[`strMeasure${i}`]?.trim();

    if (ingredient) {
      ingredients.push({
        ingredient,
        measure: measure || null
      });
    }
  }

  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    thumbnail: meal.strMealThumb,
    youtube: meal.strYoutube || null,
    source: meal.strSource || null,
    ingredients
  };
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({
      status: false,
      message: "Method not allowed"
    });
  }

  try {
    const { action = "search", query, id } = req.query;

    let data;

    if (action === "search") {
      if (!query) {
        return res.status(400).json({
          status: false,
          message: "Parameter query wajib diisi",
          example: "/api/mealdb?action=search&query=chicken"
        });
      }

      data = await request(
        `${BASE_URL}/search.php?s=${encodeURIComponent(query)}`
      );

      const meals = (data.meals || []).map(formatMeal);

      return res.status(200).json({
        status: true,
        source: "TheMealDB",
        action: "search",
        total: meals.length,
        data: meals
      });
    }

    if (action === "detail") {
      if (!id) {
        return res.status(400).json({
          status: false,
          message: "Parameter id wajib diisi",
          example: "/api/mealdb?action=detail&id=52772"
        });
      }

      data = await request(
        `${BASE_URL}/lookup.php?i=${encodeURIComponent(id)}`
      );

      const meal = data.meals?.[0];

      if (!meal) {
        return res.status(404).json({
          status: false,
          message: "Resep tidak ditemukan"
        });
      }

      return res.status(200).json({
        status: true,
        source: "TheMealDB",
        action: "detail",
        data: formatMeal(meal)
      });
    }

    if (action === "random") {
      data = await request(`${BASE_URL}/random.php`);

      const meal = data.meals?.[0];

      if (!meal) {
        return res.status(404).json({
          status: false,
          message: "Resep tidak ditemukan"
        });
      }

      return res.status(200).json({
        status: true,
        source: "TheMealDB",
        action: "random",
        data: formatMeal(meal)
      });
    }

    return res.status(400).json({
      status: false,
      message: "Action tidak valid",
      available: ["search", "detail", "random"]
    });

  } catch (error) {
    console.error("TheMealDB Error:", error);

    return res.status(502).json({
      status: false,
      source: "TheMealDB",
      message: "Gagal mengambil data resep",
      error: error.message
    });
  }
}