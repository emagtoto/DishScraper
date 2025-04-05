import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDOi70_FOFJx7dxzkDCnKq8hEIkr6iNJIY",
  authDomain: "dishscraper-15d1d.firebaseapp.com",
  projectId: "dishscraper-15d1d",
  storageBucket: "dishscraper-15d1d.firebasestorage.app",
  messagingSenderId: "117276141159",
  appId: "1:117276141159:web:f904be3b371d68d56dd6c2",
  measurementId: "G-0HJTPKSN6G"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore(app);

// Google Auth Provider
const provider = new GoogleAuthProvider();

// Google Sign-In function
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('User signed in:', user);

    // Store user data in Firestore
    await setDoc(doc(db, "users", user.uid), {
      name: user.displayName,
      email: user.email,
      profilePic: user.photoURL,
      lastLogin: new Date(),
    });

    alert('You are signed in!');
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    alert('Error during sign-in');
  }
};

// Function to save recipes to Firestore
const saveRecipe = async (recipe) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      alert('You need to sign in to save a recipe!');
      return;
    }

    // Save the recipe to Firestore under the user's UID
    await setDoc(doc(db, "users", user.uid, "recipes", recipe.id), {
      name: recipe.name,
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      image: recipe.image,
      createdAt: new Date(),
    });

    alert('Recipe saved successfully!');
  } catch (error) {
    console.error('Error saving recipe:', error);
    alert('Error saving recipe');
  }
};

const saveRecipeBtn = document.getElementById("save-recipe-btn");

saveRecipeBtn.addEventListener("click", async () => {
  const recipe = {
    title: "Spaghetti Bolognese",
    ingredients: ["spaghetti", "tomato", "ground beef", "onion", "garlic"],
    instructions: "1. Boil spaghetti. 2. Cook beef with onions. 3. Add tomato sauce.",
    createdBy: auth.currentUser.uid,
    timestamp: new Date(),
  };

  try {
    await saveRecipeToFirestore(recipe);
    console.log("Recipe saved successfully.");
  } catch (error) {
    console.error("Error saving recipe: ", error);
  }
});

async function saveRecipeToFirestore(recipe) {
  try {
    const recipeRef = doc(db, "recipes", `${recipe.createdBy}-${Date.now()}`);
    await setDoc(recipeRef, recipe);
  } catch (error) {
    console.error("Error saving recipe to Firestore: ", error);
  }
}
