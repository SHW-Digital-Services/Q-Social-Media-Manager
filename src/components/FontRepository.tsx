import React, { useState } from 'react';
import { BRAND_FONTS } from '../data/brandData';
import { 
  Type, 
  Copy, 
  Check, 
  Sliders, 
  FileCode, 
  BookOpen, 
  Sparkles,
  ArrowDown
} from 'lucide-react';

export const FontRepository: React.FC = () => {
  const [selectedFont, setSelectedFont] = useState(BRAND_FONTS[0]);
  const [testText, setTestText] = useState("Private support. Made for real life. I'm here for you—always.");
  const [fontSize, setFontSize] = useState(32);
  const [fontWeight, setFontWeight] = useState('700');
  const [letterSpacing, setLetterSpacing] = useState('-0.02');
  const [previewTheme, setPreviewTheme] = useState<'light' | 'cosmic'>('light');
  const [copiedSnippet, setCopiedSnippet] = useState(false);

  const handleCopyCss = () => {
    const css = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

/* Q Intelligence Typography Tokens */
.font-display {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 700;
  letter-spacing: -0.025em;
}

.font-interface {
  font-family: 'Inter', system-ui, sans-serif;
  font-weight: 400;
  line-height: 1.6;
}

.font-mono-spec {
  font-family: 'JetBrains Mono', monospace;
  font-weight: 500;
}`;
    navigator.clipboard.writeText(css);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-mono font-semibold">
              <Type className="w-3.5 h-3.5" />
              <span>OFFICIAL TYPOGRAPHY SPECIFICATION</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Q Brand Font Repository & Type Specimen
            </h2>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Inter-led typographic hierarchy paired with JetBrains Mono for security indicators, establishing warmth, directness, and crisp legibility across all social channels.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyCss}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-colors cursor-pointer"
            >
              {copiedSnippet ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet ? 'CSS Snippets Copied!' : 'Copy Brand CSS Rules'}</span>
            </button>
          </div>
        </div>

        {/* Font Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
          {BRAND_FONTS.map(f => {
            const isSelected = selectedFont.id === f.id;
            return (
              <div 
                key={f.id}
                onClick={() => {
                  setSelectedFont(f);
                  if (f.role === 'display') setFontWeight('700');
                  else if (f.role === 'interface') setFontWeight('400');
                  else setFontWeight('500');
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected 
                    ? 'bg-purple-50/70 border-purple-300 ring-2 ring-purple-500/20 shadow-2xs' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-semibold text-purple-700 uppercase bg-white px-2 py-0.5 rounded-full border border-purple-100">
                    {f.role}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Google Fonts</span>
                </div>
                <h4 className="text-base font-bold text-slate-900" style={{ fontFamily: f.family }}>
                  {f.name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 leading-snug">
                  {f.bestUsedFor}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Type Tester */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            <h3 className="text-base font-bold font-display text-slate-900">
              Interactive Live Type Tester ({selectedFont.name})
            </h3>
          </div>

          {/* Controls: Size, Weight, Theme */}
          <div className="flex flex-wrap items-center gap-4 text-xs">
            {/* Size Slider */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Size:</span>
              <input
                type="range"
                min="14"
                max="64"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="w-24 accent-purple-600 cursor-pointer"
              />
              <span className="font-mono w-10 font-bold text-slate-700">{fontSize}px</span>
            </div>

            {/* Weight dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Weight:</span>
              <select
                value={fontWeight}
                onChange={(e) => setFontWeight(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1 text-xs text-slate-800 focus:outline-none cursor-pointer font-medium"
              >
                <option value="400">400 Regular</option>
                <option value="500">500 Medium</option>
                <option value="600">600 Semibold</option>
                <option value="700">700 Bold</option>
                <option value="800">800 ExtraBold</option>
              </select>
            </div>

            {/* Theme Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
              <button
                onClick={() => setPreviewTheme('light')}
                className={`px-3 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                  previewTheme === 'light' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
              >
                Light
              </button>
              <button
                onClick={() => setPreviewTheme('cosmic')}
                className={`px-3 py-0.5 rounded-full text-xs font-semibold cursor-pointer ${
                  previewTheme === 'cosmic' ? 'bg-slate-900 text-white shadow-2xs' : 'text-slate-500'
                }`}
              >
                Cosmic Dark
              </button>
            </div>
          </div>
        </div>

        {/* Live Canvas Area */}
        <div 
          className={`p-8 rounded-3xl transition-colors relative overflow-hidden border min-h-[180px] flex items-center ${
            previewTheme === 'cosmic' 
              ? 'bg-cosmic-gradient border-purple-950 text-white shadow-glow-purple' 
              : 'bg-slate-50 border-slate-200 text-slate-950'
          }`}
        >
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={2}
            className="w-full bg-transparent resize-none focus:outline-none border-none leading-tight"
            style={{
              fontFamily: selectedFont.family,
              fontSize: `${fontSize}px`,
              fontWeight: Number(fontWeight),
              letterSpacing: `${letterSpacing}em`
            }}
          />
        </div>

        {/* CSS Usage Snippet for Current Font */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex items-center justify-between text-xs font-mono text-slate-700">
          <div className="truncate">
            <span className="text-purple-600 font-bold">CSS: </span>
            <span>{selectedFont.cssRule}</span>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(selectedFont.cssRule);
              setCopiedSnippet(true);
              setTimeout(() => setCopiedSnippet(false), 2000);
            }}
            className="text-xs font-sans font-semibold text-purple-600 hover:text-purple-700 ml-4 shrink-0 cursor-pointer"
          >
            Copy Snippet
          </button>
        </div>
      </div>

      {/* Official Typographic Hierarchy Scale Ladder */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold font-display text-slate-900">
              Brand Hierarchy & Scale Matrix
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exact point sizes, line heights, and character pairings defined in the Q Intelligence Brand Guide.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200 font-semibold">
            Scale: Major Second 1.125 / Perfect Fourth
          </span>
        </div>

        <div className="divide-y divide-slate-100 space-y-4">
          
          {/* H1 Display */}
          <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div className="w-48 shrink-0 text-xs font-mono text-slate-400">
              <div className="font-bold text-slate-700">H1 Display Headline</div>
              <div>Inter Bold • 48px / 3rem</div>
            </div>
            <div className="flex-1 font-display font-bold text-4xl sm:text-5xl text-slate-900 tracking-tight">
              Q Intelligence
            </div>
          </div>

          {/* H2 Display */}
          <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div className="w-48 shrink-0 text-xs font-mono text-slate-400">
              <div className="font-bold text-slate-700">H2 Section Heading</div>
              <div>Inter Semibold • 30px / 1.875rem</div>
            </div>
            <div className="flex-1 font-display font-semibold text-2xl sm:text-3xl text-slate-900 tracking-tight">
              Welcome to your private space
            </div>
          </div>

          {/* H3 Display */}
          <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div className="w-48 shrink-0 text-xs font-mono text-slate-400">
              <div className="font-bold text-slate-700">H3 Card Header</div>
              <div>Inter Medium • 24px / 1.5rem</div>
            </div>
            <div className="flex-1 font-display font-medium text-xl sm:text-2xl text-slate-900">
              Safe conversations & community resources
            </div>
          </div>

          {/* Chat Bubble Interface */}
          <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div className="w-48 shrink-0 text-xs font-mono text-slate-400">
              <div className="font-bold text-slate-700">Chat Bubble / Caption</div>
              <div>Inter Regular • 16px / 1rem</div>
            </div>
            <div className="flex-1">
              <div className="bg-purple-50 text-slate-800 p-4 rounded-2xl rounded-tl-none inline-block text-base leading-relaxed border border-purple-100">
                Hi, I’m Q. I’m here for you—always. Take all the time you need.
              </div>
            </div>
          </div>

          {/* Body Text */}
          <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div className="w-48 shrink-0 text-xs font-mono text-slate-400">
              <div className="font-bold text-slate-700">Interface Body Text</div>
              <div>Inter Regular • 15px / 0.937rem</div>
            </div>
            <div className="flex-1 text-sm text-slate-600 leading-relaxed max-w-2xl font-sans">
              Local AI runs directly on compatible devices. Hosted intelligence and search are clearly identified when they connect to online services, ensuring complete transparency.
            </div>
          </div>

          {/* Code Token */}
          <div className="pt-4 flex flex-col md:flex-row md:items-baseline justify-between gap-4">
            <div className="w-48 shrink-0 text-xs font-mono text-slate-400">
              <div className="font-bold text-slate-700">PII Token / Specs</div>
              <div>JetBrains Mono • 13px / 0.812rem</div>
            </div>
            <div className="flex-1 font-mono text-xs text-purple-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              PII_SHIELD = ACTIVE | ENCRYPTION_ZONE = ON_DEVICE | ROLE = COMMUNICATIONS_OFFICER
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
