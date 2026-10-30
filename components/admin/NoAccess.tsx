'use client';

import { useRouter } from 'next/navigation';
import AuthCard from './AuthCard';
import { Button } from './ui';
import { supabaseBrowser } from '@/lib/supabase/browser';

/** Signed in, but never invited to the team (or removed): nothing in the panel is visible. */
export default function NoAccess({ email }: { email: string }) {
  const router = useRouter();
  return (
    <AuthCard title="No access" subtitle={`${email} is not a member of the VARI team.`}>
      <p className="text-sm leading-relaxed text-bone/65">Ask an admin to invite you to the control panel.</p>
      <Button
        variant="secondary"
        className="mt-6 w-full"
        onClick={async () => {
          await supabaseBrowser().auth.signOut();
          router.replace('/admin/login');
        }}
      >
        Sign out
      </Button>
    </AuthCard>
  );
}
