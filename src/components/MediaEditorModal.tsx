import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Save, 
  Download, 
  Undo, 
  RotateCcw, 
  Scissors, 
  PenTool, 
  Highlighter, 
  Eraser, 
  Type, 
  Sliders, 
  Check, 
  Palette, 
  Trash2, 
  Sparkles,
  Move,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  Layers,
  Image as ImageIcon,
  Plus,
  Award
} from 'lucide-react';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  font: string;
  size: number;
  color: string;
  bold: boolean;
  italic: boolean;
  bgStyle: 'none' | 'black-pill' | 'white-pill' | 'purple-pill' | 'glow';
}

export interface StickerOverlay {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  badgeStyle: 'purple' | 'rainbow' | 'dark' | 'emerald';
}

interface StrokePoint {
  x: number;
  y: number;
}

interface DrawingStroke {
  tool: 'pen' | 'highlighter' | 'eraser';
  color: string;
  size: number;
  points: StrokePoint[];
}

interface MediaEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialImageSrc: string;
  onSave: (editedDataUrl: string) => void;
}

const PRESET_STICKERS: Omit<StickerOverlay, 'id' | 'x' | 'y'>[] = [
  {
    type: 'safe-space',
    title: '🏳️‍🌈 LGBTQ+ Safe Space',
    subtitle: 'Inclusive & Affirming Care',
    width: 250,
    height: 56,
    badgeStyle: 'rainbow'
  },
  {
    type: 'q-verified',
    title: '✓ Q Intelligence Verified',
    subtitle: 'Institutional Quality Mark',
    width: 240,
    height: 56,
    badgeStyle: 'purple'
  },
  {
    type: 'affirming-care',
    title: '💙 Affirming Care Provider',
    subtitle: 'Clinical & Social Affirmation',
    width: 240,
    height: 56,
    badgeStyle: 'emerald'
  },
  {
    type: 'helpline',
    title: '📞 24/7 Crisis Support',
    subtitle: 'Helpline: 0800 612 0011',
    width: 240,
    height: 56,
    badgeStyle: 'dark'
  },
  {
    type: 'pride-ribbon',
    title: '✦ EQUALITY & DIGNITY ✦',
    subtitle: 'Pride Coalition Community',
    width: 260,
    height: 56,
    badgeStyle: 'rainbow'
  }
];

const AVAILABLE_FONTS = [
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", label: 'Plus Jakarta (Brand)' },
  { name: 'Fraunces', family: "'Fraunces', serif", label: 'Fraunces (Editorial)' },
  { name: 'Outfit', family: "'Outfit', sans-serif", label: 'Outfit (Modern)' },
  { name: 'Inter', family: "'Inter', sans-serif", label: 'Inter (Clean)' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", label: 'JetBrains Mono (Code)' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", label: 'Playfair (Display)' }
];

const PRESET_COLORS = [
  { name: 'Brand Purple', hex: '#7C3AED' },
  { name: 'Deep Lilac', hex: '#C084FC' },
  { name: 'Pride Cyan', hex: '#06B6D4' },
  { name: 'Electric Pink', hex: '#EC4899' },
  { name: 'Sunlight Amber', hex: '#F59E0B' },
  { name: 'Emerald Safe', hex: '#10B981' },
  { name: 'Crisp White', hex: '#FFFFFF' },
  { name: 'Deep Charcoal', hex: '#0F172A' }
];

const FONT_SIZES = [16, 20, 24, 32, 40, 48, 64, 72];

export const MediaEditorModal: React.FC<MediaEditorModalProps> = ({
  isOpen,
  onClose,
  initialImageSrc,
  onSave
}) => {
  if (!isOpen) return null;

  // Active mode tabs: 'bg-removal' | 'drawing' | 'text'
  const [activeToolTab, setActiveToolTab] = useState<'bg-removal' | 'drawing' | 'text'>('bg-removal');

  // Image source state (allows applying background removal)
  const [currentBaseImage, setCurrentBaseImage] = useState<string>(initialImageSrc);
  const [originalImage] = useState<string>(initialImageSrc);
  const [isBgRemoved, setIsBgRemoved] = useState<boolean>(false);
  const [bgTolerance, setBgTolerance] = useState<number>(35); // 0-100 tolerance for bg removal
  const [isRemovingBg, setIsRemovingBg] = useState<boolean>(false);

  // Drawing state
  const [currentBrush, setCurrentBrush] = useState<'pen' | 'highlighter' | 'eraser'>('pen');
  const [brushColor, setBrushColor] = useState<string>('#7C3AED');
  const [brushSize, setBrushSize] = useState<number>(8);
  const [strokes, setStrokes] = useState<DrawingStroke[]>([]);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const currentStrokeRef = useRef<StrokePoint[]>([]);

  // Text overlays state
  const [textLayers, setTextLayers] = useState<TextOverlay[]>([
    {
      id: 't-1',
      text: 'You are welcomed and affirmed.',
      x: 60,
      y: 80,
      font: "'Plus Jakarta Sans', sans-serif",
      size: 28,
      color: '#FFFFFF',
      bold: true,
      italic: false,
      bgStyle: 'purple-pill'
    }
  ]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>('t-1');
  const [isDraggingText, setIsDraggingText] = useState<boolean>(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Load and cache base image
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = currentBaseImage;
    img.onload = () => {
      imageObjRef.current = img;
      renderCanvas();
    };
  }, [currentBaseImage]);

  // Main Canvas Render loop
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = imageObjRef.current;
    if (!img || !img.width || !img.height) return;

    // Set canvas dimensions to match source image
    if (canvas.width !== img.width || canvas.height !== img.height) {
      canvas.width = img.width;
      canvas.height = img.height;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw base image
    ctx.drawImage(img, 0, 0);

    // 2. Draw brush strokes
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);

      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }

      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = stroke.size;

      if (stroke.tool === 'highlighter') {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 0.45;
      } else if (stroke.tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.strokeStyle = 'rgba(0,0,0,1)';
      } else {
        ctx.strokeStyle = stroke.color;
        ctx.globalAlpha = 1.0;
      }

      ctx.stroke();
      ctx.restore();
    });

    // 3. Draw text overlays
    textLayers.forEach(layer => {
      ctx.save();
      const fontStyle = `${layer.italic ? 'italic ' : ''}${layer.bold ? 'bold ' : ''}${layer.size}px ${layer.font}`;
      ctx.font = fontStyle;
      ctx.textBaseline = 'top';

      const metrics = ctx.measureText(layer.text);
      const textWidth = metrics.width;
      const textHeight = layer.size * 1.25;
      const padding = layer.size * 0.35;

      // Draw background pill if requested
      if (layer.bgStyle !== 'none') {
        const bgX = layer.x - padding;
        const bgY = layer.y - padding / 2;
        const bgW = textWidth + padding * 2;
        const bgH = textHeight + padding;
        const radius = Math.min(16, bgH / 2);

        ctx.beginPath();
        ctx.roundRect(bgX, bgY, bgW, bgH, radius);

        if (layer.bgStyle === 'purple-pill') {
          ctx.fillStyle = 'rgba(124, 58, 237, 0.9)';
          ctx.fill();
        } else if (layer.bgStyle === 'black-pill') {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fill();
        } else if (layer.bgStyle === 'white-pill') {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
          ctx.fill();
        } else if (layer.bgStyle === 'glow') {
          ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
          ctx.strokeStyle = '#06B6D4';
          ctx.lineWidth = 2;
          ctx.fill();
          ctx.stroke();
        }
      }

      // Draw text
      ctx.fillStyle = layer.color;
      ctx.fillText(layer.text, layer.x, layer.y);

      // If selected in text mode, draw selection bounding box
      if (activeToolTab === 'text' && selectedTextId === layer.id) {
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(
          layer.x - padding - 4,
          layer.y - padding / 2 - 4,
          textWidth + padding * 2 + 8,
          textHeight + padding + 8
        );
        ctx.setLineDash([]);
      }

      ctx.restore();
    });
  }, [strokes, textLayers, activeToolTab, selectedTextId]);

  // Re-render when strokes or text layers change
  useEffect(() => {
    renderCanvas();
  }, [strokes, textLayers, activeToolTab, selectedTextId, renderCanvas]);

  // 1. Remove Background algorithm (Automated Chroma/Cutout Removal)
  const handleRemoveBackground = () => {
    setIsRemovingBg(true);

    setTimeout(() => {
      const canvas = document.createElement('canvas');
      const img = imageObjRef.current;
      if (!img) {
        setIsRemovingBg(false);
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setIsRemovingBg(false);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      // Sample corner pixels to detect background color (defaults to white/neutral if mixed)
      const corners = [
        { r: data[0], g: data[1], b: data[2] },
        { r: data[(canvas.width - 1) * 4], g: data[(canvas.width - 1) * 4 + 1], b: data[(canvas.width - 1) * 4 + 2] },
        { r: data[(canvas.width * (canvas.height - 1)) * 4], g: data[(canvas.width * (canvas.height - 1)) * 4 + 1], b: data[(canvas.width * (canvas.height - 1)) * 4 + 2] }
      ];

      // Use average corner color or default to white (#FFFFFF)
      const targetR = Math.round((corners[0].r + corners[1].r + corners[2].r) / 3);
      const targetG = Math.round((corners[0].g + corners[1].g + corners[2].g) / 3);
      const targetB = Math.round((corners[0].b + corners[1].b + corners[2].b) / 3);

      const threshold = (bgTolerance / 100) * 441; // Euclidean max distance in RGB is ~441

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Color distance from background target
        const dist = Math.sqrt(
          (r - targetR) * (r - targetR) +
          (g - targetG) * (g - targetG) +
          (b - targetB) * (b - targetB)
        );

        // Also knock out high-luminance studio white backgrounds
        const isNearWhite = r > 240 && g > 240 && b > 240;

        if (dist < threshold || (targetR > 220 && targetG > 220 && targetB > 220 && isNearWhite)) {
          data[i + 3] = 0; // Transparent
        } else if (dist < threshold * 1.25) {
          // Feather edges
          data[i + 3] = Math.round(255 * ((dist - threshold) / (threshold * 0.25)));
        }
      }

      ctx.putImageData(imgData, 0, 0);
      const cleanUrl = canvas.toDataURL('image/png');
      setCurrentBaseImage(cleanUrl);
      setIsBgRemoved(true);
      setIsRemovingBg(false);
    }, 200);
  };

  const handleRestoreBackground = () => {
    setCurrentBaseImage(originalImage);
    setIsBgRemoved(false);
  };

  // 2. Drawing handlers
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);

    if (activeToolTab === 'drawing') {
      setIsDrawing(true);
      currentStrokeRef.current = [coords];
    } else if (activeToolTab === 'text') {
      // Check if clicking on an existing text layer
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      let foundId: string | null = null;
      for (let i = textLayers.length - 1; i >= 0; i--) {
        const layer = textLayers[i];
        ctx.font = `${layer.italic ? 'italic ' : ''}${layer.bold ? 'bold ' : ''}${layer.size}px ${layer.font}`;
        const width = ctx.measureText(layer.text).width;
        const height = layer.size * 1.3;
        const padding = layer.size * 0.4;

        if (
          coords.x >= layer.x - padding &&
          coords.x <= layer.x + width + padding &&
          coords.y >= layer.y - padding &&
          coords.y <= layer.y + height + padding
        ) {
          foundId = layer.id;
          dragOffsetRef.current = { x: coords.x - layer.x, y: coords.y - layer.y };
          break;
        }
      }

      if (foundId) {
        setSelectedTextId(foundId);
        setIsDraggingText(true);
      } else {
        // Click on empty space moves current selected text to here
        if (selectedTextId) {
          setTextLayers(prev => prev.map(t => t.id === selectedTextId ? { ...t, x: coords.x, y: coords.y } : t));
        }
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoordinates(e);

    if (activeToolTab === 'drawing' && isDrawing) {
      currentStrokeRef.current.push(coords);
      // Quick live preview of active stroke
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && currentStrokeRef.current.length > 1) {
        const pts = currentStrokeRef.current;
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = brushSize;

        if (currentBrush === 'highlighter') {
          ctx.strokeStyle = brushColor;
          ctx.globalAlpha = 0.4;
        } else if (currentBrush === 'eraser') {
          ctx.globalCompositeOperation = 'destination-out';
          ctx.strokeStyle = 'rgba(0,0,0,1)';
        } else {
          ctx.strokeStyle = brushColor;
        }
        ctx.stroke();
        ctx.restore();
      }
    } else if (activeToolTab === 'text' && isDraggingText && selectedTextId) {
      setTextLayers(prev => prev.map(t => {
        if (t.id === selectedTextId) {
          return {
            ...t,
            x: Math.max(10, coords.x - dragOffsetRef.current.x),
            y: Math.max(10, coords.y - dragOffsetRef.current.y)
          };
        }
        return t;
      }));
    }
  };

  const handleMouseUp = () => {
    if (activeToolTab === 'drawing' && isDrawing) {
      setIsDrawing(false);
      if (currentStrokeRef.current.length > 1) {
        setStrokes(prev => [
          ...prev,
          {
            tool: currentBrush,
            color: brushColor,
            size: brushSize,
            points: [...currentStrokeRef.current]
          }
        ]);
      }
      currentStrokeRef.current = [];
    } else if (activeToolTab === 'text') {
      setIsDraggingText(false);
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const coords = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };

      if (activeToolTab === 'drawing') {
        setIsDrawing(true);
        currentStrokeRef.current = [coords];
      } else if (activeToolTab === 'text') {
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let foundId: string | null = null;
        for (let i = textLayers.length - 1; i >= 0; i--) {
          const layer = textLayers[i];
          ctx.font = `${layer.italic ? 'italic ' : ''}${layer.bold ? 'bold ' : ''}${layer.size}px ${layer.font}`;
          const width = ctx.measureText(layer.text).width;
          const height = layer.size * 1.3;
          const padding = layer.size * 0.4;
          if (
            coords.x >= layer.x - padding &&
            coords.x <= layer.x + width + padding &&
            coords.y >= layer.y - padding &&
            coords.y <= layer.y + height + padding
          ) {
            foundId = layer.id;
            dragOffsetRef.current = { x: coords.x - layer.x, y: coords.y - layer.y };
            break;
          }
        }
        if (foundId) {
          setSelectedTextId(foundId);
          setIsDraggingText(true);
        }
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 1 && (isDrawing || isDraggingText)) {
      e.preventDefault();
      const touch = e.touches[0];
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const coords = {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };

      if (activeToolTab === 'drawing' && isDrawing) {
        currentStrokeRef.current.push(coords);
        const ctx = canvas.getContext('2d');
        if (ctx && currentStrokeRef.current.length > 1) {
          const pts = currentStrokeRef.current;
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(pts[pts.length - 2].x, pts[pts.length - 2].y);
          ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = brushSize;
          if (currentBrush === 'highlighter') {
            ctx.strokeStyle = brushColor;
            ctx.globalAlpha = 0.4;
          } else if (currentBrush === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
          } else {
            ctx.strokeStyle = brushColor;
          }
          ctx.stroke();
          ctx.restore();
        }
      } else if (activeToolTab === 'text' && isDraggingText && selectedTextId) {
        setTextLayers(prev => prev.map(t => {
          if (t.id === selectedTextId) {
            return {
              ...t,
              x: Math.max(10, coords.x - dragOffsetRef.current.x),
              y: Math.max(10, coords.y - dragOffsetRef.current.y)
            };
          }
          return t;
        }));
      }
    }
  };

  const handleUndo = () => {
    if (activeToolTab === 'drawing') {
      setStrokes(prev => prev.slice(0, -1));
    }
  };

  const handleClearDrawings = () => {
    setStrokes([]);
  };

  // 3. Text Overlay Management
  const selectedText = textLayers.find(t => t.id === selectedTextId) || textLayers[0];

  const handleAddTextLayer = () => {
    const newId = `t-${Date.now()}`;
    const newLayer: TextOverlay = {
      id: newId,
      text: 'Affirming Care • Safe Space',
      x: 80,
      y: 120 + textLayers.length * 40,
      font: "'Plus Jakarta Sans', sans-serif",
      size: 24,
      color: '#FFFFFF',
      bold: true,
      italic: false,
      bgStyle: 'black-pill'
    };
    setTextLayers(prev => [...prev, newLayer]);
    setSelectedTextId(newId);
  };

  const updateSelectedText = (updates: Partial<TextOverlay>) => {
    if (!selectedTextId) return;
    setTextLayers(prev => prev.map(t => t.id === selectedTextId ? { ...t, ...updates } : t));
  };

  const handleDeleteSelectedText = () => {
    if (!selectedTextId) return;
    setTextLayers(prev => prev.filter(t => t.id !== selectedTextId));
    setSelectedTextId(textLayers.length > 1 ? textLayers[0].id : null);
  };

  // 4. Save and Export
  const handleSaveAndApply = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // Export high-res PNG
    const finalDataUrl = canvas.toDataURL('image/png');
    onSave(finalDataUrl);
    onClose();
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `q-intelligence-media-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md overflow-y-auto p-2 sm:p-4 md:p-6 flex justify-center items-start dark-scrollbar">
      <div className="bg-slate-900 border border-white/10 rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col my-auto max-h-[96vh] sm:max-h-[94vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar - Sticky Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/90 shrink-0 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 border border-purple-400/40 flex items-center justify-center text-purple-300 shrink-0">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold font-display text-white leading-tight">
                Media Alteration & Creative Studio
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">
                Background removal, brand drawing brush, and typography overlays.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer"
              title="Download altered PNG to disk"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>

            <button
              onClick={handleSaveAndApply}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold text-white bg-pride-spectrum hover:opacity-95 shadow-glow-purple transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply to Post</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer ml-1"
              aria-label="Close Studio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Tool Navigation Tabs - Sticky Subheader */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-950/80 border-b border-white/10 flex items-center justify-between gap-3 overflow-x-auto shrink-0 sticky top-0 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveToolTab('bg-removal')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeToolTab === 'bg-removal'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Remove Background</span>
            </button>

            <button
              onClick={() => setActiveToolTab('drawing')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeToolTab === 'drawing'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Drawing Tools</span>
            </button>

            <button
              onClick={() => setActiveToolTab('text')}
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                activeToolTab === 'text'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-300 hover:bg-white/5'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Add Text Box</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
            {activeToolTab === 'drawing' && (
              <>
                <button
                  onClick={handleUndo}
                  disabled={strokes.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-white/10 disabled:opacity-30 cursor-pointer"
                >
                  <Undo className="w-3 h-3" />
                  <span>Undo</span>
                </button>
                <button
                  onClick={handleClearDrawings}
                  disabled={strokes.length === 0}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/5 hover:bg-rose-900/30 text-rose-300 disabled:opacity-30 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body: Fully Scrollable Grid Container */}
        <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 dark-scrollbar">
          
          {/* Tool Parameters Sidebar (Left 4 cols) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-950/50 border-b lg:border-b-0 lg:border-r border-white/10 overflow-y-auto space-y-5 dark-scrollbar">
            
            {/* 1. Background Removal Controls */}
            {activeToolTab === 'bg-removal' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
                    Background Cutout & Transparency
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Automatically detect and strip solid, studio, or white backgrounds to preserve alpha transparency on publications.
                  </p>
                </div>

                <div className="space-y-3 p-4 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Detection Tolerance</span>
                    <span className="font-mono text-purple-300">{bgTolerance}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={bgTolerance}
                    onChange={(e) => setBgTolerance(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>Subtle (10%)</span>
                    <span>Standard (35%)</span>
                    <span>Aggressive (80%)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleRemoveBackground}
                    disabled={isRemovingBg}
                    className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Scissors className="w-4 h-4" />
                    <span>{isRemovingBg ? 'Processing Chroma Knockout...' : '1-Click Remove Background'}</span>
                  </button>

                  {isBgRemoved && (
                    <button
                      onClick={handleRestoreBackground}
                      className="w-full py-2 px-4 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-medium border border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore Original Background</span>
                    </button>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-purple-900/20 border border-purple-500/30 text-[11px] text-purple-200">
                  <span className="font-semibold text-white">Publication Rule:</span> White backings on circular or cutout logos are automatically eliminated. You can preview the transparent checkerboard on the right.
                </div>
              </div>
            )}

            {/* 2. Drawing Tools Controls */}
            {activeToolTab === 'drawing' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
                    Brush & Annotation Mode
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Freehand draw, highlight helpline numbers, or erase annotations directly on canvas.
                  </p>
                </div>

                {/* Brush selection */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setCurrentBrush('pen')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                      currentBrush === 'pen'
                        ? 'bg-purple-600/30 border-purple-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <PenTool className="w-4 h-4 text-purple-400" />
                    <span>Solid Pen</span>
                  </button>

                  <button
                    onClick={() => setCurrentBrush('highlighter')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                      currentBrush === 'highlighter'
                        ? 'bg-purple-600/30 border-purple-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Highlighter className="w-4 h-4 text-cyan-400" />
                    <span>Highlighter</span>
                  </button>

                  <button
                    onClick={() => setCurrentBrush('eraser')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                      currentBrush === 'eraser'
                        ? 'bg-purple-600/30 border-purple-400 text-white'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <Eraser className="w-4 h-4 text-rose-400" />
                    <span>Eraser</span>
                  </button>
                </div>

                {/* Stroke Size Slider */}
                <div className="space-y-2 p-3.5 bg-white/5 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">Brush Size</span>
                    <span className="font-mono text-purple-300">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="48"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                  <div className="flex items-center justify-center pt-1">
                    <div 
                      className="rounded-full bg-purple-400"
                      style={{ width: `${Math.min(32, brushSize)}px`, height: `${Math.min(32, brushSize)}px` }}
                    />
                  </div>
                </div>

                {/* Color Palette */}
                {currentBrush !== 'eraser' && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                      <span>Brand Palette</span>
                      <span className="font-mono text-[10px] text-purple-300">{brushColor}</span>
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c.hex}
                          onClick={() => setBrushColor(c.hex)}
                          className={`h-8 rounded-xl border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${
                            brushColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'ring-2 ring-purple-400 border-white'
                              : 'border-white/20'
                          }`}
                          style={{ backgroundColor: c.hex }}
                          title={c.name}
                        >
                          {brushColor.toLowerCase() === c.hex.toLowerCase() && (
                            <Check className={`w-3.5 h-3.5 ${c.hex === '#FFFFFF' ? 'text-black' : 'text-white'}`} />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Text Overlay & Typography Controls */}
            {activeToolTab === 'text' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300 font-mono">
                      Typography & Text Boxes
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Add, style, and position message boxes.
                    </p>
                  </div>
                  <button
                    onClick={handleAddTextLayer}
                    className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>+ Add Text</span>
                  </button>
                </div>

                {selectedText && (
                  <div className="space-y-3.5">
                    {/* Text Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Message Content</label>
                      <textarea
                        rows={2}
                        value={selectedText.text}
                        onChange={(e) => updateSelectedText({ text: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-400 resize-none font-sans"
                        placeholder="Type text overlay..."
                      />
                    </div>

                    {/* Font Chooser */}
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300">Font Family Chooser</label>
                      <select
                        value={selectedText.font}
                        onChange={(e) => updateSelectedText({ font: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-hidden focus:border-purple-400 cursor-pointer"
                      >
                        {AVAILABLE_FONTS.map(f => (
                          <option key={f.family} value={f.family}>
                            {f.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Font Size Chooser (slider + presets) */}
                    <div className="space-y-2 p-3 bg-white/5 rounded-2xl border border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">Font Size</span>
                        <span className="font-mono text-purple-300">{selectedText.size}px</span>
                      </div>
                      <input
                        type="range"
                        min="14"
                        max="80"
                        value={selectedText.size}
                        onChange={(e) => updateSelectedText({ size: Number(e.target.value) })}
                        className="w-full accent-purple-500 cursor-pointer"
                      />
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {FONT_SIZES.map(sz => (
                          <button
                            key={sz}
                            onClick={() => updateSelectedText({ size: sz })}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-mono cursor-pointer transition-colors ${
                              selectedText.size === sz
                                ? 'bg-purple-600 text-white font-bold'
                                : 'bg-white/5 text-slate-400 hover:text-white'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Style: Bold, Italic, Pill Style */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Style & Backing Pill</label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => updateSelectedText({ bold: !selectedText.bold })}
                          className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                            selectedText.bold ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 text-slate-400 border-white/10'
                          }`}
                          title="Bold"
                        >
                          <Bold className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateSelectedText({ italic: !selectedText.italic })}
                          className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-colors ${
                            selectedText.italic ? 'bg-purple-600 text-white border-purple-400' : 'bg-white/5 text-slate-400 border-white/10'
                          }`}
                          title="Italic"
                        >
                          <Italic className="w-4 h-4" />
                        </button>

                        <select
                          value={selectedText.bgStyle}
                          onChange={(e) => updateSelectedText({ bgStyle: e.target.value as any })}
                          className="px-2.5 py-1.5 bg-slate-950 border border-white/10 rounded-lg text-xs text-white focus:outline-hidden cursor-pointer"
                        >
                          <option value="none">No Background</option>
                          <option value="purple-pill">Purple Pill (Brand)</option>
                          <option value="black-pill">Translucent Slate Pill</option>
                          <option value="white-pill">White Card Pill</option>
                          <option value="glow">Cyan Glow Outline</option>
                        </select>
                      </div>
                    </div>

                    {/* Text Color Picker */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300">Text Color</label>
                      <div className="grid grid-cols-4 gap-2">
                        {PRESET_COLORS.map(c => (
                          <button
                            key={c.hex}
                            onClick={() => updateSelectedText({ color: c.hex })}
                            className={`h-7 rounded-lg border flex items-center justify-center cursor-pointer ${
                              selectedText.color.toLowerCase() === c.hex.toLowerCase()
                                ? 'ring-2 ring-purple-400 border-white'
                                : 'border-white/20'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Delete Active Text */}
                    <div className="pt-2">
                      <button
                        onClick={handleDeleteSelectedText}
                        className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete this text box</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Interactive Canvas Stage (Right 8 cols) - Scrollable */}
          <div className="lg:col-span-8 p-4 sm:p-6 flex flex-col items-center justify-center bg-slate-950/80 relative overflow-y-auto min-h-[380px] dark-scrollbar">
            
            {/* Checkerboard Pattern for Transparency */}
            <div 
              className="relative max-w-full my-auto rounded-2xl overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #1e293b 25%, transparent 25%), 
                  linear-gradient(-45deg, #1e293b 25%, transparent 25%), 
                  linear-gradient(45deg, transparent 75%, #1e293b 75%), 
                  linear-gradient(-45deg, transparent 75%, #1e293b 75%)
                `,
                backgroundSize: '20px 20px',
                backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                backgroundColor: '#0f172a'
              }}
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
                className={`max-w-full max-h-[460px] sm:max-h-[500px] object-contain block ${
                  activeToolTab === 'drawing' 
                    ? 'cursor-crosshair' 
                    : activeToolTab === 'text' 
                    ? 'cursor-move' 
                    : 'cursor-default'
                }`}
              />
            </div>

            {/* Stage Footer Helper */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 shrink-0">
              {activeToolTab === 'bg-removal' && (
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-purple-400" />
                  <span>Checkerboard area indicates transparent pixels (no white background).</span>
                </span>
              )}
              {activeToolTab === 'drawing' && (
                <span className="flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-purple-400" />
                  <span>Click and drag on the canvas to draw with {currentBrush}.</span>
                </span>
              )}
              {activeToolTab === 'text' && (
                <span className="flex items-center gap-1.5">
                  <Move className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Click and drag any text box directly on the preview to reposition.</span>
                </span>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
