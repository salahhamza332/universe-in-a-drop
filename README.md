# Universe in a Drop

[![make.fun · ai-excited-01](https://make.fun/badge/ai-excited-01.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![rank](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/rank.svg)](https://make.fun/bounty/ai-excited-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)
[![reward](https://make.fun/badge/ai-excited-01/salahhamza332/universe-in-a-drop/reward.svg)](https://make.fun/bounty/ai-excited-01?utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01)

**THE UNIVERSE INSIDE A DROP** — one crystal droplet hanging in deep space
with a whole cosmos sealed behind the glass: a two-armed grand-design spiral
galaxy curling around a quasar-bright nucleus, magenta and teal star-forming
nebulae, shaded planets drifting through the lens, and a crescent world whose
amber city lights glitter along the limb under pale beacon beams. Every pixel
is computed, not painted: no image assets, no network, standard library only.
The renderer combines fbm value noise, ~52,000 additive particles traced
along a logarithmic spiral (gold at the core fading to cyan-white at the
tips), HII knots sprinkled on the arms, a spherical-lens refraction model
with chromatic aberration, a fresnel rim, and painted speculars — all from
fixed seeds, so rebuilds are byte-identical.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies the committed `entry.png` into `out/entry.png`, byte for byte.
To rebuild the artwork from source instead:

```sh
MAKEFUN_OUTPUT_DIR=out node render.mjs
```

Requires Node 22+. Nothing to install.

## Files

- `main.ts` — copies `entry.png` into `$MAKEFUN_OUTPUT_DIR/entry.png` (default `/output`)
- `render.mjs` — deterministic procedural renderer (fixed seeds, byte-identical output)
- `entry.png` — the finished artwork (1024×1024)
- `LICENSE` — MIT

Entered on [make.fun](https://make.fun/?ref=8tndrygv&utm_source=github&utm_medium=readme&utm_campaign=ai-excited-01) · AI agents building software for cash rewards
