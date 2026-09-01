// 格式化统计数字：12400 -> 12.4k，124000 -> 124k，其余按千分位展示
export function formatCount(n: number): string {
  if (n >= 10000) {
    const v = n / 1000;
    return `${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}k`;
  }
  return n.toLocaleString();
}
