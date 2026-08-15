import { ensureDatabaseReady } from '@/lib/db';

export default async function TreatmentPlanLayout({ children }: { children: React.ReactNode }) {
  await ensureDatabaseReady();
  return children;
}
