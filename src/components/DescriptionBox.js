import React, { useState } from "react";
import { MessageSquare } from "lucide-react";

export default function DescriptionBox({ value, onChange }) {
  const [isFocused, setIsFocused] = useState(false);
  const charCount = value.length;
  const maxChars = 500;

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-orange-600" />
        <h2 className="text-lg font-bold text-gray-900">
          Describe Your Recipe
        </h2>
      </div>

      {/* Textarea */}
      <div className="relative">
        <textarea
          value={value}
          onChange={onChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="Tell us what you're craving... Be as detailed or simple as you'd like!"
          maxLength={maxChars}
          className={`w-full border-2 rounded-xl p-4 text-base resize-none transition-all duration-200 text-gray-900 placeholder-gray-400 ${
            isFocused
              ? "border-orange-500 ring-2 ring-orange-200 shadow-md"
              : "border-gray-200 hover:border-gray-300"
          } ${charCount >= maxChars ? "border-red-400" : ""}`}
          style={{ minHeight: "140px" }}
        />
        
        {/* Character Counter */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span
            className={`text-xs font-medium ${
              charCount >= maxChars
                ? "text-red-500"
                : charCount >= maxChars * 0.9
                ? "text-orange-500"
                : "text-gray-400"
            }`}
          >
            {charCount} / {maxChars}
          </span>
        </div>
      </div>
    </div>
  );
}