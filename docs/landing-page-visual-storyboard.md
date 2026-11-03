# Landing Page Visual Storyboard

## Visual system

Bright blue and white operational palette, deep navy type, editorial scale, one recurring flight-radius motif, and restrained technical labels. Product UI is built as real HTML text, not a fabricated screenshot. Scroll animation only changes which illustrative site image and workflow stage are in focus. The supplied Lottie is the hero drone; no 3D scene or Hextronics assets remain.

## Scene 1 — Request-to-result hero

1. **Initial visual:** wide light-blue field; headline and two actions on the left; mission dossier with Lottie drone and orbit rings on the right.
2. **Business message:** one request is traceable through planning, preparation, and result review.
3. **Main element:** user-provided `Drone.json`, four-step mission record, visible illustrative note.
4. **Scroll interaction:** subtle page entry only; no forced pinned hero or scroll hijack.
5. **Text transition:** eyebrow, headline, support, then primary and secondary CTA in a clear hierarchy.
6. **Scene exit:** thin divider and down cue lead into the workflow.
7. **Mobile fallback:** copy and CTA first; compact Lottie card below; no horizontal overflow.
8. **Assets:** `src/features/landing/assets/drone-animation.json`, existing OnDemand logo.

## Scene 2 — Mission journey

1. **Initial visual:** section title and first construction image with an orbit overlay and a small mission-progress panel.
2. **Business message:** show review, resource assignment, operational readiness, then post-flight review as distinct steps.
3. **Main element:** four chapters connected to mission workflow copy; photos are marked illustrative.
4. **Scroll interaction:** GSAP ScrollTrigger selects the chapter in view and crossfades the corresponding photo; the progress panel updates with that chapter.
5. **Text transition:** each chapter becomes visually current while all chapter copy remains readable and present in the document.
6. **Scene exit:** the fourth post-flight chapter concludes before the capability section.
7. **Mobile fallback:** disable sticky composition; show one visual followed by all chapter copy in normal document flow.
8. **Assets:** `site-construction.jpg`, `solar-field.jpg`, `transmission-tower.jpg`, `rail-yard.jpg`; attribution metadata in `public/images/landing/credits.json`.

## Scene 3 — Capabilities

1. **Initial visual:** a left editorial heading and a right numbered list divided by thin rules.
2. **Business message:** scope, checklist/weather, and evidence belong to the operational record.
3. **Main element:** three capability statements tied to source-backed code.
4. **Scroll interaction:** native scrolling only; hover/focus cues do not hide content.
5. **Text transition:** heading stays visible on wide screens while rows enter the viewport naturally.
6. **Scene exit:** final rule and spacing lead into the FAQ.
7. **Mobile fallback:** heading followed by vertically stacked rows.
8. **Assets:** CSS and HTML; no external imagery or invented statistics.

## Scene 4 — FAQ

1. **Initial visual:** short section label and heading beside a clean disclosure list.
2. **Business message:** answer what customers provide, when staff can start, who reviews results, and whether flight is autonomous.
3. **Main element:** semantic `<details>`/`<summary>` rows.
4. **Scroll interaction:** native details expansion; no required animation.
5. **Text transition:** opened answer appears directly below its question.
6. **Scene exit:** the last answer leads to the request action.
7. **Mobile fallback:** single-column full-width disclosure rows with readable text.
8. **Assets:** none.

## Scene 5 — Final action and credits

1. **Initial visual:** deep navy close with a large request prompt and a single light CTA.
2. **Business message:** submit a request for the team to review scope and next steps.
3. **Main element:** role-aware existing create-request link and source-credit disclosure.
4. **Scroll interaction:** no forced motion; decorative radius rings remain static.
5. **Text transition:** one headline, one support line, one action.
6. **Scene exit:** compact brand/copyright/credits footer.
7. **Mobile fallback:** stacked text and button; credits disclosure opens above the bottom edge.
8. **Assets:** existing logo, LottieFiles source link, image sources listed in the landing copy and metadata.

## Motion and accessibility constraints

- Lottie autoplay/loop is disabled when the user requests reduced motion.
- CSS transitions are disabled under `prefers-reduced-motion: reduce`.
- ScrollTrigger only updates the current workflow stage; chapter text never depends on animation to appear.
- Navigation is keyboard-operable, menu supports Escape, disclosures use native semantics, and focus has a visible outline.
- No smooth-scroll engine or 3D runtime is added; motion is limited to the supplied animation and workflow crossfades.
