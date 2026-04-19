import { useState, useEffect, useRef } from 'react';
import { Camera, X, ArrowRight, Loader2, CheckCircle2, Clock, RefreshCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PostDoubtScreenProps {
  onBack: () => void;
  onSuccess: (doubtId: string) => void;
}

export function PostDoubtScreen({ onBack, onSuccess }: PostDoubtScreenProps) {
  const [step, setStep] = useState<'form' | 'waiting' | 'success'>('form');
  const [category, setCategory] = useState('');
  const [doubtText, setDoubtText] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [timer, setTimer] = useState(120);
  const [activeDoubtId, setActiveDoubtId] = useState<string | null>(null);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const pollRef = useRef<any>(null);

  const categories = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Other'];

  // Timer countdown
  useEffect(() => {
    let interval: any;
    if (step === 'waiting' && timer > 0) {
      interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Auto-redirect on success
  useEffect(() => {
    if (step === 'success' && activeDoubtId) {
      const timeout = setTimeout(() => onSuccess(activeDoubtId), 1500);
      return () => clearTimeout(timeout);
    }
  }, [step, activeDoubtId]);

  // Listen for tutor interest — runs only after doubtId is set
  useEffect(() => {
    if (!activeDoubtId || step !== 'waiting') return;

    // Fetch immediately (in case tutor already applied)
    fetchApplicants(activeDoubtId);

    // Realtime subscription on connect_requests
    const channel = supabase
      .channel(`applicants:${activeDoubtId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'connect_requests',
        filter: `doubt_id=eq.${activeDoubtId}`
      }, async (payload) => {
        console.log('Tutor applied!', payload.new);
        await addApplicant(activeDoubtId, payload.new.teacher_id, payload.new.id);
      })
      .subscribe((status) => {
        console.log('Applicant channel status:', status);
      });

    // Polling fallback every 2 seconds (faster detection)
    pollRef.current = setInterval(() => {
      console.log('Polling for applicants...');
      fetchApplicants(activeDoubtId);
    }, 2000);

    return () => {
      supabase.removeChannel(channel);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeDoubtId, step]);

  const fetchApplicants = async (doubtId: string) => {
    const { data, error } = await supabase
      .from('connect_requests')
      .select('id, teacher_id, status, teacher:profiles!teacher_id(id, full_name, gender, course_name)')
      .eq('doubt_id', doubtId)
      .eq('status', 'pending');

    if (error) {
      console.error('fetchApplicants error:', error);
      return;
    }

    if (data && data.length > 0) {
      const formatted = data.map((req: any) => ({
        ...req.teacher,
        requestId: req.id,
      }));
      setApplicants(formatted);
    }
  };

  const addApplicant = async (doubtId: string, teacherId: string, requestId: string) => {
    const { data: teacher } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', teacherId)
      .single();

    if (teacher) {
      setApplicants((prev) => {
        if (prev.find((a) => a.id === teacher.id)) return prev;
        return [...prev, { ...teacher, requestId }];
      });
    }
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!category || !doubtText || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { alert('Login required.'); return; }

      // 1. Insert the doubt
      const { data, error } = await supabase
        .from('doubts')
        .insert([{
          student_id: user.id,
          subject: category,
          content: doubtText,
          image_url: image,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Only AFTER we have the ID, switch to waiting screen
      setActiveDoubtId(data.id);
      setTimer(120);
      setApplicants([]);
      setStep('waiting');

    } catch (err: any) {
      console.error('Submit error:', err);
      alert('Failed to post doubt: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const connectWithTutor = async (tutor: any) => {
    try {
      console.log('Connecting with tutor:', tutor.full_name, 'RequestID:', tutor.requestId);

      // 1. Update DB
      const { error } = await supabase
        .from('connect_requests')
        .update({ status: 'accepted' })
        .eq('id', tutor.requestId);

      if (error) throw error;

      // 2. Mark doubt as connected (valid enum: pending/connected/solved/cancelled)
      await supabase
        .from('doubts')
        .update({ status: 'connected' })
        .eq('id', activeDoubtId);

      // 3. Broadcast to tutor (3x retry)
      const hsCh = supabase.channel(`handshake:${activeDoubtId}`);
      hsCh.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          for (let i = 0; i < 3; i++) {
            await hsCh.send({
              type: 'broadcast',
              event: 'student_confirmed',
              payload: { teacher_id: tutor.id, doubt_id: activeDoubtId }
            });
            await new Promise(r => setTimeout(r, 300));
          }
          supabase.removeChannel(hsCh);
        }
      });

      // 4. Go to success
      setStep('success');

    } catch (err: any) {
      console.error('Connect error:', err);
      alert('Connection failed: ' + err.message);
    }
  };

  // ── SUCCESS SCREEN ─────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div className="h-full bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-xl">
          <CheckCircle2 className="w-12 h-12 text-green-500 animate-bounce" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">Expert Linked!</h2>
        <p className="text-slate-500 text-sm mb-8">Opening your live session...</p>
        <div className="flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Launching Console...</span>
        </div>
      </div>
    );
  }

  // ── WAITING SCREEN ─────────────────────────────────────────────
  if (step === 'waiting') {
    return (
      <div className="h-full bg-slate-50 flex flex-col">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 pt-10 pb-6 rounded-b-[2.5rem] shadow-xl">
          <div className="flex justify-between items-start mb-5">
            <div>
              <h2 className="text-xl font-black">Finding Experts...</h2>
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">
                {applicants.length > 0 ? `${applicants.length} expert(s) available` : 'Scanning for tutors...'}
              </p>
            </div>
            <div className="bg-white/20 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-mono font-bold">
                {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="bg-white/10 rounded-2xl px-4 py-3 border border-white/10">
            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Your Doubt</p>
            <p className="text-sm font-bold truncate">{doubtText}</p>
          </div>
        </div>

        {/* Applicants List */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3">
          {applicants.length > 0 ? (
            <>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                Available Tutors ({applicants.length})
              </p>
              {applicants.map((tutor) => (
                <div
                  key={tutor.id}
                  className="bg-white rounded-3xl p-4 shadow-lg border border-blue-50 flex items-center gap-4"
                >
                  <div className="w-13 h-13 w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                    {tutor.gender === 'Female' ? '👩‍🏫' : '👨‍🏫'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-slate-800 truncate">{tutor.full_name || 'Expert Tutor'}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                      {tutor.course_name || 'Expert'} · ⭐ 4.9
                    </p>
                  </div>
                  <button
                    onClick={() => connectWithTutor(tutor)}
                    className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-blue-200 active:scale-90 transition-all flex-shrink-0"
                  >
                    Connect
                  </button>
                </div>
              ))}
            </>
          ) : timer > 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="relative mb-6">
                <Loader2 className="w-12 h-12 animate-spin text-blue-200" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
              </div>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-loose">
                Waiting for experts to<br />accept your request...
              </p>
              <button
                onClick={() => activeDoubtId && fetchApplicants(activeDoubtId)}
                className="mt-6 flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest"
              >
                <RefreshCcw className="w-3 h-3" /> Refresh List
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="font-black text-slate-800 mb-1">Time Elapsed</p>
              <p className="text-slate-400 text-xs mb-8">No tutor found. Try posting again.</p>
              <button
                onClick={() => { setStep('form'); setTimer(120); setApplicants([]); }}
                className="bg-white border-2 border-slate-200 text-slate-800 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 hover:border-blue-500 hover:text-blue-600 transition-all"
              >
                <RefreshCcw className="w-4 h-4" /> Re-post Doubt
              </button>
            </div>
          )}
        </div>

        {/* Cancel */}
        <div className="px-6 py-5 bg-white border-t border-slate-100 text-center">
          <button onClick={onBack} className="text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-red-500 transition-colors">
            Cancel Request
          </button>
        </div>
      </div>
    );
  }

  // ── FORM SCREEN ────────────────────────────────────────────────
  return (
    <div className="h-full bg-white flex flex-col">
      <div className="px-5 py-4 flex items-center justify-between border-b">
        <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-black text-sm">Post Your Doubt</h2>
        <div className="w-9" />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Subject</label>
        <div className="grid grid-cols-3 gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`py-2.5 px-2 rounded-xl border-2 text-[11px] font-black uppercase tracking-wide transition-all ${
                category === cat ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-gray-100 bg-gray-50 text-gray-500'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Your Question</label>
        <textarea
          value={doubtText}
          onChange={(e) => setDoubtText(e.target.value)}
          placeholder="Describe your doubt clearly..."
          className="w-full h-36 bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6 outline-none focus:border-blue-500 text-sm transition-all resize-none"
        />

        <label className="block text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest">Reference Photo (Optional)</label>
        {!image ? (
          <label className="w-full h-36 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors mb-6">
            <Camera className="w-8 h-8 text-gray-300 mb-2" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tap to add photo</span>
            <input type="file" accept="image/*" capture="environment" onChange={handleCapture} className="hidden" />
          </label>
        ) : (
          <div className="relative w-full h-36 mb-6">
            <img src={image} alt="Doubt" className="w-full h-full object-cover rounded-2xl shadow-lg" />
            <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-full">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t bg-white">
        <button
          onClick={handleSubmit}
          disabled={!category || !doubtText || isSubmitting}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
          <span>{isSubmitting ? 'Posting...' : 'Find Expert Tutor'}</span>
        </button>
      </div>
    </div>
  );
}
