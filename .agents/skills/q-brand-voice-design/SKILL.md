---
name: q-brand-voice-design
description: Apply Q Intelligence’s voice and visual identity to writing, rewrites, social posts, campaigns, and design briefs. Use when creating or adapting content for Q; preserve the source meaning and verify claims before making them sound more polished.
metadata:
  short-description: Write and design in Q’s brand voice
---

# Q brand voice and design

Use this skill when content is intended to represent Q Intelligence or the Q Social Media Manager project. It guides both copy and visual direction. Follow a more specific user brief or approved campaign guidance when provided. The repository’s implementation is the reference for this project; do not assume it governs every organisation called Q.

## Voice

Q sounds warm, affirming, calm, inclusive, and trustworthy. Speak plainly and with care. Make room for people’s different identities and experiences without assuming what someone feels, needs, believes, or has lived through.

- Prefer direct, human language and short, readable sentences.
- Validate without diagnosing, overpromising, or telling someone how they must feel.
- Use invitational phrasing (“you can”, “if it helps”, “when you’re ready”) for wellbeing and reflection content.
- Respect chosen names, pronouns, and self-description. Do not guess identity or use labels as shorthand for a person.
- Keep privacy and safety claims precise. Do not imply absolute confidentiality, anonymity, security, availability, or clinical outcomes unless the source explicitly supports the claim.
- Avoid shame, stigma, sensationalism, patronising reassurance, forced positivity, and exploitative use of distress.
- Keep calls to action clear and low pressure. Use “I’m here for you—always” only where that first-person Q voice fits the channel and context.

## Transforming existing content

When asked to make content “Q-branded”, preserve its purpose, key facts, names, dates, numbers, commitments, and intended audience. Improve clarity, tone, structure, and accessibility without inventing evidence or changing the offer. Keep necessary caveats and attribution. If a claim is ambiguous or sensitive, retain it faithfully and flag the uncertainty rather than silently strengthening it.

Adapt length and formatting to the destination: social posts should lead with the main point; graphics need concise headline and supporting copy; longer articles can explain context in plain language. Respect platform limits supplied by the user or destination. Offer a short alternative when a design or channel needs less text.

For sensitive wellbeing, crisis, medical, or safety content, be especially literal with instructions and contact details. Never invent a helpline, eligibility rule, response time, or promise. Preserve supplied emergency information exactly and make it easy to find.

## Visual identity

Use the project’s established palette and typography as a starting point:

- Deep ink `#0F091F` for primary text and strong contrast.
- Primary purple `#7C3AED` for brand emphasis and interactive accents.
- Lilac tint `#F5F3FF` for gentle reflective surfaces.
- White `#FFFFFF` and soft slate `#F8FAFC` for clean, calm layouts.
- Cyan `#06B6D4` and magenta `#EC4899` as restrained nebula accents, particularly on dark backgrounds.
- Pride spectrum may be used for Pride and community celebration; do not make every message depend on rainbow decoration.

Use Inter for headlines and body copy. Use heavier Inter weights for display headlines and regular/medium weights for readable body text. Reserve JetBrains Mono for technical labels, status, timestamps, or code-like details, never ordinary narrative copy.

Visual direction should feel spacious, legible, contemporary, affirming, and calm. Cosmic dark gradients (`#020617`, `#1e1235`, `#082f49`) and the Q mark suit major announcements; light lilac suits reflective content; clear red accents suit verified urgent-help information; community photography should represent people respectfully and inclusively. Use the official Q logo asset from the project’s brand data when available; do not redraw, distort, or substitute it. Avoid decorative effects that reduce readability.

Maintain accessible contrast and readable type sizes. The project’s cyan and magenta swatches have limited contrast on white, so use them as accents or on dark surfaces rather than small text on white. Pair colour with labels or symbols when colour conveys meaning. Choose aspect ratio and text density for the destination instead of forcing one template everywhere.

## Output workflow

1. Identify the audience, purpose, medium, and any constraints in the request or source material.
2. Preserve factual content and adapt the language to Q’s voice; choose a visual direction only when the task includes design or a design brief.
3. Return content in a form the user can use directly. Keep platform variants clearly labelled and distinguish approved source facts from any proposed wording.
4. If essential brand facts, crisis details, or product claims are missing, do not fabricate them; use a neutral placeholder or ask a focused question.

Use the source repository’s `src/data/brandData.ts` for the implemented swatches, font guidance, assets, and template examples when working in this project.
