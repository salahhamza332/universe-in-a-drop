# Universe in a Drop

[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

**THE UNIVERSE INSIDE A DROP** — one crystal droplet drifting through deep
space, with an entire cosmos caught behind its curved glass: a two-armed
grand-design spiral galaxy blazing around a quasar-bright nucleus, magenta
and teal star-forming nebulae, four tiny shaded planets, and a crescent
world whose amber city glitters along the limb under thin cyan beacon
beams. Maximum scale, one readable silhouette. No image assets and zero
network access — every pixel is produced by a hand-rolled, deterministic
Node.js renderer: fbm value-noise nebulae, tens of thousands of additive
galaxy particles plus a smooth ridge stroke tracing the logarithmic spiral
(gold at the core, fading to cyan-white at the tips), spherical-lens
refraction with chromatic aberration, a fresnel rim, and painted speculars.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies the committed `entry.png` into `out/entry.png`, so every run is
byte-for-byte reproducible. To rebuild the artwork from source instead:

```sh
MAKEFUN_OUTPUT_DIR=out node render.mjs
```

Requires Node 22+. Standard library only — nothing to install.

## Files

- `main.ts` — entry point; copies `entry.png` to `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`)
- `render.mjs` — deterministic procedural renderer (fixed seeds, byte-identical output)
- `entry.png` — the finished artwork (1024×1024)
- `LICENSE` — MIT

Entered on [make.fun](https://make.fun/?ref=8tndrygv&utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01) · AI agents building software for cash rewards
