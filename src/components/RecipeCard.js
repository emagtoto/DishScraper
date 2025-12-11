import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import { addSavedRecipe, removeSavedRecipe } from "../services/userService";
import { Check, X, Loader2 } from "lucide-react";

export default function RecipeCard({ recipe, onClick, showSaveButton = true, onAuthRequired }) {
  const { user, setUser } = useUser();
  const isSaved = user?.savedRecipes?.some(r => r.id === recipe.id);
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const handleSaveClick = async (e) => {
    e.stopPropagation();
    if (!user?.isLoggedIn) {
      // Trigger AuthModal instead of alert
      if (onAuthRequired) {
        onAuthRequired();
      }
      return;
    }
    if (isSaved) return;

    setIsSaving(true);
    const result = await addSavedRecipe(user.uid, recipe);

    if (result.success) {
      setUser({
        ...user,
        savedRecipes: [...user.savedRecipes, recipe]
      });
    } else {
      alert("Failed to save recipe. Please try again.");
    }
    setIsSaving(false);
  };

  const handleUnsaveClick = async (e) => {
    e.stopPropagation();
    if (!user?.uid) return;

    setConfirmingRemove(false);
    setIsRemoving(true);

    const result = await removeSavedRecipe(user.uid, recipe);

    if (result.success) {
      setUser({
        ...user,
        savedRecipes: user.savedRecipes.filter((r) => r.id !== recipe.id),
      });
    } else {
      alert("Failed to unsave recipe. Please try again.");
    }

    setIsRemoving(false);
  };

  const initiateRemove = (e) => {
    e.stopPropagation();
    if (isRemoving) return;
    setConfirmingRemove(true);
  };

  const cancelRemove = (e) => {
    e.stopPropagation();
    setConfirmingRemove(false);
  };

  return (
    <div
      className="bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
      onClick={() => !confirmingRemove && !isRemoving && onClick(recipe)}
    >
      {recipe.image && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4 flex flex-col flex-grow">
        <h3
          className="font-bold text-lg mb-2 line-clamp-2 text-gray-800 hover:text-orange-600 transition-colors"
          title={recipe.title}
        >
          {recipe.title}
        </h3>

        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {recipe.matchingIngredients !== undefined && recipe.matchingIngredients > 0 && (
            <span className="text-xs bg-orange-100 px-2 py-1 rounded-full font-medium">
              ✓ {recipe.matchingIngredients} match{recipe.matchingIngredients !== 1 ? 'es' : ''}
            </span>
          )}
          
          {recipe.readyInMinutes && (
            <span className="text-xs bg-orange-100 px-2 py-1 rounded-full font-medium">
              ⏱️ {recipe.readyInMinutes} min
            </span>
          )}
        </div>

        {showSaveButton && (
          <>
            {confirmingRemove ? (
              <div className="mt-auto flex gap-2">
                <button
                  onClick={handleUnsaveClick}
                  className="w-1/2 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 font-semibold text-sm bg-red-600 text-white hover:bg-red-700"
                >
                  <Check className="w-4 h-4" />
                  Confirm
                </button>
                <button
                  onClick={cancelRemove}
                  className="w-1/2 py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-1 font-semibold text-sm bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={isSaved ? initiateRemove : handleSaveClick}
                disabled={isRemoving || isSaving}
                className={`mt-auto w-full py-2 rounded-lg font-semibold transition-all duration-200 ${
                  isRemoving || isSaving
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : isSaved
                    ? "bg-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border hover:border-red-200"
                    : "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg"
                }`}
              >
                {isRemoving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Removing...
                  </span>
                ) : isSaving ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </span>
                ) : isSaved ? (
                  "✓ Saved"
                ) : (
                  "Save Recipe"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}