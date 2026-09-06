export function getProxiedImageUrl(url: string | undefined, bustCache = false): string {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  let finalUrl = url;
  if (!url.startsWith('/')) {
    finalUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
  }
  if (bustCache) {
    const sep = finalUrl.includes('?') ? '&' : '?';
    finalUrl += `${sep}_t=${Date.now()}`;
  }
  
  if (finalUrl.startsWith('/') && typeof window !== 'undefined') {
    finalUrl = window.location.origin + finalUrl;
  }
  return finalUrl;
}
