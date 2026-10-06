export function isCommitteeApprovalView(searchParams: URLSearchParams): boolean {
  return searchParams.get('view') === 'committee' && Boolean(searchParams.get('periodId'));
}

export function buildCommitteePeriodUrl(path: string, periodId: string): string {
  const searchParams = new URLSearchParams();
  searchParams.set('view', 'committee');
  searchParams.set('periodId', periodId);
  return `${path}?${searchParams.toString()}`;
}
