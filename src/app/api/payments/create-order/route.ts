import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Initialize Razorpay with your key_id and key_secret from .env.local
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { amount, userId, bookingId } = await request.json();

    // Basic validation
    if (!amount || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise (e.g. 500.00 -> 50000)
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        bookingId: bookingId || 'N/A',
      },
    };

    const order = await razorpay.orders.create(options);
    
    return NextResponse.json(order);
  } catch (error: any) {
    console.error('Razorpay Order Error:', error);
    return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
  }
}
