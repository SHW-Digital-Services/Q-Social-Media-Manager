import React, { useState } from 'react';
import { BrandAsset, BrandColorSwatch, AssetVersion } from '../types';
import { BRAND_ASSETS, BRAND_COLORS, Q_LOGO_URL } from '../data/brandData';
import { QLogo } from './QLogo';
import { MediaEditorModal } from './MediaEditorModal';
import { 
  Image as ImageIcon, 
  Copy, 
  Download, 
  Upload, 
  Search, 
  Check, 
  Sparkles, 
  Palette, 
  Tag, 
  ExternalLink,
  Plus,
  History,
  RotateCcw,
  Clock,
  User,
  X,
  CheckCircle2,
  AlertCircle,
  Sliders,
  Scissors
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface MediaLibraryProps {
  onInsertIntoComposer?: (url: string) => void;
}

export const MediaLibrary: React.FC<MediaLibraryProps> = ({
  onInsertIntoComposer,
}) => {
  // Initialize assets with version control metadata
  const [assets, setAssets] = useState<BrandAsset[]>(() => {
    return BRAND_ASSETS.map((a, idx) => ({
      ...a,
      currentVersion: a.currentVersion || 'v1.0',
      versionHistory: a.versionHistory || [
        {
          versionId: `v-init-${a.id}`,
          versionNumber: 'v1.0',
          fileUrl: a.fileUrl,
          uploadedAt: '2026-09-18 10:00 AM',
          uploadedBy: 'Jordan Vance (Brand Admin)',
          dimensions: a.dimensions,
          format: a.format,
          changeNotes: 'Initial approved master brand asset upload.',
          fileSize: '1.4 MB'
        }
      ]
    }));
  });

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'assets' | 'palettes'>('assets');

  // Upload New Brand Asset Modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState<BrandAsset['category']>('graphic');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadTags, setUploadTags] = useState('brand, official');

  // Asset Version Control Modals state
  const [activeHistoryAsset, setActiveHistoryAsset] = useState<BrandAsset | null>(null);
  const [showNewVersionModal, setShowNewVersionModal] = useState<BrandAsset | null>(null);
  const [newVersionUrl, setNewVersionUrl] = useState('');
  const [newVersionNotes, setNewVersionNotes] = useState('');

  // Media alteration studio state
  const [alteringAsset, setAlteringAsset] = useState<BrandAsset | null>(null);

  const handleSaveAlteredAsset = (assetId: string, alteredDataUrl: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id !== assetId) return a;
      const prevVersionNum = parseFloat(a.currentVersion?.replace('v', '') || '1.0');
      const nextVersionStr = `v${(prevVersionNum + 0.1).toFixed(1)}`;
      const newVersion: AssetVersion = {
        versionId: `v-${Date.now()}`,
        versionNumber: nextVersionStr,
        fileUrl: alteredDataUrl,
        uploadedAt: new Date().toLocaleDateString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        uploadedBy: 'Media Alteration Studio (Scott Harvey-Whittle)',
        dimensions: a.dimensions,
        format: 'PNG',
        changeNotes: 'Altered using in-app creative tools (background cutout / drawing / typography overlay).',
        fileSize: 'Custom'
      };
      return {
        ...a,
        fileUrl: alteredDataUrl,
        currentVersion: nextVersionStr,
        versionHistory: [newVersion, ...(a.versionHistory || [])]
      };
    }));
  };

  const filteredAssets = assets.filter(a => {
    if (selectedCategory !== 'all' && a.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = a.title.toLowerCase().includes(q);
      const matchTag = a.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchTag) return false;
    }
    return true;
  });

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyColor = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  // Upload a brand new asset
  const handleUploadNewAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadUrl.trim()) return;

    const initialVersion: AssetVersion = {
      versionId: `v-${Date.now()}-1`,
      versionNumber: 'v1.0',
      fileUrl: uploadUrl.trim(),
      uploadedAt: new Date().toLocaleDateString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'Scott Harvey-Whittle (Staff)',
      dimensions: 'Custom',
      format: 'PNG/JPG',
      changeNotes: 'Initial upload to shared asset library.',
      fileSize: '1.2 MB'
    };

    const newAsset: BrandAsset = {
      id: `asset-${Date.now()}`,
      title: uploadTitle.trim(),
      category: uploadCategory,
      fileUrl: uploadUrl.trim(),
      dimensions: 'Custom',
      format: 'PNG/JPG',
      description: 'Uploaded by Social Media Officer.',
      tags: uploadTags.split(',').map(t => t.trim().toLowerCase()),
      isOfficial: false,
      backgroundRecommended: 'any',
      currentVersion: 'v1.0',
      versionHistory: [initialVersion]
    };

    setAssets([newAsset, ...assets]);
    setShowUploadModal(false);
    setUploadTitle('');
    setUploadUrl('');
    confetti({ particleCount: 50, spread: 50 });
  };

  // Upload a new tracked version of an existing asset
  const handleSaveNewAssetVersion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showNewVersionModal || !newVersionUrl.trim()) return;

    const currentAsset = showNewVersionModal;
    const history = currentAsset.versionHistory || [];
    const nextVerIndex = history.length + 1;
    const nextVerNum = `v${nextVerIndex}.0`;

    const newVer: AssetVersion = {
      versionId: `v-${Date.now()}-${nextVerIndex}`,
      versionNumber: nextVerNum,
      fileUrl: newVersionUrl.trim(),
      uploadedAt: new Date().toLocaleDateString('default', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      uploadedBy: 'Scott Harvey-Whittle (Staff)',
      dimensions: 'High-Res Revision',
      format: 'PNG / Vector',
      changeNotes: newVersionNotes.trim() || 'Updated resolution and alignment.',
      fileSize: '2.1 MB'
    };

    const updatedAsset: BrandAsset = {
      ...currentAsset,
      fileUrl: newVersionUrl.trim(),
      currentVersion: nextVerNum,
      versionHistory: [newVer, ...history]
    };

    setAssets(prev => prev.map(a => a.id === currentAsset.id ? updatedAsset : a));
    setShowNewVersionModal(null);
    setNewVersionUrl('');
    setNewVersionNotes('');
    confetti({ particleCount: 60, spread: 60 });
  };

  // Revert asset to a previous version
  const handleRevertAssetVersion = (assetId: string, version: AssetVersion) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          fileUrl: version.fileUrl,
          currentVersion: version.versionNumber,
          dimensions: version.dimensions || a.dimensions,
          format: version.format || a.format
        };
      }
      return a;
    }));

    if (activeHistoryAsset && activeHistoryAsset.id === assetId) {
      setActiveHistoryAsset(prev => prev ? {
        ...prev,
        fileUrl: version.fileUrl,
        currentVersion: version.versionNumber
      } : null);
    }

    confetti({ particleCount: 50, spread: 60 });
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-mono font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>SHARED MEDIA ASSET REPOSITORY • VERSION CONTROLLED</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-900">
              Q Intelligence Official Asset Library
            </h2>
            <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
              Approved high-resolution vector logos, cosmic nebula graphics, Pride ribbons, and color swatches. Every asset includes automatic version tracking and one-click rollback.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setAlteringAsset(assets[0] || null)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-bold transition-all cursor-pointer shadow-2xs"
              title="Launch media alteration studio: cutout background, freehand drawing, typography overlay"
            >
              <Sliders className="w-4 h-4 text-purple-600" />
              <span>Media Alteration Studio</span>
            </button>

            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Upload New Asset</span>
            </button>
          </div>
        </div>

        {/* Tab switch between Assets & Color Palettes */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('assets')}
            className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              activeTab === 'assets' 
                ? 'bg-purple-600 text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Media Files & Graphics ({assets.length})
          </button>
          <button
            onClick={() => setActiveTab('palettes')}
            className={`text-xs px-4 py-1.5 rounded-full font-semibold transition-all cursor-pointer ${
              activeTab === 'palettes' 
                ? 'bg-purple-600 text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Official Color Swatches ({BRAND_COLORS.length})
          </button>
        </div>
      </div>

      {activeTab === 'assets' ? (
        <>
          {/* Filter Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'logo', 'badge', 'banner', 'graphic'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-slate-900 text-white font-semibold' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat === 'all' ? 'All Assets' : `${cat}s`}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search assets or #tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:border-purple-500 focus:bg-white"
              />
            </div>
          </div>

          {/* Grid of Assets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssets.map(asset => {
              const isCopied = copiedId === asset.id;
              const isDarkReq = asset.backgroundRecommended === 'dark';

              return (
                <div 
                  key={asset.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Visual Preview Frame */}
                    <div className={`aspect-4/3 relative flex items-center justify-center p-6 overflow-hidden ${
                      isDarkReq ? 'bg-gradient-to-br from-[#020617] via-[#0f091f] to-[#1e1035]' : 'bg-slate-50'
                    }`}>
                      {asset.category === 'logo' || asset.fileUrl === Q_LOGO_URL ? (
                        <QLogo 
                          className="max-w-full max-h-full object-contain drop-shadow-md transform hover:scale-105 transition-transform duration-300"
                          alt={asset.title}
                          glow={isDarkReq}
                        />
                      ) : (
                        <img 
                          src={asset.fileUrl} 
                          alt={asset.title} 
                          className="max-w-full max-h-full object-contain drop-shadow-md transform hover:scale-105 transition-transform duration-300"
                        />
                      )}

                      {/* Version Badge */}
                      <button
                        type="button"
                        onClick={() => setActiveHistoryAsset(asset)}
                        className="absolute top-3 left-3 text-[10px] font-mono font-bold bg-white/95 text-purple-900 hover:bg-purple-600 hover:text-white px-2.5 py-0.5 rounded-full shadow-xs backdrop-blur-xs flex items-center gap-1 transition-colors cursor-pointer"
                        title="Click to view version history"
                      >
                        <History className="w-3 h-3" />
                        <span>{asset.currentVersion || 'v1.0'}</span>
                      </button>

                      {asset.isOfficial && (
                        <span className="absolute top-3 right-3 text-[10px] font-mono font-semibold bg-purple-900/80 text-white px-2 py-0.5 rounded-full shadow-2xs backdrop-blur-xs">
                          Official
                        </span>
                      )}

                      <span className="absolute bottom-3 right-3 text-[10px] font-mono bg-black/60 text-white px-2 py-0.5 rounded-full">
                        {asset.format}
                      </span>
                    </div>

                    {/* Body Content */}
                    <div className="p-5 space-y-3">
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                          <span className="uppercase">{asset.category}</span>
                          <span>{asset.dimensions}</span>
                        </div>
                        <h4 className="text-sm font-bold font-display text-slate-900 leading-snug">
                          {asset.title}
                        </h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {asset.description}
                        </p>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1">
                        {asset.tags.map(t => (
                          <span key={t} className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(asset.fileUrl, asset.id)}
                        className="flex-1 py-1.5 px-2.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied' : 'Copy URL'}</span>
                      </button>

                      {onInsertIntoComposer && (
                        <button
                          type="button"
                          onClick={() => onInsertIntoComposer(asset.fileUrl)}
                          className="py-1.5 px-3 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 transition-colors cursor-pointer"
                          title="Insert asset into the composer post draft"
                        >
                          Use in Post
                        </button>
                      )}
                    </div>

                    {/* Version Control Actions & Alteration */}
                    <div className="flex items-center justify-between pt-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setActiveHistoryAsset(asset)}
                        className="text-purple-700 hover:text-purple-900 font-medium flex items-center gap-1 cursor-pointer"
                      >
                        <History className="w-3 h-3" />
                        <span>History ({asset.versionHistory?.length || 1})</span>
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setAlteringAsset(asset)}
                          className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 cursor-pointer"
                          title="Alter this media asset with background cutout, drawing tools, and typography text boxes"
                        >
                          <Sliders className="w-3 h-3" />
                          <span>Alter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setShowNewVersionModal(asset)}
                          className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3 h-3" />
                          <span>Upload</span>
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Color Swatches Palette View */
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-base font-bold font-display text-slate-900 flex items-center gap-2">
              <Palette className="w-5 h-5 text-purple-600" />
              <span>Official Q Intelligence Color System</span>
            </h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Strictly vetted color swatches meeting WCAG AA and AAA accessibility contrast standards for LGBTQ+ inclusive clarity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BRAND_COLORS.map(color => {
              const isHexCopied = copiedHex === color.hex;
              return (
                <div 
                  key={color.name}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-4 space-y-3">
                    <div 
                      className="h-28 rounded-2xl w-full flex items-end p-3 relative border border-black/5"
                      style={{ backgroundColor: color.hex }}
                    >
                      <button
                        onClick={() => handleCopyColor(color.hex)}
                        className="px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-mono font-bold flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                      >
                        {isHexCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{color.hex}</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{color.name}</h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase">{color.group}</span>
                      </div>
                      <p className="text-xs text-slate-500">{color.role}</p>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 bg-slate-50 p-2 rounded-xl border border-slate-100 space-y-0.5">
                      <div>RGB: {color.rgb}</div>
                      <div>On White: {color.wcagOnWhite}</div>
                      <div>On Dark: {color.wcagOnDark}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ASSET VERSION HISTORY MODAL */}
      {activeHistoryAsset && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Asset Revision History</h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{activeHistoryAsset.title}</p>
                </div>
              </div>

              <button
                onClick={() => setActiveHistoryAsset(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of historical versions */}
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(activeHistoryAsset.versionHistory || []).map((ver) => {
                const isCurrent = ver.versionNumber === activeHistoryAsset.currentVersion;
                return (
                  <div
                    key={ver.versionId}
                    className={`p-3.5 rounded-2xl border text-xs space-y-2.5 ${
                      isCurrent ? 'bg-purple-50/60 border-purple-300 ring-1 ring-purple-400/20' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-xs ${
                          isCurrent ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-700'
                        }`}>
                          {ver.versionNumber}
                        </span>
                        <span className="font-semibold text-slate-800">{ver.uploadedBy}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{ver.uploadedAt}</span>
                        {isCurrent ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Active
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRevertAssetVersion(activeHistoryAsset.id, ver)}
                            className="px-2.5 py-1 bg-white hover:bg-purple-600 hover:text-white border border-slate-200 text-slate-700 rounded-full font-semibold transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Revert</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-slate-600 text-[11px]">
                      {ver.changeNotes}
                    </p>

                    <div className="flex items-center gap-3 pt-1 border-t border-black/5 text-[10px] text-slate-400 font-mono">
                      <span>Format: {ver.format}</span>
                      <span>Dims: {ver.dimensions || 'N/A'}</span>
                      <span>Size: {ver.fileSize || 'Standard'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveHistoryAsset(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 cursor-pointer"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD REVISION MODAL FOR AN ASSET */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Upload New Version / Revision</h3>
                <p className="text-xs text-slate-500">{showNewVersionModal.title}</p>
              </div>
              <button onClick={() => setShowNewVersionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewAssetVersion} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Asset File URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://..."
                  value={newVersionUrl}
                  onChange={(e) => setNewVersionUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Change Summary / Notes</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Higher resolution render, updated color grading, or removed background artifacts."
                  value={newVersionNotes}
                  onChange={(e) => setNewVersionNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="p-3 bg-purple-50 rounded-xl text-purple-900 text-[11px] leading-snug">
                Uploading a revision preserves the current version in the audit trail. Staff can rollback at any time.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(null)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Save as Next Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPLOAD BRAND NEW ASSET MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Upload New Asset</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadNewAsset} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Asset Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pride 2026 Celebration Poster"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as BrandAsset['category'])}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="graphic">Graphic</option>
                  <option value="logo">Logo</option>
                  <option value="badge">Badge</option>
                  <option value="banner">Banner</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Image URL</label>
                <input
                  type="url"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={uploadUrl}
                  onChange={(e) => setUploadUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. pride, event, community"
                  value={uploadTags}
                  onChange={(e) => setUploadTags(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-xl cursor-pointer shadow-xs"
                >
                  Add to Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Alteration Studio Modal */}
      {alteringAsset && (
        <MediaEditorModal
          isOpen={true}
          initialImageSrc={alteringAsset.fileUrl}
          onClose={() => setAlteringAsset(null)}
          onSave={(alteredDataUrl) => {
            handleSaveAlteredAsset(alteringAsset.id, alteredDataUrl);
            setAlteringAsset(null);
          }}
        />
      )}

    </div>
  );
};
