# ETF Portfolio Rebalancer — Web Tool

## What is this?

This is a free website tool that helps people figure out how to rebalance their ETF investments. You type in what you currently own, pick how you want it split up, and the tool tells you exactly what to buy or sell.

**Why does this make money?** Finance tools like this earn some of the highest Google ad rates on the internet — up to $50 per 1,000 visitors. People searching "how to rebalance my ETF portfolio" are actively thinking about money, which makes advertisers pay more to reach them.

---

## The files, explained simply

Think of building a website like building a house:

| File | What it is | What it does |
| ---- | ---------- | ------------ |
| `index.html` | The blueprint | Lists every section and button on the page — structure only |
| `style.css` | The paint and furniture | Controls colors, fonts, spacing — makes it look good |
| `calc.js` | The math brain | Does all the calculations — no screen, just numbers |
| `main.js` | The electrician | Makes buttons work and shows results when you click them |
| `test.js` | A spell-checker for math | Runs 26 checks to confirm `calc.js` is doing the right thing |

---

## How to run it on your computer

You don't need to install anything. Just open a terminal in this folder and run:

```bash
python3 -m http.server 8795
```

Then open your browser and go to: **http://localhost:8795**

That's it. You should see the tool running.

---

## How the tool works, step by step

1. **User fills in their holdings** — a table where they type in each ETF symbol and how much it's worth
2. **User picks a target allocation** — either a preset (like SCHD 60% / VIG 30% / JEPI 10%) or custom percentages
3. **They click Calculate** — the tool runs the math in `calc.js` and shows:
   - Two donut charts (current allocation vs target)
   - A table of what to buy or sell, and for how much
   - A FIRE progress section showing years to financial independence
4. **Email capture** appears at the bottom — this is how you build a mailing list for future paid features

---

## Common changes you'll want to make

### Change the default holdings when the page loads

Open `main.js` and find this section near the top:

```javascript
addHoldingsRow("SCHD", 60000);
addHoldingsRow("VIG",  30000);
addHoldingsRow("JEPI", 10000);
```

Change the symbol and dollar amounts to whatever you want as the default example. These are the values that show up when someone first visits the page.

---

### Add a new preset allocation

Open `calc.js` and find the `PRESETS` object at the top:

```javascript
const PRESETS = {
  "SCHD / VIG / JEPI": { SCHD: 0.60, VIG: 0.30, JEPI: 0.10 },
  ...
};
```

Add a new line with your preset name and allocations. The numbers must add up to 1.0 (which means 100%).

Example — adding a Bogle Three-Fund portfolio:

```javascript
"Bogle Three-Fund": { VTI: 0.60, VXUS: 0.20, BND: 0.20 },
```

The button for it will appear automatically — you don't need to touch any other file.

---

### Add a dividend yield for a new ETF

Open `main.js` and find `YIELD_TABLE` near the top:

```javascript
const YIELD_TABLE = {
  SCHD: 0.035, VIG: 0.018, JEPI: 0.080,
  ...
};
```

Add your ETF's symbol and its approximate trailing yield as a decimal. For example, `VYM` at 3.1% yield would be:

```javascript
VYM: 0.031,
```

You can look up a fund's current yield on ETF.com or Morningstar. Update this once a quarter when yields change.

---

### Change the page title or SEO description

Open `index.html`. Near the very top you'll see:

```html
<title>Free ETF Portfolio Rebalancer | Calculate How to Rebalance</title>
<meta name="description" content="Free ETF portfolio rebalancer..." />
```

Change the title and description to test different wording. The title is what shows up in Google search results. The description is the two lines of text below the title. Keep both short and include the words your users are actually searching for.

---

### Swap in your real AdSense slot IDs

Open `index.html` and search for `SLOT_ID_HERE`. There are three of them on the page (top, middle, bottom). Replace each one with a real ad slot ID from your Google AdSense dashboard.

**How to get a slot ID:**
1. Log into adsense.google.com
2. Go to Ads → By ad unit → Display ads
3. Create a new ad unit, give it a name (like "ETF Rebalancer Top")
4. Copy the slot ID (it looks like a 10-digit number)
5. Paste it in place of `SLOT_ID_HERE`

---

### Change the hero colors

Open `style.css`. At the very top is a block of color variables:

```css
:root {
  --navy:      #1E3A5F;
  --navy-dark: #132843;
  --blue:      #2563EB;
  --green:     #10B981;
  ...
}
```

These are like paint cans. Change `--navy` and `--navy-dark` to change the header color. Change `--green` to change the BUY badge and FIRE progress bar color. Every color on the site is controlled from this one block.

You can use any hex color picker (just Google "color picker") to find new values.

---

### Update the GitHub link

Open `index.html` and find the "Automate This" section at the bottom:

```html
<a href="https://github.com/YOURUSERNAME/alpaca-rebalancer" ...>
```

Replace `YOURUSERNAME` with your actual GitHub username once you've published the Python bot repo.

---

### Update the domain placeholder

Open `index.html` and search for `YOURDOMAIN.com`. Replace with your actual domain once you've bought one. It appears in the `<link rel="canonical">` and Open Graph tags — these help Google understand your site's address.

---

## How to deploy to the internet

### Step 1 — Put the code on GitHub

```bash
git init
git add .
git commit -m "initial build"
```

Then create a new public repository on github.com (click the + icon → New repository). Follow the instructions it gives you to push your code.

### Step 2 — Connect to Netlify (free hosting)

1. Go to netlify.com and sign up with your GitHub account
2. Click "Add new site" → "Import an existing project" → GitHub
3. Select your repo
4. Leave all settings as-is and click Deploy

Netlify will build and host your site in about 60 seconds. It gives you a free URL like `your-repo-name.netlify.app`.

### Step 3 — Add your custom domain

1. Buy a `.com` domain on Porkbun (~$10/year)
2. In Netlify: Site settings → Domain management → Add a domain
3. Follow Netlify's instructions to update the DNS records at Porkbun
4. Takes up to 24 hours to fully propagate

### Step 4 — Tell Google your site exists

1. Go to search.google.com/search-console
2. Add your domain
3. Verify ownership (Netlify makes this easy with a DNS record)
4. Click "Request indexing" on your homepage URL

Google will start showing your site in search results within a few days.

---

## The subscription roadmap (what to build next)

The tool is free now with ads. Here is the plan for adding paid features over time:

| When | Feature | How it makes money |
| ---- | ------- | ------------------ |
| 200+ users | Email digest: weekly SCHD/VIG/JEPI yield update + drift alert | Builds your email list |
| 500+ users | Saved portfolios (login required) | First reason to create an account |
| 500+ users | Drift email alerts: "Your SCHD is 8% overweight" | Premium feature, $7/mo |
| 1,000+ users | Direct Alpaca connection: rebalance from the browser | Pro tier, $15/mo |
| 1,000+ users | Backtesting: "what if I'd invested $500/mo since 2015?" | Pro tier add-on |

**The key insight:** get 500 real users first by being genuinely useful for free. The email list is your most valuable asset — it's how you convert free users into paying subscribers.

---

## Files you should NOT touch

| File | Why |
| ---- | --- |
| `test.js` | Only edit this if you add new math functions to `calc.js` |
| Any `.min.js` file from a CDN | These are external libraries. Don't edit them |

---

## If something breaks

**Page is blank:** Open your browser's developer tools (press F12), click the Console tab, and look for red error text. It will tell you exactly what went wrong and which file caused it.

**Math looks wrong:** Run `node test.js` in the terminal from this folder. If a test fails, it will show you which calculation is off.

**Styles not updating:** Your browser might be showing a cached version. Press Ctrl+Shift+R (or Cmd+Shift+R on Mac) to force a full refresh.
