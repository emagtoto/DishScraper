import axios from 'axios';

// --- CONFIGURATION ---
const DEEPSEEK_API_KEY = process.env.REACT_APP_DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.REACT_APP_DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions';

// --- STATE, CACHING, and DEBOUNCING ---
const filterCache = new Map();
const CACHE_DURATION = 15 * 60 * 1000;
let debounceTimer = null; // Timer for debouncing search requests

const generateCacheKey = (recipes, description) => {
    const recipeHash = `${recipes.length}-${recipes[0]?.id}-${recipes[recipes.length - 1]?.id}`;
    return `${recipeHash}::${description.toLowerCase().trim()}`;
};


// --- CORE AI & HELPER FUNCTIONS ---

const callAI = async (messages, max_tokens, temperature, isJson = true) => {
    // Prevent duplicate system messages if this function is called multiple times.
    if (isJson && messages[0]?.role !== 'system') {
        messages.unshift({ role: 'system', content: 'You are an AI assistant that only responds with valid, raw JSON without markdown formatting.' });
    }
    const maxRetries = 2;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.post(DEEPSEEK_API_URL, {
                model: 'deepseek-chat',
                messages,
                temperature,
                max_tokens,
                response_format: { type: 'json_object' }
            }, {
                headers: { 'Authorization': `Bearer ${DEEPSEEK_API_KEY}`, 'Content-Type': 'application/json' },
                timeout: 30000,
            });
            return response.data.choices[0].message.content;
        } catch (error) {
            if (error.code === 'ECONNABORTED' && attempt < maxRetries) {
                console.warn(`⏱️ AI call timed out on attempt ${attempt + 1}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
            } else {
                const errorDetails = error.response ? JSON.stringify(error.response.data) : error.message;
                console.error(`❌ AI Call Error after ${attempt + 1} attempts:`, errorDetails);
                throw new Error(`An AI sub-task failed. Last error: ${error.message}`);
            }
        }
    }
};

const analyzeDescriptionWithAI = async (description) => {
    const prompt = `
        You are a Recipe Query Analyst. Your job is to meticulously analyze the user's recipe description and convert it into a structured JSON object.

        **CRITICAL RULE**: If a broad cuisine category like 'Asian', 'European', or 'Mediterranean' is mentioned, you MUST expand it into a list of specific, relevant cuisines in the 'required_cuisine' array. For example, if the user says 'Asian dish', the result for 'required_cuisine' should be ['asian', 'chinese', 'japanese', 'korean', 'thai', 'vietnamese', 'filipino', 'indian', 'mongolian'].

        User Description: "${description}"

        Extract all criteria. If a field is not mentioned, omit it.
        - nutritional_constraints: { calories_max, calories_min, protein_min, carbs_max, fat_max, sugar_max, sodium_max }
        - time_constraints: { max_total_minutes }
        - general_criteria: {
            required_cuisine: [], required_dish_type: [], required_cooking_method: [],
            excluded_ingredients: [], positive_keywords: []
        }`;
    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callAI(messages, 700, 0.0, true);
    try {
        return JSON.parse(aiResponse);
    } catch (e) {
        console.error("Failed to parse AI analysis:", e);
        return {};
    }
};

/**
 * Helper function to robustly parse nutritional values from strings (e.g., "53g") or numbers.
 */
const parseNutritionValue = (value) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
    }
    return null;
};

/**
 * ✨ FIX: Re-engineered the pre-filter to robustly handle both string and object-based nutrition data.
 * This ensures constraints work for local recipes, Spoonacular results, and AI-generated recipes.
 */
const localPreFilter = (recipes, analysis) => {
    const { nutritional_constraints, time_constraints, general_criteria } = analysis;

    if (!nutritional_constraints && !time_constraints && !general_criteria) {
        return recipes;
    }

    const keywords = [
        ...(general_criteria?.positive_keywords || []),
        ...(general_criteria?.required_dish_type || []),
        ...(general_criteria?.required_cuisine || [])
    ].filter(Boolean);


    return recipes.filter(recipe => {
        // --- Step 1: Hard Constraint Checks (Fast Deal-breakers) ---
        if (nutritional_constraints) {
            const nutritionData = recipe.nutrition || recipe.nutritional_info || {};
            
            // This object maps our AI's constraint keys to the various ways recipe data might store them.
            const nutrientChecks = {
                calories_max: { keys: ['calories'], limit: 'max', name: 'Calories' },
                fat_max: { keys: ['fat', 'fat_g'], limit: 'max', name: 'Fat' },
                carbs_max: { keys: ['carbs', 'carbs_g', 'carbohydrates'], limit: 'max', name: 'Carbs' },
                protein_min: { keys: ['protein', 'protein_g'], limit: 'min', name: 'Protein' },
                sugar_max: { keys: ['sugar', 'sugar_g'], limit: 'max', name: 'Sugar' },
            };

            for (const constraint in nutritional_constraints) {
                if (nutrientChecks[constraint]) {
                    const check = nutrientChecks[constraint];
                    const constraintValue = nutritional_constraints[constraint];
                    let recipeValue = null;

                    if (typeof nutritionData === 'object' && nutritionData !== null) {
                        for (const key of check.keys) {
                            if (nutritionData[key] !== undefined) {
                                recipeValue = parseNutritionValue(nutritionData[key]);
                                break;
                            }
                        }
                    } else if (typeof nutritionData === 'string') {
                        const regex = new RegExp(`${check.name}:?\\s*([0-9.]+)`, 'i');
                        const match = nutritionData.match(regex);
                        if (match && match[1]) {
                            recipeValue = parseFloat(match[1]);
                        }
                    }

                    // If a constraint is set, but the recipe has no valid data for it, it fails.
                    if (recipeValue === null) return false;
                    
                    if (check.limit === 'max' && recipeValue > constraintValue) return false;
                    if (check.limit === 'min' && recipeValue < constraintValue) return false;
                }
            }
        }
        
        if (time_constraints) {
            const time = recipe.totalTime || recipe.readyInMinutes || 0;
            if (time_constraints.max_total_minutes && time > time_constraints.max_total_minutes) return false;
        }

        // ✨ FIX: Create a comprehensive text block for searching that handles different data structures from local vs. API recipes.
        const ingredientsText = (recipe.ingredients || [])
            .map(ing => (typeof ing === 'object' && ing !== null ? ing.name : ing) || '')
            .join(' ');
            
        const recipeText = [
            recipe.title,
            recipe.description,
            recipe.summary,
            ...(recipe.tags || []),
            ...(recipe.cuisines || []), // Spoonacular often uses this field
            ...(recipe.dishTypes || []), // Spoonacular often uses this field
            ingredientsText
        ].join(' ').toLowerCase();
        
        if (general_criteria?.excluded_ingredients?.some(ex => recipeText.includes(ex.toLowerCase()))) return false;

        // --- Step 2: Semantic Relevance Check ---
        if (keywords.length > 0) {
            // The recipe text must contain at least one of the essential keywords.
            if (!keywords.some(kw => recipeText.includes(kw.toLowerCase()))) {
                return false;
            }
        }
        
        return true;
    });
};


const rankRecipeBatchWithAI = async (recipeBatch, analysis) => {
    const compactRecipeList = recipeBatch.map((recipe, index) => {
        return `${index + 1}. ${recipe.title} | Tags: ${recipe.tags?.join(', ') || 'N/A'}`;
    }).join('\n');

    const prompt = `
      You are a Recipe Ranker AI. Evaluate a list of recipes based on the user's request and return the numbers of the best matches, ranked in order of relevance.
      USER'S REQUEST: ${JSON.stringify(analysis, null, 2)}
      RECIPES TO EVALUATE:
      ${compactRecipeList}
      Your task is to return a JSON object with a single key "ranked_matches", containing an array of the recipe numbers that are good matches, sorted from best to worst. If no recipes are a good match, return an empty array.
      Example Response: { "ranked_matches": [3, 1, 8] }
      Respond ONLY with the valid JSON object.`;
    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callAI(messages, 800, 0.1, true);
    try {
        const result = JSON.parse(aiResponse);
        const rankedIndexes = result.ranked_matches || [];
        return rankedIndexes.map(index => recipeBatch[index - 1]).filter(Boolean);
    } catch (e) {
        console.error("Failed to parse AI ranking:", e);
        return [];
    }
};

/**
 * 🚀 MAIN FILTER FUNCTION (Simplified with robust debouncing)
 */
export const filterRecipesByDescription = (recipes, description) => {
    clearTimeout(debounceTimer); // Always clear the previous timer

    return new Promise((resolve) => {
        if (!description?.trim() || recipes.length === 0) {
            return resolve(recipes);
        }

        debounceTimer = setTimeout(async () => {
            const cacheKey = generateCacheKey(recipes, description);
            const cached = filterCache.get(cacheKey);
            if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
                console.log('✅ Filter cache hit!');
                return resolve(cached.results);
            }

            console.log(`\n${'='.repeat(60)}`);
            console.log(`🚀 AI FILTERING (debounced) for: "${description}"`);
            console.log(`${'='.repeat(60)}\n`);
            const overallStart = performance.now();

            try {
                const analysis = await analyzeDescriptionWithAI(description);

                const preFilteredRecipes = localPreFilter(recipes, analysis);
                console.log(`⚡ Pre-filter complete. ${preFilteredRecipes.length}/${recipes.length} candidates remain.`);

                if (preFilteredRecipes.length === 0) {
                   return resolve([]);
                }

                const MAX_RECIPES_TO_RANK = 150;
                const recipesToRank = preFilteredRecipes.slice(0, MAX_RECIPES_TO_RANK);
                if (preFilteredRecipes.length > MAX_RECIPES_TO_RANK) {
                    console.warn(`⚠️ Too many candidates (${preFilteredRecipes.length}). Ranking only the top ${MAX_RECIPES_TO_RANK} for performance.`);
                }

                const finalResults = [];
                const batchSize = 25;

                for (let i = 0; i < recipesToRank.length; i += batchSize) {
                    const batch = recipesToRank.slice(i, i + batchSize);
                    console.log(` -> Ranking batch ${i / batchSize + 1} of ${Math.ceil(recipesToRank.length / batchSize)}...`);
                    const rankedBatch = await rankRecipeBatchWithAI(batch, analysis);
                    finalResults.push(...rankedBatch);
                }

                const duration = (performance.now() - overallStart).toFixed(2);
                console.log(`\n${'='.repeat(60)}`);
                console.log(`✅ AI FILTERING COMPLETE: Found ${finalResults.length} recipes in ${duration}ms`);
                console.log(`${'='.repeat(60)}\n`);

                filterCache.set(cacheKey, { results: finalResults, timestamp: Date.now() });
                resolve(finalResults);

            } catch (error) {
                console.error('❌ An error occurred during the AI filtering process:', error.message);
                resolve(recipes); // Fallback to original list on critical error
            }
        }, 400); // Wait 400ms after the last key press before searching
    });
};

export const clearFilterCache = () => {
    filterCache.clear();
    console.log('🗑️ Filter cache cleared');
};

const descriptionFilterService = {
    filterRecipesByDescription,
    clearFilterCache,
};

export default descriptionFilterService;

