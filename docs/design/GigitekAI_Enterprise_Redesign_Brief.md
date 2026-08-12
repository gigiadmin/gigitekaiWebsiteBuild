# GigitekAI Enterprise Redesign Brief

## Baseline Findings

The live homepage currently exposes a dense navigation system, multiple competing hero calls to action, pricing cards, benefits, industry content, proof points, a long operating model, an agentic workflow demonstration, an ROI calculator, resources, insights, FAQs, newsletter capture, and a contact form in one long scroll. This creates credibility and depth but asks a first-time SMB buyer to process too many decisions before reaching the primary conversion path.

The recommended direction is not to imitate enterprise reference sites literally. GigitekAI should adopt their hierarchy, restraint, and whitespace while remaining warmer, faster to understand, and more conversion-oriented for SMB and mid-market decision makers.

## Reference Patterns Worth Adopting

Accenture uses a small number of parent navigation choices with deep content grouped beneath those choices. Its homepage foregrounds large editorial headlines and proof-led modules rather than attempting to explain every service at once. HCLTech groups offerings into a small solution taxonomy, moves depth into secondary pathways, and alternates broad visual breathing room with compact proof and solution blocks.

## GigitekAI Design Direction

The public navigation should reduce to four primary choices: **Solutions**, **Industries**, **Insights**, and **Company**, with a single primary conversion action, **Start Your IT Assessment**. Support and client access should become utility actions. The homepage should lead with the core promise: **Managed IT + Governed AI, without the complexity.** It should then show three solution pillars, selected proof, a concise explanation of how GigitekAI works, one trust strip, and one strong CTA.

## Recommended Information Architecture

| Primary navigation | Purpose | Secondary or grouped content |
|---|---|---|
| Solutions | The commercial entry point for services and capabilities | Managed IT, Microsoft 365, cybersecurity, governed AI, cloud, data, strategy, pricing, discovery intake, and free audit |
| Industries | Relevance for regulated and high-growth buyers | Healthcare, legal, construction, financial services, manufacturing, and professional services |
| Insights | Credibility and education | Blog, AI news, knowledge base, templates, resources, and ROI calculator |
| Company | Trust and relationship | About, operating approach, locations, careers, contact, and partner ecosystem |

The public header should show the single conversion action **Start Your IT Assessment**. **Support** and **Client Access** remain utility actions, visually quieter than the primary action. The mobile drawer should present the same four decision paths before utility links and the conversion CTA.

## Homepage Wireframe

| Sequence | Section | Purpose |
|---|---|---|
| 1 | Hero | One outcome-focused statement, concise supporting copy, one primary conversion action, and one secondary AI capability link |
| 2 | Trust strip | Establish Microsoft 365, security, governed AI, and operational-framework relevance without a dense compliance list |
| 3 | Solution pillars | Three clear pathways: manage and secure, modernize Microsoft 365, and govern AI automation |
| 4 | Operating model | Explain Discover, Modernize, and Improve in three compact steps |
| 5 | AI capability | Show the agentic automation differentiator with one focused path to the live demo or AI solutions page |
| 6 | Focus industries | Prioritize healthcare, legal, and construction, with a path to the complete industries page |
| 7 | Insights | Surface a restrained selection of current thought leadership rather than a full content hub |
| 8 | Final CTA | Reiterate the IT assessment path and retain a separate support route for existing clients |

## Design Tokens and Component Standards

| Element | Recommendation |
|---|---|
| Canvas | `#0A0E1A` primary canvas with `#050810` for restrained contrast bands |
| Accent | `#00D4FF` reserved for navigation focus, primary actions, key words, and precise dividers |
| Typography | Space Grotesk for headline hierarchy; DM Sans for functional UI and body copy |
| Type scale | Display 64–80px desktop / 42–52px mobile; section headings 36–52px; body 17–19px with relaxed leading |
| Spacing | Use deliberate 96–144px desktop section rhythm and 64–88px mobile rhythm |
| Surfaces | Prefer editorial columns, hairline borders, and soft tonal shifts over repeated card grids |
| Motion | Use short opacity and transform transitions; respect reduced-motion preferences; avoid decorative particles and heavy parallax |
| Accessibility | Preserve a semantic heading hierarchy, visible focus, 48px mobile targets, and one unambiguous primary action per decision point |

## Preserve

- Existing contact, audit, discovery, pricing, support, and access flows.
- Dark navy foundation and restrained electric-cyan emphasis.
- Microsoft 365, governed AI, cybersecurity, and managed-services positioning.
- Tampa Bay and regulated-industry relevance without making the homepage feel regionally narrow.

## Reference Sources

The redesign research used the public homepages of [Accenture][1] and [HCLTech][2]. The recommendation draws from their navigation grouping, editorial hierarchy, restrained conversion paths, and the way they move detailed capabilities into secondary content rather than reproducing their branding or exact layouts.

[1]: https://www.accenture.com/us-en
[2]: https://www.hcltech.com/en-us

## Implementation Status — August 12, 2026

The homepage now follows the planned progression: focused hero, trust strip, three solution pillars, operating model, governed-AI capability, focused industries, selected insights, and a closing assessment CTA. The previous homepage sections remain available through their corresponding service, industry, insight, audit, discovery, and support routes rather than competing on the first screen.

The public header now centers on **Solutions**, **Industries**, **Insights**, and **Company**, while **Support** and **Client Access** remain utility actions. The sole primary header conversion action routes to `/free-audit`. Promotional overlays are suppressed on the homepage so the hero and primary conversion path remain clear.

Validation completed: focused Vitest regression coverage passed 2/2; the Vite production frontend build completed successfully; public navigation destinations were confirmed in the router; and the active preview returned HTTP 200 with approximately 97 ms TTFB and 110 ms total response time in the local preview environment. These preview timings are a smoke check, not a substitute for post-publish field performance measurement.

## Mobile-Specific Correction — August 12, 2026

The first redesign pass improved structure but did not visibly depart far enough from the prior mobile experience. The mobile correction now makes the hierarchy intentional rather than compressed: the hero uses a full small-viewport canvas, a tighter mobile type scale, stacked primary and secondary actions, purpose-built **Watch AI Work Live** and **Client Support** action tiles, and a compact three-signal proof row.

The mobile menu now begins with a clear assessment action and summary, treats **Solutions** as an explicit expandable group, and separates the Industry, Insights, and Company routes from support and client access utilities. Homepage content bands now use a reduced mobile vertical rhythm while retaining the more spacious desktop treatment. Focused regression coverage passed 3/3 and the production frontend build completed successfully after this correction.
