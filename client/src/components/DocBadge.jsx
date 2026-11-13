import { CircleCheck, CircleX, Clock, CircleDashed } from 'lucide-react';

const MAP = {
  approved: { Icon: CircleCheck, label: 'Approved' },
  rejected: { Icon: CircleX, label: 'Rejected' },
  pending: { Icon: Clock, label: 'Pending review' },
};

export default function DocBadge({ status }) {
  const item = MAP[status];
  if (!item) {
    return (
      <span className="badge">
        <CircleDashed size={14} /> Not uploaded
      </span>
    );
  }
  const { Icon, label } = item;
  return (
    <span className={`badge ${status}`}>
      <Icon size={14} /> {label}
    </span>
  );
}