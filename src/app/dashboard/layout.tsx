'use client';

import { Toaster } from 'react-hot-toast';
import DashboardNavigation from '@/components/layout/DashboardNavigation';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
    }
  }, [session, status, router]);
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!session) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      <DashboardNavigation />
      <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}
