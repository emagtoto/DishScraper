import React, { useState, useRef, useEffect } from "react";
import { useLocation } from "react-router-dom";
import IngredientSelector from "../components/IngredientSelector";
import DietaryFilter from "../components/DietaryFilter";
import DescriptionBox from "../components/DescriptionBox";
import RecipeCard from "../components/RecipeCard";
import RecipeModal from "../components/RecipeModal";
import AuthModal from "../components/AuthModal";
import TermsModal from "../components/TermsModal";
import { useUser } from "../context/UserContext";
import { addSavedRecipe, addSearchHistory } from "../services/userService";
import apiService from "../services/apiService";
import { generateAIRecipes } from "../services/aiService";
import { filterRecipesByDescription } from "../services/descriptionFilterService";
import { searchLocalRecipes } from "../services/localRecipeService";
import { AlertCircle, CheckCircle, Info, X, Search, ChefHat, Sparkles, Database, Globe, ArrowUp, ArrowDown } from "lucide-react";
import cookingGif from "../assets/cooking.gif";

const RecipeFinder = () => {
  const { user, setUser } = useUser();
  const location = useLocation();
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState(user.dietaryFilters || []);
  const [description, setDescription] = useState("");
  const [apiResults, setApiResults] = useState([]);
  const [aiResults, setAiResults] = useState([]);
  const [localResults, setLocalResults] = useState([]);
  const [apiExpanded, setApiExpanded] = useState(false);
  const [localExpanded, setLocalExpanded] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isMandatoryTermsView, setIsMandatoryTermsView] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [loadingApi, setLoadingApi] = useState(false);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [notification, setNotification] = useState(null);
  const [searchDots, setSearchDots] = useState("");
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showJumpToResults, setShowJumpToResults] = useState(false);

  const resultsRef = useRef(null);
  const notificationTimeoutRef = useRef(null);
  const hasLoadedUrlParams = useRef(false);
  const hasScrolledToResults = useRef(false);
  const hasAnimatedFadeIn = useRef(false);

  // Lock/unlock body scroll when modals open/close
  useEffect(() => {
    const isModalOpen = selectedRecipe || showAuthModal || (showTermsModal && isMandatoryTermsView);

    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedRecipe, showAuthModal, showTermsModal, isMandatoryTermsView]);

  // Load search parameters from URL on mount
  useEffect(() => {
    if (hasLoadedUrlParams.current) return;

    const searchParams = new URLSearchParams(location.search);
    const ingredientsParam = searchParams.get('ingredients');
    const filtersParam = searchParams.get('filters');
    const descriptionParam = searchParams.get('description');

    if (ingredientsParam || filtersParam || descriptionParam) {
      hasLoadedUrlParams.current = true;

      try {
        if (ingredientsParam) {
          const ingredients = JSON.parse(ingredientsParam);
          setSelectedIngredients(ingredients);
        }
        if (filtersParam) {
          const filters = JSON.parse(filtersParam);
          setSelectedFilters(filters);
        }
        if (descriptionParam) {
          setDescription(descriptionParam);
        }

        window.history.replaceState({}, '', '/recipes');

        setTimeout(() => {
          showNotification("Search loaded from history! Click 'Find Recipes' to search again.", "info", 5000);
        }, 300);
      } catch (error) {
        console.error("Error parsing URL parameters:", error);
      }
    }
  }, [location.search]);

  useEffect(() => {
    if (!isSearching) {
      setSearchDots("");
      return;
    }

    const interval = setInterval(() => {
      setSearchDots(prev => (prev.length < 3 ? prev + "." : ""));
    }, 500);

    return () => clearInterval(interval);
  }, [isSearching]);

  // Handle scroll for navigation buttons
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const totalResults = apiResults.length + aiResults.length + localResults.length;

      setShowBackToTop(scrollPosition > 300);

      if (totalResults > 0 && resultsRef.current) {
        const resultsPosition = resultsRef.current.offsetTop;
        setShowJumpToResults(scrollPosition < resultsPosition - 200);
      } else {
        setShowJumpToResults(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [apiResults, aiResults, localResults]);

  // Notification system
  const showNotification = (message, type = "info", duration = 5000) => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }

    setNotification({ message, type });

    if (duration > 0) {
      notificationTimeoutRef.current = setTimeout(() => {
        setNotification(null);
      }, duration);
    }
  };

  const closeNotification = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    setNotification(null);
  };

  useEffect(() => {
    const hasAcceptedTerms = sessionStorage.getItem("hasAcceptedTerms");
    if (!hasAcceptedTerms) {
      setIsMandatoryTermsView(true);
      setShowTermsModal(true);
    }
  }, []);

  const handleCloseTerms = () => {
    if (isMandatoryTermsView) {
      sessionStorage.setItem("hasAcceptedTerms", "true");
      setIsMandatoryTermsView(false);
    }
    setShowTermsModal(false);
  };

  useEffect(() => {
    setSelectedFilters(user.dietaryFilters || []);
  }, [user.dietaryFilters]);

  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  const smoothScrollTo = (target) => {
    const start = window.scrollY;
    const end = target === document.body ? 0 : target.getBoundingClientRect().top + window.scrollY;
    const distance = end - start;
    const duration = 1500;
    let startTime = null;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    const animation = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, start + distance * eased);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    requestAnimationFrame(animation);
  };

  const scrollToTop = () => {
    smoothScrollTo(document.body);
  };

  const scrollToResults = () => {
    if (resultsRef.current) {
      smoothScrollTo(resultsRef.current);
    }
  };

  useEffect(() => {
    const totalResults = apiResults.length + aiResults.length + localResults.length;

    if (totalResults > 0 && !hasAnimatedFadeIn.current) {
      hasAnimatedFadeIn.current = true;

      setTimeout(() => {
        if (resultsRef.current) smoothScrollTo(resultsRef.current);
        setFadeIn(true);
      }, 50);
    }
  }, [apiResults, aiResults, localResults]);

  const sortRecipes = (recipes) => {
    return [...recipes].sort((a, b) => {
      const matchDiff = (b.matchingIngredients || 0) - (a.matchingIngredients || 0);
      if (matchDiff !== 0) {
        return matchDiff;
      }
      return (b.relevanceScore || 0) - (a.relevanceScore || 0);
    });
  };

  const fetchRecipes = async () => {
    if (selectedIngredients.length === 0) {
      showNotification("Please select at least one ingredient to start searching!", "warning");
      return;
    }

    hasScrolledToResults.current = false;
    hasAnimatedFadeIn.current = false;

    setIsSearching(true);
    setApiResults([]);
    setLocalResults([]);
    setAiResults([]);
    setFadeIn(false);

    if (user?.isLoggedIn && user.uid) {
      const newHistoryItem = {
        id: Date.now(),
        date: new Date().toLocaleString(),
        ingredients: selectedIngredients,
        filters: selectedFilters,
        description,
      };
      await addSearchHistory(user.uid, newHistoryItem);
      setUser({ ...user, history: [...(user.history || []), newHistoryItem] });
    }

    try {
      const localPromise = (async () => {
        setLoadingLocal(true);
        try {
          const filteredLocal = await searchLocalRecipes(
            selectedIngredients,
            selectedFilters,
            description
          );

          if (filteredLocal.length) {
            setLocalResults(sortRecipes(filteredLocal));
            console.log(`✅ Local: ${filteredLocal.length} recipes sorted.`);
          }
          return filteredLocal;
        } finally {
          setLoadingLocal(false);
        }
      })();

      const aiPromise = (async () => {
        setLoadingAI(true);
        try {
          const result = await generateAIRecipes(
            selectedIngredients,
            selectedFilters,
            description,
            3
          );
          const recipes = result?.data || [];

          if (recipes.length) {
            setAiResults(sortRecipes(recipes));
            console.log(`✅ AI: ${recipes.length} recipes sorted.`);
          }
          return recipes;
        } finally {
          setLoadingAI(false);
        }
      })();

      const spoonacularPromise = (async () => {
        setLoadingApi(true);
        try {
          const result = await apiService.complexRecipeSearch(
            selectedIngredients,
            selectedFilters,
            1000,
            description,
            async (intermediateResults) => {
              if (intermediateResults.length === 0) return;

              const originalMatchData = new Map(
                intermediateResults.map(r => [r.id, {
                  matchingIngredients: r.matchingIngredients,
                  matchPercentage: r.matchPercentage,
                  matchedIngredientsList: r.matchedIngredientsList,
                  relevanceScore: r.relevanceScore
                }])
              );

              let filteredBatch = intermediateResults;

              if (description.trim() && filteredBatch.length > 0) {
                try {
                  filteredBatch = await filterRecipesByDescription(filteredBatch, description);
                } catch (err) {
                  console.error("Description filter error:", err);
                }
              }

              filteredBatch = filteredBatch.map(recipe => {
                const matchData = originalMatchData.get(recipe.id);
                if (matchData) {
                  return {
                    ...recipe,
                    matchingIngredients: matchData.matchingIngredients,
                    matchPercentage: matchData.matchPercentage,
                    matchedIngredientsList: matchData.matchedIngredientsList,
                    relevanceScore: matchData.relevanceScore
                  };
                }
                return recipe;
              });

              setApiResults(sortRecipes(filteredBatch));
            }
          );

          const spoonacularData = result?.data || [];
          console.log(`✅ Spoonacular complete: ${spoonacularData.length} recipes`);

          return spoonacularData;
        } catch (err) {
          console.error("Spoonacular API Error:", err);
          return [];
        } finally {
          setLoadingApi(false);
        }
      })();

      const [filteredLocal, aiData] = await Promise.all([
        localPromise,
        aiPromise,
        spoonacularPromise
      ]);

      setIsSearching(false);

      const finalApiCount = apiResults.length;
      const totalRecipes = finalApiCount + filteredLocal.length + aiData.length;

      if (totalRecipes === 0) {
        if (description.trim()) {
          showNotification(
            "No recipes found matching your description. Try adjusting it or removing it for broader results.",
            "warning",
            7000
          );
        } else {
          showNotification(
            "No recipes found. Try adjusting your ingredients or filters for better results.",
            "warning",
            7000
          );
        }
      } else {
        console.log(`🎉 Search complete! Total: ${totalRecipes} recipes`);
        showNotification(
          `Found ${totalRecipes} delicious recipe${totalRecipes === 1 ? '' : 's'} for you!`,
          "success",
          4000
        );
      }

    } catch (error) {
      console.error("Error fetching recipes:", error);
      setIsSearching(false);
      setLoadingApi(false);
      setLoadingLocal(false);
      setLoadingAI(false);
      showNotification(
        "An error occurred while searching. Please try again.",
        "error",
        6000
      );
    }
  };

  const saveRecipe = async (recipe) => {
    if (!user?.isLoggedIn || !user.uid) {
      setShowAuthModal(true);
      return;
    }
    if (user.savedRecipes.find((r) => r.id === recipe.id)) {
      showNotification("This recipe is already saved!", "info", 3000);
      return;
    }
    const result = await addSavedRecipe(user.uid, recipe);
    if (result.success) {
      setUser({ ...user, savedRecipes: [...user.savedRecipes, recipe] });
      showNotification("Recipe saved successfully!", "success", 3000);
    } else {
      showNotification("Failed to save recipe. Please try again.", "error", 4000);
    }
  };

  const renderResults = (title, results, expanded, setExpanded, icon, loading, hideExpand = false) => {
    const IconComponent = icon;
    const shouldShowExpandButton = results.length > 3 && !hideExpand;

    return (
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="p-1.5 sm:p-2 bg-orange-100 rounded-lg">
            <IconComponent className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
          </div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">{title}</h2>
          {loading ? (
            <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 rounded-full">
              <span className="flex items-center gap-1.5 sm:gap-2">
                <img
                  src={cookingGif}
                  alt="loading"
                  className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 lg:w-12 lg:h-12"
                />
                <span className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-medium text-orange-700">
                  Loading{searchDots}
                </span>
              </span>
            </div>
          ) : results.length > 0 ? (
            <span className="bg-orange-100 text-orange-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-bold border border-orange-200">
              {results.length} {results.length === 1 ? "recipe" : "recipes"}
            </span>
          ) : null}
        </div>

        {results.length === 0 && !loading ? (
          <div className="bg-white rounded-xl border-2 border-gray-200 p-6 sm:p-8 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3">
              <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <p className="text-sm sm:text-base text-gray-500 font-medium">No recipes found from this source</p>
          </div>
        ) : (
          <>
            <div
              className={`overflow-y-auto border-2 border-gray-200 rounded-xl p-3 sm:p-4 md:p-6 bg-white shadow-sm transition-all duration-300 ${expanded ? "max-h-[600px] sm:max-h-[900px]" : "max-h-[400px] sm:max-h-[450px]"
                }`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                {results.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onClick={(r) => setSelectedRecipe(r)}
                    onSave={saveRecipe}
                    showSaveButton={true}
                    sourceTag={recipe.source || "Spoonacular"}
                    onAuthRequired={() => setShowAuthModal(true)} // ADD THIS LINE
                  />
                ))}
              </div>
            </div>

            {shouldShowExpandButton && (
              <div className="text-center mt-3 sm:mt-4">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="px-4 sm:px-6 py-2 text-sm sm:text-base text-orange-600 font-semibold hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200"
                >
                  {expanded ? "Show Less ▲" : "Show More ▼"}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const NotificationBanner = () => {
    if (!notification) return null;

    const icons = {
      success: <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      error: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      warning: <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />,
      info: <Info className="w-4 h-4 sm:w-5 sm:h-5" />
    };

    const styles = {
      success: "bg-orange-50 border-orange-500 text-orange-800",
      error: "bg-red-50 border-red-500 text-red-800",
      warning: "bg-yellow-50 border-yellow-500 text-yellow-800",
      info: "bg-blue-50 border-blue-500 text-blue-800"
    };

    return (
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-slideDown">
        <div className={`${styles[notification.type]} rounded-xl shadow-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3`}>
          <div className="flex-shrink-0 mt-0.5">
            {icons[notification.type]}
          </div>
          <p className="flex-1 text-xs sm:text-sm font-medium">
            {notification.message}
          </p>
          <button
            onClick={closeNotification}
            className="flex-shrink-0 hover:opacity-70 transition-opacity"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -100%);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>

      <NotificationBanner />

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-orange-700 to-orange-800 text-white p-3 sm:p-4 rounded-full shadow-xl hover:shadow-2xl hover:from-orange-600 hover:to-orange-900 transition-all duration-300 hover:scale-110 group"
          aria-label="Back to top"
        >
          <ArrowUp className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
        </button>
      )}

      {showJumpToResults && (apiResults.length > 0 || aiResults.length > 0 || localResults.length > 0) && (
        <button
          onClick={scrollToResults}
          className="fixed bottom-6 left-6 z-40 bg-gradient-to-r from-orange-700 to-orange-800 text-white px-4 py-3 sm:px-5 sm:py-4 rounded-full
          shadow-xl hover:shadow-2xl hover:from-orange-600 hover:to-orange-800 transition-all duration-300 hover:scale-105 group flex items-center gap-2"
          aria-label="Jump to results"
        >
          <span className="text-sm sm:text-base font-semibold hidden sm:inline">View Results</span>
          <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 group-hover:animate-bounce" />
        </button>
      )}

      <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-2 sm:mb-3 px-4">
            Find Your Perfect Recipe
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Select ingredients, set your preferences, and discover amazing dishes tailored to your taste
          </p>
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl border border-gray-100 p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10">
          <IngredientSelector
            selectedIngredients={selectedIngredients}
            setSelectedIngredients={setSelectedIngredients}
          />
          <DietaryFilter selectedFilters={selectedFilters} setSelectedFilters={setSelectedFilters} />
          <DescriptionBox value={description} onChange={(e) => setDescription(e.target.value)} />

          <div className="mt-6 sm:mt-8 text-center">
            <button
              onClick={fetchRecipes}
              disabled={selectedIngredients.length === 0 || isSearching}
              className={`w-full sm:w-auto px-8 sm:px-10 md:px-12 py-3 sm:py-3.5 md:py-4 rounded-xl font-bold text-sm sm:text-base md:text-lg transition-all duration-300 text-white shadow-lg inline-flex items-center justify-center gap-2 sm:gap-3 ${selectedIngredients.length === 0 || isSearching
                ? "bg-orange-400 cursor-not-allowed"
                : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 hover:shadow-xl hover:-translate-y-0.5"
                }`}
            >
              <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              {isSearching ? `Searching${searchDots}` : "Find Recipes"}
            </button>

            {selectedIngredients.length === 0 && (
              <p className="text-xs sm:text-sm text-red-600 mt-3 font-medium flex items-center justify-center gap-1.5 sm:gap-2 px-4">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Please select at least one ingredient to begin</span>
              </p>
            )}
          </div>
        </div>

        {/* Results Section */}
        {(apiResults.length > 0 || aiResults.length > 0 || localResults.length > 0) && (
          <div
            ref={resultsRef}
            className={`transform transition-all duration-700 ease-in-out ${fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              }`}
          >
            {/* Results Header */}
            <div className="mb-6 sm:mb-8 bg-white rounded-xl border-2 border-orange-200 p-4 sm:p-5 md:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                <div>
                  <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Search Results</h2>
                  <p className="text-sm sm:text-base text-gray-600">
                    Discovered <span className="font-bold text-orange-600">
                      {apiResults.length + localResults.length + aiResults.length}
                    </span> delicious recipes matching your criteria
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-orange-50 px-3 sm:px-4 py-2 rounded-lg border border-orange-200">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                  <span className="text-xs sm:text-sm font-semibold text-orange-700">
                    {apiResults.length + localResults.length + aiResults.length} Total
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamically ordered results */}
            {(() => {
              const sections = [
                {
                  key: "api",
                  title: "Spoonacular Recipes",
                  results: apiResults,
                  expanded: apiExpanded,
                  setExpanded: setApiExpanded,
                  icon: Globe,
                  loading: loadingApi,
                  hideExpand: false
                },
                {
                  key: "local",
                  title: "Local Recipes",
                  results: localResults,
                  expanded: localExpanded,
                  setExpanded: setLocalExpanded,
                  icon: Database,
                  loading: loadingLocal,
                  hideExpand: false
                },
                {
                  key: "ai",
                  title: "AI Generated Recipes",
                  results: aiResults,
                  expanded: false,
                  setExpanded: () => { },
                  icon: Sparkles,
                  loading: loadingAI,
                  hideExpand: true
                }
              ];

              const sortedSections = [...sections].sort((a, b) => {
                const aHasResults = a.results.length > 0;
                const bHasResults = b.results.length > 0;
                const aIsLoading = a.loading && a.results.length === 0;
                const bIsLoading = b.loading && b.results.length === 0;

                if (aHasResults && !bHasResults) return -1;
                if (!aHasResults && bHasResults) return 1;

                if (aIsLoading && !bIsLoading) return -1;
                if (!aIsLoading && bIsLoading) return 1;

                return 0;
              });

              return sortedSections.map((section) => (
                <div key={section.key}>
                  {renderResults(
                    section.title,
                    section.results,
                    section.expanded,
                    section.setExpanded,
                    section.icon,
                    section.loading,
                    section.hideExpand
                  )}
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-8 sm:py-10 md:py-12 mt-12 sm:mt-16 md:mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8" />
                <h3 className="text-xl sm:text-2xl font-bold">DishScraper</h3>
              </div>
              <p className="text-orange-100 text-sm sm:text-base mb-4 max-w-md">
                Your intelligent recipe discovery platform. Find, save, and explore thousands of recipes tailored to your ingredients and preferences.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Legal</h3>
              <ul className="space-y-2 text-sm sm:text-base text-orange-100">
                <li>
                  <button
                    onClick={() => setShowTermsModal(true)}
                    className="hover:text-white transition-colors flex items-center gap-2"
                  >
                    → Terms & Conditions
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-orange-400 pt-4 sm:pt-6">
            <p className="text-center text-sm sm:text-base text-orange-100">
              &copy; {new Date().getFullYear()} DishScraper. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedRecipe && (
        <RecipeModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onAuthRequired={() => setShowAuthModal(true)} // ADD THIS LINE
        />
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
        />
      )}

      {showTermsModal && (
        <TermsModal
          isOpen={showTermsModal}
          onClose={handleCloseTerms}
        />
      )}

    </div>
  );
};

export default RecipeFinder;