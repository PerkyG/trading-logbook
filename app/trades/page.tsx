import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Navbar from '@/components/Navbar';
import TradeTable from '@/components/TradeTable';
import Link from 'next/link';

export default async function TradesPage() {
  const session = await getSession();
  if (!session) redirect('/');

  return (
    <>
      <Navbar traderName={session.name} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Trade Log</h1>
          <div className="flex gap-3">
            <a
              href="/api/export"
              className="btn-secondary text-sm"
              download
            >
              Export CSV
            </a>
            <Link href="/trades/new" className="btn-primary text-sm">
              + New Trade
            </Link>
          </div>
        </div>
        <TradeTable currentTraderId={session.id} />
      </main>
    </>
  );
}
