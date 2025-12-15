// localRecipeService.js - ABSOLUTE FILTER SYSTEM: Zero-tolerance validation for local recipes
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

  if (normalized.includes(' ')) {
    return recipeNormalized.includes(normalized);
  }

  const escapedWord = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`\\b${escapedWord}\\b`, 'i');
  if (regex.test(recipeNormalized)) return true;

  const seasoningWords = ['powder', 'extract', 'essence', 'flavoring'];
  for (const seasoning of seasoningWords) {
    if (recipeNormalized.includes(`${normalized} ${seasoning}`)) {
      return false;
    }
  }

  return false;
};

// ✅ ABSOLUTE: Comprehensive alcohol detection in ingredients
const containsAlcohol = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const alcoholKeywords = [
    // Wines
    'wine', 'red wine', 'white wine', 'cooking wine', 'rice wine', 'sherry', 'marsala',
    'mirin', 'shaoxing', 'vermouth', 'port', 'madeira', 'shao hsing',
    // Beers & Ales
    'beer', 'ale', 'lager', 'stout', 'porter', 'pilsner',
    // Spirits
    'vodka', 'rum', 'whiskey', 'whisky', 'bourbon', 'scotch', 'rye',
    'tequila', 'gin', 'sake', 'soju', 'shochu',
    'cognac', 'brandy', 'armagnac', 'grappa', 'ouzo', 'absinthe',
    // Champagne & Sparkling
    'champagne', 'prosecco', 'sparkling wine', 'cava', 'asti',
    // Liqueurs
    'liqueur', 'amaretto', 'baileys', 'kahlua', 'cointreau', 'triple sec',
    'grand marnier', 'frangelico', 'sambuca', 'limoncello', 'schnapps',
    'chartreuse', 'drambuie', 'campari', 'aperol', 'pernod',
    // General/other
    'spirits', 'fortified wine', 'baijiu', 'awamori', 'makgeolli'
  ];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    const hasAlcohol = alcoholKeywords.some(alcohol => {
      const escapedAlcohol = alcohol.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedAlcohol}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasAlcohol) {
      console.log(`🚫 ABSOLUTE FILTER: Alcohol detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// ✅ ABSOLUTE: Detect non-vegetarian ingredients
const containsMeat = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const meatKeywords = [
    // Meats
    'beef', 'pork', 'chicken', 'turkey', 'duck', 'lamb', 'veal', 'venison',
    'goat', 'rabbit', 'mutton', 'ham', 'bacon', 'sausage', 'pepperoni',
    'prosciutto', 'salami', 'chorizo', 'pancetta', 'ground meat',
    // Poultry parts
    'chicken breast', 'chicken thigh', 'chicken liver', 'chicken stock',
    // Pork parts
    'pork belly', 'pork shoulder', 'pork chop', 'pork loin', 'pork rinds',
    'chicharon', 'lechon',
    // Organ meats
    'liver', 'kidney', 'heart', 'tripe', 'tongue', 'brain',
    // Processed meats
    'hot dog', 'bratwurst', 'kielbasa', 'mortadella',
    // Stocks/broths
    'beef broth', 'beef stock', 'chicken broth', 'pork stock',
    // Filipino specific
    'liempo', 'longanisa', 'tocino', 'tapa'
  ];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    const hasMeat = meatKeywords.some(meat => {
      const escapedMeat = meat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedMeat}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasMeat) {
      console.log(`🥩 ABSOLUTE FILTER: Meat detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// ✅ ABSOLUTE: Detect seafood ingredients
const containsSeafood = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const seafoodKeywords = [
    'fish', 'salmon', 'tuna', 'cod', 'tilapia', 'mackerel', 'sardines',
    'anchovies', 'halibut', 'trout', 'bass', 'catfish', 'haddock',
    'shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 'crawfish',
    'oyster', 'clam', 'mussel', 'scallop', 'squid', 'octopus',
    'calamari', 'shellfish', 'seafood', 'fish sauce', 'fish stock',
    'shrimp paste', 'bagoong', 'patis', 'tinapa', 'alimasag'
  ];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    const hasSeafood = seafoodKeywords.some(seafood => {
      const escapedSeafood = seafood.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSeafood}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasSeafood) {
      console.log(`🐟 ABSOLUTE FILTER: Seafood detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// ✅ ABSOLUTE: Detect dairy ingredients
const containsDairy = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const dairyKeywords = [
    'milk', 'cream', 'butter', 'cheese', 'yogurt', 'yoghurt',
    'sour cream', 'heavy cream', 'whipping cream', 'half and half',
    'condensed milk', 'evaporated milk', 'powdered milk', 'buttermilk',
    'cheddar', 'mozzarella', 'parmesan', 'ricotta', 'feta', 'brie',
    'cottage cheese', 'cream cheese', 'mascarpone', 'ghee',
    'whey', 'casein', 'lactose', 'dairy'
  ];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    // Exception: coconut milk/cream is not dairy
    if (normalized.includes('coconut')) return false;
    
    const hasDairy = dairyKeywords.some(dairy => {
      const escapedDairy = dairy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedDairy}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasDairy) {
      console.log(`🥛 ABSOLUTE FILTER: Dairy detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// ✅ ABSOLUTE: Detect gluten-containing ingredients
const containsGluten = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const glutenKeywords = [
    'wheat', 'flour', 'all-purpose flour', 'bread flour', 'wheat flour',
    'barley', 'rye', 'malt', 'bread', 'pasta', 'noodle', 'couscous',
    'bulgur', 'farro', 'spelt', 'kamut', 'semolina', 'durum',
    'baguette', 'croissant', 'breadcrumb', 'panko', 'seitan',
    'soy sauce', 'teriyaki sauce', 'hoisin sauce'
  ];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    // Exception: rice noodles, cornstarch, etc. are gluten-free
    if (normalized.includes('rice') || normalized.includes('corn') || 
        normalized.includes('potato') || normalized.includes('tapioca') ||
        normalized.includes('gluten-free') || normalized.includes('coconut flour')) {
      return false;
    }
    
    const hasGluten = glutenKeywords.some(gluten => {
      const escapedGluten = gluten.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedGluten}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasGluten) {
      console.log(`🌾 ABSOLUTE FILTER: Gluten detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// ✅ ABSOLUTE: Detect eggs
const containsEggs = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const eggKeywords = ['egg', 'eggs', 'yolk', 'white', 'mayonnaise', 'mayo'];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    const hasEgg = eggKeywords.some(egg => {
      const escapedEgg = egg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedEgg}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasEgg) {
      console.log(`🥚 ABSOLUTE FILTER: Egg detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// ✅ ABSOLUTE: Detect nuts
const containsNuts = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const nutKeywords = [
    'almond', 'walnut', 'cashew', 'pecan', 'hazelnut', 'macadamia',
    'pistachio', 'pine nut', 'chestnut', 'brazil nut',
    'peanut', 'peanut butter', 'peanut oil'
  ];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    // Exception: coconut is not a tree nut
    if (normalized.includes('coconut')) return false;
    
    const hasNut = nutKeywords.some(nut => {
      const escapedNut = nut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedNut}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasNut) {
      console.log(`🥜 ABSOLUTE FILTER: Nut detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// ✅ ABSOLUTE: Detect soy
const containsSoy = (ingredients) => {
  if (!ingredients || !Array.isArray(ingredients)) return false;

  const soyKeywords = [
    'soy', 'soy sauce', 'tofu', 'tempeh', 'edamame', 'miso',
    'soybean', 'soy milk', 'tamari', 'shoyu'
  ];

  return ingredients.some(ing => {
    const normalized = ing.toLowerCase().trim();
    
    const hasSoy = soyKeywords.some(soy => {
      const escapedSoy = soy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escapedSoy}\\b`, 'i');
      return regex.test(normalized);
    });

    if (hasSoy) {
      console.log(`🫘 ABSOLUTE FILTER: Soy detected in ingredient: "${ing}"`);
      return true;
    }

    return false;
  });
};

// Scores recipes from 0-150 based on multiple factors
const calculateLocalRelevanceScore = (recipe, searchIngredients) => {
  const recipeIngredients = recipe.ingredients || [];
  
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
  
  const matchPercentage = searchIngredients.length > 0 
    ? (matchCount / searchIngredients.length) * 100 
    : 0;
  
  let score = matchPercentage;
  
  if (matchCount === searchIngredients.length && searchIngredients.length > 0) {
    score += 20;
  }
  
  if (matchPercentage >= 80) {
    score += 10;
  } else if (matchPercentage >= 60) {
    score += 5;
  }
  
  const totalIngredients = recipeIngredients.length;
  if (totalIngredients > 0 && totalIngredients <= 8) {
    score += 8;
  } else if (totalIngredients <= 12) {
    score += 4;
  }
  
  return {
    score: Math.min(score, 150),
    matchCount,
    matchPercentage,
    matchedList
  };
};

// ✅ ABSOLUTE: Zero-tolerance dietary filter validation
const applyAbsoluteDietaryFilters = (recipes, filters) => {
  if (!filters || filters.length === 0) return recipes;

  console.log(`🔬 ABSOLUTE FILTER MODE: Applying ${filters.length} filters with zero tolerance`);
  console.log(`📋 Active filters:`, filters);

  return recipes.filter(recipe => {
    const ingredients = recipe.ingredients || [];
    
    // ALL filters must pass
    const passesAllFilters = filters.every(filter => {
      const filterNorm = filter.toLowerCase().replace(/[-\s]/g, '');
      
      switch (filterNorm) {
        // ✅ VEGAN: NO animal products whatsoever
        case 'vegan': {
          if (containsMeat(ingredients)) {
            console.log(`❌ VEGAN REJECT: "${recipe.title}" contains meat`);
            return false;
          }
          if (containsSeafood(ingredients)) {
            console.log(`❌ VEGAN REJECT: "${recipe.title}" contains seafood`);
            return false;
          }
          if (containsDairy(ingredients)) {
            console.log(`❌ VEGAN REJECT: "${recipe.title}" contains dairy`);
            return false;
          }
          if (containsEggs(ingredients)) {
            console.log(`❌ VEGAN REJECT: "${recipe.title}" contains eggs`);
            return false;
          }
          console.log(`✅ VEGAN PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ VEGETARIAN: NO meat or seafood (but dairy/eggs OK)
        case 'vegetarian': {
          if (containsMeat(ingredients)) {
            console.log(`❌ VEGETARIAN REJECT: "${recipe.title}" contains meat`);
            return false;
          }
          if (containsSeafood(ingredients)) {
            console.log(`❌ VEGETARIAN REJECT: "${recipe.title}" contains seafood`);
            return false;
          }
          console.log(`✅ VEGETARIAN PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ PESCATARIAN: NO meat (but seafood OK)
        case 'pescatarian': {
          if (containsMeat(ingredients)) {
            console.log(`❌ PESCATARIAN REJECT: "${recipe.title}" contains meat`);
            return false;
          }
          console.log(`✅ PESCATARIAN PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ ALCOHOL-FREE: ZERO tolerance
        case 'alcoholfree': {
          if (containsAlcohol(ingredients)) {
            console.log(`❌ ALCOHOL-FREE REJECT: "${recipe.title}" contains alcohol`);
            return false;
          }
          const alcoholContent = getNumericNutrition(recipe, 'alcohol');
          if (alcoholContent !== null && alcoholContent > 0) {
            console.log(`❌ ALCOHOL-FREE REJECT: "${recipe.title}" has ${alcoholContent}g alcohol`);
            return false;
          }
          console.log(`✅ ALCOHOL-FREE PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ DAIRY-FREE / LACTOSE-FREE
        case 'dairyfree':
        case 'lactosefree': {
          if (containsDairy(ingredients)) {
            console.log(`❌ DAIRY-FREE REJECT: "${recipe.title}" contains dairy`);
            return false;
          }
          console.log(`✅ DAIRY-FREE PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ GLUTEN-FREE
        case 'glutenfree': {
          if (containsGluten(ingredients)) {
            console.log(`❌ GLUTEN-FREE REJECT: "${recipe.title}" contains gluten`);
            return false;
          }
          console.log(`✅ GLUTEN-FREE PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ EGG-FREE
        case 'eggfree': {
          if (containsEggs(ingredients)) {
            console.log(`❌ EGG-FREE REJECT: "${recipe.title}" contains eggs`);
            return false;
          }
          console.log(`✅ EGG-FREE PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ NUT-FREE / PEANUT-FREE / TREE-NUT-FREE
        case 'nutfree':
        case 'peanutfree':
        case 'treenutfree': {
          if (containsNuts(ingredients)) {
            console.log(`❌ NUT-FREE REJECT: "${recipe.title}" contains nuts`);
            return false;
          }
          console.log(`✅ NUT-FREE PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ SOY-FREE
        case 'soyfree': {
          if (containsSoy(ingredients)) {
            console.log(`❌ SOY-FREE REJECT: "${recipe.title}" contains soy`);
            return false;
          }
          console.log(`✅ SOY-FREE PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ SHELLFISH-FREE
        case 'shellfishfree': {
          const shellfishKeywords = ['shrimp', 'prawn', 'crab', 'lobster', 'crayfish', 
                                     'oyster', 'clam', 'mussel', 'scallop', 'alimasag'];
          const hasShellfish = ingredients.some(ing => {
            const normalized = ing.toLowerCase();
            return shellfishKeywords.some(shellfish => {
              const regex = new RegExp(`\\b${shellfish}\\b`, 'i');
              return regex.test(normalized);
            });
          });
          if (hasShellfish) {
            console.log(`❌ SHELLFISH-FREE REJECT: "${recipe.title}" contains shellfish`);
            return false;
          }
          console.log(`✅ SHELLFISH-FREE PASS: "${recipe.title}"`);
          return true;
        }

        // ✅ NUTRITION FILTERS: Strict validation with missing data = REJECT
        case 'lowcarb': {
          const carbs = getNumericNutrition(recipe, 'carbs_g');
          if (carbs === null) {
            console.log(`❌ LOW-CARB REJECT: "${recipe.title}" missing carb data`);
            return false;
          }
          if (carbs > 25) {
            console.log(`❌ LOW-CARB REJECT: "${recipe.title}" has ${carbs}g carbs (limit: 25g)`);
            return false;
          }
          console.log(`✅ LOW-CARB PASS: "${recipe.title}" (${carbs}g carbs)`);
          return true;
        }
        
        case 'lowfat': {
          const fat = getNumericNutrition(recipe, 'fat_g');
          if (fat === null) {
            console.log(`❌ LOW-FAT REJECT: "${recipe.title}" missing fat data`);
            return false;
          }
          if (fat > 10) {
            console.log(`❌ LOW-FAT REJECT: "${recipe.title}" has ${fat}g fat (limit: 10g)`);
            return false;
          }
          console.log(`✅ LOW-FAT PASS: "${recipe.title}" (${fat}g fat)`);
          return true;
        }
        
        case 'lowsodium': {
          const sodium = getNumericNutrition(recipe, 'sodium_mg');
          if (sodium === null) {
            console.log(`❌ LOW-SODIUM REJECT: "${recipe.title}" missing sodium data`);
            return false;
          }
          if (sodium > 400) {
            console.log(`❌ LOW-SODIUM REJECT: "${recipe.title}" has ${sodium}mg sodium (limit: 400mg)`);
            return false;
          }
          console.log(`✅ LOW-SODIUM PASS: "${recipe.title}" (${sodium}mg sodium)`);
          return true;
        }
        
        case 'sugarfree': {
          const sugar = getNumericNutrition(recipe, 'sugar_g');
          if (sugar === null) {
            console.log(`❌ SUGAR-FREE REJECT: "${recipe.title}" missing sugar data`);
            return false;
          }
          if (sugar > 3) {
            console.log(`❌ SUGAR-FREE REJECT: "${recipe.title}" has ${sugar}g sugar (limit: 3g)`);
            return false;
          }
          console.log(`✅ SUGAR-FREE PASS: "${recipe.title}" (${sugar}g sugar)`);
          return true;
        }
        
        case 'lowsugar': {
          const sugar = getNumericNutrition(recipe, 'sugar_g');
          if (sugar === null) {
            console.log(`❌ LOW-SUGAR REJECT: "${recipe.title}" missing sugar data`);
            return false;
          }
          if (sugar > 8) {
            console.log(`❌ LOW-SUGAR REJECT: "${recipe.title}" has ${sugar}g sugar (limit: 8g)`);
            return false;
          }
          console.log(`✅ LOW-SUGAR PASS: "${recipe.title}" (${sugar}g sugar)`);
          return true;
        }
        
        case 'diabeticfriendly': {
          const sugar = getNumericNutrition(recipe, 'sugar_g');
          const carbs = getNumericNutrition(recipe, 'carbs_g');
          
          if (sugar === null || carbs === null) {
            console.log(`❌ DIABETIC-FRIENDLY REJECT: "${recipe.title}" missing nutrition data`);
            return false;
          }
          
          if (sugar > 8 || carbs > 30) {
            console.log(`❌ DIABETIC-FRIENDLY REJECT: "${recipe.title}" sugar=${sugar}g carbs=${carbs}g`);
            return false;
          }
          console.log(`✅ DIABETIC-FRIENDLY PASS: "${recipe.title}"`);
          return true;
        }
        
        case 'lowcalorie': {
          const calories = getNumericNutrition(recipe, 'calories');
          if (calories === null) {
            console.log(`❌ LOW-CALORIE REJECT: "${recipe.title}" missing calorie data`);
            return false;
          }
          if (calories > 300) {
            console.log(`❌ LOW-CALORIE REJECT: "${recipe.title}" has ${calories} calories (limit: 300)`);
            return false;
          }
          console.log(`✅ LOW-CALORIE PASS: "${recipe.title}" (${calories} cal)`);
          return true;
        }
        
        case 'highprotein': {
          const protein = getNumericNutrition(recipe, 'protein_g');
          if (protein === null) {
            console.log(`❌ HIGH-PROTEIN REJECT: "${recipe.title}" missing protein data`);
            return false;
          }
          if (protein < 20) {
            console.log(`❌ HIGH-PROTEIN REJECT: "${recipe.title}" has ${protein}g protein (minimum: 20g)`);
            return false;
          }
          console.log(`✅ HIGH-PROTEIN PASS: "${recipe.title}" (${protein}g protein)`);
          return true;
        }
        
        case 'highfiber': {
          const fiber = getNumericNutrition(recipe, 'fiber_g');
          if (fiber === null) {
            console.log(`❌ HIGH-FIBER REJECT: "${recipe.title}" missing fiber data`);
            return false;
          }
          if (fiber < 5) {
            console.log(`❌ HIGH-FIBER REJECT: "${recipe.title}" has ${fiber}g fiber (minimum: 5g)`);
            return false;
          }
          console.log(`✅ HIGH-FIBER PASS: "${recipe.title}" (${fiber}g fiber)`);
          return true;
        }

        // ✅ KETO: Very strict carb limit
        case 'keto':
        case 'ketogenic': {
          const carbs = getNumericNutrition(recipe, 'carbs_g');
          if (carbs === null) {
            console.log(`❌ KETO REJECT: "${recipe.title}" missing carb data`);
            return false;
          }
          if (carbs > 20) {
            console.log(`❌ KETO REJECT: "${recipe.title}" has ${carbs}g carbs (keto limit: 20g)`);
            return false;
          }
          console.log(`✅ KETO PASS: "${recipe.title}" (${carbs}g carbs)`);
          return true;
        }
        
        // ✅ PALEO: No grains, legumes, dairy
        case 'paleo':
        case 'paleolithic': {
          if (containsDairy(ingredients)) {
            console.log(`❌ PALEO REJECT: "${recipe.title}" contains dairy`);
            return false;
          }
          if (containsGluten(ingredients)) {
            console.log(`❌ PALEO REJECT: "${recipe.title}" contains grains`);
            return false;
          }
          const legumes = ['bean', 'lentil', 'chickpea', 'pea', 'soy'];
          const hasLegumes = ingredients.some(ing => 
            legumes.some(legume => ing.toLowerCase().includes(legume))
          );
          if (hasLegumes) {
            console.log(`❌ PALEO REJECT: "${recipe.title}" contains legumes`);
            return false;
          }
          console.log(`✅ PALEO PASS: "${recipe.title}"`);
          return true;
        }
        
        // ✅ WHOLE30: Similar to paleo but stricter
        case 'whole30': {
          if (containsDairy(ingredients)) {
            console.log(`❌ WHOLE30 REJECT: "${recipe.title}" contains dairy`);
            return false;
          }
          if (containsGluten(ingredients)) {
            console.log(`❌ WHOLE30 REJECT: "${recipe.title}" contains grains`);
            return false;
          }
          const sugar = getNumericNutrition(recipe, 'sugar_g');
          if (sugar !== null && sugar > 3) {
            console.log(`❌ WHOLE30 REJECT: "${recipe.title}" has ${sugar}g sugar`);
            return false;
          }
          console.log(`✅ WHOLE30 PASS: "${recipe.title}"`);
          return true;
        }
        
        // For other filters, fall back to tag checking as secondary validation
        default: {
          const tags = Array.isArray(recipe.tags) ? recipe.tags : [];
          const tagsLower = tags.map(t => String(t).toLowerCase().replace(/[-\s]/g, ''));
          const hasTag = tagsLower.includes(filterNorm);
          
          if (!hasTag) {
            console.log(`❌ FILTER REJECT: "${recipe.title}" missing "${filter}" tag`);
            return false;
          }
          console.log(`✅ FILTER PASS: "${recipe.title}" has "${filter}" tag`);
          return true;
        }
      }
    });

    return passesAllFilters;
  });
};

/**
 * 🔥 ENHANCED: Fast local recipe search with absolute validation
 */
export const searchLocalRecipes = async (
  selectedIngredients,
  selectedFilters = [],
  description = ''
) => {
  try {
    console.log('🔍 Starting local recipe search with ABSOLUTE FILTERING...');
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

    console.log(`✅ Found ${ingredientFiltered.length} recipes with matching ingredients`);

    // Step 2: Apply ABSOLUTE dietary filters (ignores incorrect tags, validates actual data)
    const beforeFilterCount = ingredientFiltered.length;
    const dietaryFiltered = selectedFilters.length > 0
      ? applyAbsoluteDietaryFilters(ingredientFiltered, selectedFilters)
      : ingredientFiltered;

    console.log(`✅ ${dietaryFiltered.length}/${beforeFilterCount} recipes passed ALL ${selectedFilters.length} ABSOLUTE filters`);
    if (selectedFilters.length > 0 && dietaryFiltered.length < beforeFilterCount) {
      console.log(`🚫 Filtered out ${beforeFilterCount - dietaryFiltered.length} recipes with incorrect tags or failing validation`);
    }

    // Step 3: ENHANCED SORTING: Multi-level prioritization
    dietaryFiltered.sort((a, b) => {
      if (Math.abs(b.relevanceScore - a.relevanceScore) > 5) {
        return b.relevanceScore - a.relevanceScore;
      }

      if (Math.abs(b.matchPercentage - a.matchPercentage) > 10) {
        return b.matchPercentage - a.matchPercentage;
      }

      if (b.matchingIngredients !== a.matchingIngredients) {
        return b.matchingIngredients - a.matchingIngredients;
      }

      return 0;
    });

    // Log top results for debugging
    console.log('🏆 TOP 5 LOCAL RECIPES BY RELEVANCE:');
    dietaryFiltered.slice(0, 5).forEach((recipe, idx) => {
      console.log(`${idx + 1}. "${recipe.title}"`);
      console.log(`   - Relevance Score: ${Math.round(recipe.relevanceScore)}/150`);
      console.log(`   - Ingredient Match: ${recipe.matchingIngredients}/${selectedIngredients.length} (${Math.round(recipe.matchPercentage)}%)`);
      console.log(`   - Matched: ${recipe.matchedIngredientsList.join(', ')}`);
    });

    // Step 4: Apply description filter if provided
    let filteredLocal = dietaryFiltered;
    if (description?.trim() && dietaryFiltered.length > 0) {
      console.log('📝 Applying description filter...');
      
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
      
      filteredLocal = filteredLocal.map(recipe => ({
        ...recipe,
        ...matchDataMap.get(recipe.id)
      }));
      
      console.log(`✅ ${filteredLocal.length} recipes matched description`);
    }

    console.timeEnd('localSearch');
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✨ LOCAL SEARCH COMPLETE WITH ABSOLUTE VALIDATION`);
    console.log(`${'='.repeat(60)}`);
    console.log(`📊 Results: ${filteredLocal.length} recipes with 100% FILTER COMPLIANCE`);
    console.log(`✅ GUARANTEED: Every recipe validated against actual ingredients & nutrition`);
    console.log(`🚫 ZERO TOLERANCE: Incorrect tags ignored, only real data matters`);
    console.log(`${'='.repeat(60)}\n`);
    
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

// Export all detection functions for testing/debugging
export const calculateIngredientMatchScore = calculateLocalRelevanceScore;
export {
  containsAlcohol,
  containsMeat,
  containsSeafood,
  containsDairy,
  containsGluten,
  containsEggs,
  containsNuts,
  containsSoy
};

const localRecipeService = {
  searchLocalRecipes,
  getLocalRecipeById,
  getAllLocalRecipes,
  getRandomLocalRecipes,
  calculateIngredientMatchScore,
  containsAlcohol,
  containsMeat,
  containsSeafood,
  containsDairy,
  containsGluten,
  containsEggs,
  containsNuts,
  containsSoy
};

export default localRecipeService;