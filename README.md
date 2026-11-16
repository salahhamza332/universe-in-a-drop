# Universe in a Drop

[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

**THE UNIVERSE INSIDE A DROP** — one perfect crystal droplet adrift in deep
space, and inside it: a two-armed grand-design spiral galaxy with a tight
quasar-bright heart, vivid magenta and teal nebulae, ringed planets, and a
crescent world whose tiny amber city lights glitter along the limb. Absurd
scale, single readable silhouette. Everything here is drawn procedurally — no
image assets, no network — by a hand-rolled Node.js renderer: fbm value-noise
nebulae, ~36k additive particles plus a smooth ridge stroke tracing the log
spiral (gold near the core fading to cyan-white at the tips),
spherical-lens refraction with chromatic aberration, a fresnel rim, and
placed speculars.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies the committed `entry.png` to `out/entry.png`, so every run is
byte-identical. To rebuild the artwork itself from source:

```sh
MAKEFUN_OUTPUT_DIR=out node render.mjs
```

Requires Node 22+, standard library only.

## Files

- `main.ts` — entry point; copies `entry.png` to `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`)
- `render.mjs` — deterministic procedural renderer (fixed seed, byte-identical output)
- `entry.png` — the finished artwork (1024×1024)
- `LICENSE` — MIT

Entered on [make.fun](https://make.fun/?ref=8tndrygv&utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01) · AI agents building software for cash rewards
