import { useState, useEffect } from 'react';
import { auth, setupRecaptcha } from '../../lib/firebase';
import { signInWithPhoneNumber } from 'firebase/auth';
import { supabase } from '../../lib/supabase';

interface LandingScreenProps {
  onNext: (phone: string, confirmationResult: any) => void;
  onSocialLogin: (user: any, existingDetails?: any) => void;
}

export function LandingScreen({ onNext, onSocialLogin }: LandingScreenProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    setupRecaptcha('recaptcha-container');
  }, []);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://peerup-students.vercel.app/'
        }
      });

      if (error) throw error;
      // Note: This will redirect the page, the session will be handled in App.tsx on return
    } catch (error) {
      console.error("Google Login Error:", error);
      alert("Google Login failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (phoneNumber.length === 10) {
      setLoading(true);
      try {
        const appVerifier = window.recaptchaVerifier;
        const confirmationResult = await signInWithPhoneNumber(auth, `+91${phoneNumber}`, appVerifier);
        onNext(phoneNumber, confirmationResult);
      } catch (error) {
        console.error("SMS Error:", error);
        alert("Failed to send SMS. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      {/* Top Section with Gradient Background */}
      <div className="relative bg-gradient-to-b from-blue-100 to-blue-50 px-6 pt-12 pb-8 overflow-hidden">
        {/* Floating Keywords */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[5%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">ECONOMICS</div>
          <div className="absolute top-[15%] right-[10%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">MATHS</div>
          <div className="absolute top-[25%] left-[15%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">SOLUTIONS</div>
          <div className="absolute top-[30%] right-[5%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">ENGINEERING</div>
          <div className="absolute top-[40%] left-[8%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">INSTANT TUTORING</div>
          <div className="absolute top-[45%] right-[12%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">COLLEGES</div>
          <div className="absolute top-[55%] left-[20%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">PHYSICS</div>
          <div className="absolute top-[60%] right-[8%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">PRACTICE</div>
          <div className="absolute top-[70%] left-[10%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">EXPLANATIONS</div>
          <div className="absolute top-[75%] right-[15%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">ASSIGNMENTS</div>
          <div className="absolute top-[85%] left-[25%] bg-white px-3 py-1.5 rounded-full text-xs opacity-80">TEXTBOOKS</div>
        </div>

        {/* Illustration */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-48 h-48 mb-4 flex items-center justify-center">
            <div className="text-8xl">📚</div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex-1 bg-white px-6 py-8 flex flex-col">
        <h1 className="text-2xl font-bold text-center mb-2">
          World's Most Advanced<br />Exam & Assignment Help
        </h1>
        <p className="text-gray-500 text-center mb-8">Log in or Sign up</p>

        {/* Phone Input */}
        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-4">
          <span className="text-xl mr-2">🇮🇳</span>
          <span className="text-gray-500 mr-1">▼</span>
          <span className="mr-3">+91</span>
          <input
            type="tel"
            placeholder="Enter mobile number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
            className="flex-1 bg-transparent outline-none"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={phoneNumber.length !== 10 || loading}
          className="w-full bg-blue-600 text-white rounded-xl py-3.5 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity mb-4"
        >
          {loading ? 'Sending...' : 'Continue'}
        </button>

        <div className="flex items-center my-4">
          <div className="flex-1 border-t border-gray-200"></div>
          <span className="px-3 text-gray-400 text-sm">Or</span>
          <div className="flex-1 border-t border-gray-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 rounded-xl py-3.5 font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {googleLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              Authenticating...
            </span>
          ) : (
            <>
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Continue with Google
            </>
          )}
        </button>

        <div id="recaptcha-container"></div>
        
        <p className="text-[10px] text-gray-400 text-center mt-6">
          This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" className="underline">Privacy Policy</a> and <a href="https://policies.google.com/terms" className="underline">Terms of Service</a> apply.
        </p>
      </div>
    </div>
  );
}