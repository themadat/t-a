# App Template — Agent Instructions

Static, local-first HTML/CSS/JavaScript; no runtime dependencies or required build step.

## Start and resume

Run `git status --short`, then read `context/LLM_HANDOFF.md` and `context/WISHES.md`. Preserve existing edits. Read relevant files, recent commits, and any active plan's Resume block before continuing unfinished work. `continue` resumes that work; do not create a separate status file.

## Working rules

- Search with `rg`; keep changes scoped. Read task-specific docs only as needed.
- Preserve the icon library unless explicitly resetting a copy. The reusable foundation is the top bar, search, Notes, vertical Settings/Roadmap, local recovery, optional GitHub Sync, and offline support. Do not reintroduce Records or a rich-text/multi-note workspace.
- Identity, configuration, release history, and the sole `VERSION` literal live in `assets/js/config.js`. Use `major.minor.patch.build`: increment build for app changes; reset build to 1 for a requested major/minor/patch change. Update the newest release entry in this file; its version uses `VERSION`. Freeze the previous release's version as a literal when adding another entry. No version edits in HTML, manifests, worker, workflow, or docs. Documentation-only changes do not bump the app.
- Use semantic, labelled controls, visible focus, escaped text, safe URLs, and shared SVG controls.
- Verify proportionally using `docs/TESTING.md`. Stop preview servers before finishing.
- No commits or pushes without explicit authorization. Preserve computer-independent Git remotes.

## Workflows

`wish`: capture only in WISHES. `plan`: investigate and write a plan with Resume, scope, decisions, files, tests, and open questions; do not implement. `start`: implement the approved plan, maintain Resume, verify, update version. `cut`: finalize release and close its wish.
`reset`: read `docs/RESET.md` first; confirm the intended copied checkout, app identity, and replacement icon before transforming it. Never reset the canonical template accidentally.

## Handoff

Give a concise outcome and verification result, then exactly one command to stage task files, commit `Version - Text`, and push the current branch. Use `git add .` only when all changes belong to the request; otherwise name task files and mention unrelated edits. Do not suggest an empty commit or execute the command unless asked.
