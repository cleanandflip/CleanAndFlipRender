// Centralized submission utility functions to eliminate duplicate code

export function formatStatus(status: string): string {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
}

export function getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'pending': return 'default';
    case 'under_review': return 'secondary';
    case 'accepted': return 'secondary';
    case 'scheduled': return 'secondary';
    case 'completed': return 'secondary';
    case 'rejected': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'outline';
  }
}

export function getWeekStart(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
  return new Date(now.setDate(diff));
}

export function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return 'Open';
  return `$${amount.toLocaleString()}`;
}

export function isLocalCustomer(zipCode: string): boolean {
  const ashevilleZips = ['28801', '28802', '28803', '28804', '28805', '28806', '28810', '28813', '28814', '28815', '28816'];
  return ashevilleZips.includes(zipCode);
}