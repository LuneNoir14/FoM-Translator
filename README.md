# FoM Translator

An open-source, local translation editor prototype built with Electron + React.
Specifically designed to streamline localization for the game *Fields of Mistria*.

## Features

- Dense dark-theme workbench shell for comfortable translating
- Entry list, filtering, and seamless selection flow
- Dedicated source text representation side-by-side
- Translation editor with real-time saving
- Placeholder and line-break validation system
- JSON export service for seamless in-game mod packaging
- Persistent SQLite-based cross-session translation storage

## Development Commands

- `npm run dev`: Starts the application in Vite development mode.
- `npm run test`: Runs the test suites.
- `npm run build`: Compiles the React renderer and Electron types.
- `npm run dist`: Packages and builds the final executable using `electron-builder`.

## Notes

- Tests run the built-in `better-sqlite3` module with the current Node version.
- The packaging step handles native `better-sqlite3` rebuilding for the Electron ABI.
- Simply select the original game source JSON (`localization.en.json`) via the app UI to begin translating.
