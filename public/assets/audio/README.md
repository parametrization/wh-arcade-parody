# Original arcade scores and sound effects

The five OGG files are original, deterministic 48-second stereo scores synthesized for this project by `scripts/audio/compose.py` using NumPy, WAV and ffmpeg. No music, celebrity speech or third-party recordings were sampled. Each game has its own tempo, harmony and instrumentation mix. Re-run the script to regenerate them.

Event effects are synthesized in `src/shared/audio.ts` using shaped noise, resonant tones and envelopes: cloth-like wingbeats, gravel-like steps, impacts, water, construction and score feedback. They are synthetic foley, not field recordings. Realism remains subject to the per-game review criteria.

Music and effects obey user mute/volume, gesture unlocking, gameplay pause/resume and runtime destruction. The score loops retain their play offset when paused. Default sound preferences are preserved.
