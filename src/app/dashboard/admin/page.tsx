'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';

// Define types for our data
interface User {
  id: string;
  email: string;
  name?: string | null;
}

interface Golfer {
  id: string;
  name: string;
}

interface TeamRoster {
  id: string;
  golfer: Golfer;
}

interface Team {
  id: string;
  name: string;
  owner: User;
  teamRoster?: TeamRoster[];
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  isMajor: boolean;
  isWGC: boolean;
  isMatchPlay: boolean;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  
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
    
    // Fetch admin dashboard data
    const fetchAdminData = async () => {
      try {
        // Get teams
        const teamsResponse = await fetch('/api/teams');
        if (teamsResponse.ok) {
          const teamsData = await teamsResponse.json();
          setTeams(teamsData);
        }
        
        // Get tournaments
        const tournamentsResponse = await fetch('/api/tournaments');
        if (tournamentsResponse.ok) {
          const tournamentsData = await tournamentsResponse.json();
          setTournaments(tournamentsData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching admin data:', error);
        setLoading(false);
      }
    };
    
    fetchAdminData();
  }, [session, status, router]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-t-4 border-green-500 border-solid rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <div className="bg-green-50 border-l-4 border-green-500 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-green-700">Teams</h2>
          <p className="text-2xl font-bold mt-2">{teams.length}</p>
          <p className="text-sm text-green-600">Total teams in the league</p>
        </div>
        
        <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-blue-700">Tournaments</h2>
          <p className="text-2xl font-bold mt-2">{tournaments.length}</p>
          <p className="text-sm text-blue-600">Total tournaments in the season</p>
        </div>
        
        <div className="bg-purple-50 border-l-4 border-purple-500 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-purple-700">Active Tournament</h2>
          <p className="text-2xl font-bold mt-2">
            {tournaments.filter(t => t.isActive).length ? 'Yes' : 'No'}
          </p>
          <p className="text-sm text-purple-600">Tournament currently in progress</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Teams Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Teams Management</h2>
            <Link 
              href="/dashboard/admin/teams" 
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Manage Teams
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Golfers</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teams.length > 0 ? (
                  teams.slice(0, 5).map((team) => (
                    <tr key={team.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{team.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{team.owner.name || team.owner.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {team.teamRoster ? team.teamRoster.length : 0}/12
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No teams found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Tournament Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Tournament Management</h2>
            <Link 
              href="/dashboard/admin/tournaments/new" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm"
            >
              Create Tournament
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tournaments.length > 0 ? (
                  tournaments.slice(0, 5).map((tournament) => (
                    <tr key={tournament.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link href={`/dashboard/admin/tournaments/${tournament.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                          {tournament.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tournament.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tournament.isActive ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        ) : new Date(tournament.endDate) < new Date() ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            Completed
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            Upcoming
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tournament.isMajor ? 'Major' : tournament.isWGC ? 'WGC' : tournament.isMatchPlay ? 'Match Play' : 'Regular'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No tournaments found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/dashboard/admin/users" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">Manage Users</h3>
              <p className="text-gray-500 text-sm">Create users and assign owner/admin roles</p>
            </Link>
            
            <Link 
              href="/dashboard/admin/teams" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">Manage Teams</h3>
              <p className="text-gray-500 text-sm">Create teams and manage team rosters</p>
            </Link>
            
            <Link 
              href="/dashboard/admin/golfers" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">Manage Golfers</h3>
              <p className="text-gray-500 text-sm">Add or edit PGA golfers in the database</p>
            </Link>
            
            <Link 
              href="/dashboard/admin/results" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">Input Results</h3>
              <p className="text-gray-500 text-sm">Enter tournament results for golfers</p>
            </Link>
            
            <Link 
              href="/dashboard/admin/points" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">Calculate Points</h3>
              <p className="text-gray-500 text-sm">Process tournament results and update standings</p>
            </Link>
            
            <Link 
              href="/dashboard/admin/skins" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">Skins Management</h3>
              <p className="text-gray-500 text-sm">Manage weekly skins and carry-over</p>
            </Link>
            
            <Link 
              href="/dashboard/admin/lineups" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">View Lineups</h3>
              <p className="text-gray-500 text-sm">See all team lineups for tournaments</p>
            </Link>
            
            <Link 
              href="/dashboard/admin/standings" 
              className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="font-medium text-lg mb-2">Season Standings</h3>
              <p className="text-gray-500 text-sm">View current season points and rankings</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
