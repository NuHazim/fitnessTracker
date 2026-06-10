const mongoose = require("mongoose");

const favoriteMealSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },

    mealId: {
      type: Number,
      required: true,
    },

    name: String,
    img: String,

    calories: String,
    protein: String,
    carbs: String,
    fats: String,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("FavoriteMeal", favoriteMealSchema);
