import React, { useState } from "react";
import RecipeCard from "./RecipeCard";

export default function RecipeResults({ webResults = [], aiResults = [], onSelect }) {
  const [webExpanded, setWebExpanded] = useState(false);

  // Modified: No expansion state for AI results
  const renderSection = (title, results, expanded, setExpanded, hideExpandButton = false) => {
    if (!results || results.length === 0) return null;

    return (
      <div className="mb-10">
        <h2 className="text-2xl font-bold mb-4">{title}</h2>

        <div
          className={`border rounded-lg p-4 bg-white shadow-inner overflow-y-auto transition-all ${
            expanded ? "max-h-[700px]" : "max-h-[300px]"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((recipe, i) => (
              <div key={i} className="flex flex-col">
                <RecipeCard recipe={recipe} onClick={onSelect} />
              </div>
            ))}
          </div>
        </div>

        {/* Hide button if hideExpandButton is true */}
        {!hideExpandButton && (
          <div className="text-center mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-orange-500 text-lg font-semibold hover:underline"
            >
              {expanded ? "Show Less ▲" : "Show More ▼"}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-10">
      {/* Web results keep Show More */}
      {renderSection("Best Matches from the Web", webResults, webExpanded, setWebExpanded)}

      {/* AI results: hide Expand button and always show fully */}
      {renderSection("AI Generated Recipes", aiResults, true, null, true)}
    </div>
  );
}
