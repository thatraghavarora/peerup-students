import { useState, useEffect } from 'react';
import { LandingScreen } from './components/LandingScreen';
import { OTPScreen } from './components/OTPScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { supabase } from '../lib/supabase';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [userName, setUserName] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [socialUser, setSocialUser] = useState<any>(null);

  useEffect(() => {
    // 1. Initial Session Check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) handleUser(session.user);
    };
    checkSession();

    // 2. Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);
      if (session) {
        handleUser(session.user);
      } else if (event === 'SIGNED_OUT') {
        setCurrentScreen('landing');
        setSocialUser(null);
        setUserName('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleUser = async (user: any) => {
    setSocialUser(user);
    // Fetch profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profile) {
      setUserName(profile.full_name || '');
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('profile');
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100 overflow-hidden">
      <div className="w-full max-w-[390px] h-full sm:h-[844px] bg-white shadow-xl flex flex-col relative overflow-hidden">
        {currentScreen === 'landing' && (
          <LandingScreen
            onNext={(phone, result) => {
              setPhoneNumber(phone);
              setConfirmationResult(result);
              setCurrentScreen('otp');
            }}
            onSocialLogin={(user, existingDetails) => {
              setSocialUser(user);
              if (existingDetails) {
                setUserName(existingDetails.full_name || user.displayName || '');
                setCurrentScreen('dashboard');
              } else {
                setUserName(user.displayName || '');
                setCurrentScreen('profile');
              }
            }}
          />
        )}
        {currentScreen === 'otp' && (
          <OTPScreen
            phoneNumber={phoneNumber}
            confirmationResult={confirmationResult}
            onBack={() => setCurrentScreen('landing')}
            onNext={(isExistingUser, name) => {
              if (isExistingUser) {
                setUserName(name || '');
                setCurrentScreen('dashboard');
              } else {
                setCurrentScreen('profile');
              }
            }}
            onEditPhone={() => setCurrentScreen('landing')}
          />
        )}
        {currentScreen === 'profile' && (
          <ProfileScreen
            phoneNumber={phoneNumber}
            socialUser={socialUser}
            onNext={(name) => {
              setUserName(name);
              setCurrentScreen('dashboard');
            }}
          />
        )}
        {currentScreen === 'dashboard' && (
          <DashboardScreen userName={userName} />
        )}
      </div>
    </div>
  );
}