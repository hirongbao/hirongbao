export function getProxiedImageUrl(url: string | undefined): string {
  if (!url) return '';
  if (url.startsWith('/')) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}`;
}
