from flask import Flask, request, render_template, jsonify
import requests
import concurrent.futures

app = Flask(__name__)

# Your Spoonacular API key
#API_KEY = '5de37412099c47289d891b9f334b72ee'
#API_KEY = '34bba01a91044b5ab6f90ca082861209'
#API_KEY = '84521a6e9fb24f74907c0f7cc1cd38b8'
#API_KEY = '752393da47214fd6a46b110f1368d4e9'
#API_KEY = 'b730d4f598c640af9db2e6da39eaa033' #CCA EMAIL
API_KEY = '6f0d923893574027a8d4aa1f87e48885' #dscrapertest1
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
def get_valid_recipe(item):
    recipe_id = item.get('id')
    name = item.get('title', 'Unnamed Recipe')
    image = item.get('image', '')

    detail_url = BASE_URL_RECIPE_DETAILS.format(recipe_id)
    detail_response = requests.get(detail_url, params={'apiKey': API_KEY})

    if detail_response.status_code == 200:
        detail_data = detail_response.json()
        ingredients = detail_data.get('extendedIngredients', [])
        instructions = detail_data.get('analyzedInstructions', [])

        has_ingredients = len(ingredients) > 0
        has_steps = any(len(step.get('steps', [])) > 0 for step in instructions)

        if has_ingredients and has_steps:
            return {
                'id': recipe_id,
                'name': name,
                'image': image,
                'steps': f"/recipe_details/{recipe_id}"
            }

    return None

def find_recipes(input_ingredients):
    BASE_URL_FIND_BY_INGREDIENTS = "https://api.spoonacular.com/recipes/findByIngredients"
    formatted_ingredients = ','.join([i.strip() for i in input_ingredients.split(',') if i.strip()])
    
    params = {
        'ingredients': formatted_ingredients,
        'number': 10,
        'apiKey': API_KEY,
        'ranking': 1
    }

    response = requests.get(BASE_URL_FIND_BY_INGREDIENTS, params=params)

    if response.status_code == 200:
        raw_data = response.json()
        valid_recipes = []

        with concurrent.futures.ThreadPoolExecutor() as executor:
            results = executor.map(get_valid_recipe, raw_data)

        valid_recipes = [r for r in results if r is not None]
        return valid_recipes

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
            'instructions': [
                f"• Step {step['number']}: {step['step']}"
                for step in data.get('analyzedInstructions', [{}])[0].get('steps', [])
            ]
        }
        return jsonify(recipe)
    else:
        return jsonify({"error": "Recipe not found"}), 404

if __name__ == '__main__':
    app.run(debug=True)