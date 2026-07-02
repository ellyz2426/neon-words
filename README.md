# Neon Words VR

A holographic word search puzzle game for VR and browser. Find hidden words in neon-lit letter grids across 8 game modes and 3 difficulty levels.

**[Play Now](https://ellyz2426.github.io/neon-words/)**

## Gameplay

Explore a holodeck arena filled with glowing letter grids. Drag across letters to find hidden words before time runs out. Build combos for massive score multipliers.

### Game Modes
1. **Classic** - Find all words, no time limit
2. **Timed** - Beat the clock (60-90s based on difficulty)
3. **Race** - Find all words as fast as possible
4. **Category** - Words from a single category
5. **Daily Challenge** - Date-seeded grid, same for everyone
6. **Zen** - Relaxed play, no pressure
7. **Marathon** - Sequential grids with bonuses, 5-minute timer
8. **Practice** - Learn the ropes with free hints

### Difficulty
- **Easy** - 8x8 grid, 6 words, horizontal/vertical only
- **Medium** - 10x10 grid, 8 words, adds diagonals
- **Hard** - 12x12 grid, 10 words, all 8 directions

## Controls

| Action | Browser | VR |
|--------|---------|-----|
| Select word | Click + drag | Right trigger + point |
| Pause | ESC or P | B button (right) |
| Hint | H | Y button (left) |
| Rematch | R | A button (right) |

## Features

- **200 words** across 8 categories (Animals, Space, Food, Tech, Colors, Sports, Music, Nature)
- **40 achievements** with persistent tracking
- **8 letter skins** with gameplay-gated unlocks
- **5 holodeck themes** (Neon, Crimson, Toxic, Ultra Violet, Solar Blaze)
- **XP/Level progression** (50 levels)
- **Combo system** (up to x5 multiplier, 10s decay)
- **Career stats**, top 20 leaderboard, daily streaks
- **Procedural audio** (12+ SFX + ambient drone)
- **15 PanelUI spatial panels** (zero HTML DOM)
- **Canvas-textured 3D grid** with UV raycasting
- **150-particle pool** for word-found celebrations
- localStorage persistence for all progress

## Tech

- [IWSDK](https://iwsdk.dev) 0.4.0 (WebXR)
- ECS architecture (GameSystem, GameUISystem)
- PanelUI/uikitml spatial UI compiled via Vite plugin
- Seeded PRNG for reproducible daily challenges
- Dual VR + browser runtime
