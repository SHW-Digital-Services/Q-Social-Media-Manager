import React, { useState, useRef, useEffect } from 'react';
import { DesignTemplate } from '../types';
import { DESIGN_TEMPLATES, Q_LOGO_URL } from '../data/brandData';
import { QLogo } from './QLogo';
import { drawCleanQLogo, getTransparentQLogoUrl } from '../lib/logoUtils';
import { 
  Palette, 
  Download, 
  Send, 
  Sparkles, 
  Sliders, 
  Smartphone, 
  Check, 
  Layers,
  Eye,
  Plus,
  Trash2,
  Copy,
  Edit2,
  X,
  Bookmark,
  ShieldCheck,
  CheckCircle2,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DesignTemplatesStudioProps {
  onUseInComposer?: (imageUrl: string, suggestedTitle: string, suggestedContent: string) => void;
}

const LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY = 'q_intelligence_custom_templates';

export const DesignTemplatesStudio: React.FC<DesignTemplatesStudioProps> = ({
  onUseInComposer,
}) => {
  // Custom templates state loaded from localStorage
  const [customTemplates, setCustomTemplates] = useState<DesignTemplate[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Combine official templates and custom templates
  const allTemplates = [...DESIGN_TEMPLATES, ...customTemplates];

  const [selectedTemplate, setSelectedTemplate] = useState<DesignTemplate>(allTemplates[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  // Customization controls
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:5' | '16:9' | '9:16'>(allTemplates[0].defaultAspect);
  const [headline, setHeadline] = useState(allTemplates[0].defaultHeadline);
  const [subtext, setSubtext] = useState(allTemplates[0].defaultSubtext);
  const [badgeText, setBadgeText] = useState(allTemplates[0].badgeText);
  const [themeStyle, setThemeStyle] = useState<DesignTemplate['themeStyle']>(allTemplates[0].themeStyle);
  const [includeLogo, setIncludeLogo] = useState(true);
  const [includeTopline, setIncludeTopline] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  // Custom Template Creation Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplCategory, setNewTplCategory] = useState<DesignTemplate['category']>('custom');
  const [newTplTheme, setNewTplTheme] = useState<DesignTemplate['themeStyle']>('cosmic');
  const [newTplAspect, setNewTplAspect] = useState<'1:1' | '4:5' | '16:9' | '9:16'>('1:1');
  const [newTplHeadline, setNewTplHeadline] = useState('');
  const [newTplSubtext, setNewTplSubtext] = useState('');
  const [newTplBadge, setNewTplBadge] = useState('CUSTOM TEMPLATE');
  const [newTplDesc, setNewTplDesc] = useState('');

  // Persist custom templates
  const saveCustomTemplates = (updated: DesignTemplate[]) => {
    setCustomTemplates(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_CUSTOM_TEMPLATES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save custom templates to localStorage:', e);
    }
  };

  const handleSelectTemplate = (tpl: DesignTemplate) => {
    setSelectedTemplate(tpl);
    setHeadline(tpl.defaultHeadline);
    setSubtext(tpl.defaultSubtext);
    setBadgeText(tpl.badgeText);
    setAspectRatio(tpl.defaultAspect);
    setThemeStyle(tpl.themeStyle);
  };

  const handleCreateCustomTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplTitle.trim() || !newTplHeadline.trim()) return;

    const created: DesignTemplate = {
      id: `custom-tpl-${Date.now()}`,
      title: newTplTitle.trim(),
      category: newTplCategory,
      themeStyle: newTplTheme,
      defaultAspect: newTplAspect,
      defaultHeadline: newTplHeadline.trim(),
      defaultSubtext: newTplSubtext.trim() || "I'm here for you—always. Your private space for LGBTQ+ wellbeing.",
      badgeText: newTplBadge.trim().toUpperCase() || 'CUSTOM TEMPLATE',
      description: newTplDesc.trim() || 'Custom staff template for targeted brand communications.',
      previewMockupUrl: Q_LOGO_URL,
      isCustom: true,
      author: 'Staff Member',
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [created, ...customTemplates];
    saveCustomTemplates(updated);
    handleSelectTemplate(created);
    setIsCreateModalOpen(false);

    // Reset form
    setNewTplTitle('');
    setNewTplHeadline('');
    setNewTplSubtext('');
    setNewTplBadge('CUSTOM TEMPLATE');
    setNewTplDesc('');

    confetti({ particleCount: 50, spread: 60 });
  };

  const handleDeleteCustomTemplate = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this custom template?')) {
      const updated = customTemplates.filter(t => t.id !== id);
      saveCustomTemplates(updated);
      if (selectedTemplate.id === id) {
        handleSelectTemplate(DESIGN_TEMPLATES[0]);
      }
    }
  };

  const handleDuplicateTemplate = (tpl: DesignTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    const duplicated: DesignTemplate = {
      ...tpl,
      id: `custom-dup-${Date.now()}`,
      title: `${tpl.title} (Copy)`,
      isCustom: true,
      createdAt: new Date().toLocaleDateString()
    };
    const updated = [duplicated, ...customTemplates];
    saveCustomTemplates(updated);
    handleSelectTemplate(duplicated);
    confetti({ particleCount: 40, spread: 50 });
  };

  // Filter templates based on selected category tab
  const filteredTemplates = allTemplates.filter(tpl => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'custom') return tpl.isCustom;
    if (categoryFilter === 'announcement') return tpl.category === 'announcement';
    if (categoryFilter === 'quote') return tpl.category === 'quote';
    if (categoryFilter === 'helpline') return tpl.category === 'helpline';
    if (categoryFilter === 'resource') return tpl.category === 'resource';
    if (categoryFilter === 'celebration') return tpl.category === 'celebration' || tpl.category === 'pride';
    if (categoryFilter === 'privacy') return tpl.category === 'privacy';
    return true;
  });

  // Render to canvas and export as PNG image (guaranteeing NO white background box around Q logo)
  const handleExportImage = async (forComposer = false) => {
    setIsExporting(true);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setIsExporting(false);
      return;
    }

    // Dimensions based on aspect ratio
    let width = 1080;
    let height = 1080;
    if (aspectRatio === '4:5') {
      width = 1080;
      height = 1350;
    } else if (aspectRatio === '16:9') {
      width = 1920;
      height = 1080;
    } else if (aspectRatio === '9:16') {
      width = 1080;
      height = 1920;
    }

    canvas.width = width;
    canvas.height = height;

    // Background drawing according to theme
    if (themeStyle === 'cosmic') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#1e1235');
      grad.addColorStop(1, '#082f49');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (themeStyle === 'pride_spectrum') {
      ctx.fillStyle = '#0F091F';
      ctx.fillRect(0, 0, width, height);
    } else if (themeStyle === 'helpline_alert') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#FEF2F2';
      ctx.fillRect(40, 40, width - 80, height - 80);
    } else if (themeStyle === 'emerald_safe') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#064e3b');
      grad.addColorStop(1, '#022c22');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (themeStyle === 'sunset_affirming') {
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#431407');
      grad.addColorStop(0.6, '#7c2d12');
      grad.addColorStop(1, '#581c87');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (themeStyle === 'midnight_minimal') {
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, width, height);
      // Subtle silver border inset
      ctx.strokeStyle = '#27272a';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 30, width - 60, height - 60);
    } else {
      // light_tint default
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#F5F3FF';
      ctx.fillRect(40, 40, width - 80, height - 80);
    }

    // Pride Topline Ribbon
    if (includeTopline) {
      const topGrad = ctx.createLinearGradient(0, 0, width, 0);
      topGrad.addColorStop(0, '#e11d48');
      topGrad.addColorStop(0.18, '#f97316');
      topGrad.addColorStop(0.34, '#eab308');
      topGrad.addColorStop(0.5, '#10b981');
      topGrad.addColorStop(0.66, '#0ea5e9');
      topGrad.addColorStop(0.82, '#7c3aed');
      topGrad.addColorStop(1, '#db2777');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, width, 18);
    }

    // Load Transparent Q Logo Image (removes white background!)
    const cleanLogoDataUrl = await getTransparentQLogoUrl();
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      if (includeLogo) {
        const logoSize = width * 0.16;
        const logoX = (width - logoSize) / 2;
        const logoY = height * 0.13;
        // Draw clean logo without white background
        drawCleanQLogo(ctx, img, logoX, logoY, logoSize);
      }

      const isDarkTheme = themeStyle === 'cosmic' || themeStyle === 'pride_spectrum' || themeStyle === 'emerald_safe' || themeStyle === 'sunset_affirming' || themeStyle === 'midnight_minimal';

      // Draw Badge
      if (badgeText) {
        const badgeY = height * 0.35;
        ctx.font = '600 22px "JetBrains Mono", monospace';
        ctx.fillStyle = isDarkTheme ? '#A78BFA' : '#7C3AED';
        ctx.textAlign = 'center';
        ctx.fillText(badgeText.toUpperCase(), width / 2, badgeY);
      }

      // Draw Headline
      ctx.font = '700 52px "Inter", sans-serif';
      ctx.fillStyle = isDarkTheme ? '#FFFFFF' : '#0F091F';
      ctx.textAlign = 'center';

      // Word wrapping for headline
      const words = headline.split(' ');
      let line = '';
      let lineY = height * 0.45;
      const lineHeight = 66;
      const maxWidth = width * 0.82;

      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(line, width / 2, lineY);
          line = words[n] + ' ';
          lineY += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, width / 2, lineY);

      // Draw Subtext
      lineY += 44;
      ctx.font = '400 28px "Inter", sans-serif';
      ctx.fillStyle = isDarkTheme ? '#CBD5E1' : '#475569';
      
      const subWords = subtext.split(' ');
      let subLine = '';
      const subLineHeight = 42;

      for (let n = 0; n < subWords.length; n++) {
        const testLine = subLine + subWords[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && n > 0) {
          ctx.fillText(subLine, width / 2, lineY);
          subLine = subWords[n] + ' ';
          lineY += subLineHeight;
        } else {
          subLine = testLine;
        }
      }
      ctx.fillText(subLine, width / 2, lineY);

      // Bottom Sign-off
      ctx.font = '600 18px "JetBrains Mono", monospace';
      ctx.fillStyle = isDarkTheme ? '#94A3B8' : '#64748B';
      ctx.fillText('Q INTELLIGENCE • PRIVATE • AFFIRMING • SAFE', width / 2, height * 0.94);

      // Export
      const outputDataUrl = canvas.toDataURL('image/png');
      setIsExporting(false);

      if (forComposer && onUseInComposer) {
        onUseInComposer(outputDataUrl, headline, `${headline}\n\n${subtext}\n\n#QIntelligence #LGBTQWellbeing #SafeSpace`);
      } else {
        const link = document.createElement('a');
        link.download = `q-intelligence-${selectedTemplate.title.toLowerCase().replace(/\s+/g, '-')}-${aspectRatio.replace(':', 'x')}.png`;
        link.href = outputDataUrl;
        link.click();
        confetti({ particleCount: 70, spread: 60 });
      }
    };

    img.src = cleanLogoDataUrl;
  };

  const handleCopyText = () => {
    const textToCopy = `${badgeText ? `[${badgeText}] ` : ''}${headline}\n\n${subtext}\n\n#QIntelligence #LGBTQWellbeing #AffirmingSpaces`;
    navigator.clipboard.writeText(textToCopy);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  const getAspectClasses = (aspect: string) => {
    switch (aspect) {
      case '4:5': return 'aspect-[4/5] max-w-[420px]';
      case '16:9': return 'aspect-[16/9] max-w-[580px]';
      case '9:16': return 'aspect-[9/16] max-w-[340px]';
      default: return 'aspect-square max-w-[460px]';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Studio Banner & Custom Template CTA */}
      <div className="bg-gradient-to-br from-slate-900 via-[#130b24] to-[#041d33] rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden border border-purple-500/30 shadow-2xl">
        <div className="absolute top-0 inset-x-0 h-1.5 bg-pride-spectrum"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-mono font-medium">
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>OFFICIAL GRAPHICS SUITE • WCAG AAA COMPLIANT</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
              Design Templates & Publication Studio
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Empower social media and communications officers to publish branded cards, quotes, and announcements. 
              Features automated white-background removal for the Q Logo, 13 brand presets, and custom template authoring.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-full bg-pride-spectrum hover:opacity-95 text-white font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Custom Template</span>
            </button>
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-mono text-purple-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>No-White-BG Q Logo Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs Filter */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'all', label: `All Templates (${allTemplates.length})` },
          { id: 'custom', label: `Custom (${customTemplates.length})` },
          { id: 'announcement', label: 'Announcements' },
          { id: 'quote', label: 'Affirming Quotes' },
          { id: 'helpline', label: '24/7 Helplines' },
          { id: 'resource', label: 'Grounding & Exercises' },
          { id: 'celebration', label: 'Pride & Joy' },
          { id: 'privacy', label: 'Privacy & Security' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
              categoryFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Templates Selector Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {filteredTemplates.map((tpl) => {
          const isSelected = selectedTemplate.id === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => handleSelectTemplate(tpl)}
              className={`group relative p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected 
                  ? 'bg-purple-50/70 border-purple-600 ring-2 ring-purple-600/30 shadow-md' 
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              {/* Badge & Actions */}
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md ${
                  tpl.isCustom ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                }`}>
                  {tpl.isCustom ? 'CUSTOM' : tpl.category.toUpperCase()}
                </span>

                {tpl.isCustom && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleDuplicateTemplate(tpl, e)}
                      title="Duplicate Template"
                      className="p-1 hover:bg-slate-200 rounded text-slate-600"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteCustomTemplate(tpl.id, e)}
                      title="Delete Template"
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Mini visual mockup box */}
              <div className={`w-full aspect-video rounded-xl mb-2 flex items-center justify-center p-2 relative overflow-hidden ${
                tpl.themeStyle === 'cosmic'
                  ? 'bg-gradient-to-br from-slate-950 to-indigo-950 text-white'
                  : tpl.themeStyle === 'pride_spectrum'
                  ? 'bg-[#0F091F] text-white border-t border-purple-500'
                  : tpl.themeStyle === 'helpline_alert'
                  ? 'bg-red-50 text-red-900 border border-red-200'
                  : tpl.themeStyle === 'emerald_safe'
                  ? 'bg-emerald-900 text-white'
                  : tpl.themeStyle === 'sunset_affirming'
                  ? 'bg-amber-950 text-white'
                  : tpl.themeStyle === 'midnight_minimal'
                  ? 'bg-zinc-900 text-white'
                  : 'bg-purple-50 text-purple-900 border border-purple-200'
              }`}>
                {/* Clean Q Logo inside mini preview */}
                <div className="w-6 h-6 flex items-center justify-center">
                  <QLogo className="w-full h-full object-contain" />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-900 line-clamp-1 font-display">
                  {tpl.title}
                </h3>
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                  {tpl.defaultHeadline}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Studio Editor & Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left 5 cols: Customizer Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              <h2 className="text-sm font-bold font-display text-slate-900">
                Customize Publication Graphic
              </h2>
            </div>
            <span className="text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              {selectedTemplate.category.toUpperCase()}
            </span>
          </div>

          <div className="space-y-4">
            
            {/* Theme Style Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Visual Theme Style
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'cosmic', label: 'Cosmic 3D', bg: 'bg-slate-900 text-white' },
                  { id: 'light_tint', label: 'Lilac Q-50', bg: 'bg-purple-100 text-purple-900' },
                  { id: 'pride_spectrum', label: 'Obsidian Pride', bg: 'bg-zinc-900 text-white' },
                  { id: 'helpline_alert', label: 'Crisis Alert', bg: 'bg-red-50 text-red-900 border border-red-200' },
                  { id: 'emerald_safe', label: 'Emerald Sanctuary', bg: 'bg-emerald-900 text-white' },
                  { id: 'sunset_affirming', label: 'Sunset Affirming', bg: 'bg-amber-900 text-white' },
                  { id: 'midnight_minimal', label: 'Midnight Minimal', bg: 'bg-zinc-950 text-white' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setThemeStyle(t.id as any)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer truncate ${
                      themeStyle === t.id
                        ? 'ring-2 ring-purple-600 shadow-xs font-bold'
                        : 'opacity-70 hover:opacity-100'
                    } ${t.bg}`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Publication Target Aspect Ratio
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: '1:1', desc: 'Square (Insta / X / LinkedIn)' },
                  { id: '4:5', desc: 'Portrait Feed' },
                  { id: '16:9', desc: 'Landscape Banner' },
                  { id: '9:16', desc: 'Story / Reel' },
                ].map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setAspectRatio(r.id as any)}
                    className={`py-2 px-2 rounded-xl text-xs font-mono font-semibold transition-all cursor-pointer ${
                      aspectRatio === r.id 
                        ? 'bg-purple-600 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {r.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Pillar Eyebrow Badge
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white uppercase font-mono"
              />
            </div>

            {/* Headline Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Display Headline
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-medium"
              />
            </div>

            {/* Subtext Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Supporting Message / Description
              </label>
              <textarea
                rows={3}
                value={subtext}
                onChange={(e) => setSubtext(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white font-sans leading-relaxed"
              />
            </div>

            {/* Visual Toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5 text-xs">
              <div className="p-3 bg-purple-50/60 rounded-2xl border border-purple-200/60 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-900">
                  <input
                    type="checkbox"
                    checked={includeLogo}
                    onChange={(e) => setIncludeLogo(e.target.checked)}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>Display 3D Cosmic Q Logomark</span>
                </label>
                <p className="text-[11px] text-purple-900/80 pl-5 leading-tight">
                  ✓ Automatically removes white background for a seamless transparent fit on any theme.
                </p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={includeTopline}
                  onChange={(e) => setIncludeTopline(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <span>Include Official Pride Spectrum Ribbon</span>
              </label>
            </div>

            {/* Direct Export Buttons */}
            <div className="pt-4 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleExportImage(false)}
                  disabled={isExporting}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>{isExporting ? 'Rendering...' : 'Save PNG (No White BG)'}</span>
                </button>

                {onUseInComposer && (
                  <button
                    onClick={() => handleExportImage(true)}
                    disabled={isExporting}
                    className="flex-1 py-3 bg-pride-spectrum hover:opacity-95 text-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Push to Post</span>
                  </button>
                )}
              </div>

              <button
                onClick={handleCopyText}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copySuccess ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy Publication Copy & Hashtags'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 7 cols: Live Stage Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900/5 rounded-3xl p-6 sm:p-10 border border-slate-200 relative">
          
          <div className="w-full flex items-center justify-between mb-4 text-xs text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-purple-600" />
              <span>LIVE PUBLICATION PREVIEW</span>
            </span>
            <span>{aspectRatio} Format</span>
          </div>

          {/* Card Preview Element */}
          <div 
            className={`w-full rounded-3xl relative overflow-hidden shadow-2xl flex flex-col justify-between p-8 sm:p-12 transition-all ${getAspectClasses(aspectRatio)} ${
              themeStyle === 'cosmic'
                ? 'bg-gradient-to-br from-[#020617] via-[#1e1235] to-[#082f49] text-white border border-purple-900/50 shadow-glow-purple'
                : themeStyle === 'pride_spectrum'
                ? 'bg-[#0F091F] text-white border border-purple-500/30'
                : themeStyle === 'helpline_alert'
                ? 'bg-white text-slate-900 border-2 border-red-200'
                : themeStyle === 'emerald_safe'
                ? 'bg-gradient-to-br from-[#064e3b] to-[#022c22] text-white border border-emerald-500/30'
                : themeStyle === 'sunset_affirming'
                ? 'bg-gradient-to-br from-[#431407] via-[#7c2d12] to-[#581c87] text-white border border-amber-500/30'
                : themeStyle === 'midnight_minimal'
                ? 'bg-zinc-950 text-white border border-zinc-800'
                : 'bg-white text-slate-900 border border-slate-200'
            }`}
          >
            {/* Pride Topline in preview */}
            {includeTopline && (
              <div className="absolute top-0 inset-x-0 h-2 bg-pride-spectrum"></div>
            )}

            {/* Top Logo & Eyebrow */}
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              {includeLogo && (
                <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center relative">
                  {/* Clean Q Logo Component with automated white-background removal */}
                  <QLogo className="w-full h-full object-contain" glow={themeStyle !== 'helpline_alert'} />
                </div>
              )}

              {badgeText && (
                <span className={`text-[11px] font-mono font-bold tracking-widest px-3 py-1 rounded-full ${
                  themeStyle === 'helpline_alert'
                    ? 'bg-red-50 text-red-600 border border-red-200'
                    : themeStyle === 'cosmic' || themeStyle === 'pride_spectrum' || themeStyle === 'emerald_safe' || themeStyle === 'sunset_affirming' || themeStyle === 'midnight_minimal'
                    ? 'bg-white/10 text-purple-200 border border-white/20 backdrop-blur-xs'
                    : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>
                  {badgeText.toUpperCase()}
                </span>
              )}
            </div>

            {/* Center Content */}
            <div className="text-center space-y-3 my-auto py-4">
              <h2 className="text-2xl sm:text-3.5xl font-bold font-display tracking-tight leading-tight">
                {headline}
              </h2>
              <p className={`text-xs sm:text-sm leading-relaxed max-w-md mx-auto ${
                themeStyle === 'cosmic' || themeStyle === 'pride_spectrum' || themeStyle === 'emerald_safe' || themeStyle === 'sunset_affirming' || themeStyle === 'midnight_minimal'
                  ? 'text-slate-300'
                  : 'text-slate-600'
              }`}>
                {subtext}
              </p>
            </div>

            {/* Bottom Official Sign-off */}
            <div className="pt-4 border-t border-current/10 flex items-center justify-between text-[10px] font-mono opacity-70">
              <span>Q INTELLIGENCE</span>
              <span>PRIVATE • AFFIRMING • SAFE</span>
            </div>
          </div>

          <p className="mt-4 text-[11px] text-slate-400 font-mono text-center">
            Zero white background on Q Logomark • Pixel-perfect for Instagram, LinkedIn, and Threads
          </p>
        </div>
      </div>

      {/* Modal: Create Custom Template */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                <h3 className="text-lg font-bold font-display text-slate-900">
                  Create Custom Design Template
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCustomTemplate} className="space-y-4">
              
              {/* Template Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Template Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Weekly Team Affirmation or Helpline Alert"
                  value={newTplTitle}
                  onChange={(e) => setNewTplTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Category & Theme in 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Category
                  </label>
                  <select
                    value={newTplCategory}
                    onChange={(e) => setNewTplCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="custom">Custom Publication</option>
                    <option value="announcement">Announcement</option>
                    <option value="quote">Affirming Quote</option>
                    <option value="helpline">Crisis & Helpline</option>
                    <option value="resource">Grounding & Somatic</option>
                    <option value="celebration">Pride & Celebration</option>
                    <option value="community">Community Story</option>
                    <option value="privacy">Privacy & Security</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Theme Palette
                  </label>
                  <select
                    value={newTplTheme}
                    onChange={(e) => setNewTplTheme(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                  >
                    <option value="cosmic">Cosmic Nebula (Dark Indigo)</option>
                    <option value="light_tint">Soft Lilac Q-50 (Light Tint)</option>
                    <option value="pride_spectrum">Obsidian Pride (Rainbow Accents)</option>
                    <option value="helpline_alert">Crisis Crimson Alert</option>
                    <option value="emerald_safe">Emerald Sanctuary (Forest)</option>
                    <option value="sunset_affirming">Sunset Affirming (Amber)</option>
                    <option value="midnight_minimal">Midnight Minimal (Black/Silver)</option>
                  </select>
                </div>
              </div>

              {/* Aspect Ratio & Badge */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Default Aspect Ratio
                  </label>
                  <select
                    value={newTplAspect}
                    onChange={(e) => setNewTplAspect(e.target.value as any)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono"
                  >
                    <option value="1:1">1:1 Square (Instagram, X, LinkedIn)</option>
                    <option value="4:5">4:5 Portrait Feed</option>
                    <option value="16:9">16:9 Landscape Banner</option>
                    <option value="9:16">9:16 Story / Reel</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">
                    Eyebrow Badge Text
                  </label>
                  <input
                    type="text"
                    value={newTplBadge}
                    onChange={(e) => setNewTplBadge(e.target.value)}
                    placeholder="e.g., MENTAL HEALTH TIP"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-mono uppercase"
                  />
                </div>
              </div>

              {/* Default Headline */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Default Display Headline *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., You are safe here. Take a breath with us."
                  value={newTplHeadline}
                  onChange={(e) => setNewTplHeadline(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              {/* Default Subtext */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Default Supporting Subtext
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g., Gentle reminder from Q Intelligence for non-judgmental LGBTQ+ wellbeing."
                  value={newTplSubtext}
                  onChange={(e) => setNewTplSubtext(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 block">
                  Internal Staff Notes / Purpose
                </label>
                <input
                  type="text"
                  placeholder="e.g., Use this template for Thursday evening community check-ins."
                  value={newTplDesc}
                  onChange={(e) => setNewTplDesc(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer transition-colors"
                >
                  Save Custom Template
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
