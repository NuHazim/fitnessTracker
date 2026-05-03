const API_KEY = "c97d082272484ba5bad8b84d79789329";

function showTab(tab, el) {
  document.getElementById("searchTab").classList.add("d-none");
  document.getElementById("favoritesTab").classList.add("d-none");
  document.getElementById("calculatorTab").classList.add("d-none");

  document.getElementById(tab + "Tab").classList.remove("d-none");

  // remove active
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));

  // add active
  el.classList.add("active");
}

async function loadRecommendedMeals() {
  const container = document.getElementById("mealContainer");

  container.innerHTML = `
    <div class="text-center w-100">
      <div class="spinner-border text-dark"></div>
    </div>
  `;

  try {
    // Random category
    const queries = ["chicken", "healthy", "salad", "breakfast", "vegan"];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    // Random offset (for different results)
    const randomOffset = Math.floor(Math.random() * 50);

    const res = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${randomQuery}&number=6&offset=${randomOffset}&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${API_KEY}`,
    );

    const data = await res.json();

    console.log("Recommended meals:", data);

    // Handle API error / quota
    if (!data.results) {
      container.innerHTML = `
        <p class="text-danger text-center">Unable to load meals (API limit or error)</p>
      `;
      return;
    }

    // Display meals
    displayMeals(data.results);
  } catch (err) {
    container.innerHTML = `
      <p class="text-danger text-center">Failed to load meals</p>
    `;
  }
}

async function searchMeals() {
  const query = document.getElementById("searchInput").value;

  if (!query) return;

  const container = document.getElementById("mealContainer");

  container.innerHTML = `
    <div class="text-center w-100">
      <div class="spinner-border text-dark"></div>
    </div>
  `;

  try {
    const res = await fetch(
      `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=6&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${API_KEY}`,
    );

    const data = await res.json();

    console.log(data);

    displayMeals(data.results);
  } catch (err) {
    console.error(err);
    container.innerHTML = `<p class="text-danger">Error fetching meals</p>`;
  }
}

function displayMeals(meals) {
  const container = document.getElementById("mealContainer");
  container.innerHTML = "";

  if (!meals || meals.length === 0) {
    container.innerHTML = `<p class="text-muted">No meals found.</p>`;
    return;
  }

  meals.forEach((meal) => {
    const nutrients = meal.nutrition?.nutrients || [];

    const calories =
      nutrients.find((n) => n.name === "Calories")?.amount?.toFixed(0) || "N/A";
    const protein =
      nutrients.find((n) => n.name === "Protein")?.amount?.toFixed(0) || "N/A";
    const carbs =
      nutrients.find((n) => n.name === "Carbohydrates")?.amount?.toFixed(0) ||
      "N/A";
    const fats =
      nutrients.find((n) => n.name === "Fat")?.amount?.toFixed(0) || "N/A";

    const shortDesc = getShortDescription(meal, nutrients);

    container.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card meal-card h-100 shadow-sm border-0">

          <img src="${meal.image}" class="card-img-top meal-img">

          <div class="card-body d-flex flex-column">

            <!-- TITLE + HEART -->
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h6 class="fw-bold mb-0 text-truncate" style="max-width: 80%">
                ${meal.title}
              </h6>

              <i class="fa fa-heart fav-btn ${isFavorite(meal.id) ? "heart-filled" : "heart-outline"}"
                onclick="toggleFavorite(
                  this,
                  ${meal.id},
                  \`${meal.title}\`,
                  '${meal.image}',
                  '${calories}',
                  '${protein}',
                  '${carbs}',
                  '${fats}'
                )"
              ></i>
            </div>

            <!-- DESCRIPTION -->
            <p class="text-muted small mb-3">${shortDesc}</p>

            <!-- NUTRITION -->
            <div class="d-flex justify-content-between text-center mt-auto">

              <div>
                <small class="text-muted d-block">Cal</small>
                <strong>${calories}</strong>
              </div>

              <div>
                <small class="text-muted d-block">Protein</small>
                <strong>${protein}g</strong>
              </div>

              <div>
                <small class="text-muted d-block">Carbs</small>
                <strong>${carbs}g</strong>
              </div>

              <div>
                <small class="text-muted d-block">Fats</small>
                <strong>${fats}g</strong>
              </div>

            </div>

            <!-- BUTTON -->
            <button class="btn btn-outline-main btn-sm w-100 mt-3"
              onclick="openMeal(${meal.id})">
              View Recipe
            </button>

          </div>
        </div>
      </div>
    `;
  });
}

async function openMeal(id) {
  const res = await fetch(
    `https://api.spoonacular.com/recipes/${id}/information?apiKey=${API_KEY}`,
  );

  const meal = await res.json();

  document.getElementById("mealDetails").innerHTML = `
  <div class="modal-header border-0">
    <h4 class="fw-bold">${meal.title}</h4>
    <button class="btn-close" data-bs-dismiss="modal"></button>
  </div>

  <div class="modal-body">

    <div class="text-center mb-3">
      <img src="${meal.image}" class="img-fluid rounded modal-img">
    </div>

    <div class="row text-center mb-4">

      <div class="col">
        <small class="text-muted">Ready</small>
        <div class="fw-bold">${meal.readyInMinutes} min</div>
      </div>

      <div class="col">
        <small class="text-muted">Servings</small>
        <div class="fw-bold">${meal.servings}</div>
      </div>

    </div>

    <h6 class="fw-bold">Ingredients</h6>
    <ul class="list-group mb-3">
      ${meal.extendedIngredients
        .map(
          (i) => `
        <li class="list-group-item border-0 border-bottom">
          ${i.original}
        </li>
      `,
        )
        .join("")}
    </ul>

    <h6 class="fw-bold">Instructions</h6>
    <p class="text-muted">
      ${meal.instructions?.replace(/<[^>]*>/g, "") || "No instructions available."}
    </p>

  </div>
`;

  const modalEl = document.getElementById("mealModal");

  const modal = new bootstrap.Modal(modalEl);
  modal.show();
}

function getShortDescription(meal, nutrients) {
  const tags = [];

  const protein = nutrients.find((n) => n.name === "Protein")?.amount || 0;
  const carbs = nutrients.find((n) => n.name === "Carbohydrates")?.amount || 0;
  const fats = nutrients.find((n) => n.name === "Fat")?.amount || 0;

  if (protein > 20) tags.push("high in protein");
  if (carbs > 30) tags.push("rich in carbs");
  if (fats > 20) tags.push("high in healthy fats");

  if (meal.vegetarian) tags.push("vegetarian");
  if (meal.vegan) tags.push("vegan");
  if (meal.glutenFree) tags.push("gluten-free");

  return tags.length > 0 ? tags.join(", ") : "balanced meal";
}

function isFavorite(id) {
  const favs = getFavorites();
  return favs.some((item) => item.id === id);
}

// Load favorites from localStorage
function getFavorites() {
  const favs = JSON.parse(localStorage.getItem("favorites")) || [];

  // remove invalid items
  return favs.filter((f) => f.id && f.name && f.img);
}

// Save favorites
function saveFavorites(favs) {
  localStorage.setItem("favorites", JSON.stringify(favs));
}

// Toggle favorite
function toggleFavorite(el, id, name, img, calories, protein, carbs, fats) {
  id = Number(id);

  let favs = getFavorites();
  const index = favs.findIndex((item) => item.id === id);

  if (index === -1) {
    favs.push({
      id,
      name,
      img,
      calories: calories || "N/A",
      protein: protein || "N/A",
      carbs: carbs || "N/A",
      fats: fats || "N/A",
    });

    el.classList.remove("heart-outline");
    el.classList.add("heart-filled");
  } else {
    favs.splice(index, 1);

    el.classList.remove("heart-filled");
    el.classList.add("heart-outline");
  }

  saveFavorites(favs);
  renderFavorites();
}

function renderFavorites() {
  const container = document.getElementById("favoritesContainer");
  const favs = getFavorites();

  container.innerHTML = "";

  if (favs.length === 0) {
    container.innerHTML = `<p class="text-muted">No favorites yet.</p>`;
    return;
  }

  favs.forEach((meal) => {
    container.innerHTML += `
      <div class="col-md-6 col-lg-4">
        <div class="card meal-card h-100 shadow-sm border-0">

          <img src="${meal.img}" class="card-img-top meal-img">

          <div class="card-body d-flex flex-column">

            <h6 class="fw-bold mb-2">${meal.name}</h6>

            <div class="d-flex justify-content-between text-center mt-auto">

              <div>
                <small class="text-muted d-block">Cal</small>
                <strong>${meal.calories}</strong>
              </div>

              <div>
                <small class="text-muted d-block">Protein</small>
                <strong>${meal.protein}g</strong>
              </div>

              <div>
                <small class="text-muted d-block">Carbs</small>
                <strong>${meal.carbs}g</strong>
              </div>

              <div>
                <small class="text-muted d-block">Fats</small>
                <strong>${meal.fats}g</strong>
              </div>

            </div>

            <button class="btn btn-outline-main btn-sm w-100 mt-3"
              onclick="openMeal(${meal.id})">
              View Recipe
            </button>

            <button class="btn btn-outline-soft btn-sm w-100 mt-2"
              onclick="removeFavorite(${meal.id})">
              Remove
            </button>

          </div>
        </div>
      </div>
    `;
  });
}

function removeFavorite(id) {
  let favs = getFavorites();

  favs = favs.filter((item) => item.id !== id);

  saveFavorites(favs);

  renderFavorites();
}

function calculateCalories() {
  const weight = parseFloat(document.getElementById("calcWeight").value);
  const height = parseFloat(document.getElementById("calcHeight").value);
  const age = parseFloat(document.getElementById("calcAge").value);
  const gender = document.getElementById("gender").value;
  const activity = parseFloat(document.getElementById("activity").value);

  if (!weight || !height || !age || !gender || !activity) {
    alert("Please fill in all fields");
    return;
  }

  let bmr;

  if (gender === "male") {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  }

  const maintain = Math.round(bmr * activity);
  const lose = maintain - 500;
  const gain = maintain + 500;

  // Update UI
  document.getElementById("maintainCalories").innerHTML =
    `<strong>${maintain}</strong> kcal`;
  document.getElementById("loseCalories").innerHTML =
    `<strong>${lose}</strong> kcal`;
  document.getElementById("gainCalories").innerHTML =
    `<strong>${gain}</strong> kcal`;

  // Show result section
  document.getElementById("calorieResultSection").classList.remove("d-none");
}

document.addEventListener("DOMContentLoaded", () => {
  renderFavorites();
  loadRecommendedMeals();

  document.getElementById("searchBtn").addEventListener("click", () => {
    const query = document.getElementById("searchInput").value;
    searchMeals(query);
  });

  let timeout;

  document.getElementById("searchInput").addEventListener("input", (e) => {
    clearTimeout(timeout);

    timeout = setTimeout(() => {
      searchMeals(e.target.value);
    }, 500);
  });
});
