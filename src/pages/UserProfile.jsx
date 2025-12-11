import React, { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import DietaryFilter from "../components/DietaryFilter";
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, updateProfile } from "firebase/auth";
import { updateDietaryFilters, updateUserName } from "../services/userService";
import { User, Mail, Lock, Shield, Heart, CheckCircle, AlertCircle, Edit, X, Save } from "lucide-react";

// A smaller check icon for the password criteria list
const MiniCheck = () => <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />;

const UserProfile = () => {
  const { user, setUser } = useUser();

  // State for name change
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  // State for password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordMessageType, setPasswordMessageType] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);

  // State to track password criteria
  const [passwordCriteria, setPasswordCriteria] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  // State for dietary filters
  const [savingFilters, setSavingFilters] = useState(false);
  const [filtersSaved, setFiltersSaved] = useState(false);

  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user?.name]);

  useEffect(() => {
    setPasswordCriteria({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
    });
  }, [newPassword]);

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
  
  const handleNameChange = async () => {
    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    const trimmedName = displayName.trim();
    if (!firebaseUser || !trimmedName || trimmedName === user.name) {
      setIsEditingName(false);
      setDisplayName(user.name);
      return;
    }
    setIsUpdatingName(true);
    try {
      await updateProfile(firebaseUser, { displayName: trimmedName });
      await updateUserName(user.uid, trimmedName);
      setUser({ ...user, name: trimmedName });
      setIsEditingName(false);
    } catch (error) {
      console.error("Error updating name:", error);
      alert("Failed to update name. Please try again.");
      setDisplayName(user.name);
    } finally {
      setIsUpdatingName(false);
    }
  };
  
  const validatePasswordForm = () => {
    const errors = {};
    const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);

    if (newPassword.length > 0 && !allCriteriaMet) {
      errors.new = "Please ensure all password requirements are met.";
    }
    if (confirmPassword.length > 0 && newPassword !== confirmPassword) {
      errors.confirm = "Passwords do not match.";
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async () => {
    setPasswordMessage("");
    
    const allCriteriaMet = Object.values(passwordCriteria).every(Boolean);
    if (!allCriteriaMet || !validatePasswordForm()) {
      if (!allCriteriaMet && newPassword.length > 0) {
        setPasswordErrors(prev => ({...prev, new: "Please ensure all password requirements are met."}));
      }
      return;
    }

    const auth = getAuth();
    const firebaseUser = auth.currentUser;
    
    if (!firebaseUser) {
      setPasswordMessage("No user is currently logged in.");
      setPasswordMessageType("error");
      return;
    }
    setUpdatingPassword(true);
    try {
      const credential = EmailAuthProvider.credential(firebaseUser.email, currentPassword);
      await reauthenticateWithCredential(firebaseUser, credential);
      await updatePassword(firebaseUser, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordErrors({});
      setPasswordMessage("Password updated successfully!");
      setPasswordMessageType("success");
      setTimeout(() => { setPasswordMessage(""); setPasswordMessageType(""); }, 5000);
    } catch (error) {
      console.error(error);
      if (error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
        setPasswordErrors({ current: "Current password is incorrect." });
      } else if (error.code === "auth/too-many-requests") {
        setPasswordMessage("Too many attempts. Please try again later.");
        setPasswordMessageType("error");
      } else {
        setPasswordMessage("An unknown error occurred. Please try again.");
        setPasswordMessageType("error");
      }
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

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
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  readOnly={!isEditingName}
                  className={`w-full p-3 pl-4 border-2 rounded-xl font-medium focus:outline-none transition-all ${
                    isEditingName
                      ? "border-orange-400 bg-white text-gray-800 focus:ring-2 focus:ring-orange-200"
                      : "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                  }`}
                />
                {!isEditingName ? (
                  <button onClick={() => setIsEditingName(true)} className="p-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors">
                    <Edit className="w-5 h-5 text-gray-600" />
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={handleNameChange} disabled={isUpdatingName} className="p-3 bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors text-white disabled:bg-orange-300">
                      {isUpdatingName ? (
                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                    </button>
                    <button onClick={() => { setIsEditingName(false); setDisplayName(user.name); }} disabled={isUpdatingName} className="p-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors">
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 text-orange-500" />
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                readOnly
                className="w-full p-3 pl-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium focus:outline-none cursor-not-allowed"
                title="Email cannot be changed"
              />
            </div>
          </div>
        </div>

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
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-200 transition-all outline-none ${
                    passwordErrors.current ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'
                  }`}
                  disabled={updatingPassword}
                />
                {passwordErrors.current && <p className="text-red-600 text-sm mt-1">{passwordErrors.current}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  placeholder="Enter your new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-200 transition-all outline-none ${
                    passwordErrors.new ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'
                  }`}
                  disabled={updatingPassword}
                />
                {passwordErrors.new && <p className="text-red-600 text-sm mt-1">{passwordErrors.new}</p>}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-3 text-sm">
                  <div className={`flex items-center gap-2 ${passwordCriteria.length ? 'text-orange-600' : 'text-gray-500'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><MiniCheck /></svg>
                    At least 8 characters
                  </div>
                  <div className={`flex items-center gap-2 ${passwordCriteria.uppercase ? 'text-orange-600' : 'text-gray-500'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><MiniCheck /></svg>
                    One uppercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${passwordCriteria.lowercase ? 'text-orange-600' : 'text-gray-500'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><MiniCheck /></svg>
                    One lowercase letter
                  </div>
                  <div className={`flex items-center gap-2 ${passwordCriteria.number ? 'text-orange-600' : 'text-gray-500'}`}>
                    <svg width="16" height="16" viewBox="0 0 24 24"><MiniCheck /></svg>
                    One number
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyUp={validatePasswordForm}
                  className={`w-full p-3 border-2 rounded-xl focus:ring-2 focus:ring-orange-200 transition-all outline-none ${
                    passwordErrors.confirm ? 'border-red-500' : 'border-gray-200 focus:border-orange-500'
                  }`}
                  disabled={updatingPassword}
                />
                {passwordErrors.confirm && <p className="text-red-600 text-sm mt-1">{passwordErrors.confirm}</p>}
              </div>

              <button
                onClick={handlePasswordChange}
                disabled={updatingPassword || !currentPassword || !newPassword || !confirmPassword}
                className={`w-full py-3 px-6 rounded-xl font-bold text-white transition-all duration-300 flex items-center justify-center gap-2 ${
                  (updatingPassword || !currentPassword || !newPassword || !confirmPassword)
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                }`}
              >
                {updatingPassword ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
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
                <div className={`flex items-start gap-3 p-4 rounded-xl ${ passwordMessageType === "success" ? "bg-orange-50 border-orange-500" : "bg-red-50 border-red-500"}`}>
                  {passwordMessageType === "success" ? (
                    <CheckCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <p className={`text-sm font-medium ${ passwordMessageType === "success" ? "text-orange-800" : "text-red-800"}`}>
                    {passwordMessage}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-white" />
                <h2 className="text-xl font-bold text-white">Dietary Preferences</h2>
              </div>
              {savingFilters && (
                <div className="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
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
            <p className="text-gray-600 mb-6">Select your dietary preferences to personalize recipe recommendations</p>
            <DietaryFilter
              selectedFilters={user.dietaryFilters || []}
              setSelectedFilters={handleDietaryFiltersUpdate}
            />
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">Your preferences are automatically saved and applied to all recipe searches</p>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;