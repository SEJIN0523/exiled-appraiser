# Phaser one-frame battle prototype

This directory is an isolated rendering experiment on `prototype/phaser-battle`, based on production commit `00c3801`. It neither imports the production engine nor reads/writes its local storage. The original prototype branch left the production entry point, service worker, GitHub Pages configuration and `main` unchanged. The later `integrate/phaser-production` integration adds a separate production adapter while this standalone prototype remains independent. Unfinished work in the original checkout is preserved separately.

## Run

Requires Node.js 24+. The pinned Phaser 3.90.0 runtime and its MIT license are vendored, so running requires no package download or CDN.

```powershell
cd prototype/phaser
npm start
```

Open http://127.0.0.1:5180/ . Alternatively open `/prototype/phaser/index.html` through any static HTTP server serving the repository root. ES modules require HTTP; double-clicking the file is unsupported.

```powershell
npm run check
npm test
```

## What to review

- Portrait viewport: 320×640, 360×740 and 390×844 CSS pixels, no vertical page scrolling.
- Left allies and right enemies; each side has four front and four rear foot anchors. Up to five of seven playable actors deploy at once.
- Pre-battle formation explicitly separates slot selection, hero selection and confirmation. Selecting a different hero does not silently move the previous one. Assigning into an occupied slot swaps deployed heroes or replaces a deployed hero with a reserve.
- Attacks, spells, healing, MP regeneration and initiative are autonomous. During battle, the only player actions are three tactics and retreat.
- Melee approaches the target, strikes and returns. Arrows are tweened projectiles. Magic uses an elliptical ground circle, orb trail and particle burst.
- Damage resolves at visual impact, once per event. White tint, knockback, shake, critical/normal damage numbers and a 75ms strong-hit freeze make the hit readable.
- Living front ranks block melee access to the rear. Rear ranged/magic attacks deal 15% extra damage; rear targets take 20% less damage while a front remains. Rear melee attacks lose 20% damage.
- Retreat cancels the pending combat event, tweens, particles and camera effects; there is no residual damage. The result reports actual resolved action counts.
- `prefers-reduced-motion` reduces idle movement, particle counts and strong-hit shake. Rendering is capped at 60 updates per second; the footer measures Scene updates, not the monitor's RAF rate.

## Art and foot anchoring

Existing 3/4-facing static WebP art is reused; no animation frame sheets or new illustrations are generated. `prepare-assets.py` copies ten originals and one background, then finds meaningful alpha bounds and the bottom foot centroid. Small disconnected sheet-edge fragments are excluded from bounds. `assets/metadata.json` records original source paths, visible bounds, foot coordinates and authored face-width references for the seven heroes.

Each Phaser texture has one `body` frame. The image origin is computed from its foot coordinate within that frame. The ground shadow is a separate object anchored to the battlefield, so idle bobbing does not move the shadow. Heroes use face-width-based sizing with viewport safety limits; monsters use normalized visible body height. Depth follows the ground Y coordinate. This makes a future non-pixel illustrated character drop-in require only a static image and metadata, without changing combat animation code.

## Architecture and limits

- `battle-model.js`: deterministic pure battle state, formation, targeting, MP, tactics and impact resolution.
- `battle-scene.js`: Phaser Scene, frame origins, tweens, effects, particle lifetimes, hitstop, cancellation and responsive layout.
- `effects-lifecycle.js`: safely resets the paused TweenManager and settles cancelled animation awaiters.
- `app.js`: accessible HTML commands, pre-battle formation and results. There are no manual attack/skill buttons.
- `server.mjs`: loopback-only static preview.

The encounter is a fixed three-enemy forest test. It is a presentation prototype, not a replacement for production progression, inventory, stories or save migration. Real Android hardware and thermal/battery profiling remain to be performed; desktop embedded-browser FPS is not an Android performance guarantee. Existing art still has the original pixel-art treatment: this prototype changes the animation method, not the art direction.

Phaser API references: [Tweens](https://docs.phaser.io/api-documentation/3.90.0/class/tweens-tweenmanager), [ParticleEmitter](https://docs.phaser.io/api-documentation/3.90.0/class/gameobjects-particles-particleemitter), [Camera shake](https://docs.phaser.io/api-documentation/3.90.0/class/cameras-scene2d-effects-shake).
