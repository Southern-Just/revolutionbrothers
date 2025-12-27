import Header from '@/components/Header';
import { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';

const Layout = async ({ children }: { children: ReactNode }) => {
  const user = await getCurrentUser();

  if (!user) redirect('/');

  return (
    <div>
      <Header />
      {children}
    </div>
  );
};

export default Layout;
