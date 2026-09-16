import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { amount, userId, bookingId, paymentType, planId } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        {
          error: "Invalid amount.",
        },
        {
          status: 400,
        }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          error: "User ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const isSubscription = paymentType === "subscription";

    if (!isSubscription && !bookingId) {
      return NextResponse.json(
        {
          error: "Booking ID is required for booking payments.",
        },
        {
          status: 400,
        }
      );
    }

    // Razorpay expects amount in paise.
    const amountInPaise = Math.round(Number(amount) * 100);

    const receipt = isSubscription
      ? `sub_${planId || 'plan'}_${Date.now()}`
      : `booking_${bookingId}`;

    const notes: Record<string, string> = {
      userId: String(userId),
      paymentType: isSubscription ? "subscription" : "booking",
    };

    if (isSubscription) {
      notes.planId = String(planId || "");
    } else {
      notes.bookingId = String(bookingId || "");
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt,
      notes,
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);

    return NextResponse.json(
      {
        error: "Failed to create Razorpay order.",
      },
      {
        status: 500,
      }
    );
  }
}