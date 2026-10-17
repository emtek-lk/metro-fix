#!/usr/bin/env bash
# Checks the hosted METRO-FIX system from outside: the API, the two websites, DNS, certificates and CORS.
# Nothing here is secret; the defaults are the public addresses. Override with environment variables, e.g.
#   API_URL=https://api-metrofix.example.lk CUSTOMER_URL=... ADMIN_URL=... scripts/check-hosting.sh
# Options:  --warm   wake the API and the database first (use before a demo; the first call can take a minute)
# Exit status is 1 if any check FAILed (WARN does not fail the run).
set -u

API_URL="${API_URL:-https://api-metrofix.vanguardprotection.lk}"
CUSTOMER_URL="${CUSTOMER_URL:-https://metrofix.vanguardprotection.lk}"
ADMIN_URL="${ADMIN_URL:-https://admin-metrofix.vanguardprotection.lk}"
# Browser origins that must NOT be allowed any more (leftovers of earlier setups). A match is a WARN.
LEGACY_ORIGINS="${LEGACY_ORIGINS:-https://metrofix-customer.pages.dev https://metrofix-admin.pages.dev}"
TIMEOUT="${TIMEOUT:-90}"

fails=0
ok()   { printf '  \033[32mok\033[0m    %s\n' "$1"; }
warn() { printf '  \033[33mWARN\033[0m  %s\n' "$1"; }
fail() { printf '  \033[31mFAIL\033[0m  %s\n' "$1"; fails=$((fails + 1)); }
host() { echo "$1" | sed -E 's#^[a-z]+://##; s#/.*$##'; }
status() { curl -s -m "$TIMEOUT" -o /dev/null -w '%{http_code}' "$1" 2>/dev/null || echo 000; }
cors_header() { curl -s -m "$TIMEOUT" -o /dev/null -D - -H "Origin: $2" "$1" 2>/dev/null | tr -d '\r' | grep -i '^access-control-allow-origin:' | head -1 | sed -E 's/^[^:]*: *//'; }

echo "== API  $API_URL"
if [ "${1:-}" = "--warm" ]; then
  echo "  warming up (the API, then the database; this can take a minute)..."
  curl -s -m "$TIMEOUT" -o /dev/null "$API_URL/health"
  curl -s -m "$TIMEOUT" -o /dev/null "$API_URL/settings/public"
fi
c=$(status "$API_URL/health");          [ "$c" = 200 ] && ok "/health answers 200" || fail "/health answers $c"
c=$(status "$API_URL/settings/public"); [ "$c" = 200 ] && ok "/settings/public answers 200 (the API reaches the database)" || fail "/settings/public answers $c (database asleep, firewall, or credentials?)"
c=$(status "$API_URL/jobs");            [ "$c" = 401 ] && ok "/jobs refuses requests without a token (401)" || fail "/jobs answers $c, expected 401"
c=$(curl -s -m "$TIMEOUT" -o /dev/null -w '%{http_code}' "http://$(host "$API_URL")/health" 2>/dev/null || echo 000)
case "$c" in 301|302|307|308) ok "plain http redirects to https ($c)";; *) warn "plain http answers $c (expected a redirect)";; esac

echo "== Websites"
for pair in "customer|$CUSTOMER_URL" "staff|$ADMIN_URL"; do
  name=${pair%%|*}; url=${pair#*|}
  c=$(status "$url");                 [ "$c" = 200 ] && ok "$name site answers 200  ($url)" || fail "$name site answers $c  ($url)"
  c=$(status "$url/portal/services"); [ "$c" = 200 ] && ok "$name site serves deep links (single-page fallback)" || fail "$name site: a deep link answers $c"
done

echo "== CORS (what browsers are allowed to call the API)"
for pair in "customer|$CUSTOMER_URL" "staff|$ADMIN_URL"; do
  name=${pair%%|*}; url=${pair#*|}
  h=$(cors_header "$API_URL/settings/public" "$url")
  [ "$h" = "$url" ] && ok "$name site origin is allowed" || fail "$name site origin is not allowed (got: ${h:-nothing})"
done
h=$(cors_header "$API_URL/settings/public" "https://evil.example"); [ -z "$h" ] && ok "an unknown origin is refused" || fail "an unknown origin is allowed: $h"
for o in $LEGACY_ORIGINS; do
  h=$(cors_header "$API_URL/settings/public" "$o"); [ -z "$h" ] && ok "legacy origin refused: $o" || warn "legacy origin still allowed: $o (remove it from CORS_ORIGINS when no longer needed)"
done

echo "== DNS"
api_host=$(host "$API_URL")
cname=$(dig +short @1.1.1.1 CNAME "$api_host" 2>/dev/null | head -1)
case "$cname" in *onrender.com.) ok "$api_host is a CNAME to $cname";; "") warn "$api_host has no CNAME (an A record, or DNS has not propagated)";; *) warn "$api_host points at $cname (expected a Render address)";; esac
for url in "$CUSTOMER_URL" "$ADMIN_URL"; do
  h=$(host "$url"); a=$(dig +short @1.1.1.1 A "$h" 2>/dev/null | head -1)
  [ -n "$a" ] && ok "$h resolves ($a)" || fail "$h does not resolve"
done

echo "== Certificates"
for url in "$API_URL" "$CUSTOMER_URL" "$ADMIN_URL"; do
  h=$(host "$url")
  end=$(echo | openssl s_client -servername "$h" -connect "$h:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | sed 's/notAfter=//')
  if [ -z "$end" ]; then fail "$h: no certificate"; continue; fi
  if echo | openssl s_client -servername "$h" -connect "$h:443" 2>/dev/null | openssl x509 -noout -checkend $((14 * 86400)) >/dev/null 2>&1
  then ok "$h certificate valid until $end"; else warn "$h certificate expires within 14 days ($end)"; fi
done

echo
if [ "$fails" -eq 0 ]; then echo "All checks passed."; else echo "$fails check(s) FAILED."; exit 1; fi
