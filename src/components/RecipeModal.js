import React from "react";
import { X, Clock, Users, ChefHat, AlertTriangle, Info, Zap, Apple, Flame, Droplets, ExternalLink } from "lucide-react";

export default function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null;

  // Ensure instructions are in array format (handles both arrays and strings)
  const instructionsArray = Array.isArray(recipe.instructions)
    ? recipe.instructions
    : recipe.instructions
      ? recipe.instructions
        .split(/\n\n|\n(?=Step \d+:)/)
        .map(step => step.replace(/^Step \d+:\s*/i, '').trim())
        .filter((step) => step.length > 0)
      : [];

  // Check if this recipe has detailed nutritional_info
  const hasDetailedNutrition = recipe.nutritional_info && 
    (recipe.source === "Local Recipe" || recipe.found_in === "json" || recipe.source === "Spoonacular");

  // Format nutritional info to handle different field name formats
  const formatNutritionalInfo = (info) => {
    if (!info) return null;
    return {
      calories: info.calories || 'N/A',
      protein: info.protein_g ? `${Math.round(info.protein_g)}g` : 'N/A',
      carbohydrates: info.carbs_g ? `${Math.round(info.carbs_g)}g` : 'N/A',
      fat: info.fat_g ? `${Math.round(info.fat_g)}g` : 'N/A',
      fiber: info.fiber_g ? `${Math.round(info.fiber_g)}g` : 'N/A',
      sugar: info.sugar_g ? `${Math.round(info.sugar_g)}g` : 'N/A',
      sodium: info.sodium_mg ? `${Math.round(info.sodium_mg)}mg` : 'N/A',
      vitaminC: info.vitamin_c_mg ? `${Math.round(info.vitamin_c_mg)}mg` : undefined,
      calcium: info.calcium_mg ? `${Math.round(info.calcium_mg)}mg` : undefined,
      iron: info.iron_mg ? `${Math.round(info.iron_mg)}mg` : undefined,
      potassium: info.potassium_mg ? `${Math.round(info.potassium_mg)}mg` : undefined
    };
  };

  const nutritionData = hasDetailedNutrition ? formatNutritionalInfo(recipe.nutritional_info) : null;

  // Get vitamins array from recipe - handle both array and string formats
  const getVitaminsArray = () => {
    const vitaminsData = recipe.nutritional_info?.vitamins;
    if (Array.isArray(vitaminsData)) {
      return vitaminsData;
    } else if (typeof vitaminsData === 'string') {
      return vitaminsData.split(',').map(v => v.trim()).filter(v => v.length > 0);
    }
    return [];
  };
  const vitamins = getVitaminsArray();

  // Check if instructions contain only a source link
  const isSourceLinkOnly = instructionsArray.length === 1 && 
    instructionsArray[0].toLowerCase().includes('full instructions available');

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-white to-gray-50 w-full max-w-5xl rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] lg:max-h-[90vh] overflow-hidden border border-gray-200 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Image */}
        <div className="relative">
          {recipe.image && (
            <div className="relative h-40 sm:h-44 md:h-48 lg:h-56 xl:h-64 overflow-hidden rounded-t-3xl">
              <img
                src={recipe.image}
                alt={recipe.title}
                className="w-full h-full object-cover"
              />
              {/* Gradient Overlays */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>

              {/* Title and Info Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-2xl leading-tight">
                  {recipe.title}
                </h2>

                {/* Info Pills */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {(recipe.readyInMinutes || recipe.cookingTime) && (
                    <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg border border-white/20">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      <span className="text-gray-900">{recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : recipe.cookingTime}</span>
                    </div>
                  )}
                  {recipe.servings && (
                    <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg border border-white/20">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
                      <span className="text-gray-900">{recipe.servings} servings</span>
                    </div>
                  )}
                  {recipe.source && (
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg border border-orange-400 text-white">
                      <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
                      {recipe.source}
                    </div>
                  )}
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 sm:p-3 bg-white/95 backdrop-blur-md hover:bg-white rounded-full transition-all duration-200 shadow-xl border border-white/20 group"
                aria-label="Close modal"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          )}

          {!recipe.image && (
            <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-6 sm:p-8 rounded-t-3xl">
              <div className="flex justify-between items-start">
                <div className="flex items-start gap-3 sm:gap-4 flex-1">
                  <div className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-2xl border border-white/30">
                    <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4 leading-tight">{recipe.title}</h2>
                    <div className="flex flex-wrap gap-2 sm:gap-3">
                      {(recipe.readyInMinutes || recipe.cookingTime) && (
                        <div className="bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 border border-white/30 text-white">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          {recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : recipe.cookingTime}
                        </div>
                      )}
                      {recipe.servings && (
                        <div className="bg-white/20 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2 border border-white/30 text-white">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          {recipe.servings} servings
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-full transition-all duration-200 border border-white/30 group ml-2 sm:ml-4"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:text-red-100 transition-colors" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 flex-1">
          {/* AI Warning for AI Generated recipes */}
          {recipe.source === "AI Generated" && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-md">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
              </div>
              <div>
                <p className="font-bold text-yellow-900 mb-1 text-base sm:text-lg">AI-Generated Recipe</p>
                <p className="text-xs sm:text-sm text-yellow-800 leading-relaxed">
                  Use at your own risk. Check ingredients for allergies and follow safe cooking practices. This recipe was generated by AI and has not been tested.
                </p>
              </div>
            </div>
          )}

          {/* Ingredients Section */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                <Apple className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Ingredients</h3>
              {recipe.ingredients?.length && (
                <span className="ml-auto bg-orange-100 text-orange-700 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border border-orange-200">
                  {recipe.ingredients.length} items
                </span>
              )}
            </div>
            <ul className="space-y-2.5 sm:space-y-3">
              {recipe.ingredients?.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5 sm:gap-3 text-gray-700 group">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 sm:mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                  <span className="leading-relaxed text-sm sm:text-base">{ing}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions Section */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Instructions</h3>
              {!isSourceLinkOnly && instructionsArray.length > 0 && (
                <span className="ml-auto bg-orange-100 text-orange-700 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border border-orange-200">
                  {instructionsArray.length} steps
                </span>
              )}
            </div>

            {isSourceLinkOnly && recipe.sourceUrl ? (
              <div className="text-center py-8 sm:py-12">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                  <ExternalLink className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
                </div>
                <p className="text-base sm:text-lg text-gray-700 mb-4 sm:mb-6 font-medium px-4">
                  Full cooking instructions are available on the source website
                </p>
                <a
                  href={recipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 font-bold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                >
                  <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                  View Full Recipe
                </a>
              </div>
            ) : instructionsArray.length > 0 ? (
              <ol className="space-y-4 sm:space-y-5">
                {instructionsArray.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 sm:gap-5 group">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-xl flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0 shadow-md group-hover:scale-110 transition-transform">
                      {i + 1}
                    </div>
                    <p className="text-gray-700 leading-relaxed pt-1 sm:pt-2 text-sm sm:text-base">{step}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <Info className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                </div>
                <p className="italic text-base sm:text-lg">No instructions available for this recipe.</p>
              </div>
            )}
          </div>

          {/* Detailed Nutritional Information */}
          {nutritionData && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Nutrition Information</h3>
              </div>

              {/* Nutrition Info Warning for Local recipes */}
              {recipe.source === "Local Recipe" && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-3 shadow-sm">
                  <div className="p-1 sm:p-1.5 bg-orange-100 rounded-lg">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0" />
                  </div>
                  <div>
                    <p className="font-semibold text-orange-900 text-xs sm:text-sm mb-1">AI-Estimated Values</p>
                    <p className="text-xs text-orange-800 leading-relaxed">
                      Nutritional information is estimated by AI and may not be fully accurate. Please verify if you have specific dietary requirements.
                    </p>
                  </div>
                </div>
              )}

              {/* Primary Macros Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
                {nutritionData.calories !== 'N/A' && (
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                      <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">Calories</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-orange-900">{Math.round(nutritionData.calories)}</p>
                  </div>
                )}
                {nutritionData.protein !== 'N/A' && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                      <p className="text-xs text-blue-700 font-semibold uppercase tracking-wide">Protein</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-blue-900">{nutritionData.protein}</p>
                  </div>
                )}
                {nutritionData.carbohydrates !== 'N/A' && (
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-amber-200 hover:border-amber-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Apple className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600" />
                      <p className="text-xs text-amber-700 font-semibold uppercase tracking-wide">Carbs</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-amber-900">{nutritionData.carbohydrates}</p>
                  </div>
                )}
                {nutritionData.fat !== 'N/A' && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-purple-200 hover:border-purple-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Droplets className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                      <p className="text-xs text-purple-700 font-semibold uppercase tracking-wide">Fat</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-purple-900">{nutritionData.fat}</p>
                  </div>
                )}
                {nutritionData.fiber !== 'N/A' && (
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-green-200 hover:border-green-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Apple className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                      <p className="text-xs text-green-700 font-semibold uppercase tracking-wide">Fiber</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-green-900">{nutritionData.fiber}</p>
                  </div>
                )}
                {nutritionData.sugar !== 'N/A' && (
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-pink-200 hover:border-pink-300 transition-all hover:shadow-md">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-600" />
                      <p className="text-xs text-pink-700 font-semibold uppercase tracking-wide">Sugar</p>
                    </div>
                    <p className="text-2xl sm:text-3xl font-extrabold text-pink-900">{nutritionData.sugar}</p>
                  </div>
                )}
              </div>

              {/* Minerals & Vitamins */}
              {(nutritionData.sodium !== 'N/A' || nutritionData.potassium || vitamins.length > 0) && (
                <div className="border-t-2 border-gray-200 pt-4 sm:pt-5">
                  <h4 className="font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-base sm:text-lg">
                    <Apple className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    Minerals & Vitamins
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {nutritionData.sodium !== 'N/A' && (
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">Sodium:</span>
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">{nutritionData.sodium}</span>
                      </div>
                    )}
                    {nutritionData.potassium && (
                      <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-200">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-gray-600 font-medium">Potassium:</span>
                        <span className="font-bold text-gray-900 text-xs sm:text-sm">{nutritionData.potassium}</span>
                      </div>
                    )}
                    {vitamins.map((vitamin, idx) => (
                      <div key={idx} className="flex items-center gap-1.5 sm:gap-2 bg-green-50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-green-200">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs sm:text-sm text-green-900 font-bold">{vitamin}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Simple nutrition string fallback */}
          {recipe.nutrition && !nutritionData && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-gray-200">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Nutrition</h3>
              </div>
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{recipe.nutrition}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 md:p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end gap-2 sm:gap-3">
          <button
            onClick={onClose}
            className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-bold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            Close Recipe
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
}