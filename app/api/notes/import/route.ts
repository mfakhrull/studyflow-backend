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

// POST /api/notes/import - Import a note (copy from QR, assign to current user)
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
    
    // Create a new note for this user (do not copy the original _id)
    const note = await Note.create({ userId, title, content });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Error importing note:', error);
    return NextResponse.json({ error: 'Failed to import note' }, { status: 500 });
  }
}
