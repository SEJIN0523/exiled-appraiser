# Verification

- Prototype checks: 12 tests pass; production baseline: 58 tests pass.
- Embedded Chromium portrait viewports: 320×640, 360×740, 390×844 CSS px. No body/page scrolling or clipped combat controls in these sizes.
- 320px formation dialog: eight slots and seven candidates fit without vertical scrolling. Switching selected hero from Nia to Viola preserved the whole formation until confirmation.
- Browser encounter completed autonomously: melee 16, ranged 7, magic 13, healing 5, heavy actions 12 in the initial run.
- With rear targeting enabled for the enemy caster, a later run recorded rear protection twice before retreat.
- Retreat cleared active effects to zero and target health remained unchanged afterward. Rapid retreat → retry returned all actors to full encounter health and resumed automatic combat.
- Browser console: no errors during tested encounters.
- Existing static character images remain pixel art; this experiment evaluates animation by Tween/effects rather than changing the underlying illustration style.
- Android physical-device/GPU/thermal validation is still pending.

Screenshots: [390px battle](battle-390.png), [320px battle](battle-320.png).
