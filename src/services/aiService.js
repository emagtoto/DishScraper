import axios from 'axios';

// CONFIGURATION
const DEEPSEEK_API_URL = process.env.REACT_APP_DEEPSEEK_API_URL;


// AI HELPER FUNCTION with robust response handling
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
                        'Content-Type': 'application/json'
                    },
                    timeout: 35000
                }
            );

            // ✅ Handle multiple possible response structures from Render proxy
            let content = null;
            
            // Log only if data exists
            if (response.data) {
                const preview = JSON.stringify(response.data).substring(0, 200);
                console.log('API Response structure:', preview);
            }

            // Try different response structures (order matters!)
            if (response.data?.choices?.[0]?.message?.content) {
                // Standard OpenAI format (most common from your proxy)
                content = response.data.choices[0].message.content;
                console.log('✅ Used standard OpenAI format');
            } else if (response.data?.content) {
                // Direct content format
                content = response.data.content;
                console.log('✅ Used direct content format');
            } else if (response.data?.message?.content) {
                // Nested message format
                content = response.data.message.content;
                console.log('✅ Used nested message format');
            } else if (typeof response.data === 'string') {
                // Raw string response
                content = response.data;
                console.log('✅ Used raw string format');
            } else if (response.data?.data?.choices?.[0]?.message?.content) {
                // Wrapped data format
                content = response.data.data.choices[0].message.content;
                console.log('✅ Used wrapped data format');
            } else {
                console.error('❌ Unexpected API response structure:', response.data);
                throw new Error('API returned unexpected response structure');
            }

            if (!content) {
                throw new Error('API returned empty content');
            }

            console.log('✅ Successfully extracted content:', content.substring(0, 100) + '...');
            return content;

        } catch (error) {
            lastError = error;
            const isTimeout = error.code === 'ECONNABORTED';
            const statusCode = error.response?.status;

            // Log detailed error info
            console.error(`❌ AI Helper Call Error (Attempt ${attempt + 1}):`, {
                message: error.message,
                status: statusCode,
                responseData: error.response?.data,
                isTimeout,
                url: DEEPSEEK_API_URL
            });

            // Retry logic
            if (isTimeout && attempt < maxRetries) {
                console.warn(`⏱ AI Helper call timed out. Retrying in ${1500 * (attempt + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
                continue;
            } 
            
            if (statusCode >= 500 && attempt < maxRetries) {
                console.warn(`🔄 Server error (${statusCode}). Retrying in ${2000 * (attempt + 1)}ms...`);
                await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
                continue;
            }
            
            // Don't retry on client errors (4xx)
            if (statusCode >= 400 && statusCode < 500) {
                console.error(`❌ Client error (${statusCode}), not retrying`);
                break;
            }
        }
    }

    // Final error handling
    const errorMsg = lastError?.response?.data?.error?.message || 
                     lastError?.response?.data?.message ||
                     lastError?.message || 
                     'Unknown error';
    
    console.error('❌ AI Helper failed after all attempts:', errorMsg);
    throw new Error(`AI service failed: ${errorMsg}`);
};

// --- CORE AI-DRIVEN FUNCTIONS ---

const buildSmartContextAI = async (ingredients, filters, description) => {
    const prompt = `   
        You are a culinary data analyst. Your job is to meticulously analyze the user's recipe request and return a structured JSON object.
        - Categorize the provided ingredients.
        - Extract ALL dietary constraints and allergies from the filters list.
        - Identify any conflicts between ingredients and filters (e.g., shrimp with shellfish-free filter).
        - If the recipe is ethically immoral or unsafe(eg., usage of human ingredients, poison, exotic animals, domestic animals, and endangered species), respond with {"error": "Modification request denied due to ethical or safety concerns."}
        - From the natural language description, infer all preferences:
          - **Flavor Profile**: Words like 'spicy', 'savory', 'sweet', 'sour', 'umami'.
          - **Dish Type**: Words like 'soup', 'stew', 'salad', 'fried', 'grilled'.
          - **Cuisine Style**: If a specific cuisine is mentioned or implied, like 'Italian style' or 'with a Japanese twist'.
          - **Meal Type**: 'breakfast', 'lunch', 'dinner', 'snack'.
          - **Time Constraints**: 'quick', 'under 30 minutes'.
          - **Positive Keywords**: Other important characteristics like 'healthy', 'comfort food', 'light', 'for kids'.

        USER INPUT:
        - Ingredients: ${ingredients.join(', ')}
        - Filters: ${filters.join(', ')}
        - Description: "${description}"

        Respond ONLY with a JSON object with this exact structure. Omit empty arrays.
        {
            "ingredients": { "proteins": [], "vegetables": [], "carbs": [], "condiments": [], "primary": [] },
            "constraints": { 
                "dietary": [], 
                "allergies": [],
                "health": [],
                "time": null 
            },
            "conflicts": [{"ingredient": "shrimp", "filter": "Shellfish-Free", "suggestion": "use firm tofu or chicken"}],
            "preferences": { 
                "flavor_profile": [], 
                "meal_type": null,
                "dish_type": [],
                "cuisine_style": [],
                "positive_keywords": []
             }
        }
        
        For dietary array, extract values like: "vegan", "vegetarian", "keto", "paleo", etc.
        For allergies array, extract values like: "gluten-free", "dairy-free", "nut-free", "shellfish-free", etc.
        For health array, extract values like: "low-carb", "low-sodium", "high-protein", etc.
        For conflicts, identify ingredients that violate the selected filters and provide substitution suggestions.
        Possible values for time: "quick" (under 30 mins) or null.
        Possible values for meal_type: "breakfast", "lunch", "dinner", "snack", or null.
    `;

    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callAI(messages, 600, 0.1, true);

    try {
        const baseContext = {
            ingredients: { proteins: [], vegetables: [], carbs: [], condiments: [], primary: [] },
            constraints: { dietary: [], allergies: [], health: [], time: null },
            conflicts: [],
            preferences: { flavor_profile: [], meal_type: null, dish_type: [], cuisine_style: [], positive_keywords: [] }
        };
        const parsedContext = JSON.parse(aiResponse);
        return { ...baseContext, ...parsedContext };
    } catch (e) {
        console.error("Failed to parse context from AI:", e);
        return {
            ingredients: { primary: ingredients },
            constraints: { dietary: [], allergies: [], health: [] },
            conflicts: [],
            preferences: {}
        };
    }
};

const buildCompactPrompt = (ingredients, description, count, context) => {
    const allDietaryRules = [];
    
    if (context.constraints?.dietary?.length > 0) {
        context.constraints.dietary.forEach(d => {
            const dLower = d.toLowerCase();
            if (dLower.includes('vegan') || dLower === 'plant-based') {
                allDietaryRules.push('MUST BE VEGAN: No meat, seafood, dairy, eggs, honey, or any animal products. Use plant-based alternatives.');
            } else if (dLower.includes('vegetarian')) {
                allDietaryRules.push('MUST BE VEGETARIAN: No meat or seafood. Dairy and eggs are allowed.');
            } else if (dLower.includes('pescatarian')) {
                allDietaryRules.push('MUST BE PESCATARIAN: No meat except fish and seafood. Eggs and dairy allowed.');
            } else if (dLower.includes('keto')) {
                allDietaryRules.push('MUST BE KETO: Very low carb (under 20g net carbs), high fat, moderate protein. No rice, bread, sugar, or starchy vegetables.');
            } else if (dLower.includes('paleo')) {
                allDietaryRules.push('MUST BE PALEO: No grains, legumes, dairy, refined sugar, or processed foods. Focus on whole foods.');
            }
        });
    }
    
    if (context.constraints?.allergies?.length > 0) {
        context.constraints.allergies.forEach(a => {
            const aLower = a.toLowerCase();
            if (aLower.includes('gluten')) {
                allDietaryRules.push('MUST BE GLUTEN-FREE: Use tamari instead of soy sauce, rice flour instead of wheat flour, rice noodles instead of wheat noodles.');
            } else if (aLower.includes('dairy')) {
                allDietaryRules.push('MUST BE DAIRY-FREE: Use coconut milk/cream instead of dairy milk/cream, coconut oil instead of butter.');
            } else if (aLower.includes('nut-free') || aLower.includes('peanut')) {
                allDietaryRules.push('MUST BE NUT-FREE: Absolutely no peanuts, almonds, cashews, or any tree nuts. No peanut butter or nut-based sauces.');
            } else if (aLower.includes('shellfish')) {
                allDietaryRules.push('MUST BE SHELLFISH-FREE: No shrimp, crab, lobster, mussels, clams, or oysters. Use fish, chicken, tofu, or mushrooms as protein substitutes.');
            } else if (aLower.includes('fish') && !aLower.includes('shellfish')) {
                allDietaryRules.push('MUST BE FISH-FREE: No fish or fish sauce. Use soy sauce, coconut aminos, or salt for umami. Use chicken, pork, tofu, or beans for protein.');
            } else if (aLower.includes('soy')) {
                allDietaryRules.push('MUST BE SOY-FREE: No soy sauce, tofu, or soy-based products. Use coconut aminos or fish sauce for umami.');
            } else if (aLower.includes('egg')) {
                allDietaryRules.push('MUST BE EGG-FREE: No eggs in any form. Use flax eggs or aquafaba as binders if needed.');
            }
        });
    }
    
    if (context.constraints?.health?.length > 0) {
        context.constraints.health.forEach(h => {
            const hLower = h.toLowerCase();
            if (hLower.includes('low-carb')) {
                allDietaryRules.push('MUST BE LOW-CARB: Minimize rice, noodles, bread, and sugar. Maximize vegetables and protein. Under 30g carbs per serving.');
            } else if (hLower.includes('low-sodium')) {
                allDietaryRules.push('MUST BE LOW-SODIUM: Use minimal salt and soy sauce. Rely on herbs, spices, and citrus for flavor.');
            } else if (hLower.includes('high-protein')) {
                allDietaryRules.push('MUST BE HIGH-PROTEIN: Each recipe should contain at least 25g protein per serving. Emphasize lean meats, fish, eggs, or legumes.');
            }
        });
    }

    let conflictInstructions = '';
    if (context.conflicts && context.conflicts.length > 0) {
        conflictInstructions = '\n⚠ INGREDIENT CONFLICTS DETECTED:\n';
        context.conflicts.forEach(conflict => {
            conflictInstructions += `- The user provided "${conflict.ingredient}" but selected "${conflict.filter}" filter.\n`;
            conflictInstructions += `  YOU MUST substitute "${conflict.ingredient}" with: ${conflict.suggestion}\n`;
        });
        conflictInstructions += '\nIMPORTANT: Do NOT use the conflicting ingredients. Use the suggested substitutes instead.\n';
    }

    const preferenceGuides = [];
    const prefs = context.preferences || {};
    if (prefs.flavor_profile?.length > 0) {
        preferenceGuides.push(`Flavor Profile: Emphasize ${prefs.flavor_profile.join(', ')} notes.`);
    }
    if (prefs.dish_type?.length > 0) {
        preferenceGuides.push(`Dish Type: Should be a ${prefs.dish_type.join(' or ')}.`);
    }
    if (prefs.cuisine_style?.length > 0) {
        preferenceGuides.push(`Cuisine Style: Should have a ${prefs.cuisine_style.join(' or ')} style.`);
    }
    if (prefs.positive_keywords?.length > 0) {
        preferenceGuides.push(`Other Characteristics: ${prefs.positive_keywords.join(', ')}.`);
    }
    if (context.constraints?.time === 'quick') {
        preferenceGuides.push('Time Constraint: Must be cookable in under 30 minutes.');
    }
    if (prefs.meal_type) {
        preferenceGuides.push(`Meal Type: Suitable for ${prefs.meal_type}.`);
    }

    let descriptionContext = '';
    if (description?.trim()) {
        descriptionContext += `User's Raw Description: "${description}"\n`;
    }
    if (preferenceGuides.length > 0) {
        descriptionContext += `Analyzed Preferences:\n- ${preferenceGuides.join('\n- ')}`;
    }

    return `Generate ${count} creative Filipino recipes based on these ingredients: ${ingredients.join(', ')}.

USER REQUEST DETAILS:
${descriptionContext || 'No specific preferences provided.'}
${conflictInstructions}

RECIPE GENERATION TIERS (generate one for each tier if count is 3):
1. **Strict Recipe**: Use ONLY the provided ingredients (with substitutions if conflicts exist).
2. **Flexible Recipe**: You may add up to 3 common Filipino pantry items that comply with dietary restrictions examples are: salt, pepper, oil, water, garlic, and onion. Substitute if conflicts exist.
3. **Creative Recipe**: You can add several complementary ingredients for an authentic, complete dish while respecting all dietary rules.

${allDietaryRules.length > 0 ? `⚠ DIETARY RULES (MANDATORY - THESE OVERRIDE EVERYTHING):\n${allDietaryRules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}` : ''}

OUTPUT FORMAT:
- Your response MUST be a single, valid JSON array of recipe objects.
- Do NOT include any text, notes, or apologies before or after the JSON array.
- Each recipe object must follow this exact structure:
[{
  "title": "Recipe Name",
  "ingredients": ["1 cup item (e.g., 250g chicken)", "NOTE: if substitutions were made, add a note like '(substituted for X due to Y filter)'"],
  "instructions": ["Step 1.", "Step 2.", "Step 3."],
  "nutritional_info": {
    "calories": 450,
    "protein_g": 25,
    "carbs_g": 40,
    "fat_g": 15,
    "fiber_g": 5,
    "sugar_g": 8,
    "sodium_mg": 600
  },
  "cookingTime": "30 min",
  "servings": 4
}]

IMPORTANT: The nutritional_info field MUST be a JSON object with numeric values (not a string). Include all available nutrition data: calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg.`;
};

const scoreRecipeQualityAI = async (recipe, context) => {
    const prompt = `
        You are a meticulous recipe quality evaluator. Score the generated recipe from 0 to 100 based on how well it meets the user's original request.

        USER'S REQUEST CONTEXT:
        ${JSON.stringify(context, null, 2)}

        GENERATED RECIPE:
        ${JSON.stringify(recipe, null, 2)}

        EVALUATION CRITERIA:
        1. **Ingredient Adherence**: Did it use the user's primary ingredients (or proper substitutes if conflicts exist)? (Weight: 30%)
        2. **Dietary Compliance**: Does it STRICTLY follow all dietary rules, allergies, and health restrictions? This is CRITICAL. (Weight: 40%)
        3. **Conflict Resolution**: If there were ingredient-filter conflicts, did it properly substitute the conflicting ingredients? (Weight: 15%)
        4. **Preference Matching**: Does it match the user's preferences for flavor, meal type, and cooking time? (Weight: 10%)
        5. **Authenticity & Completeness**: Is it a plausible Filipino recipe with complete information (nutrition, time, servings)? (Weight: 5%)

        CRITICAL VIOLATIONS (automatic score below 30):
        - Using shellfish when "Shellfish-Free" filter is active
        - Using dairy when "Dairy-Free" filter is active
        - Using gluten when "Gluten-Free" filter is active
        - Using meat when "Vegan/Vegetarian" filter is active
        - Any violation of explicitly stated dietary restrictions

        Respond ONLY with a JSON object in this format:
        {
          "score": <number_0_to_100>,
          "issues": ["A brief description of any issue found."],
          "passed": <boolean>,
          "substitutionsCorrect": <boolean>
        }

        The "passed" key should be true if the score is 60 or above.
        The "substitutionsCorrect" key should be true if all ingredient conflicts were properly resolved.
    `;
    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callAI(messages, 400, 0.1, true);

    try {
        return JSON.parse(aiResponse);
    } catch (e) {
        console.error("Failed to parse quality score from AI:", e);
        return { score: 0, issues: ["Failed to parse AI evaluation."], passed: false, substitutionsCorrect: false };
    }
};

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
        console.log("✅ Smart Context:", JSON.stringify(context, null, 2));
        
        if (context.conflicts && context.conflicts.length > 0) {
            console.warn("⚠ Ingredient conflicts detected:", context.conflicts);
        }
        
        console.log("2. Building compact prompt...");
        const prompt = buildCompactPrompt(ingredients, description, count, context);
        
        console.log("3. Calling Deepseek API for recipe generation...");
        const recipeMessages = [
            { role: 'system', content: 'You are an expert Filipino chef from Angeles City, Pampanga. You strictly output valid JSON and always respect dietary restrictions and substitution requirements.' },
            { role: 'user', content: prompt }
        ];
        const recipeContent = await callAI(recipeMessages, 2048, 0.3, true);
        const recipes = parseAIResponse(recipeContent);

        if (recipes.length === 0) throw new Error("AI response was empty or could not be parsed.");

        console.log(`4. Scoring ${recipes.length} recipes with AI evaluator...`);
        const qualityPromises = recipes.map(recipe => 
            scoreRecipeQualityAI(recipe, { ingredients, filters, description, ...context })
            .then(quality => ({ recipe, quality }))
        );
        const qualityResults = await Promise.all(qualityPromises);

        console.log('✅ AI Quality scores:', qualityResults.map(r => `${r.recipe.title}: ${r.quality.score}/100${r.quality.substitutionsCorrect ? ' ✅' : ''}`));
        
        const goodRecipes = qualityResults.filter(r => r.quality.passed).map(r => r.recipe);

        if (goodRecipes.length > 0) {
            return { 
                success: true, 
                data: goodRecipes, 
                metadata: { 
                    context, 
                    qualityScores: qualityResults.map(r => r.quality),
                    conflictsDetected: context.conflicts?.length > 0,
                    conflicts: context.conflicts
                } 
            };
        }

        console.warn('⚠ No recipes passed the quality threshold. Returning the highest-scoring ones.');
        const sortedResults = qualityResults.sort((a, b) => b.quality.score - a.quality.score);
        return { 
            success: true, 
            data: sortedResults.map(r => r.recipe), 
            warning: 'Generated recipes may not fully match requirements. Please review them carefully.',
            metadata: { 
                context, 
                qualityScores: sortedResults.map(r => r.quality),
                conflictsDetected: context.conflicts?.length > 0,
                conflicts: context.conflicts
            }
        };

    } catch (error) {
        console.error('❌ Error in generateAIRecipes:', error.message);
        return { success: false, error: `Generation failed: ${error.message}`, data: [] };
    }
};

const parseAIResponse = (content) => {
    try {
        const jsonString = content.trim().replace(/```json/g, '').replace(/```/g, '');
        const recipesData = JSON.parse(jsonString);

        if (!Array.isArray(recipesData)) return [];

        return recipesData.map((recipe, index) => {
            if (!recipe.title || !recipe.ingredients || !recipe.instructions) return null;
            
            // Convert nutrition string to structured object if needed
            let nutritional_info = null;
            
            if (recipe.nutritional_info && typeof recipe.nutritional_info === 'object') {
                // Already in correct format
                nutritional_info = recipe.nutritional_info;
            } else if (recipe.nutrition && typeof recipe.nutrition === 'string') {
                // Convert old string format to structured object
                nutritional_info = parseNutritionString(recipe.nutrition);
            } else if (recipe.nutritional_info && typeof recipe.nutritional_info === 'string') {
                // Handle if nutritional_info comes as string
                nutritional_info = parseNutritionString(recipe.nutritional_info);
            }
            
            return {
                id: `ai-${Date.now()}-${index}`,
                title: recipe.title.trim(),
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.filter(ing => ing) : [],
                instructions: Array.isArray(recipe.instructions) ? recipe.instructions.filter(inst => inst) : [],
                nutritional_info: nutritional_info,
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

// Helper function to parse nutrition string into structured object
const parseNutritionString = (nutritionStr) => {
    if (!nutritionStr) return null;
    
    const nutrition = {};
    
    // Extract calories
    const caloriesMatch = nutritionStr.match(/calories?:\s*(\d+)/i);
    if (caloriesMatch) nutrition.calories = parseInt(caloriesMatch[1]);
    
    // Extract protein
    const proteinMatch = nutritionStr.match(/protein:\s*(\d+)\s*g/i);
    if (proteinMatch) nutrition.protein_g = parseInt(proteinMatch[1]);
    
    // Extract carbs
    const carbsMatch = nutritionStr.match(/carb(?:ohydrate)?s?:\s*(\d+)\s*g/i);
    if (carbsMatch) nutrition.carbs_g = parseInt(carbsMatch[1]);
    
    // Extract fat
    const fatMatch = nutritionStr.match(/fat:\s*(\d+)\s*g/i);
    if (fatMatch) nutrition.fat_g = parseInt(fatMatch[1]);
    
    // Extract fiber
    const fiberMatch = nutritionStr.match(/fiber:\s*(\d+)\s*g/i);
    if (fiberMatch) nutrition.fiber_g = parseInt(fiberMatch[1]);
    
    // Extract sugar
    const sugarMatch = nutritionStr.match(/sugar:\s*(\d+)\s*g/i);
    if (sugarMatch) nutrition.sugar_g = parseInt(sugarMatch[1]);
    
    // Extract sodium
    const sodiumMatch = nutritionStr.match(/sodium:\s*(\d+)\s*mg/i);
    if (sodiumMatch) nutrition.sodium_mg = parseInt(sodiumMatch[1]);
    
    return Object.keys(nutrition).length > 0 ? nutrition : null;
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