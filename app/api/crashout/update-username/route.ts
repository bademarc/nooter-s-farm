import { NextResponse } from 'next/server';
// import { getPusherServer } from '@/utils/pusher-server';
import { updateUserUsername } from '@/lib/crashout-game-engine'; // Import from engine

// Remove static export if present
// export const dynamic = 'force-static';

// Remove local state if present
// const activeUsers = new Set<string>();

export async function POST(request: Request) {
  console.log('POST /api/crashout/update-username');
  try {
    // Get request body
    const data = await request.json();
    // Engine expects oldUsername (optional) and newUsername
    const { username: newUsername, oldUsername } = data; 
    
    // Basic validation for new username
    if (!newUsername || typeof newUsername !== 'string' || newUsername.trim().length === 0 || newUsername.length > 20) {
      return NextResponse.json(
        { error: 'Invalid new username provided' },
        { status: 400 }
      );
    }
    
    // Call the engine function
    const result = updateUserUsername(oldUsername, newUsername);

    if (result.success) {
        return NextResponse.json({
            success: true,
            username: newUsername // Return the confirmed new username
        });
    } else {
         return NextResponse.json(
            { error: result.error || 'Failed to update username' }, 
            { status: 400 } // Use 400 for logic errors
         );
    }

  } catch (error) {
    console.error('Error updating username route:', error);
    let message = 'Failed to update username';
    if (error instanceof SyntaxError) { // Handle JSON parsing error
        message = 'Invalid request body';
        return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 