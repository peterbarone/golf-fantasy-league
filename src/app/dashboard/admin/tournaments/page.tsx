'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import TournamentManagement from '@/components/dashboard/TournamentManagement';

export default function TournamentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Only allow admin users
    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
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
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-bold">Tournament Management</h1>
        <a
          href="/dashboard/admin"
          className="mt-2 md:mt-0 text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Admin Dashboard
        </a>
      </div>
      
      <div className="mb-8">
        <p className="text-gray-600">
          Create and manage tournaments for the golf fantasy league. Set important details such as tournament type (Major, WGC, Match Play),
          dates, and active status.
        </p>
      </div>
      
      <TournamentManagement />
    </div>
  );
}
