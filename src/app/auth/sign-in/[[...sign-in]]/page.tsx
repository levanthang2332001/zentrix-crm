import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Sign In',
  description: 'Sign In page for Zentrix.'
};

export default async function Page() {
  return <SignInViewPage />;
}
