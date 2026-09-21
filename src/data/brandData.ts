import { BrandAsset, BrandColorSwatch, BrandFontSpecimen, DesignTemplate, PostItem, ActivityLogItem } from '../types';

export const Q_LOGO_URL = 'https://brnhalxydcakutxiregp.supabase.co/storage/v1/object/public/images/Logo.png';

export const BRAND_COLORS: BrandColorSwatch[] = [
  // UI Base
  {
    name: 'Q White',
    hex: '#FFFFFF',
    rgb: '255, 255, 255',
    role: 'Cards, Modals & Paper Surfaces',
    group: 'ui_base',
    wcagOnWhite: '1.0:1 (Fail)',
    wcagOnDark: '21:1 (AAA Pass)',
    tailwindClass: 'bg-white text-slate-900',
    notes: 'Default clean card container background.'
  },
  {
    name: 'App Background',
    hex: '#F8FAFC',
    rgb: '248, 250, 252',
    role: 'Main Page Canvas',
    group: 'ui_base',
    wcagOnWhite: '1.05:1',
    wcagOnDark: '19.8:1 (AAA Pass)',
    tailwindClass: 'bg-slate-50',
    notes: 'Soft slate light background for long sessions.'
  },
  {
    name: 'Q-50 Tint',
    hex: '#F5F3FF',
    rgb: '245, 243, 255',
    role: 'Chat Bubbles, Active Badges & Soft Accents',
    group: 'ui_base',
    wcagOnWhite: '1.1:1',
    wcagOnDark: '18.5:1 (AAA Pass)',
    tailwindClass: 'bg-purple-50 text-purple-900',
    notes: 'Signature Q lilac-tint for comforting reflections.'
  },
  {
    name: 'Text Primary',
    hex: '#0F091F',
    rgb: '15, 9, 31',
    role: 'Headlines, Display Titles & High Contrast Text',
    group: 'ui_base',
    wcagOnWhite: '17.4:1 (AAA Pass)',
    wcagOnDark: '1.2:1',
    tailwindClass: 'text-slate-950',
    notes: 'Deep indigo-tinted dark neutral.'
  },
  {
    name: 'Text Secondary',
    hex: '#64748B',
    rgb: '100, 116, 139',
    role: 'Meta tags, Subtitles & Timestamps',
    group: 'ui_base',
    wcagOnWhite: '4.6:1 (AA Pass)',
    wcagOnDark: '4.5:1',
    tailwindClass: 'text-slate-500',
    notes: 'Balanced slate gray with high legibility.'
  },

  // Brand Accents (The Nebula)
  {
    name: 'Primary Purple',
    hex: '#7C3AED',
    rgb: '124, 58, 237',
    role: 'Primary Brand Color, Interactive Links & Badges',
    group: 'nebula_accents',
    wcagOnWhite: '5.2:1 (AA Pass)',
    wcagOnDark: '4.0:1',
    tailwindClass: 'bg-purple-600 text-white',
    notes: 'Representative of spiritual depth, wisdom, and core brand mark.'
  },
  {
    name: 'Nebula Cyan',
    hex: '#06B6D4',
    rgb: '6, 182, 212',
    role: 'Logo Highlight, AI Local Engine Tag & Accents',
    group: 'nebula_accents',
    wcagOnWhite: '2.4:1',
    wcagOnDark: '8.7:1 (AAA Pass)',
    tailwindClass: 'bg-cyan-500 text-slate-950',
    notes: 'High clarity accent, used best against cosmic dark backgrounds.'
  },
  {
    name: 'Nebula Magenta',
    hex: '#EC4899',
    rgb: '236, 72, 153',
    role: 'Affirmation Highlights, Memory Controls & Warmth',
    group: 'nebula_accents',
    wcagOnWhite: '3.1:1',
    wcagOnDark: '6.8:1 (AA Pass)',
    tailwindClass: 'bg-pink-500 text-white',
    notes: 'Vibrant Pride-spectrum warmth and care.'
  },

  // Semantic
  {
    name: 'Active / Secure',
    hex: '#10B981',
    rgb: '16, 185, 129',
    role: 'Local AI Online, PII Protection Verified',
    group: 'semantic',
    wcagOnWhite: '2.5:1',
    wcagOnDark: '8.4:1 (AAA Pass)',
    tailwindClass: 'bg-emerald-500 text-white',
    notes: 'Affirms active device protection.'
  },
  {
    name: 'Helpline / Alert',
    hex: '#EF4444',
    rgb: '239, 68, 68',
    role: 'Crisis Intervention, Immediate Help Button',
    group: 'semantic',
    wcagOnWhite: '3.9:1',
    wcagOnDark: '5.4:1 (AA Pass)',
    tailwindClass: 'bg-red-500 text-white',
    notes: 'High visibility for critical LGBTQ+ suicide prevention & crisis lifelines.'
  }
];

export const BRAND_FONTS: BrandFontSpecimen[] = [
  {
    id: 'font-display',
    name: 'Inter Display',
    role: 'display',
    family: "'Inter', system-ui, sans-serif",
    weights: ['600 Semibold', '700 Bold', '800 ExtraBold'],
    bestUsedFor: 'Campaign banners, H1/H2 headlines, promotional social graphics, template hero titles.',
    prohibitedFor: 'Long paragraph blocks, fine-print disclaimers, crisis phone directory numbers.',
    sampleHeadline: 'Private support. Made for real life.',
    sampleBody: 'The visual and verbal identity for Q Intelligence celebrates self-discovery and fluidity.',
    cssRule: "font-family: 'Inter', system-ui, sans-serif; font-weight: 700; letter-spacing: -0.025em;"
  },
  {
    id: 'font-interface',
    name: 'Inter Interface',
    role: 'interface',
    family: "'Inter', system-ui, sans-serif",
    weights: ['400 Regular', '500 Medium', '600 Semibold'],
    bestUsedFor: 'Chat bubbles, body captions, navigational tabs, card descriptions, multi-platform post bodies.',
    prohibitedFor: 'Decorative artistic titles requiring high display contrast.',
    sampleHeadline: 'Hi, I’m Q. I’m here for you—always.',
    sampleBody: 'Local AI runs directly on your device. Hosted intelligence is clearly identified whenever online services are engaged.',
    cssRule: "font-family: 'Inter', system-ui, sans-serif; font-weight: 400; line-height: 1.6;"
  },
  {
    id: 'font-code',
    name: 'JetBrains Mono',
    role: 'code',
    family: "'JetBrains Mono', monospace",
    weights: ['400 Regular', '500 Medium', '700 Bold'],
    bestUsedFor: 'PII Shield indicators, compliance scores, token statistics, timestamp badges, color hex codes.',
    prohibitedFor: 'Standard storytelling copy or user conversation transcripts.',
    sampleHeadline: 'PII_SHIELD_STATUS: VERIFIED_ZERO_LEAKAGE',
    sampleBody: 'sha256: 8f4a3e21... | LOCAL_INFERENCE_ENGINE = TRUE | PRIVACY_TIER = CLIENT_ONLY',
    cssRule: "font-family: 'JetBrains Mono', monospace; font-weight: 500; font-size: 0.875rem;"
  }
];

export const BRAND_ASSETS: BrandAsset[] = [
  {
    id: 'asset-1',
    title: 'Cosmic Q 3D Logomark (High-Res Render)',
    category: 'logo',
    fileUrl: Q_LOGO_URL,
    dimensions: '1024 x 1024',
    format: 'PNG (Alpha Translucent)',
    description: '3D glossy Q mark featuring the signature cosmic nebula interior with magenta, cyan, and gold swirls.',
    tags: ['logo', 'cosmic', 'primary', 'official'],
    isOfficial: true,
    backgroundRecommended: 'dark'
  },
  {
    id: 'asset-2',
    title: 'Pride Spectrum Topline Ribbon (Vector)',
    category: 'banner',
    fileUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80',
    dimensions: '2400 x 80',
    format: 'CSS Gradient / SVG',
    description: '7-stop official pride linear gradient: Ruby (#e11d48) to Tangerine, Gold, Emerald, Sky, Purple, and Deep Pink.',
    tags: ['pride', 'topline', 'ribbon', 'accent'],
    isOfficial: true,
    backgroundRecommended: 'any'
  },
  {
    id: 'asset-3',
    title: 'Cosmic Nebula Background Canvas',
    category: 'graphic',
    fileUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1920 x 1080',
    format: 'JPG (Deep Indigo 020617)',
    description: 'Deep cosmic backdrop with star-dust texture for major campaign drops and product release graphics.',
    tags: ['background', 'cosmic', 'nebula', 'dark-mode'],
    isOfficial: true,
    backgroundRecommended: 'dark'
  },
  {
    id: 'asset-4',
    title: 'PII Shield & Local AI Security Badge',
    category: 'badge',
    fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    dimensions: '512 x 512',
    format: 'PNG',
    description: 'Official seal communicating on-device processing and strict user anonymity.',
    tags: ['privacy', 'badge', 'security', 'shield'],
    isOfficial: true,
    backgroundRecommended: 'light'
  },
  {
    id: 'asset-5',
    title: 'Affirming Community Warmth Graphic',
    category: 'graphic',
    fileUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80',
    dimensions: '1200 x 800',
    format: 'JPG',
    description: 'Inclusive candid photography emphasizing safe connection, joy, and diverse allyship.',
    tags: ['community', 'photography', 'allies', 'social'],
    isOfficial: true,
    backgroundRecommended: 'any'
  }
];

export const DESIGN_TEMPLATES: DesignTemplate[] = [
  {
    id: 'tpl-1',
    title: 'Cosmic Nebula Announcement',
    category: 'announcement',
    description: 'High-impact dark cosmic gradient with prominent glossy Q logo, glowing typography, and verified tag.',
    defaultAspect: '1:1',
    defaultHeadline: 'Private support. Made for real life.',
    defaultSubtext: 'Your private, non-judgmental space for LGBTQ+ wellbeing. Accessible anywhere, securely on your terms.',
    badgeText: 'PRODUCT UPDATE',
    themeStyle: 'cosmic',
    previewMockupUrl: Q_LOGO_URL
  },
  {
    id: 'tpl-2',
    title: 'Affirming Reflection Quote',
    category: 'quote',
    description: 'Soothing Q-50 lilac-tint container with gentle quote bubble, validating tone, and welcoming sign-off.',
    defaultAspect: '4:5',
    defaultHeadline: '“You don’t have to have it all figured out today.”',
    defaultSubtext: 'Give yourself permission to pause, breathe, and exist freely. I’m here for you—always.',
    badgeText: 'DAILY REFLECTION',
    themeStyle: 'light_tint',
    previewMockupUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-3',
    title: '24/7 Helpline & Crisis Lifeline',
    category: 'helpline',
    description: 'Crucial high-visibility emergency card with alert red accents, direct hotline numbers, and clear confidentiality note.',
    defaultAspect: '1:1',
    defaultHeadline: 'Immediate, Confidential LGBTQ+ Support',
    defaultSubtext: 'If you or someone you love is experiencing distress, trained compassionate counselors are waiting. Call 988 (Press 3) or Text START to 678-678.',
    badgeText: '24/7 CRISIS SUPPORT',
    themeStyle: 'helpline_alert',
    previewMockupUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-4',
    title: 'Pride Spectrum Celebration',
    category: 'pride',
    description: 'Vibrant celebration post framed by the 7-color rainbow spectrum ribbon and celebratory community typography.',
    defaultAspect: '1:1',
    defaultHeadline: 'Honoring Every Story, Every Journey',
    defaultSubtext: 'Pride is our history, our resistance, and our sanctuary. Today and every day, you belong here.',
    badgeText: 'PRIDE & JOY',
    themeStyle: 'pride_spectrum',
    previewMockupUrl: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-5',
    title: 'Privacy Shield & Local AI Tip',
    category: 'privacy',
    description: 'Education on how Q Intelligence protects user reflection with on-device AI processing and zero data sales.',
    defaultAspect: '16:9',
    defaultHeadline: 'What stays in your space, stays yours.',
    defaultSubtext: 'Your memories and questions are shielded with client-side inference. We never monetize or expose your inner journey.',
    badgeText: 'PRIVACY BY DESIGN',
    themeStyle: 'light_tint',
    previewMockupUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-6',
    title: '4-7-8 Breathwork Grounding',
    category: 'resource',
    description: 'Calming sensory relaxation guide designed to reduce anxiety, heart rate, and emotional overwhelm.',
    defaultAspect: '4:5',
    defaultHeadline: 'Inhale peace. Exhale what is not yours to carry.',
    defaultSubtext: 'Breathe in for 4 counts, hold gently for 7, exhale slowly for 8. You are safe in this body and in this room right now.',
    badgeText: 'GROUNDING EXERCISE',
    themeStyle: 'emerald_safe',
    previewMockupUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-7',
    title: 'Trans & Non-Binary Joy Spotlight',
    category: 'celebration',
    description: 'Uplifting celebration of authenticity, self-discovery, and gender euphoria across our diverse community.',
    defaultAspect: '4:5',
    defaultHeadline: 'Your gender euphoria is sacred and celebrated.',
    defaultSubtext: 'Stepping into who you truly are takes immense courage. Today we honor your truth, your name, and your journey.',
    badgeText: 'TRANS JOY',
    themeStyle: 'pride_spectrum',
    previewMockupUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-8',
    title: 'Pronouns & Chosen Name Respect',
    category: 'quote',
    description: 'Clear, non-negotiable affirmation establishing identity validation as basic dignity and respect.',
    defaultAspect: '1:1',
    defaultHeadline: 'Your name and pronouns are non-negotiable.',
    defaultSubtext: 'Honoring someone’s identity is the most fundamental form of care. You never have to earn the right to be respected.',
    badgeText: 'AFFIRMING CULTURE',
    themeStyle: 'sunset_affirming',
    previewMockupUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-9',
    title: 'Language Guide: Clinical to Affirming',
    category: 'mythbuster',
    description: 'Empathetic educational card guiding staff and community away from clinical terminology into empowering language.',
    defaultAspect: '1:1',
    defaultHeadline: 'Words matter. Choose empathy over labels.',
    defaultSubtext: 'Instead of assuming or diagnosing, we listen and affirm. Language creates safe harbor when spoken with care.',
    badgeText: 'LANGUAGE GUIDE',
    themeStyle: 'midnight_minimal',
    previewMockupUrl: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-10',
    title: 'Late Night Safe Haven (2 AM Check-in)',
    category: 'community',
    description: 'Dedicated nighttime support visual for users struggling with insomnia, loneliness, or late-night anxiety.',
    defaultAspect: '9:16',
    defaultHeadline: 'For anyone awake right now feeling alone.',
    defaultSubtext: 'The night can feel heavy, but tomorrow is waiting for you. Q is here whenever you need a quiet, gentle voice.',
    badgeText: 'NIGHTTIME SAFE HAVEN',
    themeStyle: 'cosmic',
    previewMockupUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-11',
    title: '5-4-3-2-1 Sensory Grounding Reset',
    category: 'resource',
    description: 'Quick somatic reset card to pull users back into the present moment when experiencing panic or triggers.',
    defaultAspect: '1:1',
    defaultHeadline: '5 things you see. 4 you feel. 3 you hear.',
    defaultSubtext: '2 things you can smell. 1 thing you love about yourself. Re-anchor your nervous system—one breath at a time.',
    badgeText: 'SOMATIC RESET',
    themeStyle: 'emerald_safe',
    previewMockupUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-12',
    title: 'Ask Q: Gentle Boundaries as Self-Care',
    category: 'qa',
    description: 'Community Q&A spotlight addressing healthy boundaries with family, colleagues, and social spaces.',
    defaultAspect: '1:1',
    defaultHeadline: '“How do I protect my peace without guilt?”',
    defaultSubtext: 'Saying “no” to what drains you is saying “yes” to your mental wellbeing. Boundaries are not walls—they are doorways to safe connection.',
    badgeText: 'ASK Q SPOTLIGHT',
    themeStyle: 'light_tint',
    previewMockupUrl: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'tpl-13',
    title: 'Chosen Family Appreciation',
    category: 'community',
    description: 'Celebration of chosen kinship, chosen families, and the safe spaces we build for one another.',
    defaultAspect: '1:1',
    defaultHeadline: 'To the ones who see you, hold you, and love you as you are.',
    defaultSubtext: 'Chosen family is love without conditions. Tag or send this to someone who makes your world feel a little safer.',
    badgeText: 'CHOSEN KINSHIP',
    themeStyle: 'sunset_affirming',
    previewMockupUrl: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?auto=format&fit=crop&w=600&q=80'
  }
];

export const INITIAL_POSTS: PostItem[] = [
  {
    id: 'post-101',
    title: 'Weekly Wellbeing Check-in: Creating Gentle Space',
    content: "Hi there. However your week is unfolding, remember that your feelings are valid. 💜 We designed Q to be your private space for LGBTQ+ wellbeing—where you set the pace, and there is never any pressure to have all the answers. Take a breath with us today. I'm here for you—always.",
    platforms: ['instagram', 'threads', 'bluesky'],
    status: 'pending_approval',
    scheduledFor: '2026-09-21T15:00:00.000Z',
    author: {
      name: 'Scott Harvey-Whittle',
      role: 'Social Media & Communications Officer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    assignee: {
      name: 'Jordan Vance',
      role: 'Brand & Editorial Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    mediaUrls: [Q_LOGO_URL],
    tags: ['#QIntelligence', '#LGBTQWellbeing', '#SafeSpace', '#SelfCare'],
    complianceAudit: {
      score: 96,
      status: 'approved',
      summary: 'Exemplifies Q Intelligence tone: warmly welcoming, affirming, and clear.',
      breakdown: {
        welcoming: 98,
        affirming: 95,
        clarity: 96,
        privacySafe: 98,
        nonPresumptive: 94
      },
      flags: [
        {
          rule: 'Welcoming & Validating Tone',
          type: 'praise',
          excerpt: "I'm here for you—always",
          message: 'Directly aligns with the official Q Intelligence core phrase.',
          suggestion: 'Keep this affirming cadence.'
        }
      ],
      scannedAt: '2026-09-20T10:15:00Z',
      source: 'gemini_3_8_flash'
    },
    comments: [
      {
        id: 'c-1',
        author: 'Jordan Vance',
        authorRole: 'Brand & Editorial Director',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
        content: 'Love the phrasing here Scott! Tone is gentle and perfectly non-presumptive. Ready to greenlight once graphic is confirmed.',
        createdAt: '10 mins ago',
        isResolved: false
      }
    ],
    revisionCount: 2,
    lastModified: '2026-09-20T10:20:00Z',
    campaign: 'Fall Wellbeing Series',
    piiShieldVerified: true
  },
  {
    id: 'post-102',
    title: '24/7 Crisis Resource Spotlight (Weekend Coverage)',
    content: "If you're feeling overwhelmed or navigating isolation, you are not alone. Free, confidential support is available 24/7: 📞 Call 988 (Press 3 for LGBTQ+ specialized youth line) or text START to 678-678 (The Trevor Project). You matter deeply. Reach out whenever you need.",
    platforms: ['instagram', 'twitter', 'linkedin', 'facebook'],
    status: 'approved',
    scheduledFor: '2026-09-20T22:00:00.000Z',
    author: {
      name: 'Scott Harvey-Whittle',
      role: 'Social Media & Communications Officer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    assignee: {
      name: 'Morgan Blake',
      role: 'Community Safety Officer',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80'
    },
    mediaUrls: ['https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80'],
    tags: ['#Helpline', '#YouAreNotAlone', '#CrisisSupport', '#LGBTQCommunity'],
    complianceAudit: {
      score: 98,
      status: 'approved',
      summary: 'Passes all safety and brand checks. Emergency resources clearly verified.',
      breakdown: {
        welcoming: 96,
        affirming: 100,
        clarity: 98,
        privacySafe: 100,
        nonPresumptive: 96
      },
      flags: [
        {
          rule: 'Approved Crisis Lifelines',
          type: 'praise',
          excerpt: '988 (Press 3) and 678-678',
          message: 'Official verified hotlines formatted with clarity.',
          suggestion: 'Ensure phone numbers remain copyable on mobile.'
        }
      ],
      scannedAt: '2026-09-20T08:30:00Z',
      source: 'gemini_3_8_flash'
    },
    comments: [
      {
        id: 'c-2',
        author: 'Morgan Blake',
        authorRole: 'Community Safety Officer',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
        content: 'Verified phone numbers and text shortcodes. Approved for simultaneous cross-platform release.',
        createdAt: '1 hour ago',
        isResolved: true
      }
    ],
    revisionCount: 1,
    lastModified: '2026-09-20T09:12:00Z',
    campaign: 'Always-On Safety Lifelines',
    piiShieldVerified: true
  },
  {
    id: 'post-103',
    title: 'Privacy Transparency Report: How On-Device AI Shields You',
    content: "How does Q protect your reflection? We believe privacy is a core right, not an afterthought. With our Local AI architecture, your thoughts process right on your device. Zero ad tracking. Zero commercial surveillance. Your journey belongs only to you. Read our full transparency breakdown at the link in bio.",
    platforms: ['linkedin', 'twitter', 'bluesky'],
    status: 'scheduled',
    scheduledFor: '2026-09-22T14:00:00.000Z',
    author: {
      name: 'Scott Harvey-Whittle',
      role: 'Social Media & Communications Officer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    assignee: {
      name: 'Jordan Vance',
      role: 'Brand & Editorial Director',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
    },
    mediaUrls: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'],
    tags: ['#PrivacyFirst', '#LocalAI', '#DataProtection', '#DigitalWellbeing'],
    complianceAudit: {
      score: 92,
      status: 'approved',
      summary: 'Clear, honest communication about technical boundaries without hyperbolic promises.',
      breakdown: {
        welcoming: 88,
        affirming: 90,
        clarity: 95,
        privacySafe: 98,
        nonPresumptive: 90
      },
      flags: [
        {
          rule: 'Protective & Honest Boundaries',
          type: 'praise',
          excerpt: 'Local AI architecture',
          message: 'Transparent explanation of device processing vs. cloud features.',
          suggestion: 'Keep link destination audited.'
        }
      ],
      scannedAt: '2026-09-19T18:00:00Z'
    },
    comments: [],
    revisionCount: 3,
    lastModified: '2026-09-19T18:45:00Z',
    campaign: 'Privacy & Architecture Pillar',
    piiShieldVerified: true
  },
  {
    id: 'post-104',
    title: 'National Coming Out Day Preview (Tone Revision Needed)',
    content: "When you finally decide to come out to your parents this month, don't let fear paralyze you. Sufferers of closeted anxiety must admit their true self. Join our webinar to be cured of self-doubt.",
    platforms: ['instagram', 'twitter'],
    status: 'changes_requested',
    scheduledFor: null,
    author: {
      name: 'Alex Rivera',
      role: 'Junior Content Associate',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&q=80'
    },
    assignee: {
      name: 'Scott Harvey-Whittle',
      role: 'Social Media & Communications Officer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    mediaUrls: [],
    tags: ['#ComingOut', '#LGBTQSupport'],
    complianceAudit: {
      score: 42,
      status: 'changes_requested',
      summary: 'Multiple brand voice violations: presumptive framing, clinical pathologizing words, and pushy directives.',
      breakdown: {
        welcoming: 45,
        affirming: 40,
        clarity: 65,
        privacySafe: 80,
        nonPresumptive: 25
      },
      flags: [
        {
          rule: 'Avoid Presumptive Assumptions',
          type: 'violation',
          excerpt: 'come out to your parents',
          message: 'Assumes the user has parents or that coming out to parents is a universally safe/mandatory goal.',
          suggestion: 'Frame coming out as deeply personal, with zero timeline pressure.'
        },
        {
          rule: 'Avoid Clinical/Cold Language',
          type: 'violation',
          excerpt: 'Sufferers of closeted anxiety',
          message: 'Q Intelligence bans pathologizing terminology like "sufferers" or treating queer experience as an illness.',
          suggestion: 'Use validating, non-medicalized terms like "navigating complex feelings".'
        },
        {
          rule: 'Avoid Diagnostic / Pushy Tone',
          type: 'violation',
          excerpt: 'cured of self-doubt',
          message: 'Q never promises to "cure" or diagnoses psychological status.',
          suggestion: 'Offer companion support instead: "We are here to reflect alongside you."'
        }
      ],
      scannedAt: '2026-09-20T09:00:00Z',
      source: 'gemini_3_8_flash'
    },
    comments: [
      {
        id: 'c-3',
        author: 'Scott Harvey-Whittle',
        authorRole: 'Social Media & Communications Officer',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
        content: '@alex-rivera Please run this through our AI Q-Voice Polish. Words like "sufferers" and "cured" violate our Brand Rule Book section on Tone of Voice. Coming out is never mandatory or prescriptive!',
        createdAt: '25 mins ago',
        isResolved: false
      }
    ],
    revisionCount: 1,
    lastModified: '2026-09-20T09:05:00Z',
    campaign: 'Awareness Days 2026',
    piiShieldVerified: false
  },
  {
    id: 'post-105',
    title: 'Pride & Joy Community Spotlight: Finding Chosen Family',
    content: "Family isn't only who we are born to—it's who embraces us unconditionally. To every member of our community cultivating spaces of warmth, laughter, and belonging: we see you and we honor you. What does chosen family feel like to you? Share in the comments if you feel comfortable. 🌈✨",
    platforms: ['instagram', 'tiktok', 'threads', 'facebook'],
    status: 'published',
    scheduledFor: '2026-09-18T16:00:00.000Z',
    publishedAt: '2026-09-18T16:00:00.000Z',
    author: {
      name: 'Scott Harvey-Whittle',
      role: 'Social Media & Communications Officer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    assignee: {
      name: 'Scott Harvey-Whittle',
      role: 'Social Media & Communications Officer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
    },
    mediaUrls: ['https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'],
    tags: ['#ChosenFamily', '#PrideAndJoy', '#LGBTQCommunity', '#QIntelligence'],
    complianceAudit: {
      score: 97,
      status: 'approved',
      summary: 'Exceptional brand compliance. Validating, gentle invitation with "if you feel comfortable".',
      breakdown: {
        welcoming: 98,
        affirming: 99,
        clarity: 95,
        privacySafe: 98,
        nonPresumptive: 96
      },
      flags: [
        {
          rule: 'Consent-Forward Engagement',
          type: 'praise',
          excerpt: 'Share in the comments if you feel comfortable',
          message: 'Protects user boundaries without pressure to disclose.',
          suggestion: 'Excellent model for future engagement prompts.'
        }
      ],
      scannedAt: '2026-09-18T14:30:00Z'
    },
    comments: [],
    revisionCount: 2,
    lastModified: '2026-09-18T15:50:00Z',
    campaign: 'Pride & Joy 365',
    piiShieldVerified: true
  }
];

export const INITIAL_ACTIVITY_LOGS: ActivityLogItem[] = [
  {
    id: 'act-1',
    user: 'Jordan Vance',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
    action: 'reviewed and added approval comment to',
    target: 'Weekly Wellbeing Check-in',
    timestamp: '10 mins ago',
    type: 'comment'
  },
  {
    id: 'act-2',
    user: 'Scott Harvey-Whittle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    action: 'requested changes on non-compliant post',
    target: 'National Coming Out Day Preview',
    timestamp: '25 mins ago',
    type: 'status_change'
  },
  {
    id: 'act-3',
    user: 'Brand Compliance Engine',
    avatar: Q_LOGO_URL,
    action: 'ran automated tone audit (Score: 42%) on',
    target: 'National Coming Out Day Preview',
    timestamp: '45 mins ago',
    type: 'compliance_run'
  },
  {
    id: 'act-4',
    user: 'Morgan Blake',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
    action: 'approved emergency hotlines for',
    target: '24/7 Crisis Resource Spotlight',
    timestamp: '1 hour ago',
    type: 'status_change'
  },
  {
    id: 'act-5',
    user: 'Scott Harvey-Whittle',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    action: 'scheduled multi-platform publication for',
    target: 'Privacy Transparency Report',
    timestamp: '3 hours ago',
    type: 'schedule'
  }
];

export const MOCK_POSTS = INITIAL_POSTS;
export const MOCK_ACTIVITIES = INITIAL_ACTIVITY_LOGS;

export const PLATFORM_SPECS: Record<string, { name: string; maxChars: number; optimalRatio: string; icon: string; brandColor: string; handleFormat: string }> = {
  instagram: {
    name: 'Instagram',
    maxChars: 2200,
    optimalRatio: '1:1 or 4:5',
    icon: 'Instagram',
    brandColor: '#E1306C',
    handleFormat: '@qintelligence.app'
  },
  linkedin: {
    name: 'LinkedIn',
    maxChars: 3000,
    optimalRatio: '16:9 or 1:1',
    icon: 'Linkedin',
    brandColor: '#0A66C2',
    handleFormat: 'Q Intelligence Organization'
  },
  twitter: {
    name: 'X (Twitter)',
    maxChars: 280,
    optimalRatio: '16:9',
    icon: 'Twitter',
    brandColor: '#0F1419',
    handleFormat: '@QIntelligence'
  },
  threads: {
    name: 'Threads',
    maxChars: 500,
    optimalRatio: '1:1 or 9:16',
    icon: 'AtSign',
    brandColor: '#000000',
    handleFormat: '@qintelligence.app'
  },
  tiktok: {
    name: 'TikTok',
    maxChars: 2200,
    optimalRatio: '9:16 Vertical',
    icon: 'Video',
    brandColor: '#000000',
    handleFormat: '@qintelligence'
  },
  bluesky: {
    name: 'Bluesky',
    maxChars: 300,
    optimalRatio: '16:9 or 1:1',
    icon: 'Cloud',
    brandColor: '#0285FF',
    handleFormat: 'qintelligence.bsky.social'
  },
  facebook: {
    name: 'Facebook',
    maxChars: 5000,
    optimalRatio: '16:9',
    icon: 'Share2',
    brandColor: '#1877F2',
    handleFormat: 'Q Intelligence Wellbeing'
  },
  website: {
    name: 'Official Website (q-ai.online)',
    maxChars: 12000,
    optimalRatio: '16:9 Banner / Article',
    icon: 'Globe',
    brandColor: '#7C3AED',
    handleFormat: 'https://q-ai.online/journal'
  }
};
