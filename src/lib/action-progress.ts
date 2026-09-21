export interface ActionProgressSnapshot {
  activeCount: number;
  label: string;
}

const activeActions = new Map<string, string>();
let sequence = 0;
let snapshot: ActionProgressSnapshot = { activeCount: 0, label: '' };
const listeners = new Set<() => void>();

function publish() {
  const lastLabel = Array.from(activeActions.values()).at(-1) ?? '';
  snapshot = { activeCount: activeActions.size, label: lastLabel };
  listeners.forEach((listener) => listener());
}

/** Theo dõi các thao tác ghi dữ liệu từ Axios để hiển thị tiến trình dùng chung. */
export function beginActionProgress(label: string) {
  const id = `action-${++sequence}`;
  activeActions.set(id, label);
  publish();
  return id;
}

export function completeActionProgress(id?: string) {
  if (!id || !activeActions.delete(id)) return;
  publish();
}

export function subscribeActionProgress(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getActionProgressSnapshot() {
  return snapshot;
}
