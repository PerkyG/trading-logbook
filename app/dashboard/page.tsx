import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import DashboardView from '@/components/Dashboard';

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <>
      <Navbar traderName={session.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardView currentTraderId={session.id} />
      </main>
    </>
  );
}
