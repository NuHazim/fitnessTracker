require('dotenv').config();

const express = require('express');
const app = express();

// Redirect root to Login.html FIRST
app.get('/', (req, res) => {
  res.redirect('/Login.html');
});

app.use(express.static('public'));

app.get('/api/recipes', async (req, res) => {
  const query = req.query.query || 'healthy';
  const number = req.query.number || 6;
  const offset = req.query.offset || 0;

  const url = `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=${number}&offset=${offset}&addRecipeInformation=true&addRecipeNutrition=true&apiKey=${process.env.SPOONACULAR_API_KEY}`;

  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.get('/api/recipes/:id', async (req, res) => {
  const url = `https://api.spoonacular.com/recipes/${req.params.id}/information?apiKey=${process.env.SPOONACULAR_API_KEY}`;
  const response = await fetch(url);
  const data = await response.json();
  res.json(data);
});

app.listen(3000, () => console.log('Server running on port 3000'));