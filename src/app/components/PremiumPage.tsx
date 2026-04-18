import { Crown, Check, Zap, BookOpen, Video, MessageCircle, Star, ShieldCheck, Sparkles } from 'lucide-react';

export function PremiumPage() {
  const features = [
    { icon: Zap, text: 'Instant AI solutions', sub: 'No waiting time for results' },
    { icon: Video, text: 'Live Video Connect', sub: 'Talk to experts face-to-face' },
    { icon: BookOpen, text: 'Step-by-step PDF Guides', sub: 'Detailed answers for every sum' },
    { icon: MessageCircle, text: 'Priority Doubt Queue', sub: 'Your doubts get solved first' },
    { icon: ShieldCheck, text: 'Ad-free Experience', sub: 'Distraction-free learning' },
  ];

  const plans = [
    { name: 'Standard Monthly', price: '₹299', duration: '/mo', popular: false, desc: 'Basic premium access' },
    { name: 'Premium Gold', price: '₹2,999', duration: '/yr', popular: true, savings: 'Save 20%', desc: 'Best for final exams' },
  ];

  return (
    <div className="px-6 pt-10 pb-20 bg-white">
      {/* Premium Badge */}
      <div className="flex justify-center mb-6">
        <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 p-1 rounded-3xl shadow-2xl shadow-yellow-200">
           <div className="bg-white rounded-[1.4rem] p-5 flex items-center justify-center">
              <Crown className="w-12 h-12 text-yellow-500" />
           </div>
        </div>
      </div>

      <div className="text-center mb-10">
        <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2">
          Unlock the Full <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">Power</span>
        </h2>
        <p className="text-gray-400 font-bold text-xs uppercase tracking-widest leading-loose">
          Join 5000+ students scoring better <br/> with Peerup Gold
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start gap-4 p-4 rounded-3xl bg-slate-50 border border-slate-100 group hover:bg-white hover:border-blue-100 transition-all">
            <div className="w-10 h-10 bg-white shadow-sm rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <feature.icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-black text-slate-800 text-sm">{feature.text}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{feature.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Plans Section */}
      <h3 className="font-black text-slate-900 mb-4 px-1">Choose Your Plan</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {plans.map((plan, index) => (
          <div
            key={index}
            className={`rounded-3xl p-6 border-2 transition-all relative overflow-hidden ${
              plan.popular
                ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-white shadow-xl shadow-yellow-900/5'
                : 'border-slate-100 bg-white'
            }`}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-yellow-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
                Most Popular
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h4 className="font-black text-lg text-slate-800">{plan.name}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{plan.desc}</p>
              </div>
              {plan.savings && (
                <span className="bg-green-100 text-green-700 text-[10px] font-black px-2 py-1 rounded-lg">
                  {plan.savings}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black text-slate-900">{plan.price}</span>
              <span className="text-sm font-bold text-gray-400">{plan.duration}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Buy Now Button */}
      <button className="w-full bg-slate-900 text-white rounded-[2rem] py-6 font-black text-lg shadow-2xl shadow-slate-200 hover:shadow-slate-300 transition-all active:scale-95 flex items-center justify-center gap-3">
        <Sparkles className="w-6 h-6 text-yellow-400" />
        Upgrade Now
      </button>
      
      <p className="text-center mt-6 text-gray-400 text-[10px] font-bold uppercase tracking-widest">
        Secure Payment via Razorpay 🔐
      </p>
    </div>
  );
}