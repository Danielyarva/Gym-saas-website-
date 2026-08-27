import { LineChart } from 'lucide-react';
import { ComingSoon } from '@/components/clients/profile/coming-soon';

export default function ClientProgressPage() {
  return <ComingSoon icon={LineChart} feature="Progress tracking" phase={3} />;
}
