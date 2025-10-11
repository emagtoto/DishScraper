import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../context/UserContext";
import AuthModal from "../components/AuthModal";
import logo from "../assets/logo.png";
import { Search, CheckCircle, Leaf, ChefHat, Sparkles, TrendingUp, Clock, Heart, Mail, ArrowRight } from "lucide-react";

const LandingPage = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useUser();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-orange-50 via-white to-amber-50">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center text-center py-16 sm:py-24 md:py-32 lg:py-40 px-4 sm:px-6 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-24 -right-24 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-5xl w-full">
          {/* Logo and Title */}
          <div className="flex flex-col sm:flex-row items-center justify-center mb-4 sm:mb-6 animate-fade-in">
            <img src={logo} alt="DishScraper Logo" className="h-16 sm:h-20 md:h-24 w-auto mb-3 sm:mb-0 sm:mr-4 drop-shadow-2xl" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight">
              DishScraper
            </h1>
          </div>

          {/* Main Tagline */}
          <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl max-w-4xl mx-auto leading-relaxed mb-4 font-medium px-2">
            Turn your ingredients into delicious meals with AI-powered recipe discovery
          </p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8 sm:mb-10 text-xs sm:text-sm px-2">
            <span className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/30 flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Smart Matching</span>
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/30 flex items-center gap-1.5 sm:gap-2">
              <Heart className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Dietary Preferences</span>
            </span>
            <span className="bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-2 rounded-full border border-white/30 flex items-center gap-1.5 sm:gap-2">
              <Leaf className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="whitespace-nowrap">Zero Food Waste</span>
            </span>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row justify-center items-stretch sm:items-center gap-3 sm:gap-4 w-full max-w-xl mx-auto px-4">
            <Link
              to="/recipes"
              className="bg-white text-orange-600 px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-orange-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:-translate-y-1 w-full sm:w-auto text-center flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              {user?.isLoggedIn ? "Go to Recipes" : "Find Recipes Now"}
            </Link>

            {!user?.isLoggedIn ? (
              <button
                onClick={() => setShowAuthModal(true)}
                className="bg-transparent border-2 border-white px-6 sm:px-8 md:px-10 py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg hover:bg-white hover:text-orange-600 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            ) : (
              <div className="text-base sm:text-lg font-semibold bg-white/20 backdrop-blur-sm px-4 sm:px-6 py-3 sm:py-4 rounded-xl border border-white/30 flex items-center justify-center gap-2">
                <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="truncate">Welcome, <span className="font-bold">{user.name}</span>!</span>
              </div>
            )}
          </div>

          {/* Social Proof */}
          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs sm:text-sm text-orange-100 px-2">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/30 border-2 border-white"></div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/30 border-2 border-white"></div>
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white/30 border-2 border-white"></div>
              </div>
              <span className="font-semibold whitespace-nowrap">1,000+ Happy Cooks</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="font-semibold whitespace-nowrap">10,000+ Recipes Found</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-3 sm:px-4 py-2 rounded-full mb-3 sm:mb-4">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
              <span className="text-xs sm:text-sm font-semibold text-orange-700">Why DishScraper</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              Everything You Need to Cook Better
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto px-4">
              Your personal recipe assistant powered by AI and smart ingredient matching
            </p>
          </div>

          <div className="grid gap-6 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-2xl p-6 sm:p-8 rounded-2xl text-center transition-all duration-300 hover:-translate-y-2 border-2 border-orange-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-orange-200/30 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Search className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-orange-800 mb-2 sm:mb-3">
                  Smart Matching
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  AI-powered ingredient matching finds the perfect recipes using what you already have in your kitchen.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl p-6 sm:p-8 rounded-2xl text-center transition-all duration-300 hover:-translate-y-2 border-2 border-green-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-200/30 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2 sm:mb-3">
                  Diet-Friendly
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Personalized suggestions for vegan, vegetarian, keto, gluten-free, and more dietary preferences.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl p-6 sm:p-8 rounded-2xl text-center transition-all duration-300 hover:-translate-y-2 border-2 border-blue-200 relative overflow-hidden sm:col-span-2 lg:col-span-1">
              <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-blue-200/30 rounded-full -mr-12 -mt-12 sm:-mr-16 sm:-mt-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-blue-800 mb-2 sm:mb-3">
                  Zero Waste
                </h3>
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  Maximize ingredient usage, minimize food waste, and cook sustainably with our smart recommendations.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10 sm:mb-12 md:mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-100 px-3 sm:px-4 py-2 rounded-full mb-3 sm:mb-4">
              <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" />
              <span className="text-xs sm:text-sm font-semibold text-orange-700">Simple Process</span>
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 px-2">
              How It Works
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
              From ingredients to delicious meals in three easy steps
            </p>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Step 1 */}
            <div className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Select Your Ingredients</h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  Choose from hundreds of ingredients or add your own. Tell us what's in your kitchen and we'll do the rest.
                </p>
              </div>
              <Search className="hidden sm:block w-8 h-8 text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0" />
            </div>

            {/* Step 2 */}
            <div className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Set Your Preferences</h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  Apply dietary filters and describe what you're craving. Our AI understands your needs and preferences.
                </p>
              </div>
              <Sparkles className="hidden sm:block w-8 h-8 text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0" />
            </div>

            {/* Step 3 */}
            <div className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 bg-white p-6 sm:p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl sm:text-2xl flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">Discover & Cook</h3>
                <p className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
                  Get instant recipe matches from our database and AI-generated suggestions. Start cooking delicious meals!
                </p>
              </div>
              <ChefHat className="hidden sm:block w-8 h-8 text-orange-500 opacity-20 group-hover:opacity-100 transition-opacity duration-300 flex-shrink-0" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-gradient-to-br from-orange-500 via-orange-600 to-red-500 text-white text-center relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl -ml-32 sm:-ml-48 -mt-32 sm:-mt-48"></div>
          <div className="absolute bottom-0 right-0 w-64 sm:w-96 h-64 sm:h-96 bg-white/10 rounded-full blur-3xl -mr-32 sm:-mr-48 -mb-32 sm:-mb-48"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 px-2">
            Ready to Transform Your Cooking?
          </h2>
          <p className="text-base sm:text-lg md:text-xl mb-8 sm:mb-10 text-orange-100 leading-relaxed max-w-2xl mx-auto px-4">
            Join thousands of home cooks discovering perfect recipes from their available ingredients. Start your culinary journey today!
          </p>
          <Link
            to="/recipes"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="inline-flex items-center gap-2 sm:gap-3 bg-white text-orange-600 px-8 sm:px-10 md:px-12 py-3.5 sm:py-4 md:py-5 rounded-xl font-bold text-base sm:text-lg md:text-xl hover:bg-orange-50 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:-translate-y-1"
          >
            <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Start Cooking Now</span>
            <ArrowRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-300 py-10 sm:py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-8 sm:mb-10 lg:mb-12">
            {/* Brand Column */}
            <div className="sm:col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <img src={logo} alt="DishScraper" className="h-8 sm:h-10 w-auto" />
                <h3 className="text-white font-bold text-xl sm:text-2xl">DishScraper</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6 leading-relaxed max-w-md">
                Your intelligent recipe discovery platform. Turn ingredients into delicious meals with AI-powered matching and smart recommendations.
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                <a href="mailto:support@dishscraper.com" className="hover:text-orange-400 transition break-all">
                  support@dishscraper.com
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">Quick Links</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <li>
                  <Link to="/recipes" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Find Recipes</span>
                  </Link>
                </li>
                <li>
                  <Link to="/saved" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Saved Recipes</span>
                  </Link>
                </li>
                <li>
                  <Link to="/history" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Search History</span>
                  </Link>
                </li>
                <li>
                  <Link to="/profile" className="hover:text-orange-400 transition flex items-center gap-2 group">
                    <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <span>Profile</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Features */}
            <div>
              <h3 className="text-white font-bold text-base sm:text-lg mb-3 sm:mb-4">Features</h3>
              <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
                <li className="flex items-center gap-2">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                  <span>AI-Powered Search</span>
                </li>
                <li className="flex items-center gap-2">
                  <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                  <span>Dietary Filters</span>
                </li>
                <li className="flex items-center gap-2">
                  <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                  <span>Zero Food Waste</span>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0" />
                  <span>Quick & Easy</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-6 sm:pt-8">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
              <p className="text-xs sm:text-sm text-gray-400 text-center sm:text-left">
                © {new Date().getFullYear()} DishScraper. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-400">
                <span>Made with</span>
                <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-red-500 fill-current" />
                <span>for food lovers</span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default LandingPage;