# OKHTEIN 3D SITE — SESSION HANDOVER

> **LATEST (2026-06-16 b) — WAVE 2 (hero money-shot) + PERFORMANCE PASS + gap fix + DEPLOY.**
> - **Wave 2 — hero "lock":** a near-still camera HOLD at the hero dwell (`VaultScene.tsx` camera useFrame,
>   `heroHold = exp(-((p-0.36)/0.05)²)` lerps cam/look to a path-sampled `heroCam`/`heroLook` at 0.88) so the
>   bag STOPS dead-centre while the FOV push-in keeps going — a held push, the "expensive" beat. The bag is a
>   presented float on its plinth (intentional), so no floor contact shadow was added. Verified real-3070.
> - **PERFORMANCE (measured on the real 3070, `scripts/_perf.mjs` scrapes the `?debug=1` overlay):** the bag
>   GLBs were meshopt+webp compressed but **never decimated** (hero 805K tris!). Decimated all 8 with
>   `gltf-transform simplify` (hero-class ratio 0.2 / shelf 0.4) + re-`meshopt`. Result at the worst-case beats:
>   **entrance 3.86M→1.06M tris (−73%), hero 3.12M→1.03M (−67%)**; bag payload **~17.6MB→~5.8MB**. Detail is in
>   the 1024² **normal maps**, so the silhouettes/quilting/studs read identically — verified at the CLOSEST view
>   (the Examine-in-3D modal) + the hero push-in + promenade. Also: proximity-gated the 3 showcase-pedestal key
>   lights (`keyRef`, off when `dist>6.5`), dropped dead `sofa`/`mirror` preloads in `SkyScene`. Draw calls
>   unchanged (~633 — would need niche-bag batching, deferred). KTX2 deferred (audit's call). Backups of the
>   pre-decimation GLBs are in git history at `48118bb` (the `_orig_backup/` working copy is NOT committed).
> - **Gap fix:** the audit's "mahogany leather renders BLACK" was real in the examiner — dark leather has ~no
>   specular to catch the upper-right key. Fixed in `ProductExaminer.tsx`: ambient 0.55→0.78 + a warm FRONT
>   fill `[0.4,0.7,3.0]` so dark leather reads as warm mahogany; the metallic palmette is unaffected (metal
>   takes ~no diffuse — verified no blowout). The audit's other "gaps" were already closed (cart drawer
>   auto-opens + count badge; `WebGLBoundary`+`VaultStatic` fallback; typo; headline scrims).
> - **New harnesses:** `_wave1/_wave2/_perf/_crop/_safecheck/_sig/_examiner/_beat.mjs`. Shots in `.shots-wave1/`,
>   `.shots-wave2/`, `.shots-check/`. **Deployed** to GH Pages (`omarRadwann/okhtein`, push→main CI).

> **LATEST (2026-06-16) — MASTERPIECE WAVE 1: the Two-Sisters emblem is now REAL CAST CHAMPAGNE METAL.**
> The brand climax was the #1 open lever ("flat PowerPoint glyph"; true brass thought BLOCKED by the
> "std-material-renders-black-at-z-12.4" mystery). **That myth is BUSTED** — a one-knob probe (swap
> `markMat` → a pure champagne `MeshPhysicalMaterial`, build, freeze `__vaultForce=0.87` on the real 3070)
> proved std/physical metal renders fine at z-12.4 now; the old "black" simply **predated the real
> `studio.hdr` IBL + the local finale key/rim lights** (a metal had nothing to reflect back then). Pure
> metal read too DIM for a climax, so the shipped solution in `VaultScene.tsx TwoSistersFinale` is a
> **HYBRID**: `markMat` = `MeshPhysicalMaterial` (champagne `#CABF9E`, metalness .9, roughness .3,
> envMapIntensity 3.0, clearcoat .5 **gated to `high`**, `vertexColors` keep emblemHalfGeo's baked sheen)
> + a **modest emissive floor that HEATS** (`0.18 + k²·1.5`, champagne `#CABF9E` → forge-warm `#F4DEAA`,
> never orange) so it never goes dead and the metal "catches", with the **IGNITE driven as a light event,
> not self-glow**: the front KEY is driven hard into the seam (`keyLightRef` `12 + k²·34`) so the cast
> surface's speculars blow past Bloom, and the champagne back-halo SWELLS (`haloMatRef` `0.18 + k²·0.42`)
> into a blooming flare as the halves complete — "metal catching fire," not a luminous sticker. Added a
> **real swept specular** (`glintLightRef`, rakes L→R over p0.74→0.90, peak 26) and a **widened local dark
> figure/ground pool (7.0×4.4)** behind the mark (gated by `reveal`, leaves the shared corridor terminus
> untouched) so the gleaming mark separates from the (now-suppressed) lattice. `TwoSistersFinale` now takes
> a `tier` prop. **Verified on the real RTX 3070 (HIGH) + the SAFE/integrated path — 0 console errors,
> hero(0.43)+atelier(0.71) unregressed, no crash with clearcoat/bloom gated off.** New dev harnesses:
> `scripts/_wave1.mjs <label>` (finale + regression beats, sharp-downscaled), `_crop.mjs` (emblem close
> crop), `_safecheck.mjs`, `_sig.mjs` (clean signature frame, no debug overlay). Shots in `.shots-wave1/`.
> **PUSHED (2026-06-16, user-chosen "go further"): flare drama + deeper field — warm-heating ignite, a
> swelling bloom halo, and a widened dark pool that drops the lattice to faint texture. OPEN (USER taste
> call): final ignite brightness on a real screen — get the user's eyes on `:5000` (the model can't judge
> glow/motion).** Next waves (roadmap): hero
> money-shot lock+contact-shadow; motion (03_widearc + promenade symmetry); commerce fly-to-cart + mobile 3D.

> **LATEST (2026-06-15) — live-bug fix pass (deployed gh-pages 1f96b0c / main 4759c46).** Fixed 4 user-reported
> defects: (1) **products were invisible on GH Pages** — `lib/products.ts` used a bare `/products/…` src but
> next/image with `unoptimized` doesn't add basePath → now `withBase('/products/…')`; (2) **black void + finale
> glyphs floating mid-walk** — `TwoSistersFinale` now reveal-gated (`reveal=smoothstep(p,0.58,0.74)`, forms on
> approach) + a **lit mashrabiya terminus** (z≈-13.9, all MeshBasicMaterial — std-material is black at this depth)
> framed by `CorridorArch z-13.2`, warmer/tighter fog `#15110C 11/28`; (3) **hero now dominates** — bag
> `normalizeTo 1.32` (1.35 is the clip ceiling); (4) **gold bag un-occluded** — `RUNWAY_SLOTS` S1 → `[-2.3,0,-2.1]`.
> Commerce polish: silhouettes fade on `<Image onLoad>` (stop bleeding through transparent PNGs), vitrine
> spotlights + drop-shadows on FeaturedUnboxing/QuickView. **Verify harness: `node scripts/_verify_fix.mjs <url>`**
> (audits every <img> + 404s + 3D beats + scrolls commerce). Always scroll INTO the commerce DOM — the prior
> "0 404s" pass was false because it only loaded the hero.

> Read this first to cold-start a new session. It captures what the project IS, where it
> stands, the goal we're driving toward, the non-obvious knowledge needed to continue safely,
> and the open items. Pair it with the auto-memory `project_okhtein_luxury_bags.md` (the long
> chronological log) — this file is the **current-state snapshot**.
>
> (NOTE: the prior contents of this file were the leftover FitSole handover from when this repo
> was cloned from fitsole-rebranding — replaced here with the Okhtein state.)

---

## 0 · The standing goal (what we're trying to reach)

**"Make Okhtein a masterpiece — work honestly and verify everything you do."** (active session
/goal). This is an **Awwwards-grade, cinematic 3D website** for the real Egyptian luxury handbag
maison **Okhtein** (أختين = "two sisters", Aya & Mounaz Abdelraouf, Cairo 2013). It is a
scroll-driven walk through a dark, sophisticated atelier/gallery that presents the real bags and
ends on the brand emblem forming. The bar is **Awwwards Site of the Day**, not "good website."

Run under the **awwwards-architect** methodology. Core non-negotiables that keep biting if ignored:
- **The PRODUCT is the verdict.** Bags must read flawless: clean light, no bloom/DOF/saturated
  wash on the product face.
- **Verify on the REAL GPU, on the user's actual tier.** SwiftShader/headless screenshots are
  composition-only (no real bloom/AO). A SAFE-only or STANDARD-only pass is a trap.
- **One knob, one screenshot, one decision.** Don't stack visual edits you can't bisect.
- **Don't theorize a visual bug — PROBE it** (read runtime values, screenshot a frozen frame).
- **Build hardened from frame one** (DPR floor 1.0, idempotent texture setup, no Canvas remount on
  tier change, guard Bloom against NaN).

---

## 1 · Where it lives & how to run

- **Repo:** `E:\master_3D\okhtein` (Next.js 16.2.6 App Router, `output:"export"` static, React 19,
  R3F 9.6, drei 10.7, three 0.184, @react-three/postprocessing, GSAP, Lenis).
- **Sibling:** `E:\master_3D\fitsole-rebranding` (the engine this was reskinned from — see memory
  `project_fitsole_rebranding`). Okhtein no longer contains FitSole content.
- **Build + serve (REQUIRED pattern):**
  ```
  cd E:\master_3D\okhtein
  npm run build            # static export to out/  (clean: TS ok, 0 errors)
  npx serve out -l 5000    # serve the built site; reads out/ from disk per request
  ```
  - `next dev` is **BARRED** (OOMs on this heavy scene). Always build → serve.
  - The serve process reads `out/` per request, so after a rebuild you do NOT need to restart it.
  - Do NOT blanket `Get-Process node | Stop-Process` (it kills other dev servers — gets denied).

- **THE machine has a real NVIDIA RTX 3070 Laptop GPU.** Headed Playwright (`channel:'chrome',
  headless:false, --start-maximized`, then `page.bringToFront()` + real `page.mouse.click()`)
  renders on the REAL GPU → this is how we verify. Auto-tier resolves to **HIGH** here.
  `?debug=1` shows a tier/DPR/fps/scroll overlay. `?tier=high|standard|safe` pins a tier.
  (Note: the user may *view* on a weaker GPU; the preview MCP tab renders unfocused→rAF frozen,
  so it's useless for motion — always use the headed-Playwright harness.)

---

## 2 · Scene architecture (so you know what file does what)

Two WebGL canvases + DOM sections, in page order:
`VaultExperience` (700vh scroll-walk) → `SkyBridge`/`SkyScene` (240vh finale) → `FeaturedUnboxing`
→ `TrustSection` → `CategoryNav` → `AboutSection` → `ProductWalls` → `ShopWall`.

- **`components/vault/VaultExperience.tsx`** — the scroll driver. Lenis + a damped `scrollProgress`
  ref drives both the camera and the DOM overlay. `DWELL_LUT`/`dwellEase` reparametrizes real
  scroll to dwell on the hero + finale beats. Mutual-exclusion logic parks the vault canvas while
  SkyScene renders (the two heavy canvases never co-render). Holds the `scrollRestoration='manual'`
  fix.
- **`components/vault/VaultCanvas.tsx`** — the R3F `<Canvas>` + adaptive tier system
  (`lib/deviceTier.ts`): boots STANDARD, GPU read lifts to HIGH on the RTX, PerformanceMonitor can
  step down. **Canvas is NOT keyed on tier** (avoids the black-frame remount footgun). Bg `#121110`.
- **`components/vault/VaultScene.tsx`** (~1750 lines) — the whole vault: materials, procedural
  textures, lighting rig, IBL, camera/look paths, HeroDisplay, ShowcaseRunway, NicheWalls,
  Mashrabiya, CorridorArches, AtelierWorkbench, TwoSistersFinale, particles, and the EffectComposer.
- **`components/vault/VaultOverlay.tsx`** — the DOM copy beats over the walk.
- **`components/vault/VaultPreloader.tsx`** — the dark "Entering the Atelier" vault-doors preloader.
- **`components/vault/SkyScene.tsx`** + `SkyBridge.tsx` — the "Two sisters. One house." finale (two
  real clutches on a glowing ring + the emblem gateway crest).
- **`components/commerce/`** — QuickView, ProductExaminer (signature 3D bag viewer), ProductCard,
  ShopWall, CartDrawer. **`lib/products.ts`** (real catalog), **`lib/assets.ts`** (GLB paths).

### Critical knowledge for camera/beat work
- **`window.__vaultForce` is a DIRECT CatmullRom curve-param (0–1), bypassing `dwellEase` — NOT raw
  scroll.** With 8 control points the beats sit at p≈idx/7: entrance idx0=0, hero idx3≈0.43,
  wide-arc idx4≈0.571, atelier idx5≈0.714, exit idx6≈0.857, exit idx7=1.0. Set it in the page
  (`window.__vaultForce = x`) to pin any beat for a screenshot.
- The **scrim** (`data-vault-scrim`) fades the vault to near-black (0.82) over p0.965→1.0 for the
  vault→shop hand-off. So the finale 3D mark must read **during the two-sisters beat (p0.80–0.92)**,
  before the scrim — NOT at p≈1.0.
- **Blender `export_yup` gotcha:** a flat mark authored in Blender's XY plane loads LYING FACE-UP
  (its +Z silhouette-normal → glTF +Y). Stand it upright in R3F with
  `<group rotation={[Math.PI/2,0,0]}>`.

---

## 2.5 · LATEST SESSION (2026-06-15) — 9-lens panel loop: the finale CLIMAX was broken, now fixed

Goal: "review as 9 experts (Awwwards/FWA/Motion/CD/Three.js/WebGL/Brand/Cinema/LuxuryAds) → single biggest
improvement → implement → re-evaluate → repeat." Two iterations done, both built clean + verified on the real 3070.

- **Iter 1 — the finale emblem NEVER RENDERED** (unanimous #1). The prior "reads perfectly" was WRONG. Root cause
  (probed, not theorized): **a `MeshStandardMaterial` renders BLACK at the finale group's depth z≈-12.4** (proven 3×,
  incl. a centred control box; basic materials render fine; the atelier GLB works because it's a different rig at
  z-8). Fixes in `VaultScene.tsx TwoSistersFinale`: markMat → **unlit `MeshBasicMaterial`** luminous champagne seal;
  a **finale camera-hold override** in the camera useFrame (`finaleK=smoothstep(p,0.80,0.88)` → cameraPos `(0,1.3,
  -10.7)`, lookTarget `(0,1.24,-12.4)`) holds the mark dead-centre (was overshooting + looking past to z-15);
  convergence retimed `k=(p-0.72)/0.15` (meets p≈0.87, during its headline); halo plane 0.16→0.08; Bloom thr
  0.96→0.90. The two halves now visibly converge → complete the mark → ignite → hold.
- **Iter 2 — forge the mark + resolve two endings** (re-eval said it read flat/sticker, no peak, twin endings):
  baked a champagne **vertex-colour gradient** into `emblemHalfGeo` (dimension), **ignition tint** `0.8+k²·1.7`,
  a **glint sweep** (glintRef, rakes L→R p0.74→0.90), a **ground pool**; and SkyBridge headline "Two sisters.
  One house." → **"Carry the bond."** (product CODA, not a twin of the vault's "one mark").
- **HONEST LIMITATION**: the mark is a luminous SEAL (faked dimension/glint), NOT raytraced metal — std material is
  black at that depth (unexplained). Reads well; true metal would need cracking that or relocating the finale.
- **Iter 3 — re-hero the product** (user-chosen next lever): the 3D hero bag read small/muddy + lost to the flat
  catalog photo. In `HeroDisplay`: bag `normalizeTo` 1.0→**1.22** (commands the frame; 1.35 clipped the handle at
  the p0.46 FOV-push peak), envMapIntensity 2.4→**3.0** (gleam), and **tamed the hot halo ring** (useFrame
  `1.4+hero*1.0 → 0.85+hero*0.6`, opacity 0.85→0.7) that was eating the bag's base. Now dominant + gleaming + clean.
- **Iter 4 — dark-beats exposure/grade lift**: atelier/promenade read muddy (products sinking into black). Split
  the promenade/hero ambient branch (hero keeps its drama); promenade ambient ti 0.36→**0.46**, atelier 0.3→**0.42**;
  niche picture-light `nicheGlowMat` emissive 0.66→**0.95** (free) so niche bags backlight + separate from black.
  Promenade now reads "brass & light"; entrance incidentally improved. Hero + finale unregressed.
- **CINEMATIC WAVE (SOTD loop, 2026-06-15)** — all built clean, CONSOLE 0, real-3070 verified: finale **dwell**
  (DWELL_LUT gaussian 0.95→0.88, camera lingers on the mark); SkyScene **luxury relight** (cold rim 58→26 etc.,
  intimate salon not sports-arena); camera **arc-length** (`getPoint`→`getPointAt` = even cinematic speed) +
  coupled gaussian re-tune (hero→0.368). True-metal finale CONCLUDED (std mat black at z-12.4, 4× proven → keep the
  seal). New: `scripts/_scrollcine.mjs` (slow-scroll velocity harness via `window.__progress` hook), `_arclen.mjs`.
- **WAVE 2 (SOTD loop)** — 6-lens re-score + a CRITICAL correction: jurors claimed the bags render as grey
  `PlaceholderBag`; a `[GLB-LOADED]` runtime probe PROVED all 10 GLBs load (0 errors) — they MISREAD the cool/over-
  desaturated materials as placeholders. Real root cause = products read pewter not champagne → global desaturation
  `-0.14 → -0.11` (both composers), verified richer-not-orange. Warmth/orange balance is a USER taste call.
- **REMAINING levers (ranked): (-1) finale emblem flat "PowerPoint glyph" → ✅ RESOLVED 2026-06-16 (Masterpiece
  Wave 1).** The "std-material-black-at-z-12.4" was a pre-HDRI artifact, not a hard block — see the top LATEST
  note; the mark is now a hybrid `MeshPhysicalMaterial` cast-metal that ignites via a driven key flare. Open
  sub-item: ignite brightness is a USER taste call. **(0a) 03_widearc beat
  scored 3/10 by ALL lenses** (broken in-between; re-key or cut); **(0) live hero floor reflection** (deferred from wave 1 — opaque floor
  needs transparent refactor + mirrored GLB, high-tier); **(1) promenade differentiation** (still tiled/symmetric — vary each arch,
  break the mirror); **(2) atelier emblem richness + bench/tools**; **(3) bag-model↔SKU identity** — the 3D hero is
  a different real bag than its "Palmette Hexagon Minaudière" label (needs the user to map GLB→SKU); **(4) true-metal
  finale** (blocked by std-material-black-at-z-12.4); plus the old finale-canvas first-compile freeze + commit/deploy
  (git still 0 commits). TASTE calls are the USER's (champagne tone, ignition brightness, hero scale) — their eyes
  on `:5000` are the binding constraint.
- New harnesses: `scripts/_panel_capture.mjs` (full-site sweep, sharp-downscaled to 1400px), `_finale_micro.mjs`,
  `_finprobe.mjs` (reads camera/mark NDC at finale), `_iter1check.mjs`. Shots in `.shots-panel/`, `.shots-iter1/`,
  `.shots-iter2/`.

## 3 · WHAT WE DID THE PRIOR SESSION (all done, built clean, verified on the real 3070)

The user gave 5 screenshots + the real Okhtein logo (.avif) and 3 asks. All three are complete.

### A · TOTAL REBRAND — killed the gold/orange FitSole vibe → dark charcoal + pale champagne
The whole site still read as warm FitSole gold/orange. Retoned **everything** to a sophisticated
near-monochrome dark-stone palette with a refined **pale champagne** metal accent (matches the dark,
minimal logo). Single biggest lever: a **global `HueSaturation saturation 0 → −0.14`** in BOTH
EffectComposers (`VaultScene` + `SkyScene`), plus Bloom int 0.5→0.32 / threshold 0.95→0.96.
- Every warm light recoloured to near-neutral (`#FFE3B8`/`#FFE8C6`/`#FFD79A`… → `#F2EDE3`/`#EFE8DA`/
  `#E6DECE`…); brass `#D9B775→#CABF9E`; brushed-brass canvas gradient, mashrabiya lattice, and ALL
  halos/rings/glows (`makeGlowTexture` orange→neutral) cooled; stone textures warm→greige; fog/bg →
  `#121110`.
- DOM `app/globals.css` `@theme`: `--color-vault-gold #BFA06A → #C7BCA3` (champagne), scan/green/
  surfaces cooled; 24 hardcoded warm rgba triplets (191,160,106 / 201,163,106 / 217,184,107) →
  champagne. `ProductExaminer`, `PlaceholderBag`, `lib/products.ts ACCENT` cooled too.

### B · REAL OKHTEIN EMBLEM (Blender) replaces the two chevron "arrowheads"
The real logo ornament is **NOT chevrons** — it's a horizontal **spear bar with double-lozenge
(diamond) finials at each end + a small centre node** (derived by ASCII-rendering the .avif alpha).
- Authored in Blender 5.1: **`scripts/_emblem.py`** → **`public/models/okhtein/okhtein_emblem.glb`**
  (36KB; bmesh, NO booleans, bevel modifier, champagne PBR, `export_yup`; also renders an ortho QA
  preview to `scripts/.emblem_preview.png`).
- `lib/assets.ts`: new `emblem` key (+ `arrowheadClasp` alias → same GLB).
- Wired everywhere the old chevrons were:
  - **Atelier clasp** — the GLB via `ModelOrFallback`, upright wrapper, `normalizeTo 0.82`,
    procedural `emblemGeo()` fallback in VaultScene.
  - **Vault finale (`TwoSistersFinale`)** — NEW `emblemHalfGeo()` (the left half, seam at local
    x=0). Two halves slide together (`spread = 0.62*(1−k)`, `k=(p−0.72)/0.20`) and **complete the
    real mark**, on a dedicated `markMat` whose emissive **ignites at the meet**
    (`0.6 + k²*1.6`). Group moved to **z-12.4** (onto the camera's actual gaze at the beat — it was
    at z-14.6 where the camera only points at the scrimmed p≈1.0), and the additive halo shrunk to
    1.9×1.15 @0.16 (the big halo had washed the whole frame grey).
  - **SkyScene** — `skyArrowGeo` rebuilt as the emblem crest.
  - Copy fixed: "Two arrowheads, one house" → **"Two sisters, one mark"** ("the emblem is set").

### C · The "critical auto-transition" bug
Diagnosed by reproducing on the real GPU: a truly-fresh, no-scroll load is **stable** — so nothing
auto-animates. The "auto-turn to a worse state" was the **dark elegant preloader auto-revealing into
the warm gold vault** (i.e. the SAME problem as the gold/orange complaint → the rebrand fixes it: the
revealed scene now matches the dark preloader). Plus the browser was **restoring scroll position on
refresh** (dropping you mid-walk). Fixed in `VaultExperience` mount effect:
`history.scrollRestoration='manual'` + `scrollTo(0,0)` when no URL hash → a refresh restarts the
cinematic at the entrance (verified scrollY 1018 → 0 on reload).

**Verification:** every beat captured on the real RTX 3070, 0 console errors. Entrance/promenade/
hero now read as a dark champagne gallery; atelier shows the real emblem; the finale's two glowing
halves converge into the complete glowing emblem; SkyScene ring is pale champagne; DOM is dark+
champagne. Screenshots in `.shots-rebrand/`, `.shots-emblem/`, `.shots-fsweep/`, `.shots-sky/`.

---

## 4 · OPEN / NEXT-STEP ITEMS (nothing blocking; pick up here)

1. **Get the user's eyes on it.** This is the binding constraint — the model can't see motion. Have
   the user scroll the live site (`:5000`) on their panel and react, especially: the entrance reveal
   (preloader→scene continuity), the atelier emblem, and the finale convergence/ignite. Their taste
   call decides the next iteration.
2. **Champagne tuning is a fork worth confirming.** I chose a refined **pale champagne** brass
   (keeps Okhtein's brass-craft identity, just not orange). If the user wants it cooler/more
   **silver-pewter** (the logo ornament reads quite pale), it's a small set of one-token tweaks:
   `brassMat`/`brassMetalMat`/`markMat` colors + the brushed-brass gradient + `--color-vault-gold`.
3. **Finale ignite brightness** — at the meet the emblem flares quite bright (intentional payoff);
   confirm it's not too blown for taste. Lever: `markMat.emissiveIntensity = 0.6 + k²*1.6` and Bloom.
4. **Atelier emblem floats slightly above its stand** — reads as an intentional "presented" display,
   but could be seated closer if the user prefers (lower the `claspRef` group y, ~1.62 → ~1.5).
5. **Dead code (harmless, optional prune):** old `scripts/_arrowhead.py` + `arrowhead_clasp.glb` and
   the now-unused `arrowheadGeo()` in VaultScene (the DOM still has subtle arrowhead SVG watermarks —
   "arrowhead" is still part of the brand language, left intentionally).
6. **Real bag GLBs:** 4 real optimized bags are already in `public/models/okhtein/`
   (`bag_designer`/`bag_luxury`/`bag_gold_clutch`/`bag_glitter` + `shelf_*`). `PlaceholderBag`
   renders if any is missing.
7. **Longer-standing (from prior passes):** AR/RTL bilingual pass; the one-time finale-canvas
   first-compile freeze (cold-mount of SkyScene — scoped fix is "eager-mount + warm SkyScene behind
   the vault preloader", not yet done, a load/risk tradeoff); commit + deploy (git has no commits
   yet; deploy = GH Pages static export under `/okhtein` base path with 0 asset 404s).

---

## 5 · Dev harnesses (all in `scripts/`, dev-only, headed real-GPU)

| script | what it captures |
|---|---|
| `_freshcheck.mjs` | fresh-load (no scroll over time) + scroll-restoration repro |
| `_tiercompare.mjs` | STANDARD vs HIGH at the same beats (isolates the tier delta) |
| `_rebrandcheck.mjs` | every vault beat + SkyScene (the rebrand verification sweep) |
| `_emblem.py` | (Blender) authors the emblem GLB + ortho preview |
| `_emblemcheck.mjs` | atelier emblem + finale + sky crest |
| `_finalesweep.mjs` | finale p-sweep (locate/tune the converging mark) |
| `_skyonly.mjs` | SkyScene finale at a fixed 1440×810 viewport |
| `_scrollrestore.mjs` | confirms refresh restarts at the entrance |

Run: `cd E:\master_3D\okhtein && node scripts/<name>.mjs`. Output lands in `.shots-*` dirs.
**Headed-maximized screenshots can exceed the 2000px image-read cap** — downscale with `sharp`
(`.resize(1280,null,{fit:'inside'})`) before reading, or use a fixed viewport like `_skyonly`.

---

## 6 · Quick "is it still good?" checklist for the new session
1. `npm run build` → clean (TS, 0 errors).
2. Confirm `npx serve out -l 5000` is up (or start it).
3. `node scripts/_rebrandcheck.mjs` → entrance/promenade/hero/atelier all dark champagne, NO orange.
4. `node scripts/_emblemcheck.mjs` → atelier shows the double-lozenge emblem; CONSOLE_ERRORS 0.
5. `node scripts/_finalesweep.mjs` → f_88 = two glowing halves; f_92 = the complete emblem.
6. Then get the user's eyes on the live site and iterate on taste.
