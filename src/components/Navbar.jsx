import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User } from "lucide-react";
import { useUser } from "../context/UserContext";
import AuthModal from "./AuthModal";
import logo from "../assets/logo.png";

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    setIsDropdownOpen(false);
    navigate("/");
  };

  return (
    <nav className="bg-orange-500 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/recipes" className="flex items-center space-x-2">
          <img
            src={logo}
            alt="DishScraper Logo"
            className="h-10 w-auto"
          />
          <span className="text-white font-bold text-lg">
            DishScraper
          </span>
        </Link>

        <div className="relative">
          <button
            className="flex items-center space-x-2 text-white hover:text-orange-200"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <User className="w-6 h-6" />
            <span className="hidden sm:inline">
              {user.isLoggedIn ? user.name || "User" : "Login / Sign Up"}
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white shadow-lg rounded-md overflow-hidden z-50">
              {user.isLoggedIn ? (
                <>
                  <Link
                    to="/profile"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Profile
                  </Link>

                  <Link
                    to="/saved"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    Saved Recipes
                  </Link>

                  <Link
                    to="/history"
                    className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    History
                  </Link>

                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                  onClick={() => {
                    setShowAuthModal(true);
                    setIsDropdownOpen(false);
                  }}
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </nav>
  );
}