import { redirect } from 'next/navigation';

// middleware.ts already redirects "/" based on session presence; this is
// just the fallback Next.js requires for the route to exist.
export default function RootPage() {
  redirect('/login');
}
