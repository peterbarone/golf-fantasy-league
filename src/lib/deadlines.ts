import { Tournament } from '@prisma/client';

// Constants for deadline times
const ROSTER_DEADLINE_DAY = 2; // Tuesday
const ROSTER_DEADLINE_HOUR = 19; // 7 PM
const LINEUP_DEADLINE_DAY = 4; // Thursday
const LINEUP_DEADLINE_HOUR = 7; // 7 AM

/**
 * Check if roster changes are allowed for a tournament
 * @param tournament Tournament to check
 * @returns boolean indicating if roster changes are allowed
 */
export function canModifyRoster(tournament: Tournament): boolean {
  const now = new Date();
  const tournamentStart = new Date(tournament.startDate);
  
  // Set deadline to Tuesday 7 PM of tournament week
  const deadline = new Date(tournamentStart);
  deadline.setDate(deadline.getDate() - (deadline.getDay() - ROSTER_DEADLINE_DAY));
  deadline.setHours(ROSTER_DEADLINE_HOUR, 0, 0, 0);

  return now < deadline;
}

/**
 * Check if lineup changes are allowed for a tournament
 * @param tournament Tournament to check
 * @returns boolean indicating if lineup changes are allowed
 */
export function canModifyLineup(tournament: Tournament): boolean {
  const now = new Date();
  const tournamentStart = new Date(tournament.startDate);
  
  // Set deadline to Thursday 7 AM of tournament week
  const deadline = new Date(tournamentStart);
  deadline.setDate(deadline.getDate() - (deadline.getDay() - LINEUP_DEADLINE_DAY));
  deadline.setHours(LINEUP_DEADLINE_HOUR, 0, 0, 0);

  return now < deadline;
}

/**
 * Get the next deadline for a tournament
 * @param tournament Tournament to check
 * @returns Object with deadline type and timestamp
 */
export function getNextDeadline(tournament: Tournament): {
  type: 'roster' | 'lineup' | 'tournament_start';
  deadline: Date;
} {
  const now = new Date();
  const tournamentStart = new Date(tournament.startDate);
  
  // Calculate roster deadline (Tuesday 7 PM)
  const rosterDeadline = new Date(tournamentStart);
  rosterDeadline.setDate(rosterDeadline.getDate() - (rosterDeadline.getDay() - ROSTER_DEADLINE_DAY));
  rosterDeadline.setHours(ROSTER_DEADLINE_HOUR, 0, 0, 0);

  // Calculate lineup deadline (Thursday 7 AM)
  const lineupDeadline = new Date(tournamentStart);
  lineupDeadline.setDate(lineupDeadline.getDate() - (lineupDeadline.getDay() - LINEUP_DEADLINE_DAY));
  lineupDeadline.setHours(LINEUP_DEADLINE_HOUR, 0, 0, 0);

  // Return the next upcoming deadline
  if (now < rosterDeadline) {
    return { type: 'roster', deadline: rosterDeadline };
  } else if (now < lineupDeadline) {
    return { type: 'lineup', deadline: lineupDeadline };
  } else {
    return { type: 'tournament_start', deadline: tournamentStart };
  }
}

/**
 * Format a deadline date into a human-readable string
 * @param date Date to format
 * @returns Formatted string (e.g. "Tuesday, June 7 at 7:00 PM")
 */
export function formatDeadline(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}
