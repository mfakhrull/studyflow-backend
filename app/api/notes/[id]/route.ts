import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import User from '@/models/User';

// Helper function to get userId either from session or from headers
async function getUserId(req: NextRequest) {
  // First try to get user from NextAuth session (web app)
  const session = await getServerSession(authOptions);
  if (session?.user) {
    return session.user.id;
  }
  
  // If no session, try to get userId from request headers (mobile app)
  const userId = req.headers.get('x-user-id');
  if (userId) {
    // Verify the userId is valid by checking in the database
    await dbConnect();
    const userExists = await User.findById(userId);
    if (userExists) {
      return userId;
    }
  }
  
  // No valid authentication found
  return null;
}

// GET /api/notes/:id - Get a single note (if owned by user)
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const note = await Note.findOne({ _id: params.id, userId });
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }
    
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Failed to fetch note' }, { status: 500 });
  }
}

// PUT /api/notes/:id - Update a note (if owned by user)
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { title, content } = await req.json();
    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content required' }, { status: 400 });
    }
    
    const note = await Note.findOneAndUpdate(
      { _id: params.id, userId },
      { title, content },
      { new: true }
    );
    
    if (!note) {
      return NextResponse.json({ error: 'Note not found or not owned' }, { status: 404 });
    }
    
    return NextResponse.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE /api/notes/:id - Delete a note (if owned by user)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbConnect();
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const note = await Note.findOneAndDelete({ _id: params.id, userId });
    if (!note) {
      return NextResponse.json({ error: 'Note not found or not owned' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
