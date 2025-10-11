import axios from 'axios';

// --- CONFIGURATION ---
const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.REACT_APP_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

// --- AI HELPER FUNCTION ---

/**
 * A centralized function to call the AI model.
 * This reduces code duplication and manages API interaction with retries.
 * @param {Array<object>} messages - The message history for the chat completion.
 * @param {number} max_tokens - The maximum number of tokens for the response.
 * @param {number} temperature - The creativity of the response.
 * @param {boolean} isJson - Whether to instruct the model to return JSON.
 * @returns {Promise<string>} The AI's response content.
 */
const callAI = async (messages, max_tokens = 500, temperature = 0.1, isJson = true) => {
    if (isJson) {
        const hasJsonInstruction = messages.some(m => m.role === 'system' && m.content.includes('JSON'));
        if (!hasJsonInstruction) {
            messages.unshift({ role: 'system', content: 'You are an AI assistant that only responds with valid, raw JSON. Do not include markdown formatting or any other text.' });
        }
    }

    const maxRetries = 2;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(
                DEEPSEEK_API_URL,
                {
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: temperature,
                    max_tokens: max_tokens,
                    response_format: isJson ? { type: 'json_object' } : { type: 'text' },
                },
                {
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 35000 // Increased timeout to 35 seconds
                }
            );
            return response.data.choices[0].message.content; // Success, exit loop
        } catch (error) {
            lastError = error;
            const isTimeout = error.code === 'ECONNABORTED';

            if (isTimeout && attempt < maxRetries) {
                console.warn(`⏱️ AI Helper call timed out. Attempt ${attempt + 1}/${maxRetries + 1}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1))); // Wait before retrying
            } else {
                console.error(`❌ AI Helper Call Error (Attempt ${attempt + 1}):`, error.response ? error.response.data : error.message);
                break; // Break on non-timeout errors or on the last attempt
            }
        }
    }

    // If the loop completes without returning, all retries have failed.
    console.error('❌ AI Helper failed after all attempts.', lastError);
    throw new Error(`An AI sub-task failed after ${maxRetries + 1} attempts.`);
};


// --- CORE AI-DRIVEN FUNCTIONS ---

/**
 * 🧠 AI-POWERED SMART CONTEXT BUILDER
 * Uses an AI call to analyze the user's input and create a structured context.
 * This replaces the static keyword lists for categorization.
 */
const buildSmartContextAI = async (ingredients, filters, description) => {
    const prompt = `
        You are a culinary data analyst. Analyze the user's recipe request and return a structured JSON object.
        - Categorize the ingredients provided.
        - Infer dietary constraints from the filters.
        - Infer flavor, meal type, and time constraints from the natural language description.

        USER INPUT:
        - Ingredients: ${ingredients.join(', ')}
        - Filters: ${filters.join(', ')}
        - Description: "${description}"

        Respond ONLY with a JSON object with this exact structure:
        {
            "ingredients": { "proteins": [], "vegetables": [], "carbs": [], "condiments": [], "primary": [] },
            "constraints": { "dietary": [], "time": null },
            "preferences": { "flavor": [], "meal": null }
        }
        Possible values for dietary: "plant-based", "gluten-free", "dairy-free", "low-carb".
        Possible values for time: "quick" (under 30 mins) or null.
        Possible values for meal: "breakfast", "lunch", "dinner", "snack", or null.
    `;

    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callAI(messages, 500, 0.1, true);

    try {
        // Add a default structure to merge with the AI response for safety
        const baseContext = {
            ingredients: { proteins: [], vegetables: [], carbs: [], condiments: [], primary: [] },
            constraints: { dietary: [], time: null },
            preferences: { flavor: [], meal: null }
        };
        const parsedContext = JSON.parse(aiResponse);
        // Deep merge to ensure all keys exist
        return { ...baseContext, ...parsedContext };
    } catch (e) {
        console.error("Failed to parse context from AI:", e);
        // Fallback to a very basic context if parsing fails
        return {
            ingredients: { primary: ingredients },
            constraints: {},
            preferences: {}
        };
    }
};

/**
 * 🎯 COMPACT PROMPT BUILDER
 * Creates the main prompt for recipe generation based on the AI-generated context.
 */
const buildCompactPrompt = (ingredients, description, count, context) => {
    const dietaryRules = context.constraints?.dietary?.map(d => {
        if (d === 'plant-based') return 'MUST BE VEGAN (no meat, dairy, eggs, or fish sauce). Use plant-based substitutes.';
        if (d === 'gluten-free') return 'MUST BE GLUTEN-FREE. Use tamari instead of soy sauce, use rice flour/noodles.';
        if (d === 'dairy-free') return 'MUST BE DAIRY-FREE. Use coconut milk/oil instead of dairy products.';
        if (d === 'low-carb') return 'MUST BE LOW-CARB. Minimize rice, noodles, and sugar; maximize vegetables.';
        return '';
    }).filter(Boolean) || [];

    const flavorGuide = context.preferences?.flavor?.length > 0 ? `FLAVOR PROFILE: Emphasize ${context.preferences.flavor.join(', ')} notes.` : '';
    const timeGuide = context.constraints?.time === 'quick' ? 'TIME: All recipes must be cookable in under 30 minutes.' : '';
    const mealGuide = context.preferences?.meal ? `MEAL: Recipes should be suitable for ${context.preferences.meal}.` : '';

    return `Generate ${count} creative Filipino recipes based on these ingredients: ${ingredients.join(', ')}.

CONTEXT:
${description ? `- User Note: "${description}"` : ''}
${flavorGuide}
${timeGuide}
${mealGuide}

RECIPE GENERATION TIERS (generate one for each tier if count is 3):
1.  **Strict Recipe**: Use ONLY the provided ingredients plus salt, pepper, oil, water, garlic, and onion.
2.  **Flexible Recipe**: You may add up to 3 common Filipino pantry items (e.g., soy sauce, vinegar, fish sauce, sugar).
3.  **Creative Recipe**: You can add several complementary ingredients for an authentic, complete dish.

${dietaryRules.length > 0 ? `DIETARY RULES (MANDATORY):\n- ${dietaryRules.join('\n- ')}` : ''}

OUTPUT FORMAT:
- Your response MUST be a single, valid JSON array of recipe objects.
- Do NOT include any text, notes, or apologies before or after the JSON array.
- Each recipe object must follow this exact structure:
[{
  "title": "Recipe Name",
  "ingredients": ["1 cup item (e.g., 250g chicken)"],
  "instructions": ["Step 1.", "Step 2.", "Step 3."],
  "nutrition": "Calories: 450, Protein: 25g, Carbs: 40g, Fat: 15g",
  "cookingTime": "30 min",
  "servings": 4
}]`;
};

/**
 * 📊 AI-POWERED RESPONSE QUALITY SCORER
 * Uses an AI call to validate the generated recipe against the user's context.
 */
const scoreRecipeQualityAI = async (recipe, context) => {
    const prompt = `
        You are a meticulous recipe quality evaluator. Score the generated recipe from 0 to 100 based on how well it meets the user's original request.

        USER'S REQUEST CONTEXT:
        ${JSON.stringify(context, null, 2)}

        GENERATED RECIPE:
        ${JSON.stringify(recipe, null, 2)}

        EVALUATION CRITERIA:
        1.  **Ingredient Adherence**: Did it use the user's primary ingredients? (Weight: 40%)
        2.  **Dietary Compliance**: Does it strictly follow all dietary rules (e.g., vegan, gluten-free)? (Weight: 30%)
        3.  **Constraint Following**: Does it match the user's preferences for flavor, meal type, and cooking time? (Weight: 20%)
        4.  **Authenticity & Completeness**: Is it a plausible Filipino recipe with complete information (nutrition, time, servings)? (Weight: 10%)

        Respond ONLY with a JSON object in this format:
        {
          "score": <number_0_to_100>,
          "issues": ["A brief description of any issue found."],
          "passed": <boolean>
        }
        The "passed" key should be true if the score is 70 or above.
    `;
    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callAI(messages, 300, 0.1, true);

    try {
        return JSON.parse(aiResponse);
    } catch (e) {
        console.error("Failed to parse quality score from AI:", e);
        return { score: 0, issues: ["Failed to parse AI evaluation."], passed: false };
    }
};


/**
 * 🚀 MAIN GENERATION FUNCTION
 * Orchestrates the multi-step AI process.
 */
export const generateAIRecipes = async (ingredients, filters = [], description = '', count = 3) => {
    try {
        if (!ingredients || ingredients.length === 0) {
            return { success: false, error: 'No ingredients provided', data: [] };
        }
        if (!isValidDescription(description).valid) {
             return { success: false, error: 'Invalid description provided.', data: [] };
        }

        console.log("1. Building smart context with AI...");
        const context = await buildSmartContextAI(ingredients, filters, description);
        console.log("🧠 Smart Context:", JSON.stringify(context, null, 2));
        
        console.log("2. Building compact prompt...");
        const prompt = buildCompactPrompt(ingredients, description, count, context);
        
        console.log("3. Calling Deepseek API for recipe generation...");
        const recipeMessages = [
            { role: 'system', content: 'You are an expert Filipino chef from Angeles City, Pampanga. You strictly output valid JSON.' },
            { role: 'user', content: prompt }
        ];
        // Use the main model for generation, which is a larger task
        const recipeContent = await callAI(recipeMessages, 2048, 0.3, true);
        const recipes = parseAIResponse(recipeContent);

        if (recipes.length === 0) throw new Error("AI response was empty or could not be parsed.");

        console.log(`4. Scoring ${recipes.length} recipes with AI evaluator...`);
        const qualityPromises = recipes.map(recipe => 
            scoreRecipeQualityAI(recipe, { ingredients, filters, description })
            .then(quality => ({ recipe, quality })) // Combine recipe with its quality score
        );
        const qualityResults = await Promise.all(qualityPromises);

        console.log('📊 AI Quality scores:', qualityResults.map(r => `${r.recipe.title}: ${r.quality.score}/100`));
        
        const goodRecipes = qualityResults.filter(r => r.quality.passed).map(r => r.recipe);

        if (goodRecipes.length > 0) {
            return { success: true, data: goodRecipes, metadata: { context, qualityScores: qualityResults.map(r=>r.quality) } };
        }

        console.warn('⚠️ No recipes passed the quality threshold. Returning the highest-scoring ones.');
        const sortedResults = qualityResults.sort((a, b) => b.quality.score - a.quality.score);
        return { 
            success: true, 
            data: sortedResults.map(r => r.recipe), 
            warning: 'Generated recipes may not fully match requirements. Please review them carefully.',
            metadata: { context, qualityScores: sortedResults.map(r=>r.quality) }
        };

    } catch (error) {
        console.error('❌ Error in generateAIRecipes:', error.message);
        return { success: false, error: `Generation failed: ${error.message}`, data: [] };
    }
};

// --- HELPER FUNCTIONS (Largely Unchanged) ---

const parseAIResponse = (content) => {
    try {
        const jsonString = content.trim().replace(/```json/g, '').replace(/```/g, '');
        const recipesData = JSON.parse(jsonString);

        if (!Array.isArray(recipesData)) return [];

        return recipesData.map((recipe, index) => {
            if (!recipe.title || !recipe.ingredients || !recipe.instructions) return null;
            return {
                id: `ai-${Date.now()}-${index}`,
                title: recipe.title.trim(),
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(ing => ing) : [],
                instructions: Array.isArray(recipe.instructions) ? recipe.instructions.filter(inst => inst) : [],
                nutrition: recipe.nutrition || 'Not specified',
                source: 'AI Generated',
                image: null,
                cookingTime: recipe.cookingTime || 'Not specified',
                servings: recipe.servings || 'Not specified',
                tags: ['Filipino', 'AI Generated']
            };
        }).filter(recipe => recipe !== null);
    } catch (error) {
        console.error('❌ Parse error:', error.message, "Content:", content);
        return [];
    }
};

const isValidDescription = (description) => {
    if (!description || description.trim() === '') return { valid: true };
    const desc = description.toLowerCase().trim();
    if (desc.length > 500) return { valid: false, reason: 'Description is too long.' };
    const offensivePatterns = [/\b(fuck|shit|damn|bitch|cunt)\b/i, /\b(kill|murder|suicide)\b/i];
    for (const pattern of offensivePatterns) {
        if (pattern.test(desc)) return { valid: false, reason: 'Description contains inappropriate content.' };
    }
    return { valid: true };
};

export const generateCustomRecipe = async (ingredients, filters, description) => {
    const result = await generateAIRecipes(ingredients, filters, description, 1);
    return result.success && result.data.length > 0 ? result.data[0] : null;
};

