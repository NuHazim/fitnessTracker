# 💪 FitNation

A comprehensive web application to help you track workouts, plan nutrition, monitor progress, and stay consistent with smart reminders.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | User registration, login, and secure session management |
| 📊 **Dashboard** | Overview of total workouts, weekly progress, and today's activity |
| 🏋️ **Fitness Tracker** | Fetch latest workouts from Strava, log, edit, and delete workouts with duration, steps, and calories |
| 📈 **Progress Charts** | Visualize fitness trends with interactive charts & streak tracking |
| 🥗 **Nutrition Planner** | Search recipes, save favorites, and calculate daily calorie needs |
| ⏰ **Smart Reminders** | Browser notifications for workouts, meals, and hydration |
| 👤 **Profile Management** | Update personal info, change password, or delete account |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **UI Framework:** Bootstrap 5, Font Awesome Icons
- **Charts:** Chart.js
- **APIs:** Spoonacular API (recipes & nutrition), Strava API (workout sync)
- **Backend:** Node.js, Express
- **Database:** MongoDB (Atlas), Mongoose

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/NuHazim/fitnessTracker.git

# Navigate to project folder
cd fitnessTracker

# Install dependencies
npm install

# Start the server
npm start
```

---

## ⚙️ Environment Setup

This project uses environment variables to keep API keys and database credentials secure.

1. In the **root** of the project, create a new file named `.env`
2. Copy the structure from `.env.example` into `.env`
3. Fill in your own values for each variable (see guides below for how to obtain them)

> ⚠️ Never commit your `.env` file to version control. It should already be listed in `.gitignore`.

---

## 🥗 Getting a Spoonacular API Key

The Nutrition Planner uses the [Spoonacular API](https://spoonacular.com/food-api) for recipes and nutrition data.

1. Go to [spoonacular.com/food-api](https://spoonacular.com/food-api)
2. Click **Start Now** / **Sign Up** and create a free account
3. Once logged in, go to your [Profile / Dashboard](https://spoonacular.com/food-api/console#Profile)
4. Copy your **API Key**
5. Paste it into your `.env` file as the value for `SPOONACULAR_API_KEY`

> The free plan includes a limited number of daily requests, which is enough for development and testing.

---

## 🏃 Getting Strava Client ID & Secret

The Fitness Tracker uses the [Strava API](https://developers.strava.com/) to sync workout data. This is **free** — no paid plan or trial is required.

1. Log in to your [Strava account](https://www.strava.com/)
2. Go to [strava.com/settings/api](https://www.strava.com/settings/api)
3. Create a new API application by filling in the required fields:
   - **Application Name:** e.g. `FitNation`
   - **Category:** Choose the closest match (e.g. "Other")
   - **Website:** Can be `http://localhost:3000` for development
   - **Authorization Callback Domain:** `localhost`
4. After creating the app, you'll see your **Client ID** and **Client Secret** on the application settings page
5. Add these values to your `.env` file as `STRAVA_CLIENT_ID` and `STRAVA_CLIENT_SECRET`
6. Set `STRAVA_REDIRECT_URI` to `http://localhost:3000/auth/strava/callback` (or your deployed URL's equivalent)

---

## 🗄️ MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a database user and allow network access from your IP (or `0.0.0.0/0` for development)
3. Get your connection string from **Connect → Drivers**
4. Add it to your `.env` file as `MONGO_URI`, making sure to include your database name before the `?` query parameters (e.g. `.../healthFitnessTracker?retryWrites=...`)
5. Set `DB_NAME` to match your database name

---

## ▶️ Running the App

```bash
node server.js
```

Then open your browser and visit: **http://localhost:3000**
