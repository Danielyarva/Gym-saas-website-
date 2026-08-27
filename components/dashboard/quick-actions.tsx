import Link from 'next/link';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Button asChild className="flex-1">
          <Link href="/clients?new=1">
            <UserPlus className="h-4 w-4" />
            Add client
          </Link>
        </Button>
        <Button asChild variant="outline" className="flex-1">
          <Link href="/clients">
            <Users className="h-4 w-4" />
            View all clients
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
