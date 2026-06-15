# Focus Flow Execution OS 2

AI execution operating system for missions, supervised browser automation, approval queues, and execution logs.

## Product direction

Focus Flow is not a traditional task manager. It is a command-to-execution system:

```txt
Command -> Mission -> Execution Plan -> Browser Agent -> Approval Queue -> Completion
```

## What this version includes

- Premium Apple-inspired dark UI.
- Mobile-first responsive layout with no horizontal overflow.
- Command Center: write one goal and convert it into a Mission.
- Missions instead of classic projects.
- Execution Plan with statuses.
- Supervised Browser Agent concept.
- Approval Queue for sensitive actions.
- Execution Log.
- Local-first demo behavior using browser storage.

## Run locally

```bash
npm install
npm run dev
```

## Deploy on Vercel

Build command:

```bash
npm run build
```

Output directory:

```bash
dist
```
