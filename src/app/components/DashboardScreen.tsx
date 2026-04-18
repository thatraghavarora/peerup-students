import { useState } from 'react';
import { Sparkles, FileText, Crown, User, Clock, Bell } from 'lucide-react';
import { SuperAIPage } from './SuperAIPage';
import { PastPapersPage } from './PastPapersPage';
import { PremiumPage } from './PremiumPage';
import { ProfilePage } from './ProfilePage';
import { PostDoubtScreen } from './PostDoubtScreen';
import { ChatScreen } from './ChatScreen';
import { HistoryOverlay } from './HistoryOverlay';

interface DashboardScreenProps {
  userName: string;
}

export function DashboardScreen({ userName }: DashboardScreenProps) {
  const [activeTab, setActiveTab] = useState('superai');
  const [showPostDoubt, setShowPostDoubt] = useState(false);
  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-full bg-[#FAFBFF] flex flex-col items-center relative overflow-hidden">
      {/* Top Bar - Premium Sticky Header */}
      <div className="sticky top-0 z-40 w-full flex justify-center bg-white border-b border-slate-100 shadow-sm">
        <div className="w-full max-w-2xl px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg shadow-blue-200">
            {getInitials(userName)}
          </div>
          <div>
            <p className="text-[10px] text-blue-600 font-black uppercase tracking-[0.2em] leading-none mb-1">Peerup</p>
            <h1 className="text-lg font-black text-slate-800 leading-none">Hello, {userName.split(' ')[0]}!</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="relative p-2.5 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
            <Bell className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
          </button>
        </div>
      </div>
    </div>

      {/* Main Content */}
      <div className="flex-1 w-full max-w-2xl pb-24 overflow-y-auto no-scrollbar scroll-smooth">
        {activeTab === 'superai' && (
          <SuperAIPage 
            onPostDoubt={() => setShowPostDoubt(true)} 
            onSelectDoubt={(id) => setActiveDoubtId(id)}
            onShowHistory={() => setShowHistory(true)}
          />
        )}
        {activeTab === 'pastpapers' && <PastPapersPage />}
        {activeTab === 'premium' && <PremiumPage />}
        {activeTab === 'profile' && (
          <ProfilePage 
            userName={userName} 
            onNavigate={(tab) => setActiveTab(tab)}
          />
        )}
      </div>

      {/* Post Doubt Overlay */}
      {showPostDoubt && (
        <div className="absolute inset-0 z-50 bg-white">
          <PostDoubtScreen 
            onBack={() => setShowPostDoubt(false)} 
            onSuccess={(id) => {
              setActiveDoubtId(id);
              setShowPostDoubt(false);
            }} 
          />
        </div>
      )}

      {/* History Overlay */}
      {showHistory && (
        <div className="absolute inset-0 z-[70] bg-white">
          <HistoryOverlay 
            onBack={() => setShowHistory(false)} 
            onOpenChat={(id) => {
              setActiveDoubtId(id);
              setShowHistory(false);
            }} 
          />
        </div>
      )}

      {/* Live Session Console */}
      {activeDoubtId && (
        <div className="absolute inset-0 z-[60] bg-white">
          <ChatScreen 
            doubtId={activeDoubtId} 
            onBack={() => setActiveDoubtId(null)} 
          />
        </div>
      )}

      {/* Floating Bottom Navigation */}
      {!showPostDoubt && !activeDoubtId && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white border border-slate-200 px-4 py-3 flex justify-around items-center rounded-[2.5rem] shadow-2xl shadow-blue-900/10 z-50">
          <button
            onClick={() => setActiveTab('superai')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 px-4 py-1 rounded-2xl ${
              activeTab === 'superai' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Sparkles className={`w-6 h-6 ${activeTab === 'superai' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">AI</span>
          </button>
          <button
            onClick={() => setActiveTab('pastpapers')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 px-4 py-1 rounded-2xl ${
              activeTab === 'pastpapers' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <FileText className={`w-6 h-6 ${activeTab === 'pastpapers' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Papers</span>
          </button>
          <button
            onClick={() => setActiveTab('premium')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 px-4 py-1 rounded-2xl ${
              activeTab === 'premium' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Crown className={`w-6 h-6 ${activeTab === 'premium' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Gold</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1.5 transition-all duration-300 px-4 py-1 rounded-2xl ${
              activeTab === 'profile' ? 'text-blue-600 scale-110' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <User className={`w-6 h-6 ${activeTab === 'profile' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">Profile</span>
          </button>
        </div>
      )}
    </div>
  );
}