import React, { useState, useEffect } from "react";
import { auth } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  reload,
  sendPasswordResetEmail,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendEmailVerification,
} from "firebase/auth";
import { saveUserData } from "../services/userService";
import TermsModal from "./TermsModal";

const PasswordRequirement = ({ met, text }) => (
  <li className={`flex items-center transition-colors duration-300 ${met ? 'text-orange-600' : 'text-gray-500'}`}>
    <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
      {met ? (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      ) : (
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      )}
    </svg>
    <span className="text-xs sm:text-sm">{text}</span>
  </li>
);

export default function AuthModal({ onClose, resetCode = null }) {
  const [mode, setMode] = useState(resetCode ? 'resetPassword' : 'login');
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [showResendVerification, setShowResendVerification] = useState(false);

  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const validatePassword = (pass) => {
    const minLength = pass.length >= 8;
    const hasUpper = /[A-Z]/.test(pass);
    const hasLower = /[a-z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    return { minLength, hasUpper, hasLower, hasNumber };
  };

  useEffect(() => {
    if (mode === 'signup') {
      setPasswordValidation(validatePassword(password));
    } else if (mode === 'resetPassword') {
      setPasswordValidation(validatePassword(newPassword));
    }
  }, [password, newPassword, mode]);

  useEffect(() => {
    if (resetCode && mode === 'resetPassword') {
      verifyResetCode(resetCode);
    }
  }, [resetCode, mode]);

  const verifyResetCode = async (code) => {
    setLoading(true);
    try {
      const email = await verifyPasswordResetCode(auth, code);
      setResetEmail(email);
      setError("");
    } catch (err) {
      console.error("Invalid or expired reset code:", err);
      setError("This password reset link is invalid or has expired. Please request a new one.");
      setMode('forgotPassword');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);

      setSuccess(
        "Password reset email sent! Please check your inbox and spam folder. " +
        "Click the link in the email to reset your password."
      );

      console.log("Password reset email sent successfully to:", email);

      setTimeout(() => setEmail(""), 3000);
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === "auth/user-not-found") {
        setSuccess(
          "If an account exists with this email, a password reset link has been sent. " +
          "Please check your inbox and spam folder."
        );
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many attempts. Please wait a few minutes and try again.");
      } else if (err.code === "auth/missing-email") {
        setError("Please enter your email address.");
      } else {
        setError(`Failed to send reset email: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const validation = validatePassword(newPassword);
    const isPasswordValid = Object.values(validation).every(Boolean);

    if (!isPasswordValid) {
      setError("Your password does not meet all the security requirements.");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, resetCode, newPassword);
      setSuccess("Password reset successful! You can now login with your new password.");

      setTimeout(() => {
        setMode('login');
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setSuccess("");
      }, 2000);
    } catch (err) {
      console.error("Password reset error:", err);

      if (err.code === "auth/invalid-action-code") {
        setError("This password reset link is invalid or has expired.");
      } else if (err.code === "auth/expired-action-code") {
        setError("This password reset link has expired. Please request a new one.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please ensure it meets all requirements.");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email || !password) {
      setError("Please enter your email and password first.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Force refresh to get latest emailVerified status
      await auth.currentUser.reload();

      if (auth.currentUser.emailVerified) {
        setSuccess("Your email is already verified! You can now login.");
        await auth.signOut();
        setShowResendVerification(false);
        return;
      }

      await sendEmailVerification(userCredential.user);

      setSuccess("Verification email resent! Please check your inbox and spam folder.");
      await auth.signOut();
      setShowResendVerification(false);
    } catch (err) {
      console.error("Resend verification error:", err);

      if (err.code === "auth/too-many-requests") {
        setError("Too many requests. Please wait a few minutes before trying again.");
      } else if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Invalid credentials. Please check your email and password.");
      } else {
        setError("Failed to resend verification email. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (mode === 'signup') {
      if (!agreedToTerms) {
        setError("Please agree to the Terms & Conditions to create an account.");
        return;
      }

      const validation = validatePassword(password);
      const isPasswordValid = Object.values(validation).every(Boolean);

      if (!isPasswordValid) {
        setError("Your password does not meet all the security requirements. Please check the list below the password field.");
        return;
      }
    }

    setLoading(true);

    try {
      let userCredential;

      if (mode === 'login') {
        userCredential = await signInWithEmailAndPassword(auth, email, password);

        console.log("🔒 Login attempt for:", userCredential.user.email);

        // Force reload to get latest verification status
        await auth.currentUser.reload();
        const currentUser = auth.currentUser;

        console.log("📧 Email verified:", currentUser.emailVerified);

        if (!currentUser.emailVerified) {
          console.log("❌ Email not verified");

          setError(
            "Please verify your email before logging in. Check your inbox for the verification link. " +
            "After clicking the link, please try logging in again."
          );
          setShowResendVerification(true);
          await auth.signOut();
          return;
        }

        console.log("✅ Login successful! Email is verified.");
      } else {
        // Signup
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await reload(userCredential.user);

        try {
          await sendEmailVerification(userCredential.user);
          setSuccess(
            "Account created! Please check your email and click the verification link to activate your account. " +
            "Check your spam folder if you don't see it."
          );
        } catch (verifyErr) {
          console.error("Failed to send verification email:", verifyErr);
          setError("Account created but failed to send verification email. Please contact support.");
        }

        const newUserData = {
          uid: userCredential.user.uid,
          name: name || "User",
          email: userCredential.user.email,
          dietaryFilters: [],
          savedRecipes: [],
          history: [],
          createdAt: new Date().toISOString(),
        };

        await saveUserData(userCredential.user.uid, newUserData);
        await auth.signOut();

        setTimeout(() => {
          setMode('login');
          setName("");
          setEmail("");
          setPassword("");
          setError("");
        }, 5000);

        return;
      }

      onClose();
    } catch (err) {
      console.error("Auth error:", err);

      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please login instead.");
      } else if (err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid credentials. Please check your email and password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email. Please sign up.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please ensure it meets all requirements.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address format.");
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const getHeaderText = () => {
    switch (mode) {
      case 'signup': return { title: "Join DishScraper", subtitle: "Create an account to get started" };
      case 'forgotPassword': return { title: "Reset Password", subtitle: "Enter your email to receive a reset link" };
      case 'resetPassword': return { title: "Set New Password", subtitle: resetEmail ? `Resetting password for ${resetEmail}` : "Enter your new password" };
      default: return { title: "Welcome Back!", subtitle: "Login to continue your culinary journey" };
    }
  };

  const header = getHeaderText();

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 backdrop-blur-sm p-3 sm:p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden transform transition-all duration-300 max-h-[90vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-4 sm:p-6 text-white">
            <h2 className="text-xl sm:text-2xl font-bold text-center">{header.title}</h2>
            <p className="text-center text-orange-100 text-xs sm:text-sm mt-1">{header.subtitle}</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {error && (
              <div className="bg-red-50 border-red-500 text-red-700 p-3 sm:p-4 rounded text-xs sm:text-sm" role="alert">
                <strong>Error:</strong> {error}
              </div>
            )}

            {success && (
              <div className="bg-orange-50 border-orange-500 text-orange-700 p-3 sm:p-4 rounded text-xs sm:text-sm" role="alert">
                <strong>Success:</strong> {success}
              </div>
            )}

            {mode === 'forgotPassword' ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-white transition-all duration-200 text-sm sm:text-base ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Sending...
                    </span>
                  ) : (
                    "Send Reset Link"
                  )}
                </button>

                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setError("");
                      setSuccess("");
                    }}
                    disabled={loading}
                    className="text-orange-600 hover:text-orange-700 font-semibold underline text-xs sm:text-sm"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            ) : mode === 'resetPassword' ? (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                    required
                    disabled={loading}
                    minLength={8}
                  />
                </div>

                <div className="mt-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">Password must contain:</h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                    <PasswordRequirement met={passwordValidation.minLength} text="At least 8 characters" />
                    <PasswordRequirement met={passwordValidation.hasUpper} text="One uppercase letter" />
                    <PasswordRequirement met={passwordValidation.hasLower} text="One lowercase letter" />
                    <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                  </ul>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-white transition-all duration-200 text-sm sm:text-base ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Resetting...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                      required
                      disabled={loading}
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border-2 border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none transition"
                    required
                    disabled={loading}
                    minLength={mode === 'login' ? 6 : 8}
                  />
                  {mode === 'signup' && (
                    <div className="mt-2.5 sm:mt-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-2">Password must contain:</h4>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5">
                        <PasswordRequirement met={passwordValidation.minLength} text="At least 8 characters" />
                        <PasswordRequirement met={passwordValidation.hasUpper} text="One uppercase letter" />
                        <PasswordRequirement met={passwordValidation.hasLower} text="One lowercase letter" />
                        <PasswordRequirement met={passwordValidation.hasNumber} text="One number" />
                      </ul>
                    </div>
                  )}
                  {mode === 'login' && (
                    <div className="mt-2 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgotPassword');
                          setError("");
                          setSuccess("");
                          setShowResendVerification(false);
                        }}
                        disabled={loading}
                        className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-semibold underline"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>

                {mode === 'login' && showResendVerification && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <p className="text-xs sm:text-sm text-gray-700 mb-2">
                      Haven't received the verification email?
                    </p>
                    <button
                      type="button"
                      onClick={handleResendVerification}
                      disabled={loading}
                      className="text-xs sm:text-sm text-orange-600 hover:text-orange-700 font-semibold underline"
                    >
                      Resend Verification Email
                    </button>
                  </div>
                )}

                {mode === 'signup' && (
                  <div className="flex items-start gap-2 bg-orange-50 p-2.5 sm:p-3 rounded-lg">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-1 w-4 h-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded flex-shrink-0"
                      disabled={loading}
                    />
                    <label htmlFor="terms" className="text-xs sm:text-sm text-gray-700">
                      I agree to the{" "}
                      <button
                        type="button"
                        onClick={() => setShowTerms(true)}
                        className="text-orange-600 hover:text-orange-700 font-semibold underline"
                      >
                        Terms & Conditions
                      </button>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-2.5 sm:py-3 rounded-lg font-semibold text-white transition-all duration-200 text-sm sm:text-base ${loading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Processing...
                    </span>
                  ) : mode === 'login' ? (
                    "Login"
                  ) : (
                    "Create Account"
                  )}
                </button>
              </form>
            )}

            {(mode === 'login' || mode === 'signup') && (
              <div className="text-center text-xs sm:text-sm">
                <p className="text-gray-600">
                  {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => {
                      setMode(mode === 'login' ? 'signup' : 'login');
                      setError("");
                      setSuccess("");
                      setAgreedToTerms(false);
                      setShowResendVerification(false);
                    }}
                    disabled={loading}
                    className="text-orange-600 hover:text-orange-700 font-semibold underline"
                  >
                    {mode === 'login' ? "Sign Up" : "Login"}
                  </button>
                </p>
              </div>
            )}

            <button
              onClick={onClose}
              disabled={loading}
              className="mt-2 sm:mt-4 w-full py-2 sm:py-2.5 text-xs sm:text-sm border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {showTerms && <TermsModal isOpen={showTerms} onClose={() => setShowTerms(false)} />}
    </>
  );
}