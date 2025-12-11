import React from "react";

const TermsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 sm:p-6 text-white">
          <h2 className="text-xl sm:text-3xl font-bold flex items-center gap-3">
            <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Terms & Conditions
          </h2>
          <p className="text-orange-100 mt-1 sm:mt-2 text-sm sm:text-base">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 text-sm sm:text-base">
          <div className="space-y-6 text-gray-700">

            {/* 1 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">1.</span> Acceptance of Terms
              </h3>
              <p>By creating an account with DishScraper, you agree to use the platform responsibly and only for its intended purpose of recipe discovery and meal planning. Your use of our service constitutes acceptance of these terms and conditions.</p>
            </section>

            {/* 2 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">2.</span> Use of Service
              </h3>
              <p className="mb-2">DishScraper provides recipe recommendations based on your selected ingredients and dietary preferences. You agree to:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Provide accurate information when using the service</li>
                <li>Use the platform for personal, non-commercial purposes</li>
                <li>Not abuse or misuse the AI recipe generation features</li>
                <li>Respect API usage limits and quota restrictions</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">3.</span> Recipe Information & Disclaimers
              </h3>
              <p className="mb-2"><strong className="text-red-600">Important Notice:</strong> All recipes and dietary information are provided "as-is" for informational purposes only. We make no guarantees about:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Nutritional accuracy or completeness</li>
                <li>Suitability for specific health conditions</li>
                <li>Allergen information or cross-contamination risks</li>
                <li>Food safety or proper cooking techniques</li>
              </ul>
              <div className="bg-yellow-50 border border-yellow-500 p-3 sm:p-4 mt-3 rounded">
                <p className="font-semibold text-yellow-800 text-xs sm:text-sm">⚠️ This platform should NOT replace professional medical or nutritional advice. Always consult with healthcare providers regarding dietary restrictions, allergies, or health concerns.</p>
              </div>
            </section>

            {/* 4 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">4.</span> User Account & Privacy
              </h3>
              <p>You are responsible for maintaining the confidentiality of your account credentials. We collect and store your search history, saved recipes, and dietary preferences to improve your experience. Your data is handled in accordance with standard privacy practices.</p>
            </section>

            {/* 5 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">5.</span> API Usage & Limitations
              </h3>
              <p className="mb-2">DishScraper uses third-party APIs (Spoonacular, DeepSeek) subject to usage limits:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Maximum 20 API points per recipe search to control costs</li>
                <li>AI generation may be limited by description validation</li>
                <li>Service availability depends on third-party API status</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">6.</span> Content Ownership
              </h3>
              <p>Recipes sourced from Spoonacular and other databases remain the property of their respective owners. AI-generated recipes are created based on your inputs and common culinary knowledge. You may use saved recipes for personal purposes only.</p>
            </section>

            {/* 7 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">7.</span> Limitation of Liability
              </h3>
              <p>DishScraper, its developers, and partners are not liable for any damages, illness, or adverse effects resulting from the use of recipes or information provided through the platform. You assume all risks associated with food preparation and consumption.</p>
            </section>

            {/* 8 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">8.</span> Changes to Terms
              </h3>
              <p>DishScraper reserves the right to update these terms at any time. We will notify users of significant changes through the platform. Continued use of the service after updates means you accept the new terms.</p>
            </section>

            {/* 9 */}
            <section>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="text-orange-500">9.</span> Termination
              </h3>
              <p>We reserve the right to terminate or suspend access to accounts that violate these terms or misuse the platform.</p>
            </section>

            {/* Contact */}
            <div className="bg-orange-50 border-orange-500 p-3 sm:p-4 mt-4 rounded">
              <p className="text-xs sm:text-sm">
                <strong>Questions?</strong> If you have any questions about these terms, please contact us at <strong>dishscrapersupport@gmail.com</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center border-t text-xs sm:text-sm">
          <p className="text-gray-600">By using DishScraper, you agree to these terms.</p>
          <button
            onClick={onClose}
            className="px-4 sm:px-6 py-2 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors shadow-md hover:shadow-lg text-xs sm:text-base"
          >
            I Understand
          </button>
        </div>

      </div>
    </div>
  );
};

export default TermsModal;
