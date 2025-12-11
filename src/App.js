import React, { useEffect, useState, useCallback } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { auth } from "./firebase";
import { applyActionCode, verifyPasswordResetCode } from "firebase/auth";
import { UserProvider } from "./context/UserContext";
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage";
import RecipeFinder from "./pages/RecipeFinder";
import SavedRecipes from "./pages/SavedRecipes";
import UserProfile from "./pages/UserProfile";
import History from "./pages/History";
import AuthModal from "./components/AuthModal";

// Component to handle email verification and password reset
function AuthActionHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [resetCode, setResetCode] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState('');

  const handleAuthAction = useCallback(async (mode, oobCode) => {
    console.log('🎬 Handling auth action:', mode);

    if (mode === 'resetPassword') {
      // Handle password reset
      setVerifying(true);
      try {
        console.log('🔐 Verifying reset code...');
        const email = await verifyPasswordResetCode(auth, oobCode);
        console.log('✅ Reset code valid for:', email);
        
        setResetCode(oobCode);
        setVerifying(false);
        setShowAuthModal(true);
        
        // Clean up URL
        navigate('/', { replace: true });
      } catch (error) {
        console.error('❌ Invalid reset code:', error);
        setVerificationMessage('❌ This password reset link is invalid or has expired.');
        
        setTimeout(() => {
          navigate('/', { replace: true });
          setVerifying(false);
        }, 3000);
      }
    } else if (mode === 'verifyEmail') {
      // Handle email verification
      setVerifying(true);
      console.log('📧 Verifying email...');
      
      try {
        await applyActionCode(auth, oobCode);
        console.log('✅ Email verified successfully!');
        
        setVerificationMessage('✅ Email verified successfully! You can now log in.');
        
        // Show success message for 3 seconds, then redirect and open login
        setTimeout(() => {
          navigate('/', { replace: true });
          setVerifying(false);
          // Open login modal after verification
          setShowAuthModal(true);
        }, 3000);
      } catch (error) {
        console.error('❌ Email verification error:', error);
        
        if (error.code === 'auth/invalid-action-code') {
          setVerificationMessage('❌ This verification link is invalid or has already been used.');
        } else if (error.code === 'auth/expired-action-code') {
          setVerificationMessage('❌ This verification link has expired. Please request a new one.');
        } else {
          setVerificationMessage('❌ Failed to verify email. Please try again or contact support.');
        }

        setTimeout(() => {
          navigate('/', { replace: true });
          setVerifying(false);
        }, 4000);
      }
    } else if (mode === 'recoverEmail' || mode === 'revertSecondFactorAddition') {
      // Handle other Firebase auth actions
      console.log('ℹ️ Unhandled auth mode:', mode);
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');

    console.log('🔍 Auth Handler - URL:', location.pathname);
    console.log('🔍 Auth Handler - Mode:', mode);
    console.log('🔍 Auth Handler - OobCode:', oobCode ? 'present' : 'missing');

    if (mode && oobCode) {
      handleAuthAction(mode, oobCode);
    }
  }, [searchParams, location, handleAuthAction]);

  const handleCloseModal = () => {
    setShowAuthModal(false);
    setResetCode(null);
  };

  return (
    <>
      {/* Email Verification/Reset Status Modal */}
      {verifying && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
            <div className="mb-4">
              {verificationMessage.includes('✅') ? (
                <svg className="w-16 h-16 text-green-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              ) : verificationMessage.includes('❌') ? (
                <svg className="w-16 h-16 text-red-500 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="animate-spin h-16 w-16 text-orange-600 mx-auto" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              {verificationMessage ? (
                verificationMessage.includes('reset') ? 'Password Reset' : 'Email Verification'
              ) : 'Processing...'}
            </h2>
            <p className="text-gray-600">
              {verificationMessage || 'Please wait while we process your request.'}
            </p>
          </div>
        </div>
      )}

      {/* Auth Modal for Password Reset or Login */}
      {showAuthModal && (
        <AuthModal 
          onClose={handleCloseModal}
          resetCode={resetCode}
        />
      )}
    </>
  );
}

function App() {
  return (
    <UserProvider>
      <Router>
        <AuthActionHandler />
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