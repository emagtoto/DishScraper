import React, { useState } from "react";
import { Search, X, Filter } from "lucide-react";

const filterCategories = {
  dietary: {
    name: "Dietary Preferences",
    filters: ["Vegan", "Vegetarian", "Pescatarian", "Keto", "Paleo", "Mediterranean", "Whole30", "Flexitarian"]
  },
  allergies: {
    name: "Allergy-Friendly",
    filters: ["Gluten-Free", "Dairy-Free", "Nut-Free", "Soy-Free", "Egg-Free", "Peanut-Free", "Tree-Nut-Free", "Lactose-Free", "Shellfish-Free", "Fish-Free", "Sesame-Free"]
  },
  health: {
    name: "Health & Nutrition",
    filters: ["Low-Carb", "Low-Fat", "Low-Sodium", "Low-Sugar", "Low-Calorie", "Heart-Healthy", "Diabetic-Friendly", "Cholesterol-Friendly", "High-Protein", "High-Fiber", "Omega-3-Rich", "Probiotic-Rich", "Anti-Inflammatory", "Alcohol-Free", "FODMAP-Friendly"]
  },
  religious: {
    name: "Religious & Ethical",
    filters: ["Halal", "Kosher"]
  }
};

export default function DietaryFilter({ selectedFilters, setSelectedFilters }) {
  const [expanded] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const toggleFilter = (filter) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter));
    } else {
      setSelectedFilters([...selectedFilters, filter]);
    }
  };

  const clearAll = () => {
    setSelectedFilters([]);
  };

  const allFilters = Object.values(filterCategories).flatMap(cat => cat.filters);

  const getFilteredFilters = () => {
    let filters = allFilters;
    
    if (search) {
      filters = filters.filter((filter) =>
        filter.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (activeCategory !== "all") {
      filters = filters.filter(f => 
        filterCategories[activeCategory].filters.includes(f)
      );
    }

    // Sort: selected first, then alphabetically
    return [
      ...filters.filter((f) => selectedFilters.includes(f)).sort(),
      ...filters.filter((f) => !selectedFilters.includes(f)).sort(),
    ];
  };

  const filteredFilters = getFilteredFilters();

  return (
    <div className="mb-6 sm:mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Dietary Filters</h2>
          {selectedFilters.length > 0 && (
            <span className="bg-orange-500 text-white px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-bold">
              {selectedFilters.length}
            </span>
          )}
        </div>
        {selectedFilters.length > 0 && (
          <button
            onClick={clearAll}
            className="text-red-500 text-xs sm:text-sm font-semibold hover:text-red-600 transition-colors duration-150 flex items-center gap-1 px-2 sm:px-3 py-2 -mr-2 sm:-mr-3"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Clear All</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative mb-3 sm:mb-4">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search dietary filters..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-xl focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 text-gray-900 placeholder-gray-400"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-all"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1.5 sm:gap-2 mb-3 sm:mb-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        <button
          onClick={() => setActiveCategory("all")}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
            activeCategory === "all"
              ? "bg-orange-500 text-white shadow-md"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          All
        </button>
        {Object.entries(filterCategories).map(([key, category]) => (
          <button
            key={key}
            onClick={() => setActiveCategory(key)}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg whitespace-nowrap transition-all duration-200 ${
              activeCategory === key
                ? "bg-orange-500 text-white shadow-md"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            <span className="hidden sm:inline">{category.name}</span>
            <span className="sm:hidden">
              {key === "dietary" && "Dietary"}
              {key === "allergies" && "Allergies"}
              {key === "health" && "Health"}
              {key === "religious" && "Religious"}
            </span>
          </button>
        ))}
      </div>

      {/* Filters Container */}
      <div
        className={`bg-gradient-to-br from-gray-50 to-orange-50 border-2 border-gray-200 rounded-xl p-3 sm:p-4 overflow-y-auto transition-all duration-300 scrollbar-thin scrollbar-thumb-orange-400 scrollbar-track-orange-100 ${
          expanded ? "h-80 sm:h-96" : "h-40 sm:h-48"
        }`}
      >
        {filteredFilters.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {filteredFilters.map((filter, i) => (
              <button
                key={i}
                onClick={() => toggleFilter(filter)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                  selectedFilters.includes(filter)
                    ? "bg-orange-500 text-white border-orange-600 shadow-md hover:bg-orange-600 hover:shadow-lg transform hover:scale-105"
                    : "bg-white text-gray-700 border-gray-300 hover:border-orange-300 hover:bg-orange-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full flex items-center justify-center mb-2 sm:mb-3">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-sm sm:text-base text-gray-600 font-medium mb-1">No filters found</p>
            <p className="text-xs sm:text-sm text-gray-500">Try adjusting your search or category</p>
          </div>
        )}
      </div>

      {/* Selected Filters Summary */}
      {selectedFilters.length > 0 && (
        <div className="mt-3 sm:mt-4 bg-white rounded-xl p-3 sm:p-4 border-2 border-orange-200 shadow-sm">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
            <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">
              Active Filters
            </h3>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {selectedFilters.map((filter) => (
              <div
                key={filter}
                className="group bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg pl-3 sm:pl-4 pr-1.5 sm:pr-2 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-sm hover:shadow-md transition-all duration-200"
              >
                <span className="text-xs sm:text-sm font-medium">{filter}</span>
                <button
                  onClick={() => toggleFilter(filter)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-md p-1 sm:p-1.5 transition-all duration-150"
                  aria-label={`Remove ${filter}`}
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}