import { doc, setDoc, getDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../firebase";

export const saveUserData = async (uid, data) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error saving user data:", error);
    return { success: false, error };
  }
};

export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      return { success: true, data: docSnap.data() };
    } else {
      return { success: true, data: null };
    }
  } catch (error) {
    console.error("Error getting user data:", error);
    return { success: false, error };
  }
};

export const addSavedRecipe = async (uid, recipe) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      savedRecipes: arrayUnion(recipe)
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding saved recipe:", error);
    return { success: false, error };
  }
};

export const removeSavedRecipe = async (uid, recipe) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      savedRecipes: arrayRemove(recipe)
    });
    return { success: true };
  } catch (error) {
    console.error("Error removing saved recipe:", error);
    return { success: false, error };
  }
};

export const updateDietaryFilters = async (uid, filters) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      dietaryFilters: filters
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating dietary filters:", error);
    return { success: false, error };
  }
};

// --- THIS IS THE NEW FUNCTION YOU NEED ---
export const updateUserName = async (uid, newName) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      name: newName
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating user name:", error);
    return { success: false, error };
  }
};
// -----------------------------------------

export const addSearchHistory = async (uid, searchData) => {
  try {
    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, {
      history: arrayUnion(searchData)
    });
    return { success: true };
  } catch (error) {
    console.error("Error adding search history:", error);
    return { success: false, error };
  }
};

/**
 * Remove a single search history item
 */
export const removeSearchHistory = async (uid, historyItemId) => {
  try {
    const userRef = doc(db, "users", uid);
    
    // Get the user's current history
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      return { success: false, error: "User not found" };
    }
    
    const userData = userDoc.data();
    const currentHistory = userData.history || [];
    
    // Filter out the item to remove
    const updatedHistory = currentHistory.filter(item => item.id !== historyItemId);
    
    // Update Firestore
    await updateDoc(userRef, {
      history: updatedHistory
    });

    return { success: true };
  } catch (error) {
    console.error("Error removing search history:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Clear all search history
 */
export const clearAllHistory = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    
    await updateDoc(userRef, {
      history: []
    });

    return { success: true };
  } catch (error) {
    console.error("Error clearing history:", error);
    return { success: false, error: error.message };
  }
};