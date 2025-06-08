'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface Golfer {
  id: string;
  name: string;
}

interface TournamentGolfer {
  id: string;
  name: string;
  isSelected: boolean;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

interface LineupSubmissionFormProps {
  maxGolfers?: number;
  onSubmissionSuccess?: () => void;
}

export default function LineupSubmissionForm({ 
  maxGolfers = 4, 
  onSubmissionSuccess 
}: LineupSubmissionFormProps) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [teamGolfers, setTeamGolfers] = useState<TournamentGolfer[]>([]);
  const [submittedGolfers, setSubmittedGolfers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  
  useEffect(() => {
    loadUpcomingTournament();
  }, []);
  
  const loadUpcomingTournament = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tournaments/upcoming');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data) {
          setTournament(data.tournament);
          
          // Check if deadline has passed
          const tournamentStart = new Date(data.tournament.startDate);
          const now = new Date();
          setDeadlinePassed(now >= tournamentStart);
          
          // Load team roster and mark already submitted golfers
          await loadTeamRoster();
          
          // If there's a lineup, mark those golfers as selected
          if (data.lineup && data.lineup.length > 0) {
            const submittedIds = data.lineup.map((entry: any) => entry.golferId);
            setSubmittedGolfers(submittedIds);
          }
        }
      } else {
        toast.error('Failed to load upcoming tournament');
      }
    } catch (error) {
      console.error('Error loading upcoming tournament:', error);
      toast.error('An error occurred while loading tournament data');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTeamRoster = async () => {
    try {
      const response = await fetch('/api/teams/owner');
      
      if (response.ok) {
        const data = await response.json();
        if (data.roster) {
          const formattedGolfers: TournamentGolfer[] = data.roster.map((entry: any) => ({
            id: entry.golfer.id,
            name: entry.golfer.name,
            isSelected: false
          }));
          setTeamGolfers(formattedGolfers);
        }
      } else {
        toast.error('Failed to load team roster');
      }
    } catch (error) {
      console.error('Error loading team roster:', error);
      toast.error('An error occurred while loading team data');
    }
  };
  
  useEffect(() => {
    // Mark previously submitted golfers as selected when data loads
    if (submittedGolfers.length > 0 && teamGolfers.length > 0) {
      setTeamGolfers(prevGolfers => 
        prevGolfers.map(golfer => ({
          ...golfer,
          isSelected: submittedGolfers.includes(golfer.id)
        }))
      );
    }
  }, [submittedGolfers, teamGolfers.length]);
  
  const handleGolferSelect = (golferId: string) => {
    if (deadlinePassed) {
      toast.error('Lineup submission deadline has passed');
      return;
    }
    
    setTeamGolfers(prevGolfers => {
      const updatedGolfers = [...prevGolfers];
      const golferIndex = updatedGolfers.findIndex(g => g.id === golferId);
      
      if (golferIndex === -1) return prevGolfers;
      
      const golfer = updatedGolfers[golferIndex];
      const selectedCount = updatedGolfers.filter(g => g.isSelected).length;
      
      // Toggle selection if already selected or if under max limit
      if (golfer.isSelected || selectedCount < maxGolfers) {
        updatedGolfers[golferIndex] = {
          ...golfer,
          isSelected: !golfer.isSelected
        };
      } else {
        toast.error(`You can only select ${maxGolfers} golfers`);
      }
      
      return updatedGolfers;
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deadlinePassed) {
      toast.error('Lineup submission deadline has passed');
      return;
    }
    
    if (!tournament) {
      toast.error('No active tournament available');
      return;
    }
    
    const selectedGolfers = teamGolfers.filter(golfer => golfer.isSelected);
    
    if (selectedGolfers.length !== maxGolfers) {
      toast.error(`Please select exactly ${maxGolfers} golfers`);
      return;
    }
    
    try {
      setSubmitting(true);
      
      const response = await fetch('/api/lineups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          golferIds: selectedGolfers.map(golfer => golfer.id),
        }),
      });
      
      if (response.ok) {
        toast.success('Lineup submitted successfully!');
        setSubmittedGolfers(selectedGolfers.map(golfer => golfer.id));
        if (onSubmissionSuccess) {
          onSubmissionSuccess();
        }
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit lineup');
      }
    } catch (error: any) {
      toast.error(error.message || 'Error submitting lineup');
    } finally {
      setSubmitting(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
  
  if (!tournament) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-6">Tournament Lineup</h2>
        <p className="text-gray-500">No upcoming tournaments scheduled.</p>
      </div>
    );
  }
  
  const selectedCount = teamGolfers.filter(golfer => golfer.isSelected).length;
  const isLineupSubmitted = submittedGolfers.length === maxGolfers;
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-2">Tournament Lineup</h2>
      <div className="mb-6">
        <h3 className="font-medium text-lg">{tournament.name}</h3>
        <p className="text-gray-600">
          {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
        </p>
        
        {deadlinePassed && (
          <div className="mt-2 bg-yellow-50 p-2 rounded text-yellow-700 text-sm">
            Lineup submission deadline has passed. Tournament has started.
          </div>
        )}
        
        {isLineupSubmitted && (
          <div className="mt-2 bg-green-50 p-2 rounded text-green-700 text-sm">
            Your lineup has been submitted for this tournament.
          </div>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select {maxGolfers} golfers from your roster ({selectedCount}/{maxGolfers}):
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {teamGolfers.map((golfer) => (
              <div
                key={golfer.id}
                onClick={() => handleGolferSelect(golfer.id)}
                className={`
                  p-3 rounded-lg border cursor-pointer transition-colors
                  ${golfer.isSelected 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                  }
                `}
              >
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={golfer.isSelected}
                    onChange={() => {}} // Handled by parent div onClick
                    className="h-4 w-4 text-blue-600 rounded"
                    readOnly
                  />
                  <label className="ml-2 text-sm text-gray-900 cursor-pointer">
                    {golfer.name}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={selectedCount !== maxGolfers || submitting || deadlinePassed}
            className={`
              px-4 py-2 rounded text-white 
              ${selectedCount !== maxGolfers || deadlinePassed
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
              }
            `}
          >
            {submitting ? 'Submitting...' : isLineupSubmitted ? 'Update Lineup' : 'Submit Lineup'}
          </button>
        </div>
      </form>
    </div>
  );
}
