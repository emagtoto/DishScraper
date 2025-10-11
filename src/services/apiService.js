// apiService.js - MODIFIED: Allows for flexible ingredient matching
import axios from 'axios';

const BASE_URL = 'https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes'; //
const RAPID_API_KEY = process.env.REACT_APP_SPOONACULAR_API_KEY; //
const RAPID_API_HOST = 'spoonacular-recipe-food-nutrition-v1.p.rapidapi.com'; //

const CONFIG = { //
  MAX_RECIPES_NO_FILTERS: 200, //
  TARGET_VALIDATED_RECIPES: 200, //
  BATCH_SIZE: 100, //
  BATCH_DELAY: 500, //
  DETAIL_FETCH_DELAY: 250, //
  MAX_PARALLEL_DETAILS: 0 //
};

let rateLimitInfo = { //
  classificationsLimit: null, //
  classificationsRemaining: null, //
  requestsLimit: null, //
  requestsRemaining: null, //
  tinyrequestsLimit: null, //
  tinyrequestsRemaining: null, //
  lastUpdated: null, //
  resetTime: null //
};

const hasAvailableQuota = () => { //
  if (!rateLimitInfo.lastUpdated) return { allowed: true }; //
  if (rateLimitInfo.requestsRemaining !== null && parseInt(rateLimitInfo.requestsRemaining) <= 0) { //
    return { allowed: false, reason: 'Daily request quota exhausted', limit: rateLimitInfo.requestsLimit, remaining: 0, type: 'requests' }; //
  }
  if (rateLimitInfo.tinyrequestsRemaining !== null && parseInt(rateLimitInfo.tinyrequestsRemaining) <= 0) { //
    return { allowed: false, reason: 'Daily tiny requests quota exhausted', limit: rateLimitInfo.tinyrequestsLimit, remaining: 0, type: 'tinyrequests' }; //
  }
  if (rateLimitInfo.classificationsRemaining !== null && parseInt(rateLimitInfo.classificationsRemaining) <= 0) { //
    return { allowed: false, reason: 'Daily classifications quota exhausted', limit: rateLimitInfo.classificationsLimit, remaining: 0, type: 'classifications' }; //
  }
  return { allowed: true, remaining: parseInt(rateLimitInfo.requestsRemaining) || null }; //
};

const updateRateLimitInfo = (headers) => { //
  if (headers) { //
    const previousRequests = rateLimitInfo.requestsRemaining; //
    const previousTiny = rateLimitInfo.tinyrequestsRemaining; //
    const previousClassifications = rateLimitInfo.classificationsRemaining; //

    rateLimitInfo = { //
      classificationsLimit: headers['x-ratelimit-classifications-limit'], //
      classificationsRemaining: headers['x-ratelimit-classifications-remaining'], //
      requestsLimit: headers['x-ratelimit-requests-limit'], //
      requestsRemaining: headers['x-ratelimit-requests-remaining'], //
      tinyrequestsLimit: headers['x-ratelimit-tinyrequests-limit'], //
      tinyrequestsRemaining: headers['x-ratelimit-tinyrequests-remaining'], //
      resetTime: headers['x-ratelimit-requests-reset'], //
      lastUpdated: new Date().toISOString() //
    };

    const requestsConsumed = previousRequests !== null //
      ? parseInt(previousRequests) - parseInt(rateLimitInfo.requestsRemaining) //
      : 0; //
    const tinyConsumed = previousTiny !== null //
      ? parseInt(previousTiny) - parseInt(rateLimitInfo.tinyrequestsRemaining) //
      : 0; //
    const classConsumed = previousClassifications !== null //
      ? parseInt(previousClassifications) - parseInt(rateLimitInfo.classificationsRemaining) //
      : 0; //

    console.log('📋 Raw Headers Received:', { //
      'x-ratelimit-classifications-limit': headers['x-ratelimit-classifications-limit'], //
      'x-ratelimit-classifications-remaining': headers['x-ratelimit-classifications-remaining'], //
      'x-ratelimit-requests-limit': headers['x-ratelimit-requests-limit'], //
      'x-ratelimit-requests-remaining': headers['x-ratelimit-requests-remaining'], //
      'x-ratelimit-tinyrequests-limit': headers['x-ratelimit-tinyrequests-limit'], //
      'x-ratelimit-tinyrequests-remaining': headers['x-ratelimit-tinyrequests-remaining'] //
    });

    console.log('📊 Rate Limit Updated:', { //
      requests: `${rateLimitInfo.requestsRemaining}/${rateLimitInfo.requestsLimit}` + //
        (requestsConsumed > 0 ? ` 📻-${requestsConsumed}` : ''), //
      tinyrequests: `${rateLimitInfo.tinyrequestsRemaining}/${rateLimitInfo.tinyrequestsLimit}` + //
        (tinyConsumed > 0 ? ` 📻-${tinyConsumed}` : ''), //
      classifications: `${rateLimitInfo.classificationsRemaining}/${rateLimitInfo.classificationsLimit}` + //
        (classConsumed > 0 ? ` 📻-${classConsumed}` : ''), //
      resetTime: rateLimitInfo.resetTime ? new Date(parseInt(rateLimitInfo.resetTime) * 1000).toLocaleTimeString() : 'N/A' //
    });
  } else { //
    console.warn('⚠️ No headers received from API response'); //
  }
};

const getRateLimitInfo = () => { //
  const info = { //
    ...rateLimitInfo, //
    percentUsed: rateLimitInfo.requestsLimit && rateLimitInfo.requestsRemaining //
      ? Math.round((1 - rateLimitInfo.requestsRemaining / rateLimitInfo.requestsLimit) * 100) //
      : null //
  };

  if (rateLimitInfo.resetTime) { //
    const resetDate = new Date(parseInt(rateLimitInfo.resetTime) * 1000); //
    const now = new Date(); //
    const msUntilReset = resetDate - now; //

    if (msUntilReset > 0) { //
      const hours = Math.floor(msUntilReset / (1000 * 60 * 60)); //
      const minutes = Math.floor((msUntilReset % (1000 * 60 * 60)) / (1000 * 60)); //
      info.resetIn = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`; //
      info.resetDate = resetDate.toLocaleTimeString(); //
    } else { //
      info.resetIn = 'Now'; //
      info.resetDate = 'Ready'; //
    }
  }

  return info; //
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms)); //

const makeApiRequest = async (url, params, retryCount = 0, maxRetries = 3) => { //
  try { //
    if (!RAPID_API_KEY) { //
      throw new Error('Spoonacular API key is not configured. Please add REACT_APP_SPOONACULAR_API_KEY to your .env file'); //
    }

    const quotaCheck = hasAvailableQuota(); //
    if (!quotaCheck.allowed) { //
      throw new Error(`${quotaCheck.reason}. Your daily limit of ${quotaCheck.limit} ${quotaCheck.type} has been reached.`); //
    }

    const response = await axios.get(url, { //
      params: params, //
      headers: { //
        'X-RapidAPI-Key': RAPID_API_KEY, //
        'X-RapidAPI-Host': RAPID_API_HOST //
      },
      timeout: 15000 //
    });

    updateRateLimitInfo(response.headers); //
    return response; //
  } catch (error) { //
    if (error.response) { //
      const status = error.response.status; //
      const message = error.response.data?.message || 'API request failed'; //
      updateRateLimitInfo(error.response.headers); //

      if (status === 402) { //
        throw new Error('API quota exceeded. Please check your RapidAPI plan.'); //
      } else if (status === 429 && retryCount < maxRetries) { //
        const waitTime = Math.min(2000 * Math.pow(2, retryCount), 16000); //
        console.log(`⏳ Rate limit hit, waiting ${waitTime}ms before retry ${retryCount + 1}/${maxRetries}...`); //
        await delay(waitTime); //
        return makeApiRequest(url, params, retryCount + 1, maxRetries); //
      } else if (status === 429) { //
        throw new Error('Rate limit exceeded. Please wait a moment and try again.'); //
      } else if (status === 401 || status === 403) { //
        throw new Error('Invalid API key. Please check your .env configuration.'); //
      } else { //
        throw new Error(`API Error (${status}): ${message}`); //
      }
    }
    throw error; //
  }
};

const formatNutritionSimple = (nutritionalInfo) => { //
  return `Calories: ${Math.round(nutritionalInfo.calories)}, Protein: ${Math.round(nutritionalInfo.protein_g)}g, Carbs: ${Math.round(nutritionalInfo.carbs_g)}g, Fat: ${Math.round(nutritionalInfo.fat_g)}g`; //
};

const extractInstructions = (recipe) => { //
  if (recipe.analyzedInstructions && Array.isArray(recipe.analyzedInstructions)) { //
    const steps = recipe.analyzedInstructions[0]?.steps; //
    if (steps && Array.isArray(steps) && steps.length > 0) { //
      return steps.map((step) => step.step); //
    }
  }

  if (recipe.instructions && typeof recipe.instructions === 'string') { //
    const cleaned = recipe.instructions //
      .replace(/<[^>]*>/g, '') //
      .replace(/&[a-z]+;/gi, '') //
      .replace(/&nbsp;/g, ' ') //
      .trim(); //

    const isPromotional = /servings with|per serving|spoonacular score|users who liked|plenty of people|brought to you by/i.test(cleaned); //

    if (!isPromotional && cleaned.length > 50) { //
      let steps = cleaned.split(/\d+\.\s+/).filter(s => s.trim().length > 10); //

      if (steps.length <= 1) { //
        steps = cleaned.split(/\n+/).filter(s => s.trim().length > 10); //
      }

      if (steps.length <= 1) { //
        steps = cleaned //
          .split(/(?<=[.!?])\s+(?=[A-Z])/) //
          .filter(s => s.trim().length > 10); //
      }

      if (steps.length > 0) { //
        return steps.map(s => s.trim()); //
      }
    }
  }

  return [ //
    'Prepare all ingredients as listed above.', //
    'Follow standard cooking methods for the main ingredients.', //
    'Season to taste and adjust cooking times as needed.', //
    'Serve hot and enjoy!' //
  ];
};

export const getRecipeDetails = async (recipeId) => { //
  try { //
    const numericId = String(recipeId).replace(/^spoon-/, ''); //
    const response = await makeApiRequest( //
      `${BASE_URL}/${numericId}/information`, //
      { includeNutrition: true } //
    );

    const recipe = response.data; //
    const nutritionData = recipe.nutrition?.nutrients || []; //

    const parsedNutrition = { //
      calories: nutritionData.find(n => n.name === 'Calories')?.amount || 0, //
      protein_g: nutritionData.find(n => n.name === 'Protein')?.amount || 0, //
      carbs_g: nutritionData.find(n => n.name === 'Carbohydrates')?.amount || 0, //
      fat_g: nutritionData.find(n => n.name === 'Fat')?.amount || 0, //
      fiber_g: nutritionData.find(n => n.name === 'Fiber')?.amount || 0, //
      sugar_g: nutritionData.find(n => n.name === 'Sugar')?.amount || 0, //
      sodium_mg: nutritionData.find(n => n.name === 'Sodium')?.amount || 0 //
    };

    return { //
      id: `spoon-${recipe.id}`, //
      title: recipe.title, //
      image: recipe.image, //
      ingredients: recipe.extendedIngredients?.map(ing => ing.original) || [], //
      instructions: extractInstructions(recipe), //
      nutrition: formatNutritionSimple(parsedNutrition), //
      nutritional_info: parsedNutrition, //
      tags: recipe.diets || [], //
      source: 'Spoonacular', //
      readyInMinutes: recipe.readyInMinutes, //
      servings: recipe.servings, //
      sourceUrl: recipe.sourceUrl //
    };
  } catch (error) { //
    console.error(`Error fetching recipe ${recipeId}:`, error); //
    return null; //
  }
};

const normalizeIngredient = (ingredient) => ingredient.toLowerCase().trim(); //

const ingredientMatches = (searchIngredient, recipeIngredient) => { //
  const normalized = normalizeIngredient(searchIngredient); //
  const recipeNormalized = normalizeIngredient(recipeIngredient); //

  const strictExclusions = { //
    'butter': ['buttermilk', 'peanut butter', 'almond butter', 'butter beans', 'butterscotch', 'cocoa butter', 'shea butter'], //
    'milk': ['buttermilk', 'coconut milk', 'almond milk', 'oat milk', 'soy milk'], //
    'cream': ['ice cream', 'sour cream', 'whipped cream', 'cream cheese'], //
    'cheese': ['cream cheese', 'cottage cheese'], //
    'salt': ['seasoned salt', 'garlic salt', 'onion salt', 'sea salt'], //
    'sugar': ['brown sugar', 'powdered sugar', 'confectioners sugar', 'caster sugar'], //
    'sauce': ['soy sauce', 'fish sauce', 'hot sauce', 'worcestershire sauce', 'tomato sauce'], //
    'pepper': ['bell pepper', 'chili pepper', 'cayenne pepper'], //
    'bean': ['green bean', 'coffee bean', 'vanilla bean'], //
    'nut': ['peanut', 'coconut', 'donut', 'butternut'], //
    'wine': ['rice wine', 'cooking wine'], //
    'vinegar': ['balsamic vinegar', 'apple cider vinegar', 'rice vinegar', 'white vinegar'] //
  };

  if (strictExclusions[normalized]) { //
    for (const excluded of strictExclusions[normalized]) { //
      if (recipeNormalized.includes(excluded)) { //
        console.log(`🚫 Strict exclusion: "${normalized}" will NOT match "${recipeIngredient}" (contains "${excluded}")`); //
        return false; //
      }
    }
  }

  if (normalized.includes(' ')) { //
    if (recipeNormalized.includes(normalized)) { //
      console.log(`✅ Multi-word match: "${normalized}" found in "${recipeIngredient}"`); //
      return true; //
    }
  } else { //
    const escapedWord = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'i'); //
    if (regex.test(recipeNormalized)) { //
      console.log(`✅ Word boundary match: "${normalized}" found in "${recipeIngredient}"`); //
      return true; //
    }
  }

  const synonymMap = { //
    'chicken': ['chicken', 'poultry'], //
    'beef': ['beef', 'steak'], //
    'pork': ['pork', 'ham', 'bacon'], //
    'shrimp': ['shrimp', 'prawn'], //
    'pasta': ['pasta', 'noodle', 'spaghetti', 'penne', 'fettuccine', 'linguine', 'macaroni'], //
    'tomato': ['tomato', 'tomatoes'], //
    'potato': ['potato', 'potatoes'], //
    'onion': ['onion', 'onions'], //
    'rice': ['rice', 'basmati', 'jasmine rice'], //
    'flour': ['flour', 'all-purpose flour', 'wheat flour'], //
    'egg': ['egg', 'eggs'], //
    'milk': ['milk', 'whole milk'], //
    'salt': ['salt'] //
  };

  const synonyms = synonymMap[normalized] || []; //
  for (const synonym of synonyms) { //
    const escapedSynonym = synonym.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); //
    const synonymRegex = new RegExp(`\\b${escapedSynonym}\\b`, 'i'); //
    if (synonymRegex.test(recipeNormalized)) { //
      console.log(`✅ Synonym match: "${normalized}" matched via synonym "${synonym}" in "${recipeIngredient}"`); //
      return true; //
    }
  }

  const seasoningWords = ['powder', 'extract', 'essence', 'flavoring', 'seasoning', 'dried']; //
  for (const seasoning of seasoningWords) { //
    if (recipeNormalized.includes(`${normalized} ${seasoning}`) || //
        recipeNormalized.includes(`${seasoning} ${normalized}`)) { //
      console.log(`🚫 Seasoning exclusion: "${normalized}" will NOT match "${recipeIngredient}" (contains "${seasoning}")`); //
      return false; //
    }
  }

  return false; //
};

const calculateIngredientMatchScore = (searchIngredients, recipeIngredients) => { //
  if (!searchIngredients || searchIngredients.length === 0) return { //
    count: 0, //
    total: 0, //
    percentage: 0, //
    matched: [], //
    unmatched: [] //
  };

  let matchCount = 0; //
  const matchedIngredients = []; //
  const unmatchedIngredients = []; //

  for (const searchIng of searchIngredients) { //
    const matchingRecipeIngs = recipeIngredients.filter(recipeIng => //
      ingredientMatches(searchIng, recipeIng) //
    );
    
    if (matchingRecipeIngs.length > 0) { //
      matchCount++; //
      matchedIngredients.push({ //
        search: searchIng, //
        foundIn: matchingRecipeIngs[0] //
      });
    } else { //
      unmatchedIngredients.push(searchIng); //
    }
  }

  const matchPercentage = (matchCount / searchIngredients.length) * 100; //

  console.log(`🔍 Match calculation:`, { //
    searchIngredients, //
    matchCount, //
    total: searchIngredients.length, //
    percentage: matchPercentage.toFixed(1), //
    matched: matchedIngredients.map(m => `"${m.search}" → "${m.foundIn}"`), //
    unmatched: unmatchedIngredients //
  });

  return { //
    count: matchCount, //
    total: searchIngredients.length, //
    percentage: matchPercentage, //
    matched: matchedIngredients.map(m => m.search), //
    unmatched: unmatchedIngredients, //
    matchDetails: matchedIngredients //
  };
};

const calculateRelevanceScore = (recipe, searchIngredients, hasUsedIngredients = null) => { //
  const ingredientMatch = calculateIngredientMatchScore( //
    searchIngredients, //
    recipe.ingredients || [] //
  );

  let score = ingredientMatch.percentage; //

  if (hasUsedIngredients !== null) { //
    const usedPercentage = (hasUsedIngredients / searchIngredients.length) * 100; //
    score = Math.max(score, usedPercentage); //
  }

  if (ingredientMatch.count === searchIngredients.length) { //
    score += 20; //
  }

  if (ingredientMatch.percentage >= 80) { //
    score += 10; //
  } else if (ingredientMatch.percentage >= 60) { //
    score += 5; //
  }

  const totalIngredients = recipe.ingredients?.length || 0; //
  if (totalIngredients > 0 && totalIngredients <= 10) { //
    score += 5; //
  }

  if (recipe.readyInMinutes && recipe.readyInMinutes <= 30) { //
    score += 5; //
  } else if (recipe.readyInMinutes && recipe.readyInMinutes <= 45) { //
    score += 3; //
  }

  return { //
    score: Math.min(score, 150), //
    ingredientMatch //
  };
};

const mapFiltersToApiParams = (filters) => { //
  const apiParams = {}; //
  const clientFilters = []; //
  const intolerances = []; //
  const diets = []; //

  const dedupedFilters = Array.from(new Set((filters || []).map(f => String(f).toLowerCase().trim()))); //

  const dietMap = { //
    'vegan': 'vegan', //
    'vegetarian': 'vegetarian', //
    'pescatarian': 'pescatarian', //
    'keto': 'ketogenic', //
    'paleo': 'paleo', //
    'mediterranean': 'mediterranean', //
    'whole30': 'whole30' //
  };

  const intoleranceMap = { //
    'gluten-free': 'gluten', //
    'dairy-free': 'dairy', //
    'lactose-free': 'dairy', //
    'nut-free': 'tree nut', //
    'tree-nut-free': 'tree nut', //
    'peanut-free': 'peanut', //
    'soy-free': 'soy', //
    'egg-free': 'egg', //
    'shellfish-free': 'shellfish', //
    'fish-free': 'seafood' //
  };

  const nutritionFilters = { //
    'low-carb': { nutrient: 'carbs_g', max: 25 }, //
    'low-fat': { nutrient: 'fat_g', max: 10 }, //
    'low-sodium': { nutrient: 'sodium_mg', max: 400 }, //
    'sugar-free': { nutrient: 'sugar_g', max: 3 }, //
    'low-sugar': { nutrient: 'sugar_g', max: 8 }, //
    'diabetic-friendly': [ //
      { nutrient: 'sugar_g', max: 8 }, //
      { nutrient: 'carbs_g', max: 30 } //
    ]
  };

  dedupedFilters.forEach(filter => { //
    const normalized = filter.replace(/\s+/g, '-'); //

    if (dietMap[normalized]) { //
      diets.push(dietMap[normalized]); //
    }

    if (intoleranceMap[normalized]) { //
      intolerances.push(intoleranceMap[normalized]); //
    }

    if (nutritionFilters[normalized]) { //
      const conditions = nutritionFilters[normalized]; //
      if (Array.isArray(conditions)) { //
        conditions.forEach(cond => clientFilters.push({ name: filter, ...cond })); //
      } else { //
        clientFilters.push({ name: filter, ...conditions }); //
      }
    }
  });

  if (diets.length > 0) { //
    if (diets.includes('vegan')) { //
      apiParams.diet = 'vegan'; //
      console.log('🌱 Using vegan diet filter (most restrictive)'); //
    } else if (diets.includes('vegetarian')) { //
      apiParams.diet = 'vegetarian'; //
      console.log('🥗 Using vegetarian diet filter'); //
    } else { //
      apiParams.diet = diets[0]; //
      console.log(`🍽️ Using ${diets[0]} diet filter`); //
    }

    diets.forEach(diet => { //
      clientFilters.push({ name: diet, type: 'diet', value: diet }); //
    });

    console.log(`⚠️ Multiple diets detected: ${diets.join(', ')}`); //
    console.log(`📋 Will validate ALL diets client-side for strict matching`); //
  }

  if (intolerances.length > 0) { //
    apiParams.intolerances = intolerances.join(','); //
    console.log(`🚫 Applying intolerances: ${intolerances.join(', ')}`); //
  }

  return { apiParams, clientFilters }; //
};

const nutrientNameMap = { //
  'calories': 'Calories', //
  'protein_g': 'Protein', //
  'carbs_g': 'Carbohydrates', //
  'fat_g': 'Fat', //
  'fiber_g': 'Fiber', //
  'sugar_g': 'Sugar', //
  'sodium_mg': 'Sodium' //
};

const getNutritionValue = (recipe, nutrient) => { //
  if (!nutrient) return null; //

  if (recipe.nutritional_info && Object.prototype.hasOwnProperty.call(recipe.nutritional_info, nutrient)) { //
    const v = recipe.nutritional_info[nutrient]; //
    if (v !== undefined && v !== null) { //
      const parsed = parseFloat(v); //
      return isNaN(parsed) ? null : parsed; //
    }
  }

  const nutrientLabel = nutrientNameMap[nutrient]; //
  const rawNutrients = recipe.nutrition?.nutrients || recipe?.nutrients || []; //
  if (Array.isArray(rawNutrients) && nutrientLabel) { //
    const found = rawNutrients.find(n => String(n.name).toLowerCase() === nutrientLabel.toLowerCase()); //
    if (found && (found.amount !== undefined && found.amount !== null)) { //
      const parsed = parseFloat(found.amount); //
      return isNaN(parsed) ? null : parsed; //
    }
  }

  return null; //
};

const passesNutritionFilters = (recipe, clientFilters) => { //
  if (!clientFilters || clientFilters.length === 0) return true; //

  const recipeTags = Array.isArray(recipe.tags) //
    ? recipe.tags.map(t => String(t).toLowerCase().replace(/[-\s]/g, '')) //
    : []; //

  for (const filter of clientFilters) { //
    if (filter.type === 'diet') { //
      const dietNorm = filter.value.toLowerCase().replace(/[-\s]/g, ''); //
      const hasDiet = recipeTags.includes(dietNorm); //

      if (!hasDiet) { //
        console.log(`❌ Recipe "${recipe.title}" rejected: missing diet tag "${filter.value}"`); //
        return false; //
      }
      continue; //
    }

    const value = getNutritionValue(recipe, filter.nutrient); //

    if (value === null) { //
      console.log(`❌ Recipe "${recipe.title}" rejected: ${filter.nutrient} data missing`); //
      return false; //
    }

    if (filter.max !== undefined && value > filter.max) { //
      console.log(`❌ Recipe "${recipe.title}" rejected: ${filter.nutrient}=${value} > max ${filter.max}`); //
      return false; //
    }
    if (filter.min !== undefined && value < filter.min) { //
      console.log(`❌ Recipe "${recipe.title}" rejected: ${filter.nutrient}=${value} < min ${filter.min}`); //
      return false; //
    }
  }

  return true; //
};

const extractRecipeFromSearchResult = (recipe) => { //
  const nutritionData = recipe.nutrition?.nutrients || []; //

  const parsedNutrition = { //
    calories: nutritionData.find(n => n.name === 'Calories')?.amount || 0, //
    protein_g: nutritionData.find(n => n.name === 'Protein')?.amount || 0, //
    carbs_g: nutritionData.find(n => n.name === 'Carbohydrates')?.amount || 0, //
    fat_g: nutritionData.find(n => n.name === 'Fat')?.amount || 0, //
    fiber_g: nutritionData.find(n => n.name === 'Fiber')?.amount || 0, //
    sugar_g: nutritionData.find(n => n.name === 'Sugar')?.amount || 0, //
    sodium_mg: nutritionData.find(n => n.name === 'Sodium')?.amount || 0 //
  };

  return { //
    id: `spoon-${recipe.id}`, //
    title: recipe.title, //
    image: recipe.image, //
    ingredients: recipe.extendedIngredients?.map(ing => ing.original) || //
      recipe.missedIngredients?.map(ing => ing.original) || [], //
    instructions: extractInstructions(recipe), //
    nutrition: formatNutritionSimple(parsedNutrition), //
    nutritional_info: parsedNutrition, //
    tags: recipe.diets || [], //
    source: 'Spoonacular', //
    readyInMinutes: recipe.readyInMinutes, //
    servings: recipe.servings, //
    sourceUrl: recipe.sourceUrl, //
    usedIngredientCount: recipe.usedIngredientCount || 0, //
    missedIngredientCount: recipe.missedIngredientCount || 0 //
  };
};

export const complexRecipeSearch = async ( //
  ingredients, //
  filters = [], //
  maxResults = 200, //
  description = '', //
  onProgressUpdate = null, //
  fetchFullDetails = true //
) => {
  try { //
    if (!ingredients || ingredients.length === 0) return { success: true, data: [] }; //

    const ingredientsString = ingredients.map(ing => ing.trim()).join(','); //
    const { apiParams, clientFilters } = mapFiltersToApiParams(filters); //
    const hasNutritionFilters = clientFilters.some(f => f.nutrient); //
    const hasDietFilters = clientFilters.some(f => f.type === 'diet'); //

    const startTime = Date.now(); //
    console.log(`🔎 Starting search for recipes with at least ${ingredients.length - 2} matching ingredients...`); //

    const batchSize = CONFIG.BATCH_SIZE; //
    const targetRecipes = hasNutritionFilters || hasDietFilters //
      ? Math.min(maxResults, CONFIG.MAX_RECIPES_NO_FILTERS) //
      : Math.min(maxResults, CONFIG.MAX_RECIPES_NO_FILTERS); //
    const numBatches = Math.ceil(targetRecipes / batchSize); //
    let apiPointsUsed = 0; //
    let allValidatedRecipes = []; //
    let processedIds = new Set(); //

    for (let batch = 0; batch < numBatches; batch++) { //
      const params = { //
        ingredients: ingredientsString, //
        ranking: 1,
        number: batchSize, //
        offset: batch * batchSize, //
        addRecipeInformation: true, //
        fillIngredients: true, //
        addRecipeNutrition: true, //
        addRecipeInstructions: true, //
        instructionsRequired: false, //
        ignorePantry: true, //
        sort: 'max-used-ingredients', //
        ...apiParams //
      };

      console.log(`🔎 Batch ${batch + 1}/${numBatches}...`); //

      try { //
        const response = await makeApiRequest(`${BASE_URL}/complexSearch`, params); //
        apiPointsUsed++; //

        if (!response.data.results || response.data.results.length === 0) { //
          console.log(`⚠️ Batch ${batch + 1}: No more results from API.`); //
          break; //
        }

        console.log(`✔ Batch ${batch + 1}: Received ${response.data.results.length} initial recipes.`); //

        const recipesToProcess = response.data.results.filter(recipe => !processedIds.has(recipe.id)); //

        const batchRecipes = [];
        for (const recipe of recipesToProcess) { //
          processedIds.add(recipe.id); //
          const extractedRecipe = extractRecipeFromSearchResult(recipe); //
          batchRecipes.push(extractedRecipe);
        }

        // ### CHANGE: This filter is now more flexible ###
        const validatedInBatch = batchRecipes.filter(recipe => {
          const matchInfo = calculateIngredientMatchScore(ingredients, recipe.ingredients);
          // Allow recipes that are missing up to 2 ingredients, but must have at least one match.
          return matchInfo.count >= ingredients.length - 2 && matchInfo.count > 0;
        });

        if (validatedInBatch.length > 0) { //
          console.log(`✅ Found ${validatedInBatch.length} valid matches in this batch.`); //
          
          const recipesWithScores = validatedInBatch
            .map(recipe => {
              const relevance = calculateRelevanceScore(recipe, ingredients);
              return {
                ...recipe,
                matchingIngredients: relevance.ingredientMatch.count,
                matchPercentage: relevance.ingredientMatch.percentage,
                relevanceScore: relevance.score,
                matchedIngredientsList: relevance.ingredientMatch.matched,
                unmatchedIngredientsList: relevance.ingredientMatch.unmatched,
              };
            })
            .filter(recipe => {
              if (clientFilters.length > 0) {
                return passesNutritionFilters(recipe, clientFilters);
              }
              return true;
            });

          allValidatedRecipes.push(...recipesWithScores); //

          if (onProgressUpdate) { //
            onProgressUpdate([...allValidatedRecipes]); //
          }
        }

        if (allValidatedRecipes.length >= targetRecipes) { //
          console.log(`✅ Reached target of ${targetRecipes} recipes, stopping search.`); //
          break; //
        }

        if (batch < numBatches - 1) { //
          await delay(CONFIG.BATCH_DELAY); //
        }
      } catch (error) { //
        console.error(`❌ Batch ${batch + 1} failed:`, error.message); //
        break; //
      }
    }

    // ### CHANGE: This sorting is now more important with partial matches ###
    allValidatedRecipes.sort((a, b) => {
      // Primary sort: Number of matching ingredients (highest first)
      if (b.matchingIngredients !== a.matchingIngredients) {
        return b.matchingIngredients - a.matchingIngredients;
      }
      // Secondary sort: Relevance score (highest first)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      // Final tiebreaker: Cooking time (shorter is better)
      const timeA = a.readyInMinutes || 999;
      const timeB = b.readyInMinutes || 999;
      return timeA - timeB;
    });

    console.log('\n🏆 TOP 5 RECIPES BY RELEVANCE:'); //
    allValidatedRecipes.slice(0, 5).forEach((recipe, idx) => { //
      console.log(`${idx + 1}. "${recipe.title}"`); //
      console.log(`   - Relevance Score: ${Math.round(recipe.relevanceScore)}/150`); //
      console.log(`   - Ingredient Match: ${recipe.matchingIngredients}/${ingredients.length} (${Math.round(recipe.matchPercentage)}%)`); //
      console.log(`   - Ready in: ${recipe.readyInMinutes || 'N/A'} min`); //
    });

    const endTime = Date.now(); //
    const duration = ((endTime - startTime) / 1000).toFixed(2); //

    console.log(`\n${'='.repeat(60)}`); //
    console.log(`✅ FLEXIBLE MATCH SEARCH COMPLETE`); //
    console.log(`${'='.repeat(60)}`); //
    console.log(`📊 Results: ${allValidatedRecipes.length} recipes found`); //
    console.log(`🎯 Sorted by: Match Count → Relevance Score → Cook Time`); //
    console.log(`💰 API Cost: ${apiPointsUsed} points`); //
    console.log(`⏱️ Duration: ${duration}s`); //
    console.log(`📉 Remaining: ${rateLimitInfo.requestsRemaining || 'Unknown'} requests`); //
    if (rateLimitInfo.resetTime) { //
      const resetDate = new Date(parseInt(rateLimitInfo.resetTime) * 1000); //
      console.log(`🔄 Resets: ${resetDate.toLocaleString()}`); //
    }
    console.log(`${'='.repeat(60)}\n`); //

    return { success: true, data: allValidatedRecipes, apiPointsUsed }; //
  } catch (error) { //
    console.error('Search error:', error); //
    return { //
      success: false, //
      error: error.message || 'Failed to search recipes' //
    };
  }
};

export const preserveMatchCounts = (recipes) => { //
  return recipes.map(recipe => { //
    if (recipe._originalMatchData) { //
      return { //
        ...recipe, //
        matchingIngredients: recipe._originalMatchData.count, //
        matchPercentage: recipe._originalMatchData.percentage, //
        matchedIngredientsList: recipe._originalMatchData.matched, //
        unmatchedIngredientsList: recipe._originalMatchData.unmatched //
      };
    }
    return recipe; //
  });
};

export const validateIngredientMatching = (searchIngredients, recipe) => { //
  console.log('\n🧪 VALIDATION TEST'); //
  console.log('━'.repeat(60)); //
  console.log('Search Ingredients:', searchIngredients); //
  console.log('Recipe Ingredients:', recipe.ingredients); //
  console.log('━'.repeat(60)); //
  
  const result = calculateIngredientMatchScore(searchIngredients, recipe.ingredients); //
  
  console.log('\n📊 RESULTS:'); //
  console.log(`✅ Matched (${result.count}/${result.total}):`, result.matched); //
  console.log(`❌ Not Found (${result.unmatched.length}):`, result.unmatched); //
  console.log(`📈 Match Rate: ${result.percentage.toFixed(1)}%`); //
  
  if (result.matchDetails) { //
    console.log('\n🔍 DETAILED MATCHES:'); //
    result.matchDetails.forEach(m => { //
      console.log(`  "${m.search}" found in: "${m.foundIn}"`); //
    });
  }
  
  console.log('━'.repeat(60)); //
  
  return result; //
};

export const runMatchingTests = () => { //
  console.log('\n🧪 RUNNING INGREDIENT MATCHING TESTS\n'); //
  
  const testCases = [ //
    { //
      name: 'Exact Match', //
      search: ['chicken', 'rice', 'tomato'], //
      recipe: ['chicken breast', 'white rice', 'diced tomatoes'], //
      expectedMatches: 3 //
    },
    { //
      name: 'Partial Match', //
      search: ['chicken', 'rice', 'broccoli'], //
      recipe: ['chicken breast', 'white rice', 'carrots'], //
      expectedMatches: 2 //
    },
    { //
      name: 'No Match', //
      search: ['beef', 'pasta', 'cheese'], //
      recipe: ['chicken breast', 'white rice', 'tomatoes'], //
      expectedMatches: 0 //
    },
    { //
      name: 'Complex Ingredients', //
      search: ['chicken breast', 'olive oil'], //
      recipe: ['boneless chicken breast', 'extra virgin olive oil', 'salt'], //
      expectedMatches: 2 //
    },
    { //
      name: 'False Positive Test (Powder)', //
      search: ['garlic'], //
      recipe: ['garlic powder', 'onion', 'salt'], //
      expectedMatches: 0 //
    },
    { //
      name: 'Synonym Match', //
      search: ['shrimp', 'pasta'], //
      recipe: ['prawns', 'spaghetti', 'garlic'], //
      expectedMatches: 2 //
    },
    { //
      name: 'Word Boundary Test', //
      search: ['ham'], //
      recipe: ['graham crackers', 'milk', 'sugar'], //
      expectedMatches: 0 //
    },
    { //
      name: 'Multi-word Ingredient', //
      search: ['chicken breast', 'soy sauce'], //
      recipe: ['boneless skinless chicken breast', 'low sodium soy sauce', 'ginger'], //
      expectedMatches: 2 //
    },
    { //
      name: 'Strict Butter Test', //
      search: ['butter'], //
      recipe: ['unsalted butter', 'flour', 'sugar'], //
      expectedMatches: 1 //
    },
    { //
      name: 'Butter vs Buttermilk', //
      search: ['butter'], //
      recipe: ['buttermilk', 'flour', 'baking soda'], //
      expectedMatches: 0 //
    },
    { //
      name: 'Butter vs Peanut Butter', //
      search: ['butter'], //
      recipe: ['peanut butter', 'bread', 'jelly'], //
      expectedMatches: 0 //
    },
    { //
      name: 'Multiple Ingredients - All Match', //
      search: ['chicken', 'rice', 'garlic', 'onion'], //
      recipe: ['chicken breast', 'white rice', 'minced garlic', 'diced onion', 'soy sauce'], //
      expectedMatches: 4 //
    },
    { //
      name: 'Multiple Ingredients - Partial Match', //
      search: ['chicken', 'rice', 'broccoli', 'carrot'], //
      recipe: ['chicken thigh', 'brown rice', 'bell pepper', 'snow peas'], //
      expectedMatches: 2 //
    },
    { //
      name: 'Milk vs Buttermilk', //
      search: ['milk'], //
      recipe: ['whole milk', 'eggs', 'vanilla'], //
      expectedMatches: 1 //
    },
    { //
      name: 'Milk Should Not Match Buttermilk', //
      search: ['milk'], //
      recipe: ['buttermilk', 'flour', 'sugar'], //
      expectedMatches: 0 //
    }
  ];
  
  let passed = 0; //
  let failed = 0; //
  
  testCases.forEach((test, index) => { //
    console.log(`\nTest ${index + 1}: ${test.name}`); //
    console.log('─'.repeat(50)); //
    
    const result = calculateIngredientMatchScore(test.search, test.recipe); //
    const success = result.count === test.expectedMatches; //
    
    if (success) { //
      console.log(`✅ PASS - Expected ${test.expectedMatches}, Got ${result.count}`); //
      passed++; //
    } else { //
      console.log(`❌ FAIL - Expected ${test.expectedMatches}, Got ${result.count}`); //
      console.log(`   Matched: ${result.matched.join(', ') || 'none'}`); //
      console.log(`   Unmatched: ${result.unmatched.join(', ') || 'none'}`); //
      failed++; //
    }
  });
  
  console.log('\n' + '='.repeat(60)); //
  console.log(`TEST SUMMARY: ${passed} passed, ${failed} failed`); //
  console.log('='.repeat(60)); //
  
  return { passed, failed, total: testCases.length }; //
};

export {  //
  ingredientMatches,  //
  getRateLimitInfo,  //
  calculateIngredientMatchScore,  //
  calculateRelevanceScore  //
};

const apiService = { //
  getRecipeDetails, //
  complexRecipeSearch, //
  ingredientMatches, //
  getRateLimitInfo, //
  calculateIngredientMatchScore, //
  calculateRelevanceScore, //
  preserveMatchCounts, //
  validateIngredientMatching, //
  runMatchingTests //
};

export default apiService;