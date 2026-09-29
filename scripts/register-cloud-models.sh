#!/usr/bin/env bash
#
# Register the plan-tiered model catalogue on Samwell Cloud.
#
# WHY THIS EXISTS
#
# `cloud_models` already holds rows from before plans existed, and `min_plan`
# was added with a default of 'archmaester' on purpose: the two ways of being
# wrong are not symmetric. A frontier model that lands in the cheapest tier by
# accident is sold at a tenth of what it costs; a cheap model stranded in the
# dearest tier is an oversight somebody notices. So the migration is safe and
# WRONG until this runs - every plan below Archmaester reaches nothing.
#
# `initDb` only seeds when the table is EMPTY, so a deploy will not fix this
# by itself. Confirm with:
#
#   curl -s "$SAMWELL_CLOUD_URL/health" | jq '{modelsByPlan, modelsMissingPrices}'
#
# Run this from your machine, not from inside the container: it talks to the
# public HTTPS endpoint. The admin key is never printed or written anywhere.
#
# Usage:
#   ./scripts/register-cloud-models.sh          (prompts for the key, hidden)
#   ADMIN_API_KEY=... ./scripts/register-cloud-models.sh
set -euo pipefail

# The admin key has to be supplied. Coolify's env API redacts every value on
# the list endpoint (`--show-sensitive` does not change it), so this cannot
# fetch the key for you. Copy it from the Coolify dashboard: the app ->
# Environment Variables -> ADMIN_API_KEY.
#
# Prefix the command with a space and your shell will keep it out of history:
#
#    ADMIN_API_KEY='...' ./scripts/register-cloud-models.sh
#
# Read from the terminal itself, a line at a time, until one has something in
# it. A value copied out of a dashboard often starts with a newline; a single
# `read` took that as the whole answer, the script exited, and the rest of the
# paste landed in the shell, which ran the key as a command and put it in the
# history. Whitespace and bracketed-paste markers are stripped for the same
# reason.
if [ -z "${ADMIN_API_KEY:-}" ]; then
  printf 'ADMIN_API_KEY (from the Coolify app env, input hidden): ' >&2
  while IFS= read -rs line </dev/tty; do
    line="${line//$'\e[200~'/}"
    line="${line//$'\e[201~'/}"
    line="${line//[[:space:]]/}"
    if [ -n "$line" ]; then ADMIN_API_KEY="$line"; break; fi
  done
  unset line
  echo >&2
fi
[ -n "${ADMIN_API_KEY:-}" ] || { echo "No admin key given, nothing to do." >&2; exit 1; }

# The app's own server. The old thamsanqa.africa host answers 503 now.
SAMWELL_CLOUD_URL="${SAMWELL_CLOUD_URL:-https://api.open-citadel.online}"
BASE="${SAMWELL_CLOUD_URL%/}"

register() { # <model-id> <min-plan>
  printf '  %-34s -> %-14s ' "$1" "$2"
  code=$(curl -s -o /tmp/rcm-out.json -w '%{http_code}' -X POST "$BASE/admin/models" \
    -H 'Content-Type: application/json' \
    -H "x-admin-key: $ADMIN_API_KEY" \
    -d "{\"id\":\"$1\",\"minPlan\":\"$2\"}")
  if [ "$code" = "200" ]; then echo "ok"; else echo "FAILED ($code): $(head -c 200 /tmp/rcm-out.json)"; fi
}

retire() { # <model-id>
  printf '  %-34s -> %-14s ' "$1" "retired"
  code=$(curl -s -o /tmp/rcm-out.json -w '%{http_code}' -X DELETE \
    "$BASE/admin/models/$1" -H "x-admin-key: $ADMIN_API_KEY")
  case "$code" in
    200) echo "ok" ;;
    404) echo "not in catalogue (fine)" ;;
    *)   echo "FAILED ($code): $(head -c 200 /tmp/rcm-out.json)" ;;
  esac
}

echo "Maester"
register 'z-ai/glm-5.3-flash'              maester
register 'openai/gpt-6-luna-pro'           maester
register 'deepseek/deepseek-v4-flash-0731' maester

echo "Grand Maester"
register 'anthropic/claude-sonnet-5'       grand_maester
register 'openai/gpt-5.6-terra'            grand_maester
register 'deepseek/deepseek-v4-pro-0813'   grand_maester

echo "Archmaester"
register 'anthropic/claude-opus-5'         archmaester
register 'openai/gpt-5.6-sol'              archmaester
register 'moonshotai/kimi-k3'              archmaester

# Rows carried over from before plans existed that are NOT in the nine above.
# Left alone they sit at the migration default - the dearest tier - so an
# Archmaester would quietly still be offered them. Retired instead.
#
# `openai/gpt-6-luna-pro` must never be retired: it is ONBOARDING_MODEL_ID,
# and an onboarding turn billed to the reader looks the model up in the whole
# catalogue, where a missing row answers 503 rather than falling back. It is
# in the Maester tier above.
#
# `openai/gpt-5.6-luna` held that slot, and the onboarding one, before it.
# Point ONBOARDING_MODEL_ID at the new model before running this, or paid
# onboarding turns 503 until you do.
#
# Safe to run: `deleteCloudModel` promotes a new default if it removes the
# current one, and a reader holding a retired id is healed on their next
# `/billing/me`.
echo "Retiring models from before plans"
retire 'anthropic/claude-sonnet-4.5'
retire 'google/gemini-2.5-flash'
retire 'openai/gpt-5.6-luna'

echo
echo "Catalogue now:"
curl -s "$BASE/health" | python3 -c "import sys,json;d=json.load(sys.stdin);print(' modelsByPlan:',d.get('modelsByPlan'));print(' missing prices:',d.get('modelsMissingPrices'))"
