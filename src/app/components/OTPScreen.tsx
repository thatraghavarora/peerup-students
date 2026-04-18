import { useState, useEffect, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface OTPScreenProps {
  phoneNumber: string;
  confirmationResult: any;
  onBack: () => void;
  onNext: (isExistingUser: boolean, name?: string) => void;
  onEditPhone: () => void;
}

export function OTPScreen({ phoneNumber, confirmationResult, onBack, onNext, onEditPhone }: OTPScreenProps) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Firebase OTP is usually 6 digits
  const [countdown, setCountdown] = useState(60);
  const [verifying, setVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    const code = otp.join('');
    try {
      if (confirmationResult) {
        await confirmationResult.confirm(code);
        
        // Check Supabase profiles
        const { data: { user } } = await supabase.auth.getUser();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user?.id)
          .maybeSingle();

        if (data) {
          // User exists, go to dashboard
          onNext(true, data.full_name);
        } else {
          // New user, go to onboarding profile
          onNext(false);
        }
      }
    } catch (error) {
      console.error("Verification Error:", error);
      alert("Invalid OTP. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const isOtpComplete = otp.every(digit => digit !== '');

  return (
    <div className="min-h-full bg-white px-6 py-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center mb-8">
        <button onClick={onBack} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-semibold">OTP Verification</h1>
      </div>

      {/* Description */}
      <p className="text-gray-600 mb-2">
        We have sent a verification code to
      </p>
      <div className="flex items-center gap-2 mb-8">
        <span className="font-semibold">+91-{phoneNumber}</span>
        <button onClick={onEditPhone} className="text-blue-600 text-sm">Edit</button>
      </div>

      {/* OTP Inputs */}
      <div className="flex gap-4 mb-8 justify-center">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={el => inputRefs.current[index] = el}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleOtpChange(index, e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-14 h-14 text-center text-xl border-2 rounded-lg outline-none transition-colors ${
              digit ? 'border-black' : 'border-gray-300'
            } focus:border-blue-600`}
          />
        ))}
      </div>

      {/* Submit Button */}
      <button
        onClick={handleVerify}
        disabled={!isOtpComplete || verifying}
        className="w-full bg-gray-200 text-gray-400 rounded-xl py-3.5 font-medium mb-4 disabled:cursor-not-allowed enabled:bg-blue-600 enabled:text-white transition-colors"
      >
        {verifying ? 'Verifying...' : 'Submit'}
      </button>

      {/* Resend OTP */}
      <p className="text-center text-gray-500 text-sm">
        {countdown > 0 ? (
          `Resend OTP in ${countdown} seconds`
        ) : (
          <button onClick={() => setCountdown(7)} className="text-blue-600">
            Resend OTP
          </button>
        )}
      </p>
    </div>
  );
}