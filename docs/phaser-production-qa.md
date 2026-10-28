# Phaser production integration · 2026-10-29

Production uses its existing party, inventory, stats, MP, mastery, story and save key. The Phaser Scene is a presentation adapter; the original progression engine remains authoritative. Previewed actions leave state untouched, and impact commits them once. Leaving combat or retreat invalidates uncommitted attacks.

- Root regression/integration suite: 71 passed.
- Standalone prototype suite: 15 passed.
- Embedded Chromium: 320×640, 360×740 and 390×844; one canvas, no page overflow or clipped command buttons.
- Played the existing story, purchased the first companion, placed her in the rear alone, and verified front exposure in the display. Bought a healer, mage and archer using earned currency; their real jobs, material palettes, stats and MP rendered correctly.
- Reloaded and continued the resulting save without changing its owned heroes or progress.
- Verified autonomous wins, gold and experience, multiple regions and a second world cycle. Same-region waves reuse the Phaser context and textures; old contexts are explicitly released when the view is destroyed.
- A same-action commander heal initially caused an incorrect visual death before the damage projection was corrected. The final projection reconstructs the pre-impact target resources from the authoritative result and is regression-tested. No warnings/errors were recorded after the corrected build was reloaded.
- Rear-only parties lose protection and ranged positioning bonuses. Their saved formation is retained, while their live display advances to the front. Falling front ranks are not revived by ordinary healing.
- Face width references are derived from visible skin, with a strict second pass to reject warm blonde hair. Foot centroids ignore transparent margins and disconnected edge fragments. Existing immutable material palettes and portrait fades remain in place.

The original checkout's unfinished preset/economy/city changes remain untouched. This release contains the Phaser integration and formation/size corrections. Physical Android-device thermal and battery profiling has not been performed.
