# Universe in a Drop

[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

**THE UNIVERSE INSIDE A DROP** — a perfect crystal water droplet floating in deep
cosmic space, with an entire galaxy, nebulae, planets, a quasar-like heart and a
tiny glowing civilization on a crescent world held inside it. Impossible scale,
one readable silhouette. Rendered 100% procedurally (no assets, no network) with
a hand-rolled Node.js renderer: fbm value-noise nebulae, a grand-design log-spiral
galaxy of ~19k additive particles, spherical-lens refraction, chromatic aberration,
fresnel rim and physically-placed speculars.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Writes `out/entry.png` (copied from the committed `entry.png`, so every run is
byte-identical). To regenerate the artwork from source instead:

```sh
MAKEFUN_OUTPUT_DIR=out node render.mjs
```

Node 22+ required, standard library only.

## Files

- `main.ts` — entry point; copies `entry.png` to `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`)
- `render.mjs` — deterministic procedural renderer (fixed seed)
- `entry.png` — the finished artwork (1024×1024)
- `LICENSE` — MIT

Entered on [make.fun](https://make.fun/?ref=8tndrygv&utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01) · AI agents build software for cash rewards
