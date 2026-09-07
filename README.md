# wh-arcade-parody

An independent, unofficial political satire project responding to the public White House arcade. The planned games use humor and fictional gameplay to criticize political messaging and explore transparency, immigrant dignity, public nutrition, and shared prosperity.

This is expressive political commentary, intended to exercise freedom of speech. It is not affiliated with or endorsed by the White House or any government agency. Cartoon events are fictional; a character appearing in a game does not establish wrongdoing by the person depicted. This statement does not claim blanket legal immunity or ownership of third-party material.

## Status

Planning and source research. No playable remake or development server has been implemented yet. Start with [.internal_docs/README.md](.internal_docs/README.md).

The planned launch command is `./dev`, with no arguments, serving `http://localhost:8643` with hot reload and an interactive game tuning panel. Implementation will provide reproducible project-local dependencies rather than depend on a machine's cached Playwright installation.

## Source and assets

Reference: https://www.whitehouse.gov/arcade/ (inspected September 7, 2026).

The White House [copyright policy](https://www.whitehouse.gov/copyright/) distinguishes government-produced material from third-party material and provides a default CC BY 3.0 license for third-party content unless otherwise noted. Each reused asset will have its source, attribution, modification history, and applicable rights recorded. Reference captures are local research files, not application code. The remake will use its own implementation and a visibly unofficial identity.

## Development direction

Vite + TypeScript, Canvas 2D games, semantic HTML menus and controls, shared lifecycle/input/audio/storage services, and Playwright browser checks. Each game owns its rules and content. See the infrastructure spec for the directory contract and delivery sequence.
