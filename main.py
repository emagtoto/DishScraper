from flask import Flask, request, render_template, jsonify
import requests

app = Flask(__name__)

# Your Spoonacular API key
API_KEY = '1a64753b31664f1eba93287db857bd33'
BASE_URL_RECIPES = "https://api.spoonacular.com/recipes/complexSearch"
BASE_URL_INGREDIENTS = "https://api.spoonacular.com/food/ingredients/{}/information"
BASE_URL_RECIPE_DETAILS = "https://api.spoonacular.com/recipes/{}/information"

# Function to get detailed information about an ingredient
def get_ingredient_info(ingredient_id):
    url = BASE_URL_INGREDIENTS.format(ingredient_id)
    params = {
        'amount': 1,
        'apiKey': API_KEY
    }
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        return {
            'name': data.get('name', 'Unknown Ingredient'),
            'image': data.get('image', ''),  # Image URL if available
            'aisle': data.get('aisle', 'Unknown Aisle')  # Aisle info if available
        }
    return None

# Function to find recipes based on ingredients with dietary and health filters
def find_recipes(input_ingredients):
    BASE_URL_FIND_BY_INGREDIENTS = "https://api.spoonacular.com/recipes/findByIngredients"
    # Format ingredients input
    formatted_ingredients = ','.join([i.strip() for i in input_ingredients.split(',') if i.strip()])
    
    params = {
        'ingredients': formatted_ingredients,
        'number': 10,
        'apiKey': API_KEY,
        'ranking': 1  # Try to maximize matching ingredients
    }

    response = requests.get(BASE_URL_FIND_BY_INGREDIENTS, params=params)

    if response.status_code == 200:
        data = response.json()
        recipes = []

        for item in data:
            recipe_id = item.get('id')
            name = item.get('title', 'Unnamed Recipe')
            image = item.get('image', '')
            recipe_info = {
                'id': recipe_id,
                'name': name,
                'image': image,
                'steps': f"/recipe_details/{recipe_id}"  # You already handle this
            }
            recipes.append(recipe_info)

        return recipes
    return []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/recipe_finder')
def recipe_finder():
    return render_template('recipe_finder.html')

@app.route('/get_recipes', methods=['POST'])
def get_recipes():
    input_ingredients = request.form['ingredients']
    
    results = find_recipes(input_ingredients)
    message = None if results else "No recipes found for the given ingredients."
    
    return render_template('recipe_finder.html', results=results, ingredients=input_ingredients, message=message)

# This route will handle the request to fetch recipe details for the modal
@app.route('/recipe_details/<int:recipe_id>')
def recipe_details(recipe_id):
    # Fetch recipe details using Spoonacular API
    url = BASE_URL_RECIPE_DETAILS.format(recipe_id)
    params = {'apiKey': API_KEY}
    response = requests.get(url, params=params)

    if response.status_code == 200:
        data = response.json()
        recipe = {
            'name': data['title'],
            'image': data.get('image', ''),
            'ingredients': [
                {
                    'name': ingredient['name'],
                    'image': ingredient['image'],
                    'aisle': ingredient.get('aisle', 'Unknown')
                }
                for ingredient in data.get('extendedIngredients', [])
            ],
            'instructions': [step['step'] for step in data.get('analyzedInstructions', [{}])[0].get('steps', [])]
        }
        return jsonify(recipe)
    else:
        return jsonify({"error": "Recipe not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)