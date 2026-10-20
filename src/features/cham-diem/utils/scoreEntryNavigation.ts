export function isScoreEntryView(searchParams: URLSearchParams): boolean {
  return searchParams.get('view') === 'score' && Boolean(searchParams.get('groupPeriodFilter'));
}

export function buildScoreEntryUrl(path: string, periodId: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set('view', 'score');
  searchParams.set('groupPeriodFilter', periodId);
  return `${path}?${searchParams.toString()}`;
}
