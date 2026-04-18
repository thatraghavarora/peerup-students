import { Search, FileText, Download, Filter, GraduationCap, School, Book, Award } from 'lucide-react';
import { useState } from 'react';

export function PastPapersPage() {
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All', icon: Book },
    { id: 'boards', label: 'Board Exams', icon: School },
    { id: 'competitive', label: 'Competitive', icon: Award },
    { id: 'university', label: 'University', icon: GraduationCap },
  ];

  const papers = [
    { id: 1, subject: 'Advanced Mathematics', year: '2024', exam: 'JEE Main', category: 'competitive', pages: 24, size: '2.4 MB' },
    { id: 2, subject: 'Classical Physics', year: '2024', exam: 'CBSE Board', category: 'boards', pages: 18, size: '1.8 MB' },
    { id: 3, subject: 'Organic Chemistry', year: '2023', exam: 'NEET UG', category: 'competitive', pages: 32, size: '4.1 MB' },
    { id: 4, subject: 'Molecular Biology', year: '2023', exam: 'ICSE Board', category: 'boards', pages: 14, size: '1.2 MB' },
    { id: 5, subject: 'Business Analytics', year: '2024', exam: 'Mumbai University', category: 'university', pages: 12, size: '0.9 MB' },
    { id: 6, subject: 'English Literature', year: '2024', exam: 'CBSE Board', category: 'boards', pages: 10, size: '0.8 MB' },
  ];

  const filteredPapers = activeCategory === 'all' 
    ? papers 
    : papers.filter(p => p.category === activeCategory);

  return (
    <div className="px-6 pt-6 pb-20">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-slate-900 leading-tight">Past Papers Archive</h2>
        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-1">
          Access 1000+ Previous Year Questions
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="w-5 h-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search by subject, exam or year..."
          className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
          <Filter className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto md:flex-wrap md:justify-start pb-4 no-scrollbar -mx-2 px-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-500 border border-gray-100 hover:border-blue-200'
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Papers Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredPapers.map((paper) => (
          <div
            key={paper.id}
            className="group bg-white border border-gray-100 rounded-3xl p-5 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-900/5 transition-all active:scale-[0.98]"
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-50 group-hover:bg-blue-100 rounded-2xl flex items-center justify-center transition-colors">
                <FileText className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">
                    {paper.exam}
                  </span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {paper.year}
                  </span>
                </div>
                <h3 className="font-black text-slate-800 text-lg group-hover:text-blue-600 transition-colors">
                  {paper.subject}
                </h3>
                <div className="flex items-center gap-3 mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>{paper.pages} Pages</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span>{paper.size}</span>
                </div>
              </div>
              <button className="w-12 h-12 bg-gray-50 group-hover:bg-blue-600 rounded-2xl flex items-center justify-center transition-all group-hover:shadow-lg group-hover:shadow-blue-200">
                <Download className="w-5 h-5 text-gray-400 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More/Deep Content Placeholder */}
      <div className="mt-10 pt-10 border-t border-dashed border-gray-200 text-center">
        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">You've reached the end of preview</p>
        <button className="text-blue-600 font-black text-sm uppercase tracking-widest underline underline-offset-4">
          Request Specific Paper
        </button>
      </div>
    </div>
  );
}