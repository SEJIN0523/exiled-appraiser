// Phaser 3.90 killAll destroys tweens but intentionally preserves manager.paused.
// Hitstop cancellation must restore the manager before a new encounter can animate.
export function resetAnimations(manager,waiters){manager.killAll();manager.resumeAll();for(const done of [...waiters])done();waiters.clear();}
