import axios from 'axios';
import {
  Activity,
  BrainCircuit,
  ChevronRight,
  ClipboardList,
  HeartPulse,
  Info,
  Pill, Search,
  ShieldAlert, ShieldCheck,
  Utensils,
  X
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

const API_BASE = "https://neuro-diagnostics-app1.onrender.com";

const CATEGORY_MAP = {
  "General": ["fatigue", "fever", "lethargy", "weight_loss", "high_fever", "chills", "malaise", "phlegm", "sweating", "mild_fever"],
  "Skin": ["itching", "skin_rash", "nodal_skin_eruptions", "pustule", "blackheads", "scurring", "yellowish_skin", "bruising", "peeling_skin"],
  "Digestive": ["vomiting", "indigestion", "nausea", "abdominal_pain", "constipation", "diarrhoea", "stomach_pain", "acidity", "burning_micturition", "distention_of_abdomen"],
  "Neurological": ["headache", "dizziness", "altered_sensorium", "unsteadiness", "lack_of_concentration", "visual_disturbances", "balance_errors"],
  "Respiratory": ["continuous_sneezing", "cough", "breathlessness", "mucoid_sputum", "chest_pain"],
  "Muscle/Joint": ["joint_pain", "muscle_wasting", "muscle_weakness", "back_pain", "neck_pain", "stiff_neck", "knee_pain", "swelling_joints"]
};

export default function ModernPredictor() {
  const [backendSymptoms, setBackendSymptoms] = useState([]);
  const [selected, setSelected] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [results, setResults] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    axios.get(`${API_BASE}/symptoms`)
      .then(res => setBackendSymptoms(res.data.symptoms || []))
      .catch(err => console.error("Neural Link Offline"));
  }, []);

  const filteredSymptoms = useMemo(() => {
    return backendSymptoms.filter(s => {
      const matchesSearch = s.toLowerCase().includes(searchTerm.toLowerCase());
      if (activeCategory === "All") return matchesSearch;
      if (activeCategory === "Others") {
        const allKnown = Object.values(CATEGORY_MAP).flat();
        return matchesSearch && !allKnown.includes(s);
      }
      return matchesSearch && CATEGORY_MAP[activeCategory]?.includes(s);
    });
  }, [backendSymptoms, searchTerm, activeCategory]);

  const toggleSymptom = (s) => {
    setSelected(prev => prev.includes(s) ? prev.filter(i => i !== s) : [...prev, s]);
  };

  const runAnalysis = async () => {
    if (selected.length === 0) return;
    setIsAnalyzing(true);
    try {
      const res = await axios.post(`${API_BASE}/predict`, { symptoms: selected });
      setResults(res.data);
    } catch (err) {
      alert("Analysis Failed. Check backend connection.");
    } finally {
      setTimeout(() => setIsAnalyzing(false), 800);
    }
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] antialiased">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60">
        <div className="max-w-[1440px] mx-auto px-8 h-20 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200 rotate-3">
              <BrainCircuit size={26} className="text-white -rotate-3" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900 leading-none uppercase">NEURO<span className="text-indigo-600">AI</span></h1>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Diagnostic Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Neural Link Active</span>
          </div>
        </div>
      </nav>

      <main className="max-w-[1440px] mx-auto px-8 py-10">
        <div className="grid lg:grid-cols-12 gap-10">
          
          {/* LEFT: SYMPTOM ENGINE */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/60 border border-white">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <ClipboardList className="text-indigo-600" size={28} />
                    Symptom Log
                </h2>
                <button onClick={() => setSelected([])} className="text-[10px] font-black text-rose-500 hover:underline uppercase tracking-widest">
                    Reset
                </button>
              </div>
              
              <div className="relative mb-6">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" placeholder="Search biological markers..." 
                  className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] focus:bg-white focus:border-indigo-100 transition-all outline-none font-medium text-sm"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex overflow-x-auto gap-2 mb-8 pb-2 no-scrollbar">
                {["All", ...Object.keys(CATEGORY_MAP), "Others"].map(cat => (
                  <button
                    key={cat} onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2.5 rounded-full text-[10px] font-black whitespace-nowrap transition-all border ${
                      activeCategory === cat ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500'
                    }`}
                  >
                    {cat.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="h-[380px] overflow-y-auto pr-3 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
                {filteredSymptoms.map(s => {
                  const isActive = selected.includes(s);
                  return (
                    <button
                      key={s} onClick={() => toggleSymptom(s)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all border ${
                        isActive ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-100 hover:border-indigo-100'
                      }`}
                    >
                      <span className="capitalize font-bold text-xs">{s.replace(/_/g, ' ')}</span>
                      {isActive ? <X size={16} /> : <div className="w-5 h-5 border-2 border-slate-100 rounded-lg" />}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={runAnalysis}
                disabled={selected.length === 0 || isAnalyzing}
                className="w-full mt-8 py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs shadow-2xl hover:bg-black transition-all disabled:opacity-20 uppercase tracking-[0.2em] flex items-center justify-center gap-3"
              >
                {isAnalyzing ? "Processing Neural Map..." : "Initiate Diagnosis"}
                {!isAnalyzing && <ChevronRight size={18} />}
              </button>
            </div>
          </div>

          {/* RIGHT: CLINICAL DASHBOARD */}
          <div className="lg:col-span-7">
            {!results && !isAnalyzing ? (
              <div className="h-full min-h-[600px] bg-white/40 border-4 border-dashed border-white rounded-[3rem] flex flex-col items-center justify-center p-16 text-center">
                <HeartPulse className="text-slate-200 mb-8" size={64} />
                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Awaiting Biomarkers</h3>
                <p className="text-slate-400 max-w-sm mt-4 text-xs font-bold leading-relaxed uppercase">Select symptoms to begin the inference process.</p>
              </div>
            ) : isAnalyzing ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-64 bg-white rounded-[3rem]" />
                <div className="grid grid-cols-2 gap-6">
                  <div className="h-48 bg-white rounded-[3rem]" />
                  <div className="h-48 bg-white rounded-[3rem]" />
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                {/* 1. Main Disease & Description Card */}
                <div className="bg-slate-900 rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
                  <div className="relative z-10">
                    <span className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.4em]">Inference Outcome</span>
                    <h1 className="text-6xl font-black text-white mb-8 tracking-tighter leading-[0.9]">{results.disease}</h1>
                    <div className="flex items-start gap-4 p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-md">
                        <Info size={24} className="text-indigo-400 shrink-0 mt-1" />
                        <p className="text-slate-300 text-xs leading-relaxed font-bold italic">"{results.description}"</p>
                    </div>
                  </div>
                </div>

                {/* 2-5. Action Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  <ResultCard title="Medical Protocol" icon={<Pill size={20}/>} color="rose" data={results.medications} />
                  <ResultCard title="Safety Steps" icon={<ShieldCheck size={20}/>} color="emerald" data={results.precautions} />
                  <ResultCard title="Dietary Intake" icon={<Utensils size={20}/>} color="amber" data={results.diets} />
                  <ResultCard title="Recovery Plan" icon={<Activity size={20}/>} color="blue" isText data={results.workout} />
                </div>

                <div className="p-6 bg-slate-100 rounded-[2rem] flex gap-5 items-center">
                    <ShieldAlert className="text-slate-400 shrink-0" size={32} />
                    <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest leading-relaxed">
                        Educational Disclaimer: AI predictions are based on pattern recognition and do not replace professional medical consultation.
                    </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function ResultCard({ title, icon, color, data, isText = false }) {
    const themes = {
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100",
        blue: "text-blue-600 bg-blue-50 border-blue-100"
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <div className={`flex items-center gap-3 mb-6 font-black text-[10px] uppercase tracking-widest ${themes[color].split(' ')[0]}`}>
                <div className={`p-2 rounded-xl ${themes[color]}`}>{icon}</div>
                {title}
            </div>
            {isText ? (
                <div className={`p-4 rounded-2xl border font-bold text-xs leading-relaxed ${themes[color]}`}>
                  {data}
                </div>
            ) : (
                <div className="flex flex-wrap gap-2">
                    {Array.isArray(data) && data.map((item, i) => (
                        <span key={i} className={`px-3 py-1.5 rounded-lg text-[10px] font-black border capitalize ${themes[color]}`}>
                            {item}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
}
