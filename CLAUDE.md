@AGENTS.md

# React Native Project Guidelines

## Tech Stack

- React Native (Expo / CLI)
- TypeScript
- Navigation: React Navigation v6
- State: Zustand / Redux Toolkit
- Styling: NativeWind / StyleSheet

## Rules & Constraints

1. Always write TypeScript with explicit types. Do not use `any`.
2. Prefer Functional Components with React Hooks.
3. Keep UI components separate from logic (use custom hooks).
4. When suggesting code changes, provide ONLY the modified parts or diffs, not whole files.
5. Do not modify native folders (`/android` or `/ios`) unless explicitly requested.

## Common Commands

- Run Expo: `npx expo start`
- Run iOS: `npx expo run:ios`
- Run Android: `npx expo run:android`
- Type Check: `npx tsc`

## Git workflow

- Always create a new branch before starting work
- Open a PR at the end of every task, don't push directly to main
- after opening a PR, send me the Vercel deployment link for testin
- After PR is approved, merge it into main
