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

// GET /api/notes - List notes for current user
export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const notes = await Note.find({ userId }).sort({ updatedAt: -1 });
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
  }
}

// POST /api/notes - Create a new note for current user
export async function POST(req: NextRequest) {
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
    
    const note = await Note.create({ userId, title, content });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
