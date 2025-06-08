'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import LineupSubmissionForm from '@/components/dashboard/LineupSubmissionForm';
import LeagueStandings from '@/components/dashboard/LeagueStandings';

interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface Golfer {
  id: string;
  name: string;
  active: boolean;
}

interface TeamRoster {
  id: string;
  golfer: Golfer;
}

interface Team {
  id: string;
  name: string;
  owner: User;
  teamRoster: TeamRoster[];
}

export default function OwnerDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('lineup');
  
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/login');
      return;
    }
    
    // Only allow owner users
    if (session.user.role !== 'OWNER') {
      router.push('/dashboard');
      return;
    }
    
    loadTeamData();
  }, [session, status, router]);
  
  const loadTeamData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams/owner');
      
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      } else {
        console.error('Failed to load team data');
      }
    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading owner dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Team Dashboard</h1>
      
      {team && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-green-700">{team.name}</h2>
          <p className="text-gray-600">
            Owner: {team.owner.name || team.owner.email}
          </p>
          <p className="text-gray-600">
            Roster Size: {team.teamRoster?.length || 0} golfers
          </p>
        </div>
      )}
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('lineup')}
              className={`py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'lineup'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Tournament Lineup
            </button>
            <button
              onClick={() => setActiveTab('roster')}
              className={`py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'roster'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Team Roster
            </button>
            <button
              onClick={() => setActiveTab('standings')}
              className={`py-4 px-1 border-b-2 font-medium text-sm
                ${activeTab === 'standings'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              League Standings
            </button>
          </nav>
        </div>
      </div>
      
      <div className="mt-8">
        {activeTab === 'lineup' && (
          <LineupSubmissionForm maxGolfers={4} onSubmissionSuccess={loadTeamData} />
        )}
        
        {activeTab === 'roster' && team && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Team Roster</h3>
            
            {team.teamRoster?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Golfer Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {team.teamRoster.map((roster) => (
                      <tr key={roster.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {roster.golfer.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {roster.golfer.active ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                              Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500">No golfers in your team roster yet.</p>
            )}
          </div>
        )}
        
        {activeTab === 'standings' && (
          <LeagueStandings highlightUserId={session?.user?.email} />
        )}
      </div>
    </div>
  );
}
