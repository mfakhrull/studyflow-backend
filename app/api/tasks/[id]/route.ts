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

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    // Get userId using our helper function
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const taskId = params.id;
    
    // Find task by ID and ensure it belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json({ task }, { status: 200 });
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    // Get userId using our helper function
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const taskId = params.id;
    const body = await req.json();
    
    // Find task by ID and ensure it belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Update task
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      { ...body },
      { new: true, runValidators: true }
    );
    
    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    
    // Get userId using our helper function
    const userId = await getUserId(req);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const taskId = params.id;
    
    // Find task by ID and ensure it belongs to the user
    const task = await Task.findOne({ _id: taskId, userId });
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    // Delete task
    await Task.findByIdAndDelete(taskId);
    
    return NextResponse.json({ message: 'Task deleted' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}