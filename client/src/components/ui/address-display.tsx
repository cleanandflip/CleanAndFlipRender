import { CheckCircle } from 'lucide-react';

interface User {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  isLocalCustomer?: boolean;
}

interface AddressDisplayProps {
  user: User;
  className?: string;
}

export function AddressDisplay({ user, className = "" }: AddressDisplayProps) {
  if (!user.street) {
    return <span className="text-gray-500">No address on file</span>;
  }
  
  return (
    <div className={className}>
      <p className="text-white">{user.street}</p>
      <p className="text-gray-400">{user.city}, {user.state} {user.zipCode}</p>
      {user.isLocalCustomer && (
        <span className="text-xs text-green-500 mt-1 inline-flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          Local customer
        </span>
      )}
    </div>
  );
}