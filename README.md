# The Adaptive Mindscape — Project Mirror

A wellness companion that meets you where you are. Not a medical tool.

## Local development

**Requirements:** Node.js 18 or higher ([nodejs.org](https://nodejs.org))

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev

# 3. Open http://localhost:5173 in your browser
```

## Project structure

```
src/
├── main.jsx        # React entry point
├── index.css       # Global reset styles
├── data.js         # Conditions, crisis lines, affirmations
├── db.js           # Data layer (localStorage → Supabase)
└── App.jsx         # All screens, hooks, components
```

## Adding the Supabase backend

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `project-mirror-schema.sql` in the Supabase SQL editor
3. Copy your Project URL and anon key from Settings → API
4. Create a `.env` file (copy from `.env.example`) and fill in the values
5. Install the Supabase client: `npm install @supabase/supabase-js`
6. In `src/db.js`, uncomment the import lines and replace `LS.push(...)` calls with `supabase.from(...).insert(...)` as shown in the comments

## Deployment (Vercel)

See `DEPLOYMENT_GUIDE.md` for step-by-step instructions.

## Games status

| Condition | Game | Status |
|---|---|---|
| Anxiety | Fog Lantern | 🚧 Building next |
| Depression | Deep Sea Glow | 🚧 Planned |
| Stress | Glass Storm | ✅ Live |
| Fear | The Lighthouse | 🚧 Planned |
| Tension | The Coil | 🚧 Planned |
| I Don't Know | The Signal | ✅ Live (routing) |

## Disclaimer

This is a wellness tool in active development. It is not a replacement for professional mental health care. Anonymous behavioral data is collected to improve the product. No personal information is stored.
