import { Metadata } from 'next';
import CreateDTFForm from '@/components/dtf/create-dtf-form';
import { Footer, Header } from '@/components/landing-page';

export const metadata: Metadata = {
  title: 'Create DTF | OSMO',
  description: 'Create your own Decentralized Token Fund with custom token allocations',
};

export default function CreateDTFPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header />
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Create Your DTF
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Build a diversified portfolio by creating your own Decentralized Token Fund. 
            Choose tokens, set allocations, and launch your fund in minutes.
          </p>
        </div>
        
        <CreateDTFForm />
      </div>
      <Footer />
    </div>
  );
}
