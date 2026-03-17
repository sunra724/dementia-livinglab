export function formatLargeNumber(value: number): string {
  if (value >= 100000000) {
    return `${(value / 100000000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}억`;
  }

  if (value >= 10000) {
    return `${(value / 10000).toLocaleString('ko-KR', { maximumFractionDigits: 0 })}만`;
  }

  return value.toLocaleString('ko-KR');
}
