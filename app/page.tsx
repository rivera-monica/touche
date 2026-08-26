import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Dashboard from '@/components/Dashboard';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: candles, error } = await supabase
    .from('candles')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to load candles: ${error.message}`);
  }

  return <Dashboard initialCandles={candles ?? []} userEmail={user.email ?? ''} />;
}
