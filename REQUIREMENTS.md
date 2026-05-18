# Requirements: Hungarian "j" vs "ly" Spelling Practice Web App

## 1. Project Overview
**Name**: J vagy LY?  
**Goal**: A web‑based game to practice Hungarian spelling where players choose the correct spelling between two alternatives that differ only in `j`/`ly` usage (e.g., `folyó` vs `fojó`).  

**Target users**: Hungarian learners, native speakers wanting to improve spelling, teachers.  
**Platform**: Web app, mobile‑first, deployable on **Vercel**.

## 2. Functional Requirements

### 2.1 Core Gameplay
- **Word pair generation** from `magyar-szavak.txt` (Hungarian word list).
  - Identify candidate words containing `j` or `ly`.
  - For each valid word, create a wrong variant by replacing one `j` with `ly` or one `ly` with `j`.
  - Filter out wrong variants that accidentally match another valid word.
  - Store pairs (correct, wrong) in a static JSON file for runtime use.
- **Round flow**:
  1. Select a random pair.
  2. Display both options in randomised order (two large buttons).
  3. Player selects one.
  4. Immediate feedback (correct/incorrect, show correct answer).
  5. Update score.
  6. Auto‑advance after short delay or via “Next” button.
- **Scoring**:
  - Track correct/total rounds.
  - Display current score prominently.
- **Session management**:
  - “New game” resets score and round.
  - Persistent session in browser (localStorage) optional for later.

### 2.2 User Interface
- **Header**: “J vagy LY?” with brief instructions in Hungarian.
- **Game area**:
  - Two equally sized, high‑contrast buttons for the two spelling options.
  - Feedback area below buttons.
  - Score panel (e.g., `7/10`).
  - Control buttons: “Következő szó”, “Új játék”.
- **Responsive design**: Works on mobile (touch) and desktop (keyboard shortcuts `1`/`2`).
- **Accessibility**:
  - Semantic HTML, ARIA labels.
  - Keyboard navigation.
  - Sufficient colour contrast.

### 2.3 Non‑functional Requirements
- **Performance**: First load < 3 seconds on 3G; round interaction < 100 ms.
- **Availability**: 99.9% uptime (Vercel guarantees).
- **Maintainability**: Clean, documented code; unit tests for core logic.
- **Scalability**: Static site; no server‑side logic beyond pre‑generated data.

## 3. Technical Stack (Vercel‑only)

| Layer            | Technology                     |
|------------------|--------------------------------|
| Frontend         | Next.js 15 (App Router)        |
| UI Components    | React 19, Tailwind CSS         |
| State Management | React hooks (useState, useContext) |
| Data Generation  | Python script (pre‑build step) |
| Hosting          | Vercel                         |
| CI/CD            | GitHub Actions / Vercel Git integration |
| Analytics        | Vercel Analytics (optional)    |

**Why this stack**:
- **Next.js** provides fast static export, excellent tooling, and seamless Vercel deployment.
- **Tailwind CSS** enables rapid, consistent UI development.
- **Pre‑generated data** keeps the app fully static, cheap to host, and fast.

## 4. Data Pipeline

1. **Source**: `magyar-szavak.txt` (Hungarian word list) – copied from Betuveto repository.
2. **Processing script** (`scripts/generate-pairs.py`):
   - Loads the word list.
   - Applies the pair‑generation algorithm (see §2.1).
   - Outputs `public/jly-pairs.json` with array of `{ correct, wrong }` objects.
3. **Runtime**: The Next.js app imports the JSON file and uses it as the question bank.

## 5. Project Structure

```
j-or-ly/
├── public/
│   ├── jly-pairs.json          # Generated data
│   └── ...
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (game)
│   ├── components/
│   │   ├── GameCard.tsx        # Main game UI
│   │   ├── ScorePanel.tsx      # Score display
│   │   └── ButtonPair.tsx      # Option buttons
│   └── utils/
│       ├── pairs.ts            # Pair‑loading logic
│       └── gameLogic.ts        # Round management
├── scripts/
│   └── generate-pairs.py       # Data generation
├── tests/
│   └── gameLogic.test.ts       # Unit tests
├── tailwind.config.ts
├── next.config.ts
├── package.json
└── README.md
```

## 6. Development Workflow

### 6.1 Setup
```bash
git clone https://github.com/tmsso/j-or-ly.git
cd j-or-ly
npm install
# Generate initial data
python scripts/generate-pairs.py
npm run dev
```

### 6.2 Data updates
When `magyar-szavak.txt` changes:
1. Run `python scripts/generate-pairs.py`.
2. Commit the updated `public/jly-pairs.json`.
3. Redeploy (Vercel auto‑deploys on push).

### 6.3 Deployment
- Connect GitHub repo to Vercel.
- Vercel automatically builds and deploys `main` branch.
- Use Vercel’s preview deployments for pull requests.

## 7. Quality Gates

### 7.1 Testing
- **Unit tests** (Jest) for pair‑generation logic, game state transitions.
- **End‑to‑end** (Playwright) for critical user flows.
- **Visual regression** (optional) with Chromatic.

### 7.2 Performance
- Lighthouse CI score > 90 in all categories.
- Bundle size < 100 kB (gzipped).

### 7.3 Security
- Static site; no user data stored on server.
- Sanitise any dynamic content (none planned).

## 8. Milestones & Timeline

| Milestone                      | Deliverables                                           | Est. time |
|--------------------------------|--------------------------------------------------------|-----------|
| **M1: Data pipeline**          | Pair‑generation script, JSON output, unit tests        | 2 days    |
| **M2: Core UI**                | Next.js scaffold, game layout, button components       | 3 days    |
| **M3: Game logic**             | Round flow, scoring, feedback                          | 2 days    |
| **M4: Polish & deploy**        | Responsive design, keyboard shortcuts, Vercel deploy   | 3 days    |
| **Total**                      | MVP ready for production                               | 10 days   |

## 9. Future Enhancements (Post‑MVP)

1. **Spaced repetition**: Prioritise incorrectly answered words.
2. **Audio pronunciation**: Integrate TTS for correct word.
3. **Progress tracking**: User accounts, leaderboards.
4. **Teacher dashboard**: Export mistake statistics.
5. **Offline support**: PWA installation.

## 10. Acceptance Criteria

The project is considered complete when:

- [ ] App is live at `j‑or‑ly.vercel.app` (or custom domain).
- [ ] Game loads and plays without errors on Chrome, Firefox, Safari mobile/desktop.
- [ ] Score updates correctly after each round.
- [ ] Data pipeline generates ≥ 500 valid `j`/`ly` pairs.
- [ ] Unit test coverage > 80% for core logic.
- [ ] Lighthouse performance score ≥ 90.

---

*This document supersedes any earlier plans (e.g., Streamlit‑based plan). All development should follow the Vercel stack outlined here.*