export const getToken = () => localStorage.getItem('site_token');
export const setToken = (token: string) => localStorage.setItem('site_token', token);
export const removeToken = () => localStorage.removeItem('site_token');

export const getUserInfo = () => {
  const info = localStorage.getItem('site_user_info');
  return info ? JSON.parse(info) : null;
};
export const setUserInfo = (info: any) => localStorage.setItem('site_user_info', JSON.stringify(info));
export const removeUserInfo = () => localStorage.removeItem('site_user_info');

export async function authRequest<T = any>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {})
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const res = await fetch(url, { ...options, headers });
  
  if (res.status === 401) {
    removeToken();
    removeUserInfo();
    window.dispatchEvent(new Event('auth_expired'));
    throw new Error('登录已过期，请重新登录');
  }
  
  const json = await res.json();
  if (json.code !== 0) {
    throw new Error(json.message || '请求失败');
  }
  
  return json.data;
}
