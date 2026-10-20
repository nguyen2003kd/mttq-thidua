export function isCouncilApprovalView(searchParams: URLSearchParams): boolean {
  return searchParams.get('view') === 'council' && Boolean(searchParams.get('periodId'));
}

export function buildCouncilPeriodUrl(path: string, periodId: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set('view', 'council');
  searchParams.set('periodId', periodId);
  return `${path}?${searchParams.toString()}`;
}
