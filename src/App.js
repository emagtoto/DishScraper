import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider } from "./context/UserContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import RecipeFinder from "./pages/RecipeFinder";
import SavedRecipes from "./pages/SavedRecipes";
import UserProfile from "./pages/UserProfile";
import History from "./pages/History";

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/recipes"
              element={
                <>
                  <Navbar />
                  <RecipeFinder />
                </>
              }
            />
            <Route
              path="/saved"
              element={
                <>
                  <Navbar />
                  <SavedRecipes />
                </>
              }
            />
            <Route
              path="/profile"
              element={
                <>
                  <Navbar />
                  <UserProfile />
                </>
              }
            />
            <Route
              path="/history"
              element={
                <>
                  <Navbar />
                  <History />
                </>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;