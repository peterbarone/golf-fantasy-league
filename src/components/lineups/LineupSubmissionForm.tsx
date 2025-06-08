'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface Golfer {
  id: string;
  name: string;
}

interface TeamRoster {
  id: string;
  golfer: Golfer;
}

interface Tournament {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isMajor: boolean;
  isWGC: boolean;
  isMatchPlay: boolean;
}

interface LineupSubmissionFormProps {
  tournament: Tournament;
  teamRoster: TeamRoster[];
  existingLineup?: Array<{ golfer: Golfer }>;
}

export default function LineupSubmissionForm({ 
  tournament, 
  teamRoster,
  existingLineup = []
}: LineupSubmissionFormProps) {
  const router = useRouter();
  const [selectedGolfers, setSelectedGolfers] = useState<string[]>(
    existingLineup.map(item => item.golfer.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deadline, setDeadline] = useState<Date | null>(null);
  const [deadlinePassed, setDeadlinePassed] = useState(false);
  
  // Maximum golfers in a tournament lineup
  const MAX_LINEUP_SIZE = 6;
  
  useEffect(() => {
    if (tournament?.startDate) {
      const tournamentStart = new Date(tournament.startDate);
      setDeadline(tournamentStart);
      setDeadlinePassed(new Date() >= tournamentStart);
    }
  }, [tournament]);
  
  const handleGolferSelection = (golferId: string) => {
    setSelectedGolfers(prev => {
      if (prev.includes(golferId)) {
        // Remove golfer if already selected
        return prev.filter(id => id !== golferId);
      } else if (prev.length < MAX_LINEUP_SIZE) {
        // Add golfer if under max limit
        return [...prev, golferId];
      } else {
        // Max reached, show notification
        toast.error(`Maximum of ${MAX_LINEUP_SIZE} golfers allowed in tournament lineup`);
        return prev;
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (deadlinePassed) {
      toast.error('Lineup submissions are closed for this tournament');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/lineups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId: tournament.id,
          golferIds: selectedGolfers,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to submit lineup');
      }
      
      toast.success('Tournament lineup submitted successfully!');
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while submitting your lineup');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Format deadline date for display
  const formattedDeadline = deadline 
    ? new Date(deadline).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'TBD';
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">
        {tournament.name} Lineup Submission
      </h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Submission Deadline: <span className="font-medium">{formattedDeadline}</span>
        </p>
        <p className="text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedGolfers.length}/{MAX_LINEUP_SIZE}</span>
        </p>
      </div>
      
      {deadlinePassed ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md mb-4">
          Lineup submissions are closed for this tournament.
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4 max-h-80 overflow-y-auto border rounded-md p-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="py-2 px-3 text-left">Select</th>
                  <th className="py-2 px-3 text-left">Golfer Name</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {teamRoster.map(item => (
                  <tr key={item.id} className={selectedGolfers.includes(item.golfer.id) ? 'bg-blue-50' : ''}>
                    <td className="py-2 px-3">
                      <input 
                        type="checkbox" 
                        checked={selectedGolfers.includes(item.golfer.id)}
                        onChange={() => handleGolferSelection(item.golfer.id)}
                        disabled={deadlinePassed}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="py-2 px-3">{item.golfer.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <button 
            type="submit"
            disabled={isSubmitting || deadlinePassed || selectedGolfers.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Lineup'}
          </button>
        </form>
      )}
    </div>
  );
}
