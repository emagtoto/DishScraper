from flask import Flask, request, render_template, jsonify
import requests

app = Flask(__name__)

# Your Spoonacular API key
#API_KEY = '34bba01a91044b5ab6f90ca082861209'
API_KEY = '6f0d923893574027a8d4aa1f87e48885' #dscrapertest1
#84521a6e9fb24f74907c0f7cc1cd38b8
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
def find_recipes(input_ingredients, dietary_restrictions, health_conditions):
    BASE_URL_FIND_BY_INGREDIENTS = "https://api.spoonacular.com/recipes/complexSearch"
    
    # Format ingredients input
    formatted_ingredients = ','.join([i.strip() for i in input_ingredients.split(',') if i.strip()])
    
    params = {
        'ingredients': formatted_ingredients,
        'number': 10,
        'apiKey': API_KEY,
        'ranking': 1  # Try to maximize matching ingredients
    }

    # Add dietary restrictions to the search params if selected
    if dietary_restrictions:
        params['diet'] = dietary_restrictions  # Don't join, pass as a single value

    # Add health conditions to the search params if selected
    if health_conditions:
        params['health'] = ','.join(health_conditions)

    # Debug: Log the parameters to check what's being sent to the API
    print(f"API request params: {params}")
    
    response = requests.get(BASE_URL_FIND_BY_INGREDIENTS, params=params)

    if response.status_code == 200:
        data = response.json()
        recipes = []

        # Check if there are any recipes in the response
        for item in data.get('results', []):
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
    else:
        print(f"Error fetching recipes: {response.status_code}, {response.text}")
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
    dietary_restrictions = request.form.get('dietary_restrictions')
    health_conditions = request.form.get('health_conditions')

    # If no specific restriction is selected, use None for that category
    dietary_restrictions = dietary_restrictions if dietary_restrictions else None
    health_conditions = health_conditions if health_conditions else None

    results = find_recipes(input_ingredients, dietary_restrictions, health_conditions)
    message = None if results else "No recipes found for the given ingredients and filters."
    
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