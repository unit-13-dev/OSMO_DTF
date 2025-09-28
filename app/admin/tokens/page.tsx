import TokenManager from '@/components/admin/token-manager';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Token Manager - Admin',
  description: 'Manage Unichain Sepolia token addresses',
};

export default function AdminTokensPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-100 dark:from-gray-900 dark:to-black">
      <TokenManager />
    </div>
  );
}
