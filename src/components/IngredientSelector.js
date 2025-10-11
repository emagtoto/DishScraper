import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, ChefHat } from 'lucide-react';
import ingredients from '../data/ingredients';

export default function IngredientSelector({ selectedIngredients, setSelectedIngredients }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // Smart filtering with exact match priority
  const filteredIngredients = ingredients
    .filter(
      ing => 
        ing.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !selectedIngredients.includes(ing)
    )
    .sort((a, b) => {
      const searchLower = searchTerm.toLowerCase();
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();

      // Exact match gets highest priority
      if (aLower === searchLower) return -1;
      if (bLower === searchLower) return 1;

      // Starts with search term gets second priority
      const aStarts = aLower.startsWith(searchLower);
      const bStarts = bLower.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      // Otherwise alphabetical
      return a.localeCompare(b);
    });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const addIngredient = (ingredient) => {
    if (!selectedIngredients.includes(ingredient)) {
      setSelectedIngredients([...selectedIngredients, ingredient]);
      setSearchTerm('');
      setShowSuggestions(false);
    }
  };

  const removeIngredient = (ingredient) => {
    setSelectedIngredients(selectedIngredients.filter(i => i !== ingredient));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && filteredIngredients.length > 0) {
      e.preventDefault();
      addIngredient(filteredIngredients[0]);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
        <label className="text-base sm:text-lg font-bold text-gray-900">
          Select Ingredients
        </label>
      </div>

      {/* Search Input */}
      <div ref={searchRef} className="relative mb-4">
        <div className="relative">
          <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search and add ingredients..."
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 text-gray-900 placeholder-gray-400"
          />
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && searchTerm && (
          <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-xl shadow-xl max-h-48 sm:max-h-60 overflow-y-auto">
            {filteredIngredients.length > 0 ? (
              <div className="py-1 sm:py-2">
                {filteredIngredients.slice(0, 20).map((ingredient) => (
                  <button
                    key={ingredient}
                    onClick={() => addIngredient(ingredient)}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-orange-50 transition-colors duration-150 flex items-center justify-between group"
                  >
                    <span className="text-sm sm:text-base text-gray-700 font-medium">{ingredient}</span>
                    <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                  </button>
                ))}
                {filteredIngredients.length > 20 && (
                  <div className="px-3 sm:px-4 py-2 text-center text-xs sm:text-sm text-gray-500 border-t border-gray-200">
                    {filteredIngredients.length - 20} more ingredients available...
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 sm:px-4 py-4 sm:py-5 text-center">
                <p className="text-sm sm:text-base font-medium text-gray-600 mb-3">Ingredient not found</p>
                <button
                  onClick={() => addIngredient(searchTerm)}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2.5 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add "{searchTerm}" as custom ingredient
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Ingredients Display */}
      {selectedIngredients.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-5 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">
              Selected Ingredients
            </h3>
            <span className="bg-orange-500 text-white px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold">
              {selectedIngredients.length}
            </span>
          </div>
          
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {selectedIngredients.map((ingredient) => (
              <div
                key={ingredient}
                className="group bg-white border-2 border-orange-300 rounded-lg pl-3 sm:pl-4 pr-2 py-2 flex items-center gap-2 hover:border-orange-500 hover:shadow-md transition-all duration-200"
              >
                <span className="text-sm sm:text-base text-gray-900 font-medium">{ingredient}</span>
                <button
                  onClick={() => removeIngredient(ingredient)}
                  className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md p-1.5 transition-all duration-150"
                  aria-label={`Remove ${ingredient}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {selectedIngredients.length > 0 && (
            <button
              onClick={() => setSelectedIngredients([])}
              className="mt-3 sm:mt-4 text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-150 flex items-center gap-1 px-2 py-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {selectedIngredients.length === 0 && (
        <div className="bg-gray-50 rounded-xl p-4 sm:p-6 border-2 border-dashed border-gray-300 text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
          </div>
          <p className="text-sm sm:text-base text-gray-600 font-medium mb-1">No ingredients selected yet</p>
          <p className="text-xs sm:text-sm text-gray-500">Start typing to search and add ingredients</p>
        </div>
      )}
    </div>
  );
}