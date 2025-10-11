import React, { useState } from "react";
import { useUser } from "../context/UserContext";
import DietaryFilter from "../components/DietaryFilter";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { updateDietaryFilters } from "../services/userService";
import { User, Mail, Lock, Shield, Heart, CheckCircle, AlertCircle } from "lucide-react";

const UserProfile = () => {
  const { user, setUser } = useUser();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState(""); // "success" or "error"
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [savingFilters, setSavingFilters] = useState(false);
  const [filtersSaved, setFiltersSaved] = useState(false);

  const handleDietaryFiltersUpdate = async (filters) => {
    if (!user?.uid) return;

    setSavingFilters(true);
    setFiltersSaved(false);

    const result = await updateDietaryFilters(user.uid, filters);

    if (result.success) {
      setUser({ ...user, dietaryFilters: filters });
      setFiltersSaved(true);
      setTimeout(() => setFiltersSaved(false), 3000);
    } else {
      alert("Failed to update dietary filters. Please try again.");
    }

    setSavingFilters(false);
  };

  const handlePasswordChange = async () => {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;

    if (!firebaseUser) {
      setPasswordMessage("No user is currently logged in.");
      setPasswordMessageType("error");
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage("New password must be at least 6 characters.");
      setPasswordMessageType("error");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords do not match.");
      setPasswordMessageType("error");
      return;
    }

    setUpdatingPassword(true);
    setPasswordMessage("");

    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage("Password updated successfully!");
      setPasswordMessageType("success");
      
      setTimeout(() => {
        setPasswordMessage("");
        setPasswordMessageType("");
      }, 5000);
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password") {
        setPasswordMessage("Current password is incorrect.");
      } else if (error.code === "auth/too-many-requests") {
        setPasswordMessage("Too many attempts. Please try again later.");
      } else {
        setPasswordMessage(error.message || "An error occurred.");
      }
      setPasswordMessageType("error");
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        {/* Account Information Card */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Account Information</h2>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 text-orange-500" />
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={user.name || ""}
                  readOnly
                  className="w-full p-3 pl-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:outline-none cursor-not-allowed"
                  title="Name cannot be changed here"
                />
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-orange-500" />
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email || ""}
                  readOnly
                  className="w-full p-3 pl-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:outline-none cursor-not-allowed"
                  title="Email cannot be changed"
                />
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> To change your name or email, please contact support.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-2xl shadow-xl mb-6 overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white">Security Settings</h2>
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-6">Update your password to keep your account secure</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  disabled={updatingPassword}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  disabled={updatingPassword}
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none"
                  disabled={updatingPassword}
                />
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  updatingPassword || !currentPassword || !newPassword || !confirmPassword
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {updatingPassword ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    Update Password
                  </>
                )}
              </button>

              {passwordMessage && (
                <div className={`flex items-start gap-3 p-4 rounded-xl border-l-4 ${
                  passwordMessageType === "success" 
                    ? "bg-orange-50 border-orange-500" 
                    : "bg-red-50 border-red-500"
                }`}>
                  {passwordMessageType === "success" ? (
                    <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm font-medium ${
                    passwordMessageType === "success" ? "text-orange-800" : "text-red-800"
                  }`}>
                    {passwordMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dietary Preferences Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Dietary Preferences</h2>
              </div>
              {savingFilters && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span className="text-sm font-medium text-white">Saving...</span>
                </div>
              )}
              {filtersSaved && !savingFilters && (
                <div className="flex items-center gap-2 bg-orange-500 px-3 py-1.5 rounded-lg animate-pulse">
                  <CheckCircle className="w-4 h-4 text-white" />
                  <span className="text-sm font-medium text-white">Saved!</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Select your dietary preferences to personalize recipe recommendations
            </p>
            <DietaryFilter
              selectedFilters={user.dietaryFilters || []}
              setSelectedFilters={handleDietaryFiltersUpdate}
            />
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Your preferences are automatically saved and applied to all recipe searches
          </p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;