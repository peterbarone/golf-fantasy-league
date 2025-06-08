'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface Golfer {
  id: string;
  name: string;
  active: boolean;
}

interface TeamRoster {
  id: string;
  teamId: string;
  golferId: string;
  golfer: Golfer;
}

interface Team {
  id: string;
  name: string;
  owner: User;
  teamRoster: TeamRoster[];
}

export default function TeamsManagement() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showRosterForm, setShowRosterForm] = useState<string | null>(null);
  
  const [newTeam, setNewTeam] = useState({
    name: '',
    ownerId: '',
  });
  
  const [selectedGolfers, setSelectedGolfers] = useState<string[]>([]);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load teams
      const teamsResponse = await fetch('/api/teams');
      if (teamsResponse.ok) {
        const teamsData = await teamsResponse.json();
        setTeams(teamsData);
      } else {
        toast.error('Failed to load teams');
      }
      
      // Load users with OWNER role
      const usersResponse = await fetch('/api/users?role=OWNER');
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        setUsers(usersData);
      } else {
        toast.error('Failed to load users');
      }
      
      // Load active golfers
      const golfersResponse = await fetch('/api/golfers?active=true');
      if (golfersResponse.ok) {
        const golfersData = await golfersResponse.json();
        setGolfers(golfersData);
      } else {
        toast.error('Failed to load golfers');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('An error occurred while loading data');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newTeam.name || !newTeam.ownerId) {
      toast.error('Please provide a team name and select an owner');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTeam),
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('Team created successfully');
        setTeams([...teams, data]);
        setNewTeam({
          name: '',
          ownerId: '',
        });
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        toast.error(`Failed to create team: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('An error occurred while creating the team');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleUpdateRoster = async (teamId: string) => {
    if (!selectedGolfers.length) {
      toast.error('Please select at least one golfer');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/teams/${teamId}/roster`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ golferIds: selectedGolfers }),
      });
      
      if (response.ok) {
        toast.success('Team roster updated successfully');
        loadData(); // Reload all data
        setSelectedGolfers([]);
        setShowRosterForm(null);
      } else {
        const error = await response.json();
        toast.error(`Failed to update roster: ${error.error}`);
      }
    } catch (error) {
      console.error('Error updating roster:', error);
      toast.error('An error occurred while updating the roster');
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Are you sure you want to delete the team "${teamName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success(`Team "${teamName}" deleted successfully`);
        setTeams(teams.filter(team => team.id !== teamId));
      } else {
        const error = await response.json();
        toast.error(`Failed to delete team: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('An error occurred while deleting the team');
    }
  };
  
  const handleGolferSelection = (golferId: string) => {
    if (selectedGolfers.includes(golferId)) {
      setSelectedGolfers(selectedGolfers.filter(id => id !== golferId));
    } else {
      setSelectedGolfers([...selectedGolfers, golferId]);
    }
  };
  
  const handleRemoveGolfer = async (teamId: string, golferId: string, golferName: string) => {
    if (!confirm(`Are you sure you want to remove ${golferName} from this team?`)) {
      return;
    }
    
    try {
      const response = await fetch(`/api/teams/${teamId}/roster/${golferId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast.success(`${golferName} removed from team successfully`);
        
        // Update teams state locally without a full reload
        setTeams(teams.map(team => {
          if (team.id === teamId) {
            return {
              ...team,
              teamRoster: team.teamRoster.filter(tr => tr.golferId !== golferId)
            };
          }
          return team;
        }));
      } else {
        const error = await response.json();
        toast.error(`Failed to remove golfer: ${error.error}`);
      }
    } catch (error) {
      console.error('Error removing golfer:', error);
      toast.error('An error occurred while removing the golfer');
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold mb-2 md:mb-0">Teams</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700"
        >
          {showCreateForm ? 'Cancel' : 'Add New Team'}
        </button>
      </div>
      
      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-3">Create New Team</h3>
          <form onSubmit={handleCreateTeam}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="teamName">
                Team Name
              </label>
              <input
                id="teamName"
                type="text"
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                className="p-2 border border-gray-300 rounded w-full"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="ownerId">
                Team Owner
              </label>
              <select
                id="ownerId"
                value={newTeam.ownerId}
                onChange={(e) => setNewTeam({ ...newTeam, ownerId: e.target.value })}
                className="p-2 border border-gray-300 rounded w-full"
                required
              >
                <option value="">Select an owner</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded mr-2 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ${
                  submitting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {submitting ? 'Creating...' : 'Create Team'}
              </button>
            </div>
          </form>
        </div>
      )}
      
      {teams.length === 0 ? (
        <div className="bg-yellow-50 p-4 rounded">
          <p className="text-yellow-700">No teams found. Create a new team to get started.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {teams.map((team) => (
            <div key={team.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 p-4 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div>
                  <h3 className="text-lg font-medium">{team.name}</h3>
                  <p className="text-sm text-gray-600">
                    Owner: {team.owner.name || team.owner.email}
                  </p>
                </div>
                <div className="mt-2 md:mt-0 flex items-center">
                  <button
                    onClick={() => setShowRosterForm(showRosterForm === team.id ? null : team.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded mr-2 hover:bg-blue-700"
                  >
                    {showRosterForm === team.id ? 'Hide Roster Form' : 'Add to Roster'}
                  </button>
                  <button
                    onClick={() => handleDeleteTeam(team.id, team.name)}
                    className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
              
              {/* Team Roster */}
              <div className="p-4">
                <h4 className="text-md font-medium mb-2">Team Roster ({team.teamRoster.length} golfers)</h4>
                {team.teamRoster.length === 0 ? (
                  <p className="text-sm text-gray-500">No golfers in roster yet.</p>
                ) : (
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {team.teamRoster.map((roster) => (
                      <li key={roster.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span className="text-sm">{roster.golfer.name}</span>
                        <button
                          onClick={() => handleRemoveGolfer(team.id, roster.golferId, roster.golfer.name)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              {/* Add to Roster Form */}
              {showRosterForm === team.id && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <h4 className="text-md font-medium mb-2">Add Golfers to Roster</h4>
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Select golfers to add to the team roster:</p>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded bg-white p-2">
                      {golfers
                        .filter(golfer => !team.teamRoster.some(tr => tr.golferId === golfer.id))
                        .length === 0 ? (
                        <p className="text-sm text-gray-500 p-2">No more active golfers available to add.</p>
                      ) : (
                        golfers
                          .filter(golfer => !team.teamRoster.some(tr => tr.golferId === golfer.id))
                          .map(golfer => (
                            <div key={golfer.id} className="flex items-center p-2 hover:bg-gray-50">
                              <input
                                type="checkbox"
                                id={`golfer-${golfer.id}`}
                                checked={selectedGolfers.includes(golfer.id)}
                                onChange={() => handleGolferSelection(golfer.id)}
                                className="mr-2"
                              />
                              <label htmlFor={`golfer-${golfer.id}`} className="text-sm cursor-pointer">
                                {golfer.name}
                              </label>
                            </div>
                          ))
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <button
                      onClick={() => {
                        setSelectedGolfers([]);
                        setShowRosterForm(null);
                      }}
                      className="px-3 py-1 border border-gray-300 text-gray-700 rounded mr-2 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleUpdateRoster(team.id)}
                      disabled={submitting || selectedGolfers.length === 0}
                      className={`px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 ${
                        submitting || selectedGolfers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {submitting ? 'Adding...' : 'Add Selected Golfers'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
