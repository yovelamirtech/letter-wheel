# Hebrew Word Game

A Hebrew word-finding puzzle game built with Expo and React Native, in the style of Spelling Bee: given a set of letters arranged in a circle (with one required letter), find as many valid Hebrew words as you can.

## Getting started

Install dependencies:

```bash
npm install
```

Start the Expo dev server:

```bash
npm start
```

Or launch directly on a platform:

```bash
npm run android
npm run ios
npm run web
```

## Project structure

- `src/screens` — app screens (splash, level select, game, settings, explanation)
- `src/utils` — game logic, word validation, letter/circle layout helpers
- `src/data` — dictionary, puzzle definitions, and level data
- `scripts` — offline scripts for generating the word dictionary

## Bug reports (Web3Forms)

The in-app report forms — "דיווח על באג" in Settings and "דיווח על מילה שגויה" in the
game — submit to [Web3Forms](https://web3forms.com), which forwards them to your inbox.

The Access Key ships as the default in `app.json` (`expo.extra.web3formsAccessKey`).
It's meant to be public — Web3Forms is designed for the key to live in client-side
code, and protects against abuse with its own rate limiting plus the honeypot field
already sent by `src/utils/web3forms.ts`. This works out of the box in Expo Go, EAS
builds, and the Vercel web export with no extra setup.

To use a different key (e.g. after rotating it), get a free Access Key at
https://web3forms.com and override the default without touching code:

- **Locally**: copy `.env.example` to `.env` and set `WEB3FORMS_ACCESS_KEY`, then
  restart the dev server.
- **EAS builds**: `eas env:set --name WEB3FORMS_ACCESS_KEY --value <key> --environment production`
- **Vercel web export**: set `WEB3FORMS_ACCESS_KEY` under Project Settings →
  Environment Variables.

`app.config.js` checks the env var first and falls back to the `app.json` default.

(`eas env:set` creates or updates in one step; the older `env:create` /
`env:update` pair is deprecated.)

Each build profile in `eas.json` is bound to a matching environment via its
`environment` field, so `eas build --profile production` picks the value up
automatically.

Use `sensitive`, not `secret`. Secret variables are unreadable outside EAS servers,
which breaks `eas update` and local config resolution. They also buy nothing here:
the key is embedded in the shipped bundle either way, so anyone who unpacks the app
can read it. That is expected — Web3Forms access keys are designed for client-side
use. Keeping it out of the public repo is what actually matters, since a key sitting
in a public repo gets scraped and turned into inbox spam. If that happens anyway,
rotate the key in the Web3Forms dashboard and re-run the command above.

## App store readiness

- Display name in `app.json` is "גלגל מילים"; the `slug`
  (`hebrew-word-game`) stays as-is since it's just the internal Expo
  project identifier, not user-facing.
- Privacy policy: [PRIVACY.md](./PRIVACY.md) (link to the GitHub-rendered
  page — `https://github.com/yovelamirtech/letter-wheel/blob/main/PRIVACY.md`
  — when filling out App Store Connect / Play Console privacy fields).
  It documents the real AdMob banner ad unit already wired in
  `app.json` / `src/ads/adUnitIds.ts`, and the optional Web3Forms bug
  report.
- `app.json` has real `ios.bundleIdentifier` / `android.package`
  (`com.yovlezstudio.wordswheel`), starting build numbers, and an
  `ios.infoPlist.NSUserTrackingUsageDescription` string (required by
  Apple because the app links Google Mobile Ads / accesses IDFA).
- `src/ads/adsInit.ts` runs once on launch: it gathers GDPR consent via
  AdMob's `AdsConsent` API (required by Google for EEA/UK/Switzerland
  users regardless of where the publisher is based) and, on iOS, asks
  for App Tracking Transparency permission before the SDK initializes.
  Test with a real build (not Expo Go) — the consent/ATT prompts don't
  appear in Expo Go.
- The `expo-audio` plugin in `app.json` is configured with
  `microphonePermission: false` and `recordAudioAndroid: false`. Without
  this, the plugin requests the microphone/`RECORD_AUDIO` permission by
  default even though the app only plays sound effects and never
  records — an unused permission request like that is a common App
  Review flag and a bad look in the Play Store's Data Safety section.
- Settings screen has a "מדיניות פרטיות" link (Settings → מידע) that
  opens `PRIVACY.md` on GitHub. Apple requires a privacy policy link
  reachable from inside the app itself, not just in App Store Connect
  metadata, for apps that show ads/use tracking.
- `eas.json` defines `development`, `preview`, and `production` build
  profiles plus a `submit.production` target. Before the first build,
  run `eas init` (requires an Expo account) to link the project and
  populate `extra.eas.projectId` in `app.json`, and set the `owner`
  field if building under an Expo organization account.
- Still needed before submission: Apple Developer / Google Play Console
  accounts, store listing assets (screenshots, descriptions, content
  rating — declare "Advertising ID" / "Approximate location" data
  collection in both stores' data-safety questionnaires because of
  AdMob, and mention the optional bug-report form), and a device test
  pass.
