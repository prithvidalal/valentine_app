# Valentine Love Quest

A 3-level Valentine-themed Mario-inspired platformer web app.

## Levels

1. `index.html`: Intro platformer with exactly 3 ledges and a start mystery box on ledge #3.
2. `question.html`: Platformer proposal level with moving `No` and fixed `Yes` mystery boxes.
3. `trivia.html`: Platformer trivia level with 5 mystery question boxes.

## Controls

- Left: `ArrowLeft` or `A`
- Right: `ArrowRight` or `D`
- Jump: `Space`, `ArrowUp`, or `W`
- Show full HUD hints: `H`

## Node.js (Primary Workflow)

Install Node 20 LTS (choose one):

```bash
nvm install 20
nvm use 20
```

or

```bash
brew install node@20
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
```

Install dependencies:

```bash
npm ci
```

Run dev server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

## uv Fallback Tooling

You can still use uv-based static serving/checks:

```bash
uv run serve
uv run check
```

## Deployment to GitHub Pages

The workflow in `.github/workflows/pages.yml` now:

1. Sets up Node 20
2. Runs `npm ci`
3. Runs `npm run build`
4. Uploads `dist/` and deploys to GitHub Pages

Public URL format: `https://<username>.github.io/<repo-name>/`

## Notes

- Visual FX quality defaults to `balanced` via `fxQuality` in level configs.
- Character and tune are original-inspired implementations for safer public hosting.
- Update `data/trivia-questions.json` to personalize trivia content.
