import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import { Clock, Search, Filter, FileText, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { removeSearchHistory, clearAllHistory } from "../services/userService";

const History = () => {
  const { user, setUser } = useUser();
  const [hoveredItem, setHoveredItem] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showClearAllModal, setShowClearAllModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
    });
  };

  const handleRepeatSearch = (item) => {
    // Encode search parameters to pass via URL
    const searchParams = new URLSearchParams();
    searchParams.set('ingredients', JSON.stringify(item.ingredients));
    searchParams.set('filters', JSON.stringify(item.filters));
    if (item.description) {
      searchParams.set('description', item.description);
    }
    
    // Navigate to RecipeFinder with search parameters
    navigate(`/recipes?${searchParams.toString()}`);
  };

  const handleDelete = async (itemId) => {
    if (!user?.uid) return;

    setItemToDelete(itemId);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!user?.uid || !itemToDelete) return;

    const result = await removeSearchHistory(user.uid, itemToDelete);
    
    if (result.success) {
      setUser({
        ...user,
        history: user.history.filter(item => item.id !== itemToDelete)
      });
    } else {
      alert("Failed to delete search. Please try again.");
    }

    setShowDeleteModal(false);
    setItemToDelete(null);
  };

  const handleClearAll = async () => {
    if (!user?.uid) return;
    setShowClearAllModal(true);
  };

  const confirmClearAll = async () => {
    if (!user?.uid) return;

    const result = await clearAllHistory(user.uid);
    
    if (result.success) {
      setUser({ ...user, history: [] });
    } else {
      alert("Failed to clear history. Please try again.");
    }

    setShowClearAllModal(false);
  };

  if (!user.isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Sign In Required</h2>
            <p className="text-gray-600 mb-6">
              Please log in to view your search history and track your recipe discoveries.
            </p>
            <button className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-semibold hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl">
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Delete Confirmation Modal
  const DeleteModal = () => {
    if (!showDeleteModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Delete Search?</h3>
          </div>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete this search from your history? This action cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setItemToDelete(null);
              }}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Clear All Confirmation Modal
  const ClearAllModal = () => {
    if (!showClearAllModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-scaleIn">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">Clear All History?</h3>
          </div>
          
          <p className="text-gray-600 mb-2">
            Are you sure you want to clear all your search history?
          </p>
          <p className="text-red-600 font-semibold text-sm mb-6">
            This will permanently delete all {user.history?.length || 0} search{user.history?.length !== 1 ? 'es' : ''} and cannot be undone.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setShowClearAllModal(false)}
              className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-all duration-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmClearAll}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-orange-50 p-6">
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>

      <DeleteModal />
      <ClearAllModal />
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-800">Search History</h1>
              <p className="text-gray-600 mt-1">
                Track and revisit your recipe searches
              </p>
            </div>
          </div>
          
          {user.history && user.history.length > 0 && (
            <div className="flex items-center gap-6 mt-6 p-4 bg-white rounded-xl shadow-md">
              <div className="flex items-center gap-2">
                <Search className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-gray-800">{user.history.length}</p>
                  <p className="text-sm text-gray-500">Total Searches</p>
                </div>
              </div>
              <div className="h-12 w-px bg-gray-200"></div>
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Last search</p>
                  <p className="text-sm font-semibold text-gray-800">
                    {formatDate(user.history[user.history.length - 1]?.date)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* History Items */}
        {!user.history || user.history.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">No History Yet</h2>
            <p className="text-gray-600 mb-2">
              Your recipe searches will appear here!
            </p>
            <p className="text-gray-500 text-sm">
              Start exploring recipes to build your search history.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {user.history.slice().reverse().map((item, index) => (
              <div
                key={item.id}
                onMouseEnter={() => setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200"
              >
                <div className="p-6">
                  {/* Header with date and delete button */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 font-bold text-sm">
                          #{user.history.length - index}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-700">
                          {formatDate(item.date)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.date).toLocaleString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className={`p-2 rounded-lg transition-all duration-300 ${
                        hoveredItem === item.id
                          ? 'bg-red-50 text-red-600 opacity-100'
                          : 'text-gray-400 opacity-0 group-hover:opacity-100'
                      } hover:bg-red-100`}
                      aria-label="Delete search"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Content Grid */}
                  <div className="grid gap-4">
                    {/* Ingredients */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                        <Search className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Ingredients
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.ingredients.map((ingredient, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm rounded-full font-medium shadow-sm"
                            >
                              {ingredient}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Filters */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Filter className="w-5 h-5 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                          Dietary Filters
                        </p>
                        {item.filters.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {item.filters.map((filter, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-blue-100 text-blue-700 text-sm rounded-full font-medium"
                              >
                                {filter}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-400 text-sm italic">No filters applied</p>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                            Description
                          </p>
                          <p className="text-gray-700 text-sm leading-relaxed">
                            "{item.description}"
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Repeat Search Button */}
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleRepeatSearch(item)}
                      className="w-full px-4 py-2 bg-gray-50 hover:bg-orange-50 text-gray-700 hover:text-orange-600 rounded-lg font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 group"
                    >
                      <Search className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      Repeat This Search
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Clear All Button */}
        {user.history && user.history.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={handleClearAll}
              className="px-6 py-3 bg-white hover:bg-red-50 text-red-600 rounded-xl font-semibold border-2 border-red-200 hover:border-red-300 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 mx-auto"
            >
              <Trash2 className="w-4 h-4" />
              Clear All History
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default History;