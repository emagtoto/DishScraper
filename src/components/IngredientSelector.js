import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, ChefHat, Info } from 'lucide-react';
import ingredients from '../data/ingredients';

export default function IngredientSelector({ selectedIngredients, setSelectedIngredients }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

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

      if (aLower === searchLower) return -1;
      if (bLower === searchLower) return 1;

      const aStarts = aLower.startsWith(searchLower);
      const bStarts = bLower.startsWith(searchLower);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

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
    } else if (e.key === 'Enter' && searchTerm.trim() && filteredIngredients.length === 0) {
      e.preventDefault();
      addIngredient(searchTerm.trim());
    }
  };

  return (
    <div className="mb-8">
      {/* Header with Helper Tip */}
      <div className="flex items-center gap-2 mb-4">
        <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
        <label className="text-base sm:text-lg font-bold text-gray-900">
          What ingredients do you have?
        </label>
      </div>

      {/* Helper Text */}
      <div className="mb-4 flex items-start gap-2 bg-orange-50 border-orange-500 p-3 rounded">
        <Info className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-orange-800">
          <span className="font-semibold">How it works:</span> Type an ingredient name below, click it from the list to add it. You can add as many as you want, or type custom ones.
        </p>
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
            placeholder="Type: chicken, tomato, garlic..."
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
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-left hover:bg-orange-50 active:bg-orange-100 transition-colors duration-100 flex items-center justify-between group"
                    title="Click to add this ingredient"
                  >
                    <span className="text-sm sm:text-base text-gray-700 font-medium">{ingredient}</span>
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500 opacity-100" />
                  </button>
                ))}
                {filteredIngredients.length > 20 && (
                  <div className="px-3 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm text-gray-600 bg-gray-50 border-t border-gray-200">
                    <p className="font-medium">Showing 20 of {filteredIngredients.length} matches</p>
                    <p className="text-gray-500 text-xs mt-1">Type more to narrow results</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-3 sm:px-4 py-4 sm:py-5 text-center">
                <p className="text-sm sm:text-base font-medium text-gray-700 mb-1">"{searchTerm}" not in our list?</p>
                <p className="text-xs sm:text-sm text-gray-600 mb-4">No problem! You can add it as a custom ingredient.</p>
                <button
                  onClick={() => addIngredient(searchTerm.trim())}
                  className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-4 py-2.5 sm:py-3 rounded-lg font-semibold text-sm sm:text-base transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  Add "{searchTerm}" as ingredient
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Ingredients Display */}
      {selectedIngredients.length > 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-5 border-2 border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">
                Your ingredients
              </h3>
              <p className="text-xs text-gray-600 mt-1">Ready to find recipes? Click "Find Recipes" button below</p>
            </div>
            <span className="bg-orange-500 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-sm sm:text-base font-bold">
              {selectedIngredients.length} added
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
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
                  title="Click to remove"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {selectedIngredients.length > 0 && (
            <button
              onClick={() => setSelectedIngredients([])}
              className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-150 flex items-center gap-1 px-2 py-1 hover:bg-orange-100 rounded"
            >
              <X className="w-4 h-4" />
              Remove all
            </button>
          )}
        </div>
      )}

      {/* Empty State */}
      {selectedIngredients.length === 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-4 sm:p-6 border-2 border-orange-200 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-200 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
          </div>
          <p className="text-sm sm:text-base text-gray-700 font-medium mb-2">Start by adding ingredients</p>
          <p className="text-xs sm:text-sm text-gray-600">Type in the search box above (like "chicken" or "rice") and click results to add them</p>
        </div>
      )}
    </div>
  );
}