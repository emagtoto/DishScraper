import React from "react";
import { useUser } from "../context/UserContext";

export default function RecipeCard({ recipe, onClick, onSave, showSaveButton = true }) {
  const { user } = useUser();
  const isSaved = user?.savedRecipes?.some(r => r.id === recipe.id);

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onSave) {
      onSave(recipe);
    }
  };

  return (
    <div
      className="bg-white shadow-md rounded-lg overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
      onClick={() => onClick(recipe)}
    >
      {recipe.image && (
        <div className="relative h-48 w-full overflow-hidden">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            loading="lazy"
          />
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-gray-700">
            {recipe.source}
          </div>
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

        {showSaveButton && onSave && (
          <button
            onClick={handleSaveClick}
            className={`mt-auto w-full py-2 rounded-lg font-semibold transition-all duration-200 ${
              isSaved
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 text-white shadow-md hover:shadow-lg"
            }`}
            disabled={isSaved}
          >
            {isSaved ? "✓ Saved" : "Save Recipe"}
          </button>
        )}
      </div>
    </div>
  );
}