export const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  needs_correction: 'Needs Correction',
  complete: 'Complete',
  form_released: 'Form Released',
  submitted_to_governor: "Submitted to Governor's Office",
  approved: 'Approved',
  denied: 'Denied',
};

// maps an application status to a badge color class
export const statusClass = (status) =>
  ({
    pending_review: 'pending',
    needs_correction: 'rejected',
    denied: 'rejected',
    approved: 'approved',
    complete: 'approved',
    form_released: 'approved',
  })[status] || '';

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}