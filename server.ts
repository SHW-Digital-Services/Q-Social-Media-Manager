import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Brand rules context for Q Intelligence
const Q_BRAND_GUIDE_PROMPT = `
You are the official Brand Compliance & Editorial Reviewer for "Q Intelligence".
Brand Mission: "Your private space for LGBTQ+ wellbeing and personal reflection. We provide intelligent support, safe conversations, resources, and guidance for LGBTQ+ individuals and allies."
Pillars: Secure & Private, Built with Empathy, Connected Community.

TONE OF VOICE RULES:
WE ARE:
1. Welcoming: Non-judgmental, warm ("I'm here for you—always").
2. Clear: Direct, plain language without convoluted jargon or confusing identity gatekeeping.
3. Affirming: Validating user experiences and identities without reservation or conditional phrasing.
4. Protective: Transparent about privacy choices without over-promising impossible encryption or exposing sensitive data.

WE ARE NOT:
1. Clinical/Cold: NEVER use overly medicalized, detached, or pathological terms (avoid "sufferers", "afflicted", "disorder", "pathology", "symptoms of being queer").
2. Presumptive: NEVER assume pronouns, gender expression, family relationships, coming-out status, or transition steps (e.g. avoid assuming parents are unsupportive or that everyone has or wants to "come out").
3. Pushy: NEVER force disclosure, demand radical openness, or urge users toward actions they aren't ready for.
4. Diagnostic: The AI or brand NEVER diagnoses psychological conditions; it only observes, reflects, and supports.
`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      brand: 'Q Intelligence',
      timestamp: new Date().toISOString(),
    });
  });

  // Compliance Audit Endpoint
  app.post('/api/compliance/audit', async (req, res) => {
    try {
      const { text, platform, targetAudience } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required for compliance audit.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // Fallback heuristic scoring if API key is not yet set
        const clinicalTerms = ['disorder', 'pathology', 'afflicted', 'sufferers', 'diagnose', 'symptom'];
        const presumptiveTerms = ['when you come out to your parents', 'your mother', 'your father', 'as a normal person'];
        const pushyTerms = ['you must', 'you need to disclose', 'don\'t delay', 'admit it'];

        const lower = text.toLowerCase();
        const flagged: Array<{ rule: string; type: 'violation' | 'warning' | 'praise'; excerpt: string; message: string; suggestion: string }> = [];

        clinicalTerms.forEach(term => {
          if (lower.includes(term)) {
            flagged.push({
              rule: 'Avoid Clinical/Cold Tone',
              type: 'violation',
              excerpt: term,
              message: `The term "${term}" feels clinical or medicalized. Q Intelligence maintains compassionate, empathetic language.`,
              suggestion: `Consider softer, non-pathologizing language focusing on personal reflection.`,
            });
          }
        });

        presumptiveTerms.forEach(term => {
          if (lower.includes(term)) {
            flagged.push({
              rule: 'Avoid Presumptive Assumptions',
              type: 'violation',
              excerpt: term,
              message: `Phrasing like "${term}" assumes specific family or personal circumstances.`,
              suggestion: `Use inclusive, non-assumptive phrasing like "your support network" or "those close to you".`,
            });
          }
        });

        pushyTerms.forEach(term => {
          if (lower.includes(term)) {
            flagged.push({
              rule: 'Avoid Pushy Directives',
              type: 'warning',
              excerpt: term,
              message: `Language like "${term}" can feel coercive or pushy.`,
              suggestion: `Frame as an invitation: "Whenever you feel ready..."`,
            });
          }
        });

        // Affirming check
        if (/welcome|safe space|here for you|reflect|journey|affirm|support|privacy|belong/i.test(text)) {
          flagged.push({
            rule: 'Warm & Welcoming Spirit',
            type: 'praise',
            excerpt: 'Validating tone detected',
            message: 'Matches Q Intelligence values: welcoming, validating, and safe.',
            suggestion: 'Maintain this gentle and affirming approach.',
          });
        }

        const score = Math.max(45, Math.min(100, 100 - (flagged.filter(f => f.type === 'violation').length * 25) - (flagged.filter(f => f.type === 'warning').length * 10)));

        return res.json({
          score,
          status: score >= 85 ? 'approved' : score >= 70 ? 'needs_review' : 'changes_requested',
          summary: score >= 85 
            ? 'Complies strongly with Q Intelligence tone guidelines.' 
            : 'Contains potential tone or framing adjustments needed before publishing.',
          breakdown: {
            welcoming: 88,
            affirming: 85,
            clarity: 92,
            privacySafe: 95,
            nonPresumptive: score < 75 ? 65 : 90,
          },
          flags: flagged,
          source: 'rule_engine_local',
        });
      }

      const prompt = `
Analyze the following social media draft for Q Intelligence.
Platform: ${platform || 'Cross-Platform'}
Target Audience: ${targetAudience || 'LGBTQ+ community & allies'}

Draft content:
"""
${text}
"""

Evaluate strictly against Q Intelligence Brand Guidelines:
1. Welcoming & Safe (creating an affirming, non-judgmental space)
2. Clear & Direct (no jargon, transparent)
3. Affirming & Validating (no invalidation of queer experiences)
4. Protective & Private (respects confidentiality, honest boundaries)
5. NOT Clinical/Cold (no medicalizing of queer identity)
6. NOT Presumptive (no assuming pronouns, journey status, coming out timeline, or biological family acceptance)
7. NOT Pushy (no demanding action or disclosure)
8. NOT Diagnostic (no diagnosing mental health or conditions)

Return valid JSON adhering to the specified schema.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: Q_BRAND_GUIDE_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Overall compliance score 0 to 100' },
              status: { type: Type.STRING, description: 'approved, needs_review, or changes_requested' },
              summary: { type: Type.STRING, description: 'Executive assessment of brand compliance' },
              breakdown: {
                type: Type.OBJECT,
                properties: {
                  welcoming: { type: Type.INTEGER },
                  affirming: { type: Type.INTEGER },
                  clarity: { type: Type.INTEGER },
                  privacySafe: { type: Type.INTEGER },
                  nonPresumptive: { type: Type.INTEGER },
                },
                required: ['welcoming', 'affirming', 'clarity', 'privacySafe', 'nonPresumptive'],
              },
              flags: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    rule: { type: Type.STRING },
                    type: { type: Type.STRING, description: 'violation, warning, or praise' },
                    excerpt: { type: Type.STRING },
                    message: { type: Type.STRING },
                    suggestion: { type: Type.STRING },
                  },
                  required: ['rule', 'type', 'excerpt', 'message', 'suggestion'],
                },
              },
            },
            required: ['score', 'status', 'summary', 'breakdown', 'flags'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      parsed.source = 'gemini_3_8_flash';
      return res.json(parsed);
    } catch (err: any) {
      console.error('Compliance audit error:', err);
      res.status(500).json({ error: err.message || 'Failed to execute compliance audit.' });
    }
  });

  // Rewrite in Q Intelligence Voice
  app.post('/api/compliance/rewrite', async (req, res) => {
    try {
      const { text, style = 'Warm & Supportive', platform = 'Instagram' } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required for rewrite.' });
      }

      const ai = getGeminiClient();
      if (!ai) {
        // High-quality deterministic fallback
        const rewritten = `Hi there. ${text.replace(/sufferers|afflicted/gi, 'members of our community').replace(/you must/gi, 'you are always welcome to')} We're here for you—always. Your journey is yours to define. 💜✨`;
        return res.json({
          rewrittenText: rewritten,
          notes: 'Enhanced with welcoming, non-presumptive Q tone and affirming sign-off.',
          styleApplied: style,
          source: 'local_preset',
        });
      }

      const prompt = `
Rewrite the following post copy to align with the Q Intelligence brand voice.
Desired Style: ${style} (e.g. "Warm & Supportive", "Direct & Clear", "Helpline & Safe Haven", or "Celebratory & Community")
Platform: ${platform}

Original Draft:
"""
${text}
"""

Guidelines to apply:
- Infuse Q's signature voice: welcoming, affirming, clear, and privacy-protective.
- Eliminate clinical, cold, or prescriptive phrasing.
- Ensure no assumptions are made regarding user disclosure, identity timeline, or family background.
- Include appropriate gentle hashtags and community-affirming emojis if suitable for ${platform}.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: Q_BRAND_GUIDE_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              rewrittenText: { type: Type.STRING, description: 'The polished brand-compliant caption' },
              notes: { type: Type.STRING, description: 'Explanation of changes made for brand compliance' },
              suggestedHashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['rewrittenText', 'notes', 'suggestedHashtags'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Rewrite error:', err);
      res.status(500).json({ error: err.message || 'Failed to rewrite text.' });
    }
  });

  // Hashtag & Tag Suggestions
  app.post('/api/compliance/hashtags', async (req, res) => {
    try {
      const { topic, platform } = req.body;
      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          hashtags: ['#QIntelligence', '#LGBTQWellbeing', '#SafeSpace', '#InclusiveCommunity', '#AffirmingSpaces', '#MentalWellbeing'],
          platformTip: 'Keep hashtags between 3 and 5 for optimal engagement without cluttering the message.',
        });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Generate 6 respectful, brand-safe, and affirming hashtags for Q Intelligence on topic: "${topic || 'General LGBTQ+ wellbeing and safe reflection'}" for platform: ${platform || 'Social Media'}. Do not use sensationalized or outdated terminology.`,
        config: {
          systemInstruction: Q_BRAND_GUIDE_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hashtags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              platformTip: { type: Type.STRING },
            },
            required: ['hashtags', 'platformTip'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Hashtags error:', err);
      res.status(500).json({ error: err.message || 'Failed to generate hashtags.' });
    }
  });

  // In-memory version history cache with Supabase sync support
  const postVersionStore = new Map<string, any[]>();
  const assetVersionStore = new Map<string, any[]>();

  // Fetch versions for a post
  app.get('/api/posts/versions/:postId', (req, res) => {
    const { postId } = req.params;
    const versions = postVersionStore.get(postId) || [];
    res.json({ postId, versions });
  });

  // Record a new version for a post
  app.post('/api/posts/versions/:postId', (req, res) => {
    const { postId } = req.params;
    const version = req.body;
    if (!version) {
      return res.status(400).json({ error: 'Version data is required.' });
    }
    const current = postVersionStore.get(postId) || [];
    const updated = [version, ...current];
    postVersionStore.set(postId, updated);
    res.json({ success: true, postId, totalVersions: updated.length, version });
  });

  // Fetch versions for an asset
  app.get('/api/assets/versions/:assetId', (req, res) => {
    const { assetId } = req.params;
    const versions = assetVersionStore.get(assetId) || [];
    res.json({ assetId, versions });
  });

  // Record a new version for an asset
  app.post('/api/assets/versions/:assetId', (req, res) => {
    const { assetId } = req.params;
    const version = req.body;
    if (!version) {
      return res.status(400).json({ error: 'Asset version data is required.' });
    }
    const current = assetVersionStore.get(assetId) || [];
    const updated = [version, ...current];
    assetVersionStore.set(assetId, updated);
    res.json({ success: true, assetId, totalVersions: updated.length, version });
  });

  // Vite middleware or static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Q Intelligence Communications Hub server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
