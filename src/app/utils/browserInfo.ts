export function isFirefoxBrowser(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return /firefox|fxios/i.test(userAgent);
}

