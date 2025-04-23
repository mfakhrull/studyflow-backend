import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
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
    await connectDB();
    const userExists = await User.findById(userId);
    if (userExists) {
      return userId;
    }
  }
  
  // No valid authentication found
  return null;
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get userId using our helper function
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Find all tasks for this user
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
    
    return NextResponse.json({ tasks }, { status: 200 });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    // Get userId using our helper function
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await req.json();
    
    const { title, description, dueDate, priority } = body;
    
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    
    // Create new task
    const task = await Task.create({
      title,
      description,
      dueDate,
      priority,
      userId
    });
    
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}