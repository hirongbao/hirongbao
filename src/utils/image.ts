export function getProxiedImageUrl(url: string | undefined, bustCache = false): string {
  if (!url) return '';
  let finalUrl = url;
  if (!url.startsWith('/')) {
    finalUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  if (bustCache) {
    const sep = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${sep}_t=${Date.now()}`;
  }
  return finalUrl;
}
