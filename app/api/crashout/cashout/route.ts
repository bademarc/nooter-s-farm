import { NextResponse } from 'next/server';
import { cashout } from '@/lib/crashout-game-engine';

export async function POST(request: Request) {
  console.log('POST /api/crashout/cashout');
  try {
    const { username } = await request.json();
    
    // Basic validation
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }
    
    // Call the engine function to handle cashout logic
    const result = cashout(username);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Cashed out successfully',
        multiplier: result.multiplier,
        winnings: result.winnings,
        balance: result.balance
      });
    } else {
      // Return specific error from engine
      return NextResponse.json(
        { error: result.error || 'Failed to cash out' }, 
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error cashing out:', error);
     let message = 'Failed to cash out';
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