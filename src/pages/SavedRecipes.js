import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import RecipeModal from "../components/RecipeModal";
import { removeSavedRecipe } from "../services/userService";
import { Trash2, BookOpen, ChefHat } from "lucide-react";

const SavedRecipes = () => {
  const { user, setUser } = useUser();
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [removing, setRemoving] = useState(null);

  const removeRecipe = async (recipe) => {
    if (!user?.uid) return;

    setRemoving(recipe.id);

    const result = await removeSavedRecipe(user.uid, recipe);

    if (result.success) {
      setUser({
        ...user,
        savedRecipes: user.savedRecipes.filter((r) => r.id !== recipe.id),
      });
    } else {
      alert("Failed to remove recipe. Please try again.");
    }

    setRemoving(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500 rounded-lg">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Saved Recipes</h1>
          </div>
          <p className="text-gray-600 ml-14">
            Your personal collection of favorite recipes
          </p>
        </div>

        {/* Content Section */}
        {!user?.isLoggedIn ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md text-center border border-gray-100">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ChefHat className="w-10 h-10 text-orange-500" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                Welcome Back!
              </h2>
              <p className="text-gray-600 mb-6">
                Please log in to view and manage your saved recipes.
              </p>
            </div>
          </div>
        ) : user.savedRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md text-center border border-gray-100">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <BookOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">
                No Saved Recipes Yet
              </h2>
              <p className="text-gray-600">
                Start exploring delicious recipes and save your favorites to build your personal cookbook!
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Recipe Count */}
            <div className="mb-6">
              <p className="text-gray-700 font-medium">
                {user.savedRecipes.length} {user.savedRecipes.length === 1 ? "recipe" : "recipes"} saved
              </p>
            </div>

            {/* Recipe Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {user.savedRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer group border border-gray-100 flex flex-col"
                  onClick={() => setSelectedRecipe(recipe)}
                >
                  {/* Recipe Image */}
                  <div className="relative h-48 bg-gradient-to-br from-orange-100 to-amber-100 overflow-hidden">
                    {recipe.image ? (
                      <img
                        src={recipe.image}
                        alt={recipe.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ChefHat className="w-16 h-16 text-orange-300" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* Recipe Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-orange-600 transition-colors">
                      {recipe.title}
                    </h3>

                    {/* Ingredients Preview */}
                    {recipe.ingredients && recipe.ingredients.length > 0 && (
                      <div className="mb-4 flex-1">
                        <p className="text-sm text-gray-600 line-clamp-2">
                          <span className="font-medium text-gray-700">Ingredients: </span>
                          {recipe.ingredients.slice(0, 3).join(", ")}
                          {recipe.ingredients.length > 3 && "..."}
                        </p>
                      </div>
                    )}

                    {/* Source Badge */}
                    {recipe.source && (
                      <div className="mb-4">
                        <span className="inline-block px-3 py-1 bg-orange-50 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
                          {recipe.source}
                        </span>
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeRecipe(recipe);
                      }}
                      disabled={removing === recipe.id}
                      className={`w-full py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm ${
                        removing === recipe.id
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-600"
                      }`}
                    >
                      {removing === recipe.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          Removing...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Recipe Modal */}
        {selectedRecipe && (
          <RecipeModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
          />
        )}
      </div>
    </div>
  );
};

export default SavedRecipes;