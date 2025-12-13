import axios from 'axios';

// CONFIGURATION
const DEEPSEEK_API_URL = process.env.REACT_APP_DEEPSEEK_API_URL;

const DEBOUNCE_DELAY = 400; // ms

// TUNABLES
const MAX_AI_RANK = 80;
const ENABLE_CACHE = true;
const ENABLE_AI_FILTERING = true; // Toggle to disable AI and use simple search

// STATE, CACHING, and DEBOUNCING
const filterCache = new Map();
const analysisCache = new Map();
const analysisCacheDuration = 15 * 60 * 1000;
const filterCacheDuration = 30 * 60 * 1000;
let debounceTimer = null;

//  UTILITIES
const now = () => Date.now();

const generateCacheKey = (recipes, description) => {
    const firstId = recipes[0]?.id ?? recipes[0]?.recipeId ?? null;
    const lastId = recipes[recipes.length - 1]?.id ?? recipes[recipes.length - 1]?.recipeId ?? null;
    const len = recipes.length;
    const normDesc = (description || '').toLowerCase().trim();
    return `${len}::${firstId || 'nil'}::${lastId || 'nil'}::${normDesc}`;
};

const safeParseJson = (text) => {
    try { return JSON.parse(text); }
    catch (e) { return null; }
};

const truncate = (s, n = 140) => {
    if (!s) return '';
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
};

const roundIfNumber = (v) => (typeof v === 'number' ? Math.round(v) : v);

// SIMPLE KEYWORD FILTER (Used for simple queries & fallback)
const simpleKeywordFilter = (recipes, description) => {
    const keywords = description.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const fullQuery = description.toLowerCase().trim();
    const isStyleQuery = /\b(style|dish|recipe|food)\b/i.test(description);

    const scoredRecipes = recipes.map(recipe => {
        const title = (recipe.title || recipe.name || '').toLowerCase();
        const summary = (recipe.summary || recipe.description || '').toLowerCase();
        const tags = (recipe.tags || []).join(' ').toLowerCase();
        const cuisines = (recipe.cuisines || []).join(' ').toLowerCase();
        const dishTypes = (recipe.dishTypes || []).join(' ').toLowerCase();
        const ingredients = (recipe.ingredients || []).map(ing =>
            typeof ing === 'string' ? ing : (ing?.name || ing?.original || '')
        ).join(' ').toLowerCase();

        const metadataText = [tags, cuisines, dishTypes].join(' ');
        let score = 0;

        const mainKeywords = keywords.filter(kw =>
            !['style', 'dish', 'recipe', 'food', 'with'].includes(kw)
        );

        const titleWords = title.split(/\s+/);
        if (titleWords.includes(fullQuery)) {
            score += 100;
        } else if (title.includes(fullQuery)) {
            score += 80;
        }

        if (isStyleQuery) {
            const titleHasMainKeyword = mainKeywords.some(kw => {
                const regex = new RegExp(`\\b${kw}\\b`, 'i');
                return regex.test(title);
            });

            if (titleHasMainKeyword) {
                score += 70;
            }

            const onlyInIngredients = mainKeywords.some(kw =>
                ingredients.includes(kw) && !title.includes(kw) && !summary.includes(kw)
            );

            if (onlyInIngredients && !titleHasMainKeyword) {
                score -= 50;
            }
        }

        const titleMatches = mainKeywords.filter(kw => title.includes(kw)).length;
        if (titleMatches === mainKeywords.length && mainKeywords.length > 0) {
            score += 50;
        } else if (titleMatches > 0) {
            score += titleMatches * 20;
        }

        const summaryMatches = mainKeywords.filter(kw => summary.includes(kw)).length;
        score += summaryMatches * 10;

        const metadataMatches = mainKeywords.filter(kw => metadataText.includes(kw)).length;
        score += metadataMatches * 5;

        const ingredientMatches = mainKeywords.filter(kw =>
            ingredients.includes(kw) && !title.includes(kw) && !summary.includes(kw)
        ).length;
        score += ingredientMatches * 2;

        if (isStyleQuery) {
            mainKeywords.forEach(kw => {
                const ingredientMatches = ingredients.match(new RegExp(`\\b${kw}\\s+(sauce|marinade|paste|seasoning|powder)`, 'gi'));
                if (ingredientMatches && !title.includes(kw)) {
                    score -= 30;
                }
            });
        }

        return { recipe, score };
    });

    return scoredRecipes
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.recipe);
};

// CHECK IF QUERY IS SIMPLE
const isSimpleQuery = (description) => {
    const normalized = description.toLowerCase().trim();
    const wordCount = normalized.split(/\s+/).length;

    const complexPatterns = [
        /\d+\s*(calorie|minute|min|gram|g|mg|serving)/i,
        /\b(low|high|max|min|under|over|less than|more than)\b/i,
        /\b(without|no|exclude|avoid|except)\b/i,
        /\b(vegan|vegetarian|gluten-free|dairy-free|keto|paleo)\b/i,
    ];

    const hasComplexPattern = complexPatterns.some(pattern => pattern.test(normalized));
    return wordCount <= 3 && !hasComplexPattern;
};

// AI CALL with robust response handling
const callAI = async (messages, max_tokens = 1200, temperature = 0.1, isJson = true) => {
    if (isJson && messages[0]?.role !== 'system') {
        messages.unshift({
            role: 'system',
            content: 'You are an AI assistant that responds ONLY with valid JSON (no markdown, no explanation).'
        });
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
                headers: { 'Content-Type': 'application/json' },
                timeout: 30000,
            });

            // ✅ Handle different response structures
            let content = null;
            
            if (response.data?.choices?.[0]?.message?.content) {
                content = response.data.choices[0].message.content;
            } else if (response.data?.content) {
                content = response.data.content;
            } else if (response.data?.message?.content) {
                content = response.data.message.content;
            } else if (typeof response.data === 'string') {
                content = response.data;
            } else if (response.data?.data?.choices?.[0]?.message?.content) {
                content = response.data.data.choices[0].message.content;
            } else {
                console.error('Unexpected API response structure:', response.data);
                throw new Error('Unexpected API response structure');
            }

            if (!content) {
                throw new Error('API returned empty content');
            }

            return content;

        } catch (error) {
            const errorStatus = error.response?.status;
            
            if (errorStatus === 429) {
                console.error("AI Call Error: Rate limit exceeded (429).");
                throw new Error("AI service rate limited");
            }
            if (errorStatus === 401) {
                console.error("AI Call Error: Authentication failed (401).");
                throw new Error("AI authentication failed");
            }
            if ((error.code === 'ECONNABORTED' || (errorStatus && errorStatus >= 500)) && attempt < maxRetries) {
                console.warn(`AI call failed on attempt ${attempt + 1}. Retrying...`);
                await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
                continue;
            }
            
            const details = error.response ? JSON.stringify(error.response.data) : error.message;
            console.error(`AI Call Error: ${details}`);
            throw new Error('AI call failed: ' + (error.message || details));
        }
    }
};

// ANALYZE DESCRIPTION (cached)
const analyzeDescriptionWithAI = async (description) => {
    const key = description.toLowerCase().trim();
    if (ENABLE_CACHE) {
        const cached = analysisCache.get(key);
        if (cached && (now() - cached.timestamp < analysisCacheDuration)) {
            return cached.analysis;
        }
    }

    const prompt = `
You are a Recipe Query Analyst. Convert the user description into JSON describing constraints.
Rules:
- For simple dish names (like "adobo", "pasta", "curry"), ONLY extract: {"general_criteria": {"positive_keywords": [dishname]}}
- Only add complex constraints if explicitly mentioned (calories, time, excluded ingredients, etc.)
- Expand broad cuisines (e.g., "Asian" -> ["chinese","japanese","korean","thai","indian","vietnamese","filipino"])
- For Filipino dishes like "adobo", "sinigang", add "filipino" to required_cuisine
- Keep positive_keywords simple and directly related to the query

User description: "${description}"

Return only valid JSON. For simple queries, return minimal structure:
{
  "general_criteria": {
    "positive_keywords": ["adobo"],
    "required_cuisine": ["filipino"]
  }
}

Only add these fields if explicitly mentioned:
{
  "nutritional_constraints": {"calories_max":300, "protein_min":15},
  "time_constraints": {"max_total_minutes":30},
  "general_criteria": {
    "required_cuisine": ["italian"],
    "required_dish_type": ["soup"],
    "excluded_ingredients": ["peanut"],
    "positive_keywords": ["spinach", "quick"]
  }
}
    `.trim();

    const messages = [{ role: 'user', content: prompt }];
    const aiResponse = await callAI(messages, 800, 0.0, true);
    const parsed = safeParseJson(aiResponse);
    if (!parsed) {
        console.error('Analysis AI returned unparseable JSON:', aiResponse);
        return { general_criteria: { positive_keywords: [description.toLowerCase().trim()] } };
    }

    if (ENABLE_CACHE) {
        analysisCache.set(key, { analysis: parsed, timestamp: now() });
    }
    return parsed;
};

// LOCAL PREFILTER
const localPreFilter = (recipes, analysis) => {
    const { nutritional_constraints, time_constraints, general_criteria } = analysis || {};

    if (!nutritional_constraints && !time_constraints && !general_criteria) return recipes;

    const keywords = [
        ...(general_criteria?.positive_keywords || []),
        ...(general_criteria?.required_dish_type || []),
        ...(general_criteria?.required_cuisine || [])
    ].filter(Boolean).map(k => k.toLowerCase());

    return recipes.filter(recipe => {
        if (time_constraints?.max_total_minutes) {
            const time = recipe.totalTime || recipe.readyInMinutes || 0;
            if (time && time > time_constraints.max_total_minutes) return false;
        }

        const ingredientsText = (recipe.ingredients || []).map(ing =>
            (typeof ing === 'object' && ing !== null ? (ing.name || ing.original || '') : ing) || ''
        ).join(' ').toLowerCase();

        const recipeText = [
            recipe.title || '',
            recipe.name || '',
            recipe.description || '',
            recipe.summary || '',
            ...(recipe.tags || []),
            ...(recipe.cuisines || []),
            ...(recipe.dishTypes || []),
            ingredientsText
        ].join(' ').toLowerCase();

        if (general_criteria?.excluded_ingredients?.some(ex => {
            const r = new RegExp(`\\b${ex.toLowerCase()}\\b`, 'i');
            return r.test(recipeText);
        })) return false;

        if (nutritional_constraints && Object.keys(nutritional_constraints).length > 0) {
            const nutritionData = recipe.nutrition || recipe.nutritional_info || {};
            const hasNutritionData = typeof nutritionData === 'object' && Object.keys(nutritionData).length > 0;

            if (hasNutritionData) {
                const getVal = (k) => {
                    const checks = {
                        calories: ['calories', 'cal', 'kcal'],
                        protein_g: ['protein', 'protein_g'],
                        carbs_g: ['carbs', 'carbs_g', 'carbohydrates'],
                        fat_g: ['fat', 'fat_g'],
                        sugar_g: ['sugar', 'sugar_g'],
                        sodium_mg: ['sodium', 'sodium_mg']
                    }[k] || [];

                    for (const key of checks) {
                        if (nutritionData[key] !== undefined && nutritionData[key] !== null) {
                            const v = nutritionData[key];
                            if (typeof v === 'number') return v;
                            if (typeof v === 'string') {
                                const n = parseFloat(v.replace(/[^\d.]/g, ''));
                                if (!isNaN(n)) return n;
                            }
                        }
                    }
                    return null;
                };

                for (const [conKey, conVal] of Object.entries(nutritional_constraints)) {
                    if (conVal == null) continue;
                    let nutrientKey = null;
                    if (conKey.includes('calorie')) nutrientKey = 'calories';
                    else if (conKey.includes('protein')) nutrientKey = 'protein_g';
                    else if (conKey.includes('carb')) nutrientKey = 'carbs_g';
                    else if (conKey.includes('fat')) nutrientKey = 'fat_g';
                    else if (conKey.includes('sodium')) nutrientKey = 'sodium_mg';
                    else if (conKey.includes('sugar')) nutrientKey = 'sugar_g';
                    if (!nutrientKey) continue;

                    const recipeValue = getVal(nutrientKey);
                    if (recipeValue !== null) {
                        if (conKey.endsWith('_max') && recipeValue > conVal) return false;
                        if (conKey.endsWith('_min') && recipeValue < conVal) return false;
                    }
                }
            }
        }

        if (keywords.length > 0) {
            const matches = keywords.some(k => recipeText.includes(k));
            if (!matches) {
                const fuzzyMatch = keywords.some(k => {
                    if (k.length > 4) {
                        return recipeText.includes(k.slice(0, -1)) || recipeText.includes(k.slice(1));
                    }
                    return false;
                });
                if (!fuzzyMatch) return false;
            }
        }

        return true;
    });
};

// Recipe Compression
const buildCompressedRecipeLines = (recipes) => {
    return recipes.map((recipe, idx) => {
        const id = recipe.id ?? recipe.recipeId ?? `idx${idx}`;
        const title = truncate(recipe.title || recipe.name || 'Untitled', 80).replace(/\n/g, ' ');
        const tags = (recipe.tags || []).slice(0, 6).map(t => t.toString().replace(/\|/g, ',')).join(',');
        const cuisines = (recipe.cuisines || []).slice(0, 3).join(',');
        const dishTypes = (recipe.dishTypes || []).slice(0, 3).join(',');

        const ingredientsPreview = (recipe.ingredients || []).slice(0, 6).map(ing => {
            if (!ing) return '';
            if (typeof ing === 'string') return ing.split(',')[0];
            if (typeof ing === 'object' && (ing.name || ing.original)) return (ing.name || ing.original).split(',')[0];
            return '';
        }).filter(Boolean).join(',');

        const nutrition = recipe.nutritional_info || recipe.nutrition || {};
        const cal = roundIfNumber(nutrition.calories || nutrition.cal || nutrition.kcal) || '';
        const prot = roundIfNumber(nutrition.protein || nutrition.protein_g) || '';
        const carbs = roundIfNumber(nutrition.carbs || nutrition.carbs_g) || '';
        const fat = roundIfNumber(nutrition.fat || nutrition.fat_g) || '';
        const sodium = roundIfNumber(nutrition.sodium || nutrition.sodium_mg) || '';

        const parts = [
            `${idx + 1}|${id}|${title}`,
            tags ? `tags:${tags}` : '',
            cuisines ? `cuisines:${cuisines}` : '',
            dishTypes ? `dish:${dishTypes}` : '',
            recipe.totalTime ? `time:${recipe.totalTime}` : (recipe.readyInMinutes ? `time:${recipe.readyInMinutes}` : ''),
            ingredientsPreview ? `ing:${ingredientsPreview}` : '',
            cal ? `cal:${cal}` : '',
            prot ? `prot:${prot}` : '',
            carbs ? `carb:${carbs}` : '',
            fat ? `fat:${fat}` : '',
            sodium ? `sod:${sodium}` : '',
        ].filter(Boolean).join('|');

        return parts.length > 200 ? parts.slice(0, 200) : parts;
    });
};

// ONE-CALL RANKING
const rankAllInOneCall = async (recipesToRank, analysis) => {
    if (!recipesToRank || recipesToRank.length === 0) return [];

    const limited = recipesToRank.slice(0, MAX_AI_RANK);
    const compressedLines = buildCompressedRecipeLines(limited);

    const prompt = `
You are a Recipe Ranker. Rank candidate recipes based on relevance to the user's request.

User request (JSON):
${JSON.stringify(analysis)}

Candidate recipes (one per line):
${compressedLines.join('\n')}

Instructions:
- Rank by relevance to user query
- If the query is simple (like "adobo"), prioritize title matches
- Consider nutrition/time constraints if specified
- If recipes don't match well, include them anyway (user sees all results)
- Return JSON with "ranked_matches": array of 1-based indices, best first

Example: { "ranked_matches": [3,1,5,2,4] }

Respond ONLY with JSON.
    `.trim();

    const messages = [{ role: 'user', content: prompt }];
    const maxTokens = 1400;
    const aiResponse = await callAI(messages, maxTokens, 0.1, true);
    const parsed = safeParseJson(aiResponse);

    if (!parsed || !Array.isArray(parsed.ranked_matches)) {
        console.error('Ranker AI returned invalid JSON:', aiResponse);
        return limited;
    }

    const rankedIndices = parsed.ranked_matches.map(n => Number(n)).filter(n => !isNaN(n) && n >= 1 && n <= limited.length);
    const rankedRecipes = rankedIndices.map(i => limited[i - 1]).filter(Boolean);

    const includedIds = new Set(rankedRecipes.map(r => r.id || r.recipeId));
    const remaining = limited.filter(r => !includedIds.has(r.id || r.recipeId));

    return [...rankedRecipes, ...remaining];
};

// MAIN FILTER FUNCTION
export const filterRecipesByDescription = (recipes, description) => {
    clearTimeout(debounceTimer);

    return new Promise((resolve) => {
        if (!description?.trim() || !recipes || recipes.length === 0) {
            return resolve(recipes || []);
        }

        debounceTimer = setTimeout(async () => {
            const cacheKey = generateCacheKey(recipes, description);
            if (ENABLE_CACHE) {
                const cached = filterCache.get(cacheKey);
                if (cached && (now() - cached.timestamp < filterCacheDuration)) {
                    console.log('Filter cache hit!');
                    return resolve(cached.results);
                }
            }

            console.log(`\nFiltering recipes for: "${description}"`);
            const overallStart = performance.now();

            try {
                if (!ENABLE_AI_FILTERING || isSimpleQuery(description)) {
                    console.log('Using simple keyword filter');
                    const results = simpleKeywordFilter(recipes, description);
                    if (ENABLE_CACHE) {
                        filterCache.set(cacheKey, { results, timestamp: now() });
                    }
                    const duration = (performance.now() - overallStart).toFixed(2);
                    console.log(`Filtering complete: ${results.length} recipes in ${duration}ms`);
                    return resolve(results);
                }

                console.log('Using AI-powered filtering');
                const analysis = await analyzeDescriptionWithAI(description);
                console.log('Analysis:', JSON.stringify(analysis));

                const preFiltered = localPreFilter(recipes, analysis);
                console.log(`Pre-filter: ${preFiltered.length}/${recipes.length} candidates`);

                if (preFiltered.length === 0) {
                    console.log('Pre-filter too aggressive, falling back to keyword search');
                    const fallback = simpleKeywordFilter(recipes, description);
                    if (ENABLE_CACHE) filterCache.set(cacheKey, { results: fallback, timestamp: now() });
                    return resolve(fallback);
                }

                const recipesToRank = preFiltered.slice(0, MAX_AI_RANK);
                const ranked = await rankAllInOneCall(recipesToRank, analysis);

                const duration = (performance.now() - overallStart).toFixed(2);
                console.log(`AI filtering complete: ${ranked.length} recipes in ${duration}ms`);

                if (ENABLE_CACHE) {
                    filterCache.set(cacheKey, { results: ranked, timestamp: now() });
                }

                return resolve(ranked);

            } catch (error) {
                console.error('AI filtering failed, using keyword fallback:', error.message);
                const fallbackResults = simpleKeywordFilter(recipes, description);
                if (ENABLE_CACHE) {
                    filterCache.set(cacheKey, { results: fallbackResults, timestamp: now() });
                }
                return resolve(fallbackResults);
            }
        }, DEBOUNCE_DELAY);
    });
};

export const clearFilterCache = () => {
    filterCache.clear();
    console.log('Filter cache cleared');
};

export const clearAnalysisCache = () => {
    analysisCache.clear();
    console.log('Analysis cache cleared');
};

const descriptionFilterService = {
    filterRecipesByDescription,
    clearFilterCache,
    clearAnalysisCache,
};

export default descriptionFilterService;