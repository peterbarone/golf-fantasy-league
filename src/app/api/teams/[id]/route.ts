import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

// GET /api/teams/[id] - Get a specific team by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const teamId = params.id;
    
    // Get team with owner, roster, and lineups
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        teamRoster: {
          include: {
            golfer: true,
          },
        },
        lineups: {
          include: {
            tournament: true,
            golfer: true,
          },
        },
      },
    });
    
    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Allow access if user is admin or team owner
    if (session.user.role !== 'ADMIN' && team.ownerId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    return NextResponse.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/teams/[id] - Update a team (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const teamId = params.id;
    const body = await request.json();
    const { name, ownerId } = body;
    
    // Validate input
    if (!name && !ownerId) {
      return NextResponse.json(
        { error: 'At least one field to update is required' },
        { status: 400 }
      );
    }
    
    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
    });
    
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // If changing owner, verify new owner exists and has no team
    if (ownerId && ownerId !== existingTeam.ownerId) {
      const newOwner = await prisma.user.findUnique({
        where: { id: ownerId },
        include: { team: true },
      });
      
      if (!newOwner) {
        return NextResponse.json(
          { error: 'New owner not found' },
          { status: 404 }
        );
      }
      
      if (newOwner.team && newOwner.team.id !== teamId) {
        return NextResponse.json(
          { error: 'User already owns another team' },
          { status: 400 }
        );
      }
    }
    
    // Update team
    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name }),
        ...(ownerId && { ownerId }),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    
    return NextResponse.json(updatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/teams/[id] - Delete a team (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    // Check authentication
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check for admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }
    
    const teamId = params.id;
    
    // Check if team exists
    const existingTeam = await prisma.team.findUnique({
      where: { id: teamId },
    });
    
    if (!existingTeam) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Delete all related records first
    // 1. Delete lineups
    await prisma.lineup.deleteMany({
      where: { teamId },
    });
    
    // 2. Delete team points
    await prisma.teamPoints.deleteMany({
      where: { teamId },
    });
    
    // 3. Delete team roster entries
    await prisma.teamRoster.deleteMany({
      where: { teamId },
    });
    
    // 4. Delete the team itself
    await prisma.team.delete({
      where: { id: teamId },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting team:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
