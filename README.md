# 💪 Health & Fitness Tracker

A comprehensive web application to help you track workouts, plan nutrition, monitor progress, and stay consistent with smart reminders.


---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔐 **Authentication** | User registration, login, and secure session management |
| 📊 **Dashboard** | Overview of total workouts, weekly progress, and today's activity |
| 🏋️ **Fitness Tracker** | Fetch latest workouts from Strava,Log, edit, and delete workouts with duration, steps, and calories |
| 📈 **Progress Charts** | Visualize fitness trends with interactive charts & streak tracking |
| 🥗 **Nutrition Planner** | Search recipes, save favorites, and calculate daily calorie needs |
| ⏰ **Smart Reminders** | Browser notifications for workouts, meals, and hydration |
| 👤 **Profile Management** | Update personal info, change password, or delete account |

---

## 🛠️ Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+)
- **UI Framework:** Bootstrap 5, Font Awesome Icons
- **Charts:** Chart.js
- **API:** Spoonacular API (recipes & nutrition)
- **Storage:** localStorage (client-side)
- **Backend (Ready):** Node.js, Express, MongoDB schemas prepared

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/health-fitness-tracker.git

# Navigate to project folder
cd health-fitness-tracker

# Install dependencies
npm install

# Start the server
npm start
```
---
### API Key Setup (Nutrition Planner)
- Get a free API key from Spoonacular API
- Open ```public/NutritionPlanner.js```
- Replace line 1:
```javascript
const API_KEY = "your-api-key-here";
```
### run ```node server.js```
### Open your browser and visit: http://localhost:3000
### But backend isnt developed yet so run live server

