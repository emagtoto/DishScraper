// localRecipeService.js - ENHANCED: Advanced scoring system for thousands of recipes
import localRecipes from "../data/recipes_meta.json";
import { filterRecipesByDescription } from "./descriptionFilterService";

 // Robust nutrition extraction with proper null handling
const getNumericNutrition = (recipe, nutrient) => {
  if (!recipe?.nutritional_info) return null;
  const value = recipe.nutritional_info[nutrient];
  if (value === undefined || value === null) return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

/**
 * Advanced ingredient matching with word boundaries
 * Prevents false positives like "chicken" matching "chicken powder"
 */
const ingredientMatches = (searchIngredient, recipeIngredient) => {
  const normalized = searchIngredient.toLowerCase().trim();
  const recipeNormalized = recipeIngredient.toLowerCase().trim();

  // Direct substring match for phrases (e.g., "chicken breast")
  if (normalized.includes(' ')) {
    return recipeNormalized.includes(normalized);
  }

  // Single-word match using word boundaries
  const escapedWord = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
  if (regex.test(recipeNormalized)) return true;

  // Exclude seasoning forms (these don't count as actual ingredients)
  const seasoningWords = ['powder', 'extract', 'essence', 'flavoring'];
  for (const seasoning of seasoningWords) {
    if (recipeNormalized.includes(`${normalized} ${seasoning}`)) {
      return false;
    }
  }

  return false;
};

 // Scores recipes from 0-150 based on multiple factors
const calculateLocalRelevanceScore = (recipe, searchIngredients) => {
  const recipeIngredients = recipe.ingredients || [];
  
  // Count matches and track which ingredients matched
  let matchCount = 0;
  const matchedList = [];
  
  for (const searchIng of searchIngredients) {
    const hasMatch = recipeIngredients.some(recipeIng => 
      ingredientMatches(searchIng, recipeIng)
    );
    if (hasMatch) {
      matchCount++;
      matchedList.push(searchIng);
    }
  }
  
  // Calculate match percentage
  const matchPercentage = searchIngredients.length > 0 
    ? (matchCount / searchIngredients.length) * 100 
    : 0;
  
  // Base score from percentage (0-100)
  let score = matchPercentage;
  
  // Perfect match (uses ALL searched ingredients)
  if (matchCount === searchIngredients.length && searchIngredients.length > 0) {
    score += 20;
  }
  
  // High percentage matches
  if (matchPercentage >= 80) {
    score += 10;
  } else if (matchPercentage >= 60) {
    score += 5;
  }
  
  // Simple recipes (fewer ingredients = easier to make)
  const totalIngredients = recipeIngredients.length;
  if (totalIngredients > 0 && totalIngredients <= 8) {
    score += 8;
  } else if (totalIngredients <= 12) {
    score += 4;
  }
  
  return {
    score: Math.min(score, 150), // Cap at 150
    matchCount,
    matchPercentage,
    matchedList
  };
};

 // Proper multi-filter support with diet hierarchy and ALL filter validation
const applyDietaryFilters = (recipes, filters) => {
  if (!filters || filters.length === 0) return recipes;

  console.log(` Applying ${filters.length} filters:`, filters);

  return recipes.filter(recipe => {
    const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
    const tagsLower = tags.map(t => String(t).toLowerCase().replace(/[-\s]/g, ''));
    
    // ALL filters must pass (use .every())
    const passesAllFilters = filters.every(filter => {
      const filterNorm = filter.toLowerCase().replace(/[-\s]/g, '');
      
      // Quick tag match (most common case)
      if (tagsLower.includes(filterNorm)) return true;

      // DIET HIERARCHY: Handle overlapping diets correctly
      switch (filterNorm) {
        // Vegan is most restrictive - must have vegan tag
        case 'vegan':
          return tagsLower.includes('vegan');
        
        // Vegetarian allows vegan OR vegetarian
        case 'vegetarian':
          return tagsLower.includes('vegetarian') || tagsLower.includes('vegan');
        
        case 'pescatarian':
          return tagsLower.includes('pescatarian');
        
        case 'keto':
        case 'ketogenic':
          return tagsLower.includes('keto');
        
        case 'paleo':
        case 'paleolithic':
          return tagsLower.includes('paleo');
        
        case 'mediterranean':
          return tagsLower.includes('mediterranean');
        
        case 'whole30':
          return tagsLower.includes('whole30');
        
        case 'halal':
          return tagsLower.includes('halal');
        
        case 'kosher':
          return tagsLower.includes('kosher');

        // Allergen-free filters
        case 'glutenfree':
          return tagsLower.includes('glutenfree');
        
        case 'dairyfree':
          return tagsLower.includes('dairyfree');
        
        case 'lactosefree':
          return tagsLower.includes('lactosefree') || tagsLower.includes('dairyfree');
        
        case 'nutfree':
          return tagsLower.includes('nutfree');
        
        case 'peanutfree':
          return tagsLower.includes('peanutfree');
        
        case 'treenutfree':
          return tagsLower.includes('treenutfree');
        
        case 'soyfree':
          return tagsLower.includes('soyfree');
        
        case 'eggfree':
          return tagsLower.includes('eggfree');
        
        case 'shellfishfree':
          return tagsLower.includes('shellfishfree');
        
        case 'alcoholfree':
          return tagsLower.includes('alcoholfree');

        // Nutrition-based filters with strict thresholds
        case 'lowcarb': {
          const carbs = getNumericNutrition(recipe, 'carbs_g');
          // If no data, check tags; if has data, must be ≤25g
          if (carbs === null) {
            return tagsLower.includes('keto') || tagsLower.includes('lowcarb');
          }
          const passes = carbs <= 25;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: carbs=${carbs}g (limit: 25g)`);
          }
          return passes;
        }
        
        case 'lowfat': {
          const fat = getNumericNutrition(recipe, 'fat_g');
          if (fat === null) {
            return tagsLower.includes('lowfat');
          }
          const passes = fat <= 10;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: fat=${fat}g (limit: 10g)`);
          }
          return passes;
        }
        
        case 'lowsodium': {
          const sodium = getNumericNutrition(recipe, 'sodium_mg');
          if (sodium === null) {
            return tagsLower.includes('lowsodium');
          }
          const passes = sodium <= 400;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: sodium=${sodium}mg (limit: 400mg)`);
          }
          return passes;
        }
        
        case 'sugarfree': {
          const sugar = getNumericNutrition(recipe, 'sugar_g');
          if (sugar === null) {
            return tagsLower.includes('sugarfree');
          }
          const passes = sugar <= 3;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: sugar=${sugar}g (limit: 3g)`);
          }
          return passes;
        }
        
        case 'lowsugar': {
          const sugar = getNumericNutrition(recipe, 'sugar_g');
          if (sugar === null) {
            return tagsLower.includes('sugarfree') || tagsLower.includes('lowsugar');
          }
          const passes = sugar <= 8;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: sugar=${sugar}g (limit: 8g)`);
          }
          return passes;
        }
        
        case 'diabeticfriendly': {
          const sugar = getNumericNutrition(recipe, 'sugar_g');
          const carbs = getNumericNutrition(recipe, 'carbs_g');
          
          // If no data, check tags
          if (sugar === null && carbs === null) {
            return tagsLower.includes('diabeticfriendly') || tagsLower.includes('sugarfree');
          }
          
          // Strict thresholds - sugar ≤8g, carbs ≤30g
          const sugarOk = sugar === null || sugar <= 8;
          const carbsOk = carbs === null || carbs <= 30;
          const passes = sugarOk && carbsOk;
          
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: sugar=${sugar}g (limit: 8g), carbs=${carbs}g (limit: 30g)`);
          }
          return passes;
        }

        // Other health filters
        case 'lowcalorie': {
          const calories = getNumericNutrition(recipe, 'calories');
          if (calories === null) {
            return tagsLower.includes('lowcalorie');
          }
          const passes = calories <= 300;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: calories=${calories} (limit: 300)`);
          }
          return passes;
        }

        case 'highprotein': {
          const protein = getNumericNutrition(recipe, 'protein_g');
          if (protein === null) {
            return tagsLower.includes('highprotein');
          }
          const passes = protein >= 20;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: protein=${protein}g (minimum: 20g)`);
          }
          return passes;
        }

        case 'highfiber': {
          const fiber = getNumericNutrition(recipe, 'fiber_g');
          if (fiber === null) {
            return tagsLower.includes('highfiber');
          }
          const passes = fiber >= 5;
          if (!passes) {
            console.log(` Recipe "${recipe.title}" rejected: fiber=${fiber}g (minimum: 5g)`);
          }
          return passes;
        }

        case 'fodmapfriendly':
          return tagsLower.includes('fodmapfriendly');

        default:
          // Fallback: check if filter appears anywhere in tags
          return tagsLower.some(t => t.includes(filterNorm));
      }
    });

    // Log results for debugging
    if (passesAllFilters) {
      console.log(` Recipe "${recipe.title}" passed ALL ${filters.length} filters`);
    } else {
      console.log(` Recipe "${recipe.title}" failed at least one filter`);
    }

    return passesAllFilters;
  });
};

/**
 * 🔥 ENHANCED: Fast local recipe search with advanced relevance scoring
 */
export const searchLocalRecipes = async (
  selectedIngredients,
  selectedFilters = [],
  description = ''
) => {
  try {
    console.log('🔍 Starting local recipe search with advanced scoring...');
    console.time('localSearch');

    // Step 1: Calculate advanced relevance scores for all matching recipes
    const ingredientFiltered = localRecipes.reduce((acc, recipe) => {
      const relevance = calculateLocalRelevanceScore(recipe, selectedIngredients);
      
      if (relevance.matchCount > 0) {
        acc.push({
          ...recipe,
          matchingIngredients: relevance.matchCount,
          matchPercentage: relevance.matchPercentage,
          matchedIngredientsList: relevance.matchedList,
          relevanceScore: relevance.score,
          // Store for restoration after AI filtering
          _originalMatchData: {
            matchingIngredients: relevance.matchCount,
            matchPercentage: relevance.matchPercentage,
            matchedIngredientsList: relevance.matchedList,
            relevanceScore: relevance.score
          }
        });
      }
      return acc;
    }, []);

    console.log(` Found ${ingredientFiltered.length} recipes with matching ingredients`);

    // Step 2: Apply dietary filters (FIXED - now supports multiple filters properly)
    const beforeFilterCount = ingredientFiltered.length;
    const dietaryFiltered = selectedFilters.length > 0
      ? applyDietaryFilters(ingredientFiltered, selectedFilters)
      : ingredientFiltered;

    console.log(` ${dietaryFiltered.length}/${beforeFilterCount} recipes passed ALL ${selectedFilters.length} dietary filters`);
    if (selectedFilters.length > 0 && dietaryFiltered.length < beforeFilterCount) {
      console.log(` Filtered out ${beforeFilterCount - dietaryFiltered.length} recipes that didn't meet ALL criteria`);
    }

    // Step 3: ENHANCED SORTING: Multi-level prioritization
    dietaryFiltered.sort((a, b) => {
      // Primary sort: Relevance score (highest first)
      if (Math.abs(b.relevanceScore - a.relevanceScore) > 5) {
        return b.relevanceScore - a.relevanceScore;
      }

      // Secondary sort: Match percentage
      if (Math.abs(b.matchPercentage - a.matchPercentage) > 10) {
        return b.matchPercentage - a.matchPercentage;
      }

      // Tertiary sort: Absolute number of matching ingredients
      if (b.matchingIngredients !== a.matchingIngredients) {
        return b.matchingIngredients - a.matchingIngredients;
      }

      // Keep current order (stable sort)
      return 0;
    });

    // Log top results for debugging
    console.log(' TOP 5 LOCAL RECIPES BY RELEVANCE:');
    dietaryFiltered.slice(0, 5).forEach((recipe, idx) => {
      console.log(`${idx + 1}. "${recipe.title}"`);
      console.log(`   - Relevance Score: ${Math.round(recipe.relevanceScore)}/150`);
      console.log(`   - Ingredient Match: ${recipe.matchingIngredients}/${selectedIngredients.length} (${Math.round(recipe.matchPercentage)}%)`);
      console.log(`   - Matched: ${recipe.matchedIngredientsList.join(', ')}`);
    });

    // Step 4: Apply description filter if provided
    let filteredLocal = dietaryFiltered;
    if (description?.trim() && dietaryFiltered.length > 0) {
      console.log(' Applying description filter...');
      
      // CRITICAL: Store ALL match data before filtering
      const matchDataMap = new Map(
        dietaryFiltered.map(r => [r.id, {
          matchingIngredients: r.matchingIngredients,
          matchPercentage: r.matchPercentage,
          matchedIngredientsList: r.matchedIngredientsList,
          relevanceScore: r.relevanceScore,
          _originalMatchData: r._originalMatchData
        }])
      );
      
      filteredLocal = await filterRecipesByDescription(dietaryFiltered, description);
      
      // CRITICAL: Restore ALL match data after filtering
      filteredLocal = filteredLocal.map(recipe => ({
        ...recipe,
        ...matchDataMap.get(recipe.id)
      }));
      
      console.log(`${filteredLocal.length} recipes matched description`);
    }

    console.timeEnd('localSearch');
    console.log(`Local search complete: ${filteredLocal.length} recipes found (with advanced scoring)`);
    return filteredLocal;

  } catch (error) {
    console.error('Error searching local recipes:', error);
    return [];
  }
};

/**
 * Get a single local recipe by ID
 */
export const getLocalRecipeById = (recipeId) => {
  return localRecipes.find(recipe => recipe.id === recipeId) || null;
};

/**
 * Get all local recipes
 */
export const getAllLocalRecipes = () => {
  return localRecipes;
};

/**
 * OPTIMIZED: Fisher-Yates shuffle for random recipes
 */
export const getRandomLocalRecipes = (count = 5) => {
  const arr = [...localRecipes];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, count);
};

 // Export scoring function for consistency with API service
export const calculateIngredientMatchScore = calculateLocalRelevanceScore;

const localRecipeService = {
  searchLocalRecipes,
  getLocalRecipeById,
  getAllLocalRecipes,
  getRandomLocalRecipes,
  calculateIngredientMatchScore
};

export default localRecipeService;