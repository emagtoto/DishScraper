// Import the Firestore db instance from your firebase config
import { db } from "../firebase";

// Import the Firestore functions we need
import { doc, writeBatch, collection } from "firebase/firestore";

// Import the local JSON data
import recipes from "../data/recipes_meta.json";

/**
 * Uploads all recipes from recipes_meta.json to a 'recipes' collection in Firestore.
 * It uses the recipe's 'id' field as the document ID.
 * This is a one-time script.
 */
export const uploadAllRecipesToFirestore = async () => {
  if (!recipes || recipes.length === 0) {
    console.error("No recipes found in recipes_meta.json");
    return;
  }

  console.log(`Starting upload of ${recipes.length} recipes to Firestore...`);

  const recipesCollectionRef = collection(db, "recipes");
  
  // Use a WriteBatch for efficient bulk upload (Firestore has a 500-operation limit per batch)
  let batch = writeBatch(db);
  let operationCount = 0;

  try {
    for (const recipe of recipes) {
      // Skip any recipe that might be missing an ID
      if (recipe.id === undefined || recipe.id === null) {
        console.warn("Skipping recipe with missing ID:", recipe.title);
        continue;
      }
      
      // Use the recipe.id as the document ID (must be a string)
      const docId = String(recipe.id);
      const recipeRef = doc(recipesCollectionRef, docId);
      
      batch.set(recipeRef, recipe);
      operationCount++;

      // When we hit the 500 limit, commit the batch and start a new one
      if (operationCount % 499 === 0) {
        await batch.commit();
        batch = writeBatch(db); // re-initialize batch
        console.log(`Committed ${operationCount} recipes...`);
      }
    }

    // Commit any remaining operations in the last batch
    await batch.commit();

    console.log(`✅ Successfully uploaded ${operationCount} recipes to Firestore.`);
    return { success: true, count: operationCount };

  } catch (error) {
    console.error("Error uploading recipes to Firestore:", error);
    return { success: false, error };
  }
};