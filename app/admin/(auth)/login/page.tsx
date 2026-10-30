import type { Metadata } from 'next';
import { Suspense } from 'react';
import AuthCard from '@/components/admin/AuthCard';
import LoginForm from './LoginForm';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <AuthCard title="Welcome back" subtitle="Sign in to manage the VARI Studio website.">
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthCard>
  );
}
