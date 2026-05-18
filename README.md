# J vagy LY? - Hungarian Spelling Practice Web App

A web-based game to practice Hungarian spelling where players choose the correct spelling between two alternatives that differ only in `j`/`ly` usage.

**Live Demo**: [j-or-ly.vercel.app](https://j-or-ly.vercel.app) *(after deployment)*

## Features

- **18,365 Hungarian word pairs** generated from `magyar-szavak.txt`
- **Responsive design** - works on mobile and desktop
- **Keyboard shortcuts** - 1/2 for options, Space for next, N for new game
- **Score tracking** - accuracy percentage and progress bar
- **Instant feedback** - visual indicators for correct/incorrect answers
- **Hungarian UI** - fully localized for Hungarian users

## Tech Stack

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Vercel** for hosting
- **Python** for data preprocessing

## Development

### Prerequisites
- Node.js 22+
- Python 3.x
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/tmsso/j-or-ly.git
cd j-or-ly

# Install dependencies
npm install

# Generate initial data
npm run generate-data

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

### Building for Production

```bash
npm run build
npm start
```

The build command automatically regenerates the word pairs from `data/magyar-szavak.txt`.

## Deployment on Vercel

1. **Connect GitHub repository** to Vercel at [vercel.com/new](https://vercel.com/new)
2. **Select repository**: `tmsso/j-or-ly`
3. **Configure build settings**:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. **Deploy** - Vercel will automatically deploy on every push to `main` or `codex/hungarian-word-practice`

### Manual Deployment via CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Data Pipeline

The app uses a pre-generated JSON file (`public/jly-pairs.json`) containing 18,365 Hungarian word pairs.

### Regenerating Data

When `data/magyar-szavak.txt` is updated:

```bash
npm run generate-data
git add public/jly-pairs.json
git commit -m "Update word pairs"
git push
```

Vercel will automatically rebuild with the new data.

## Project Structure

```
├── app/                    # Next.js App Router
│   ├── components/        # React components
│   ├── utils/            # Game logic and utilities
│   ├── globals.css       # Tailwind styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Home page
├── public/               # Static assets
│   └── jly-pairs.json   # Generated word pairs
├── scripts/
│   └── generate-pairs.py # Data generation script
├── data/
│   └── magyar-szavak.txt # Hungarian word list
└── tests/               # Unit tests (future)
```

## How It Works

1. **Word pair generation**:
   - Loads 161,743 Hungarian words from `magyar-szavak.txt`
   - Identifies words containing `j` or `ly`
   - Creates wrong variants by swapping `j` ↔ `ly`
   - Filters out wrong variants that match real words

2. **Gameplay**:
   - Randomly selects a pair (correct, wrong)
   - Shuffles button order
   - Player selects an option
   - Immediate feedback with correct answer
   - Score updates automatically

## License

MIT © tmsso

## Acknowledgments

- Hungarian word list from various open sources
- Inspired by Hungarian language learning needs