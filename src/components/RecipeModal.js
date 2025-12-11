import React, { useState, useEffect } from "react";
import { X, Clock, Users, ChefHat, AlertTriangle, Info, Zap, Apple, Flame, ExternalLink, Sparkles, RefreshCw, Bookmark, Loader2, Check } from "lucide-react";
import { useUser } from "../context/UserContext";
import { addSavedRecipe, removeSavedRecipe } from "../services/userService";
import { modifyRecipeWithAI } from "../services/interactiveAiService";

export default function RecipeModal({ recipe, onClose, onAuthRequired }) {
  const { user, setUser } = useUser();

  const [modifiedRecipe, setModifiedRecipe] = useState(null);
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [isModifying, setIsModifying] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    setModifiedRecipe(null);
    setModificationPrompt('');
    setIsModifying(false);
    setIsSaving(false);
    setIsRemoving(false);
    setConfirmingRemove(false);
  }, [recipe]);

  if (!recipe) return null;

  const displayRecipe = modifiedRecipe || recipe;

  const isSaved = user?.isLoggedIn && user.savedRecipes.some(r => r.id === displayRecipe.id);

  const handleModifyRecipe = async () => {
    if (!modificationPrompt.trim()) return;
    setIsModifying(true);

    const result = await modifyRecipeWithAI(displayRecipe, modificationPrompt);

    if (result.success) {
      setModifiedRecipe({
        ...displayRecipe,
        ...result.data,
        id: `${displayRecipe.id}-modified-${Date.now()}`, 
        source: "AI Modified"
      });
    } else {
      console.error(`Sorry, I couldn't modify the recipe. Error: ${result.error}`);
      alert(`Sorry, I couldn't modify the recipe. Error: ${result.error}`); 
    }

    setIsModifying(false);
  };

  const handleSaveRecipe = async () => {
    if (!user?.isLoggedIn) {
      // Trigger AuthModal instead of alert
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }
    if (isSaved) return;

    setIsSaving(true);
    const result = await addSavedRecipe(user.uid, displayRecipe);

    if (result.success) {
      setUser({
        ...user,
        savedRecipes: [...user.savedRecipes, displayRecipe]
      });
    } else {
      console.error("Failed to save recipe. Please try again.");
      alert("Failed to save recipe. Please try again.");
    }
    setIsSaving(false);
  };

  const handleUnsaveRecipe = async () => {
    if (!user?.uid) return;

    setConfirmingRemove(false);
    setIsRemoving(true);

    const result = await removeSavedRecipe(user.uid, displayRecipe);

    if (result.success) {
      setUser({
        ...user,
        savedRecipes: user.savedRecipes.filter((r) => r.id !== displayRecipe.id),
      });
    } else {
      alert("Failed to unsave recipe. Please try again.");
    }

    setIsRemoving(false);
  };

  const initiateRemove = () => {
    if (isRemoving) return;
    setConfirmingRemove(true);
  };

  const cancelRemove = () => {
    setConfirmingRemove(false);
  };

  const instructionsArray = Array.isArray(displayRecipe.instructions)
    ? displayRecipe.instructions
    : displayRecipe.instructions
      ? String(displayRecipe.instructions)
        .split(/\n\n|\n(?=Step \d+:)/)
        .map(step => step.replace(/^Step \d+:\s*/i, '').trim())
        .filter((step) => step.length > 0)
      : [];

  const getNutritionItems = () => {
    if (!displayRecipe.nutritional_info) return [];
    
    const info = displayRecipe.nutritional_info;
    const items = [];

    const nutritionMap = [
      { key: 'calories', label: 'Calories', unit: '', format: (v) => Math.round(v) },
      { key: 'protein_g', label: 'Protein', unit: 'g', format: (v) => Math.round(v) },
      { key: 'carbs_g', label: 'Carbohydrates', unit: 'g', format: (v) => Math.round(v) },
      { key: 'fat_g', label: 'Fat', unit: 'g', format: (v) => Math.round(v) },
      { key: 'fiber_g', label: 'Fiber', unit: 'g', format: (v) => Math.round(v) },
      { key: 'sugar_g', label: 'Sugar', unit: 'g', format: (v) => Math.round(v) },
      { key: 'sodium_mg', label: 'Sodium', unit: 'mg', format: (v) => Math.round(v) }
    ];

    nutritionMap.forEach(({ key, label, unit, format }) => {
      if (info[key] !== undefined && info[key] !== null) {
        items.push({
          label,
          value: format(info[key]),
          unit
        });
      }
    });

    return items;
  };

  const nutritionItems = getNutritionItems();
  const isSourceLinkOnly = instructionsArray.length === 1 && instructionsArray[0].toLowerCase().includes('full instructions available');

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-white to-gray-50 w-full max-w-5xl rounded-3xl shadow-2xl relative flex flex-col max-h-[85vh] lg:max-h-[90vh] overflow-hidden border border-gray-200 animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          {displayRecipe.image && (
            <div className="relative h-40 sm:h-44 md:h-48 lg:h-56 xl:h-64 overflow-hidden rounded-t-3xl">
              <img src={displayRecipe.image} alt={displayRecipe.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-2 sm:mb-3 md:mb-4 text-white drop-shadow-2xl leading-tight">{displayRecipe.title}</h2>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {(displayRecipe.readyInMinutes || displayRecipe.cookingTime) && (
                    <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg border border-white/20">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      <span className="text-gray-900">{displayRecipe.readyInMinutes ? `${displayRecipe.readyInMinutes} min` : displayRecipe.cookingTime}</span>
                    </div>
                  )}
                  {displayRecipe.servings && (
                    <div className="bg-white/95 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg border border-white/20">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
                      <span className="text-gray-900">{displayRecipe.servings} servings</span>
                    </div>
                  )}
                  {displayRecipe.source && (
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 backdrop-blur-md px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-lg border border-orange-400 text-white">
                      <Flame className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="text-white">{displayRecipe.source}</span>
                    </div>
                  )}
                </div>
              </div>
              <button onClick={onClose} className="absolute top-4 right-4 p-2 sm:p-3 bg-white/95 backdrop-blur-md hover:bg-white rounded-full transition-all duration-200 shadow-xl border border-white/20 group">
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700 group-hover:text-red-500 transition-colors" />
              </button>
            </div>
          )}
          {!displayRecipe.image && (
            <div className="relative bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 p-6 sm:p-8 rounded-t-3xl">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-3 sm:mb-4 leading-tight">{displayRecipe.title}</h2>
            </div>
          )}
        </div>

        <div className="overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-5 md:space-y-6 flex-1">

          {modifiedRecipe && (
            <div className="bg-gradient-to-r from-orange-50 to-orange-50 border-orange-500 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3 sm:gap-4 shadow-md">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
                </div>
                <div>
                  <p className="font-bold text-orange-900 mb-1 text-base sm:text-lg">Viewing AI-Modified Recipe</p>
                  <p className="text-xs sm:text-sm text-orange-800 leading-relaxed">
                    This recipe was modified by AI. You can revert to the original at any time.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModifiedRecipe(null)}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 rounded-lg text-xs font-semibold text-gray-700 border border-gray-300 transition-all shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Revert
              </button>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center gap-2"><Sparkles className="text-orange-500" />Modify with AI</h3>
            <p className="text-sm text-gray-600 mb-4">Describe any changes you want to make. For example: "Double the servings", "make it vegan", "replace chicken with fish".</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={modificationPrompt}
                onChange={(e) => setModificationPrompt(e.target.value)}
                placeholder="How would you like to change this recipe?"
                className="flex-grow w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                disabled={isModifying}
              />
              <button
                onClick={handleModifyRecipe}
                disabled={isModifying || !modificationPrompt}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:bg-gray-400 disabled:shadow-none disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isModifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>


          {(recipe.source === "AI Generated" && !modifiedRecipe) && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-500 rounded-xl p-4 sm:p-5 flex items-start gap-3 sm:gap-4 shadow-md">
              <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0" />
              </div>
              <div>
                <p className="font-bold text-yellow-900 mb-1 text-base sm:text-lg">AI-Generated Recipe</p>
                <p className="text-xs sm:text-sm text-yellow-800 leading-relaxed">
                  This recipe was generated by AI and has not been tested.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
              <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                <Apple className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Ingredients</h3>
              {displayRecipe.ingredients?.length && (
                <span className="ml-auto bg-orange-100 text-orange-700 px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border border-orange-200">
                  {displayRecipe.ingredients.length} items
                </span>
              )}
            </div>
            <ul className="space-y-2.5 sm:space-y-3">
              {displayRecipe.ingredients?.map((ing, i) => (
                <li key={i} className="flex items-start gap-2.5 sm:gap-3 text-gray-700 group">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mt-2 sm:mt-2.5 flex-shrink-0 group-hover:scale-125 transition-transform"></span>
                  <span className="leading-relaxed text-sm sm:text-base">{ing}</span>
                </li>
              ))}
            </ul>
          </div>

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

            {isSourceLinkOnly && displayRecipe.sourceUrl ? (
              <div className="text-center py-8 sm:py-12">
                <a
                  href={displayRecipe.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-bold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
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

          {nutritionItems.length > 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-5 pb-3 sm:pb-4 border-b border-gray-200">
                <div className="p-2 sm:p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
                  <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Nutrition Information</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {nutritionItems.map((item, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 sm:p-4 md:p-5 rounded-xl border-2 border-orange-200 hover:border-orange-300 transition-all hover:shadow-md">
                    <p className="text-xs text-orange-700 font-semibold uppercase tracking-wide">{item.label}</p>
                    <p className="text-2xl sm:text-3xl font-extrabold text-orange-900">
                      {item.value}{item.unit}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {displayRecipe.nutrition && nutritionItems.length === 0 && (
            <div className="bg-white rounded-2xl p-4 sm:p-5 md:p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <p className="text-gray-700 leading-relaxed text-sm sm:text-base">{displayRecipe.nutrition}</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 md:p-6 border-t-2 border-gray-200 bg-gradient-to-r from-gray-50 to-white flex justify-end items-center gap-2 sm:gap-3">
          {user?.isLoggedIn ? (
            <>
              {confirmingRemove ? (
                <div className="flex gap-2">
                  <button
                    onClick={handleUnsaveRecipe}
                    className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg flex items-center gap-2 bg-red-600 text-white hover:bg-red-700"
                  >
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    Confirm Unsave
                  </button>
                  <button
                    onClick={cancelRemove}
                    className="px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg flex items-center gap-2 bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={isSaved ? initiateRemove : handleSaveRecipe}
                  disabled={isSaving || isRemoving}
                  className={`px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg flex items-center gap-2 ${
                    isSaving || isRemoving
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : isSaved
                      ? 'bg-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border-2 hover:border-red-200'
                      : 'bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Saving...
                    </>
                  ) : isRemoving ? (
                    <>
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Removing...
                    </>
                  ) : isSaved ? (
                    <>✓ Saved</>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
                      Save Recipe
                    </>
                  )}
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleSaveRecipe}
              className="px-6 sm:px-8 py-2.5 sm:py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all duration-200 shadow-lg flex items-center gap-2 bg-white text-orange-600 border-2 border-orange-500 hover:bg-orange-50"
            >
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5" />
              Save Recipe
            </button>
          )}
          <button
            onClick={onClose}
            className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 font-bold text-sm sm:text-base transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
            Close
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}</style>
    </div>
  );
}