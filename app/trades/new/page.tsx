import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import TradeForm from '@/components/TradeForm';

export default async function NewTradePage() {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <>
      <Navbar traderName={session.name} />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl font-bold mb-6">Log New Trade</h1>
        <TradeForm />
      </main>
    </>
  );
}
