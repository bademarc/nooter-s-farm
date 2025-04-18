import { NextResponse } from 'next/server';
import { placeBet } from '@/lib/crashout-game-engine';

export async function POST(request: Request) {
  console.log('POST /api/crashout/place-bet');
  try {
    const { betAmount, autoCashout, username } = await request.json();
    
    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid username' }, { status: 400 });
    }
    if (typeof betAmount !== 'number' || betAmount <= 0) {
      return NextResponse.json({ error: 'Invalid bet amount' }, { status: 400 });
    }
    const parsedAutoCashout = typeof autoCashout === 'string' ? parseFloat(autoCashout) : (typeof autoCashout === 'number' ? autoCashout : null);
    if (parsedAutoCashout !== null && (isNaN(parsedAutoCashout) || parsedAutoCashout < 1.01)) {
        return NextResponse.json({ error: 'Invalid auto cashout multiplier (must be >= 1.01 or empty)' }, { status: 400 });
    }
    
    const result = placeBet(username, betAmount, parsedAutoCashout);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Bet placed successfully',
        balance: result.balance
      });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to place bet' }, 
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Error placing bet:', error);
    let message = 'Failed to place bet';
    if (error instanceof SyntaxError) {
        message = 'Invalid request body';
        return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
} 