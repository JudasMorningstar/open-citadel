#!/usr/bin/env bash
# Publishes an over-the-air update, with the notes its dialog will show.
#
# The app reads an update's notes from the update itself: app.config.js puts
# release-notes.json into `extra`, and `extra` travels in every update's
# manifest. So the notes are whatever that file says at the moment of
# publishing, and this is the one place that checks them and shows them to
# you before they go out. The same lines become the update's message, so the
# EAS dashboard and the dialog never disagree.
#
#   scripts/publish-update.sh [android|ios|all] [production|preview]
#
# Defaults to android and production. Publish iOS from the Mac: its builds are
# made there, and a fingerprint worked out on Linux may not match them.
set -euo pipefail

platform="${1:-android}"
channel="${2:-production}"
cd "$(git rev-parse --show-toplevel)"

echo "Checking release-notes.json"
if ! pnpm exec vitest run src/features/updates/utils/__tests__/release-notes.test.ts >/tmp/release-notes-check.log 2>&1; then
  # The failed test prints each problem as an added line of its diff.
  sed -nE 's/^\+ +"(.*)",?$/  - \1/p' /tmp/release-notes-check.log | sed 's/\\"/"/g' | grep . \
    || tail -n 20 /tmp/release-notes-check.log
  echo "The notes are not fit to publish. Fix release-notes.json and run this again." >&2
  exit 1
fi

echo
echo "This update's dialog will say:"
# 4 is NOTES_SHOWN in src/features/updates/utils/release-notes.ts.
node -e 'for (const [i, n] of require("./release-notes.json").notes.entries()) console.log(`  ${i < 4 ? "•" : "+"} ${n}`)'
echo "(• is shown at once, + waits behind \"+ N more\" and scrolls in its box)"
echo
read -r -p "Publish these to $channel for $platform? [y/N] " answer
[[ "$answer" == "y" || "$answer" == "Y" ]] || { echo "Nothing published."; exit 1; }

message="$(node -e 'console.log(require("./release-notes.json").notes.join(", "))')"
APP_VARIANT="$channel" eas update --channel "$channel" --environment "$channel" --platform "$platform" --message "$message"
