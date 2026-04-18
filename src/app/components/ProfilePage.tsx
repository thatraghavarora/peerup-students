import { useState, useEffect } from 'react';
import { User, BookOpen, LogOut, ChevronRight, Bell, HelpCircle, Shield, Award } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface ProfilePageProps {
  userName: string;
  onNavigate?: (tab: string) => void;
}

export function ProfilePage({ userName, onNavigate }: ProfilePageProps) {
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        if (data) setUserData(data);
      }
    };
    fetchUserData();
  }, [userName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  const profileItems = [
    { icon: User, label: 'Account Information', value: userData?.email || 'N/A' },
    { icon: Award, label: 'Gender', value: userData?.gender || 'Not specified' },
    { icon: BookOpen, label: 'Current Study', value: userData?.class_level ? `Class ${userData.class_level}` : (userData?.course_name ? `${userData.course_name} - ${userData.semester} Sem` : 'Not specified') },
    { icon: Bell, label: 'Notifications', value: 'Manage alerts' },
    { icon: HelpCircle, label: 'Help & Support', value: 'Contact Peerup Support' },
    { icon: Shield, label: 'Privacy Policy', value: 'Terms and Conditions' },
  ];

  return (
    <div className="px-6 pt-6 pb-6">
      {/* Profile Header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 mb-6 text-white shadow-xl shadow-blue-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-white/20 border-2 border-white/50 rounded-full flex items-center justify-center text-3xl shadow-inner">
             {userData?.role === 'teacher' ? '👨‍🏫' : '👨‍🎓'}
          </div>
          <div>
            <h2 className="text-xl font-black">{userName}</h2>
            <div className="flex items-center gap-1.5 text-blue-100 text-[10px] font-black uppercase tracking-widest mt-1">
               <span className="bg-white/20 px-2 py-0.5 rounded-full">Explorer</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => onNavigate?.('premium')}
          className="w-full bg-white text-blue-600 rounded-xl py-3 font-black text-sm shadow-lg shadow-blue-900/10 hover:bg-blue-50 transition-colors"
        >
          Upgrade to Premium Gold 👑
        </button>
      </div>

      {/* Menu Items */}
      <h3 className="font-black text-slate-900 mb-4 px-1">Settings & Support</h3>
      <div className="space-y-3 mb-8">
        {profileItems.map((item, index) => (
          <button
            key={index}
            className="w-full bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:bg-blue-50 transition-colors group"
          >
            <div className="w-10 h-10 bg-gray-50 group-hover:bg-white rounded-xl flex items-center justify-center border border-gray-50 transition-colors">
              <item.icon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1 text-left">
              <div className="font-bold text-sm text-slate-800">{item.label}</div>
              {item.value && (
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.value}</div>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-gray-300" />
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button 
        onClick={handleLogout}
        className="w-full bg-red-50 text-red-600 rounded-2xl py-4 font-black flex items-center justify-center gap-2 border border-red-100 hover:bg-red-100 transition-colors"
      >
        <LogOut className="w-5 h-5" />
        <span>Log Out of Peerup</span>
      </button>

      <p className="text-center text-gray-300 text-[10px] font-bold uppercase tracking-widest mt-8">Peerup v1.0.4</p>
    </div>
  );
}