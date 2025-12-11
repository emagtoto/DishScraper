import axios from 'axios';

// --- CONFIG ---
const DEEPSEEK_API_URL = process.env.REACT_APP_DEEPSEEK_API_URL || '/.netlify/functions/deepseek';

// ✅ Centralized DeepSeek Call
const callDeepSeek = async (messages, max_tokens = 2048, temperature = 0.3) => {
    try {
        const response = await axios.post(
            DEEPSEEK_API_URL,
            {
                model: 'deepseek-chat',
                messages,
                max_tokens,
                temperature,
                response_format: { type: 'json_object' }
            },
            {
                headers: {'Content-Type': 'application/json',
                },
                timeout: 45000
            }
        );
        return { success: true, data: response.data.choices[0].message.content };
    } catch (error) {
        console.error("❌ DeepSeek API Error:", error.response ? error.response.data : error.message);
        const errorMessage = error.response?.data?.error?.message || "AI service error.";
        return { success: false, error: errorMessage };
    }
};

// ✅ Unit-Simplified & Token-Saving Recipe Modifier
export const modifyRecipeWithAI = async (originalRecipe, modificationRequest) => {
    const cleanInstructions = Array.isArray(originalRecipe.instructions)
        ? originalRecipe.instructions
        : [String(originalRecipe.instructions)];

    const R = JSON.stringify({
        title: originalRecipe.title,
        servings: originalRecipe.servings || 0,
        t: originalRecipe.readyInMinutes ? `${originalRecipe.readyInMinutes} min` : originalRecipe.cookingTime || 'N/A',
        ing: originalRecipe.ingredients,
        inst: cleanInstructions
    });

    // 🔥 Compressed Prompt with Unit Rules Applied
    const prompt = `
R=${R}
U="${modificationRequest}"
Rules:
- Convert units: use cup, 1/2 cup, 1/4 cup, tbsp, tsp, pinch, handful ONLY.
- No ml, grams, ounces, decimals.
- Round values naturally. 5-15g => pinch, 20-40g => small handful, 50g+ => handful.
- 240ml=1 cup, 120ml=1/2 cup, 60ml=1/4 cup, 15ml=1 tbsp, 5ml=1 tsp.
- Merge duplicate spice entries. Use "split use" if needed.
- If the recipe is ethically immoral or unsafe(eg., usage of human ingredients, poison, exotic animals, domestic animals, and endangered species), respond with {"error": "Modification request denied due to ethical or safety concerns."}
{
"title": "...",
"servings": N,
"cookingTime": "...",
"ingredients": [...],
"instructions": [...],
"nutritional_info": {
"calories": N,
"protein_g": N,
"carbs_g": N,
"fat_g": N
}}
`;

    const messages = [
        { role: 'system', content: 'Return ONLY raw JSON. No markdown. No comments.' },
        { role: 'user', content: prompt }
    ];

    const result = await callDeepSeek(messages);

    if (result.success) {
        try {
            const parsed = JSON.parse(result.data);
            if (parsed.title && parsed.ingredients && parsed.instructions) {
                return { success: true, data: parsed };
            } else {
                throw new Error("Missing keys.");
            }
        } catch (err) {
            console.error("JSON Parse Error:", err, "RAW:", result.data);
            return { success: false, error: "Invalid AI JSON. Try again." };
        }
    } else {
        return result;
    }
};

// ✅ Export
const interactiveAiService = {
    modifyRecipeWithAI,
};

export default interactiveAiService;
