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

export async function urlToBase64(url: string | undefined): Promise<string> {
  if (!url) return '';
  if (url.startsWith('data:')) return url;
  
  try {
    const proxiedUrl = getProxiedImageUrl(url, false);
    const response = await fetch(proxiedUrl);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Failed to convert image to base64:', error);
    return ''; // Return empty string on failure so it degrades gracefully
  }
}
