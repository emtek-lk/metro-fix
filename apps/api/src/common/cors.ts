/**
 * Which browser origins may call the API (and open the live-update socket).
 *
 * Production allows only what CORS_ORIGINS lists: a comma-separated list of origins, where a `*`
 * stands for one hostname label, e.g. `https://metrofix.example.lk,https://admin.metrofix.example.lk`
 * or `https://*.metrofix.example.lk`. Development (anything but NODE_ENV=production) also allows
 * localhost, 127.0.0.1 and any `*.localhost` host on any port, so the local hostnames just work.
 * Requests with no Origin header (the native apps, curl, server to server) are always allowed: CORS
 * is a browser rule, and they are protected by sign-in and roles like everyone else.
 */
export type OriginCheck = (origin: string | undefined) => boolean;

const escape = (text: string) => text.replace(/[.+?^${}()|[\]\\]/g, '\\$&');

/** Turns `https://*.example.lk` into a matcher where `*` is a single hostname label. */
function toMatcher(entry: string): RegExp {
  return new RegExp(`^${entry.split('*').map(escape).join('[A-Za-z0-9-]+')}$`, 'i');
}

const LOCAL_DEV = [
  /^https?:\/\/localhost(:\d+)?$/i,
  /^https?:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https?:\/\/([A-Za-z0-9-]+\.)+localhost(:\d+)?$/i,
];

export function buildOriginCheck(env: Record<string, string | undefined> = process.env): OriginCheck {
  const configured = (env.CORS_ORIGINS ?? '')
    .split(',')
    .map((entry) => entry.trim().replace(/\/+$/, ''))
    .filter(Boolean)
    .map(toMatcher);
  const isProduction = env.NODE_ENV === 'production';
  const matchers = isProduction ? configured : [...configured, ...LOCAL_DEV];

  return (origin) => {
    if (!origin) return true;
    return matchers.some((matcher) => matcher.test(origin));
  };
}

/** The shape the `cors` package and socket.io expect for their `origin` option. */
export function corsOriginOption(check?: OriginCheck) {
  // Built on first use, so the environment is read after dotenv has loaded it.
  let active = check;
  return (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    active ??= buildOriginCheck();
    callback(null, active(origin));
  };
}
