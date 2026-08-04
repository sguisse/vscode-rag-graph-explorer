/**
 * Browser-compatible mock for Node.js 'util' module in Webview context.
 */
export function format(f: unknown, ...args: unknown[]): string {
  if (typeof f !== 'string') {
    return [f, ...args].map((arg) => (typeof arg === 'object' ? JSON.stringify(arg) : String(arg))).join(' ');
  }
  let i = 0;
  const str = f.replace(/%[sdj%]/g, (x) => {
    if (x === '%%') return '%';
    if (i >= args.length) return x;
    const arg = args[i++];
    if (x === '%s') return String(arg);
    if (x === '%d') return Number(arg).toString();
    if (x === '%j') {
      try {
        return JSON.stringify(arg);
      } catch {
        return '[Circular]';
      }
    }
    return x;
  });
  while (i < args.length) {
    const arg = args[i++];
    return str + ' ' + (typeof arg === 'object' ? JSON.stringify(arg) : String(arg));
  }
  return str;
}

export function inspect(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export default {
  format,
  inspect,
};
