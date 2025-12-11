import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AuthModal from "../components/AuthModal";
import Navbar from "../components/Navbar";
import { Search, ChefHat, Sparkles, Globe, Database, ArrowRight, Check, Leaf, Heart} from "lucide-react";

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-16 md:pt-20 pb-16 sm:pb-20 md:pb-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 leading-tight">
            Find recipes from what you have
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 mb-10 sm:mb-12 max-w-3xl mx-auto leading-relaxed">
            Search across 10,000+ recipes, AI-generated suggestions, and curated options. Get personalized results based on your ingredients and dietary needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 sm:mb-16">
            <Link
              to="/recipes"
              className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Search className="w-5 h-5" />
              {user?.isLoggedIn ? "Go to Recipes" : "Find Recipes Now"}
            </Link>
            {!user?.isLoggedIn && (
              <button
                onClick={() => setShowAuthModal(true)}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-orange-600 px-8 sm:px-10 py-3.5 sm:py-4 rounded-lg font-bold text-base sm:text-lg transition-all duration-200 border-2 border-orange-600 shadow-md hover:shadow-lg"
              >
                Create Free Account
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-12 text-sm sm:text-base">
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span>10,000+ recipes</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span>3 recipe sources</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <div className="w-2 h-2 bg-orange-600 rounded-full"></div>
              <span>AI-powered matching</span>
            </div>
          </div>
        </div>
      </section>

      {/* Why We're Different */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-white border-t border-b border-gray-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Three sources. Better results.
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Most recipe apps search one source. We search three to give you more options.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Source 1 */}
            <div className="group bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-blue-200 transition-colors">
                <Globe className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Comprehensive Database</h3>
              <p className="text-gray-600 mb-5 leading-relaxed">
                10,000+ tested recipes with full nutrition data, cooking times, and step-by-step instructions.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Nutritional information</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Difficulty & cook time</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">User ratings</span>
                </li>
              </ul>
            </div>

            {/* Source 2 */}
            <div className="group bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-purple-200 transition-colors">
                <Database className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Optimized for Matching</h3>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Hand-curated recipes designed to work with limited ingredients. Get better results faster.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Quality over quantity</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Perfect ingredient matches</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Instant results</span>
                </li>
              </ul>
            </div>

            {/* Source 3 */}
            <div className="group bg-gradient-to-br from-orange-50 to-white p-8 rounded-2xl border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg transition-all duration-300">
              <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6 group-hover:bg-orange-200 transition-colors">
                <Sparkles className="w-7 h-7 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Generated Recipes</h3>
              <p className="text-gray-600 mb-5 leading-relaxed">
                Creative recipes generated on-the-fly based on your exact ingredients and preferences.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Personalized combinations</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Works with any ingredient</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Unique suggestions</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gradient-to-br from-orange-50 to-amber-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-12 sm:mb-16 text-center">
            Powerful tools for smarter cooking
          </h2>

          <div className="grid md:grid-cols-2 gap-10 md:gap-12">
            {/* Feature 1 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Ingredient-Based Search</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Add what's in your kitchen and we'll find recipes that use the most of it.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Add hundreds of ingredients
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    See match percentages
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Heart className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Dietary Filters</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Set your preferences once. Every search automatically respects your dietary needs and allergies.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Vegan, keto, gluten-free & more
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Manage allergies
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Filter by nutrition
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">AI Recipe Modification</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Save recipes and use AI to customize them. Double servings, swap ingredients, or adapt them instantly.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Modify ingredients
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Adjust servings
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Change cooking method
                  </li>
                </ul>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="flex gap-6">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Leaf className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Reduce Food Waste</h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Search for recipes based on what you have. Use ingredients before they spoil and save money.
                </p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Minimize waste
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Save money on groceries
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-orange-600 rounded-full"></span>
                    Cook sustainably
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 md:py-24 px-4 sm:px-6 bg-gradient-to-r from-orange-600 to-orange-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6">
            Ready to cook smarter?
          </h2>
          <p className="text-lg sm:text-xl text-orange-100 mb-10 leading-relaxed">
            Start searching by ingredients in just 2 minutes. Get better recipes, reduce food waste, and save money.
          </p>
          <Link
            to="/recipes"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 bg-white text-orange-600 px-8 sm:px-10 py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ChefHat className="w-5 h-5" />
            Find Recipes Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm sm:text-base text-orange-100">
            © {new Date().getFullYear()} DishScraper. Reduce waste, cook smarter.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
};

export default LandingPage;