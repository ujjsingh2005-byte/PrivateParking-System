import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Setup Supabase with Service Role Key for backend updates
// This key allows bypassing RLS so we can update the payment status
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, bookingId } = await request.json();

    // 1. Signature verification
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    if (!isAuthentic) {
      return NextResponse.json({ error: 'Signature mismatch' }, { status: 400 });
    }

    // 2. Perform DB update (Payment succeeded)
    if (bookingId) {
      const { error: paymentError } = await supabaseAdmin
        .from('payments')
        .update({ status: 'success', razorpay_payment_id })
        .eq('razorpay_order_id', razorpay_order_id);

      if (paymentError) throw paymentError;

      // Update booking status if necessary
      await supabaseAdmin.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId);
    }

    return NextResponse.json({ success: true, payment_id: razorpay_payment_id });
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    return NextResponse.json({ error: error.message || 'Payment verification failed' }, { status: 500 });
  }
}
