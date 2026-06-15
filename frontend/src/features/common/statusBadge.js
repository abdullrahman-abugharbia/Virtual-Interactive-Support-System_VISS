// Order status badge palette (user + admin order views).
// Values are exact rgba/hex from the design spec, so they live as inline styles.
export const STATUS_BADGE = {
  pending: { color: '#A5B4FC', background: 'rgba(99,102,241,.14)', borderColor: 'rgba(99,102,241,.38)' },
  dispatched: { color: '#FCD34D', background: 'rgba(251,191,36,.10)', borderColor: 'rgba(251,191,36,.32)' },
  delivered: { color: '#34D399', background: 'rgba(16,185,129,.10)', borderColor: 'rgba(16,185,129,.32)' },
  received: { color: '#34D399', background: 'rgba(16,185,129,.10)', borderColor: 'rgba(16,185,129,.32)' },
  cancelled: { color: '#FDA4AF', background: 'rgba(244,63,94,.10)', borderColor: 'rgba(244,63,94,.32)' },
};

export function statusBadgeStyle(status) {
  const s = STATUS_BADGE[status] || STATUS_BADGE.pending;
  return {
    color: s.color,
    background: s.background,
    border: `1px solid ${s.borderColor}`,
  };
}
