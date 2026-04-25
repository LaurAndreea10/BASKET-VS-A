# 🏀 Basket vs AI

A browser-based basketball arcade game with career progression, AI opponent, match settings, upgrades, achievements, competitions, and responsive controls for desktop and mobile.

## 🔗 Live Demo

Main version:

https://laurandreea10.github.io/BASKET-VS-AI/

Enhanced Pro version:

https://laurandreea10.github.io/BASKET-VS-AI/enhanced.html

## ✨ Highlights

- Fast arcade basketball gameplay against an AI opponent
- Enhanced Pro gameplay with separate aim and power control
- Bank shots with backboard bounce and bonus scoring
- Anti-stuck recovery for dead balls and rim-hit situations
- Wind indicator and wind drift in Chaos / PRO-style matches
- Perfect shot assist track with weak, good, perfect, and strong zones
- Live ball speed, combo, perfect-shot, rim-hit, and bank-shot stats
- Career progression with XP, cash, fans, upgrades, levels, and achievements
- Hub tabs for Career, Shop, Leaderboard, and Competitions
- Tournament, League, and Daily Challenge flows
- Bilingual RO/EN UI and optional Web Audio sound effects
- Responsive single-page experience hosted on GitHub Pages

## ✅ Latest Improvements

- Rebuilt `enhanced.html` as an Enhanced Pro version that combines the existing Enhanced page with key mechanics from `BASKET-VS-AI-PRO`
- Added aim control separated from the power meter using keyboard controls, touch buttons, and an aim slider
- Added bank-shot physics, backboard bounce, rim-hit tracking, anti-stuck recovery, and ball speed display
- Added wind system and visible wind indicator for Chaos / higher difficulty gameplay
- Added a perfect-shot assist track to make timing clearer on desktop and mobile
- Expanded career stats with perfect shots, rim hits, bank shots, and best combo
- Added hub tabs for Career, Shop, Leaderboard, and Competitions
- Added tournament, league, and daily challenge competition loops
- Added bilingual RO/EN translations for the new UI and optional generated sound effects
- Kept the same localStorage key (`basket-vs-ai-enhanced-career`) so existing Enhanced saves migrate forward

## 🎮 Controls

### Desktop

- Use **A / D** or **← / →** to aim
- Hold **Space** or click/tap **SHOOT** to charge power
- Release near the gold zone for a perfect shot
- Use wider aim angles or Bank Lab mode to attempt bank shots

### Mobile

- Use the aim slider or left/right aim buttons
- Hold **SHOOT** to charge power
- Release near the gold zone for a perfect shot
- Bank shots can bounce from the backboard for bonus points

## 🏆 Competitions

- **Tournament:** win 3 matches in a row for a cash and XP trophy bonus
- **League:** earn points every match and climb league tiers
- **Daily Challenge:** score 12+ points with at least one bank shot for a daily reward

## 🛠 Technologies

- HTML5
- CSS3
- JavaScript
- Canvas API
- Web Audio API
- Local storage for career progress
- GitHub Pages

## 📁 Project Structure

```text
BASKET-VS-AI/
├── index.html      # Original full game page
├── enhanced.html   # Enhanced Pro game page
├── styles.css      # Enhanced Pro responsive styling
├── script.js       # Enhanced Pro gameplay, career, shop, leaderboard, competitions
└── README.md       # Project documentation and changelog
```

## 🚀 Deployment

The project is published with GitHub Pages from the `main` branch.

## 👤 Author

**Laura Andreea**
