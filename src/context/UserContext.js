import React, { createContext, useContext, useState, useEffect } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { getUserData, saveUserData } from "../services/userService";

const UserContext = createContext();

const defaultUser = {
  uid: null,
  name: "",
  email: "",
  dietaryFilters: [],
  savedRecipes: [],
  history: [],
  isLoggedIn: false,
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(defaultUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const result = await getUserData(firebaseUser.uid);
        
        if (result.success && result.data) {
          setUser({
            uid: firebaseUser.uid,
            name: result.data.name || firebaseUser.displayName || "User",
            email: firebaseUser.email,
            dietaryFilters: result.data.dietaryFilters || [],
            savedRecipes: result.data.savedRecipes || [],
            history: result.data.history || [],
            isLoggedIn: true,
          });
        } else {
          const newUserData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || "User",
            email: firebaseUser.email,
            dietaryFilters: [],
            savedRecipes: [],
            history: [],
            createdAt: new Date().toISOString(),
          };
          
          await saveUserData(firebaseUser.uid, newUserData);
          
          setUser({
            ...newUserData,
            isLoggedIn: true,
          });
        }
      } else {
        setUser(defaultUser);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(defaultUser);
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, setUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);