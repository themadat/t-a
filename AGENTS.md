# T&A Agent Rules

Static, local-first HTML/CSS/JavaScript; no dependencies or build step.

- Start with `git status --short` and `context/LLM_HANDOFF.md`. Preserve unrelated edits and private data.
- Search with `rg`; read source and docs only as needed. Keep changes scoped and controls accessible; escape user text and use shared SVGs.
- Identity, releases, and the sole `VERSION` live in `assets/js/config.js`. Use major.minor.patch.build; increment build for app changes, reset it to 1 for a major/minor/patch change. New releases use VERSION; freeze the previous release. Do not bump for docs alone.
- Preserve storage keys, migrations, linked-entry integrity, and credential isolation. Keep personal data out of source and deployment.
- Verify proportionally using `docs/TESTING.md`; stop preview servers afterward.
- Do not commit/push without explicit authorization or change computer-independent remotes.
- Finish with the outcome, verification, and one command to stage task files, commit `Version - Text`, and push. Exclude unrelated changes.
