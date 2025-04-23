import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    
    // Reuse the same credentials validation logic from authOptions
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectDB();
    
    // Use the same user lookup logic
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'No user found with this email' },
        { status: 401 }
      );
    }
    
    // Use the same password validation logic
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid password' },
        { status: 401 }
      );
    }
    
    // Return the same user object format that NextAuth would use
    const userForClient = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: userForClient,
    });
  } catch (error) {
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, message: 'Authentication failed' },
      { status: 500 }
    );
  }
}