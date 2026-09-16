import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServerClient } from "@supabase/ssr";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      bookingId,
      userId,
      amount,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentType,
      planName,
    } = body;

    const isSubscription = paymentType === "subscription";

    if (
      (!isSubscription && !bookingId) ||
      !userId ||
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing payment verification data.",
        },
        {
          status: 400,
        }
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is missing.");

      return NextResponse.json(
        {
          success: false,
          error: "Payment configuration error.",
        },
        {
          status: 500,
        }
      );
    }

    // Create the signature using Razorpay order ID + payment ID
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Timing-safe comparison
    const receivedBuffer = Buffer.from(razorpay_signature, "utf8");
    const generatedBuffer = Buffer.from(generatedSignature, "utf8");

    const isValid =
      receivedBuffer.length === generatedBuffer.length &&
      crypto.timingSafeEqual(receivedBuffer, generatedBuffer);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid payment signature.",
        },
        {
          status: 400,
        }
      );
    }

    // Create server client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    });

    // Insert payment record in payments table
    const { error: dbError } = await supabase.from("payments").insert({
      user_id: userId,
      booking_id: isSubscription ? null : bookingId,
      amount: amount || 0,
      status: "success",
      payment_method: "razorpay",
      razorpay_order_id,
      razorpay_payment_id,
    });

    if (dbError) {
      console.error("Database insert error:", dbError);
    }

    // If payment type is subscription, update user's active subscription
    if (isSubscription && planName) {
      // Deactivate existing active subscriptions for the user
      await supabase
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("user_id", userId)
        .eq("status", "active");

      // Calculate start and end date (1 month)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const { error: subError } = await supabase.from("subscriptions").insert({
        user_id: userId,
        plan: planName,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
      });

      if (subError) {
        console.error("Subscription insert error:", subError);
        return NextResponse.json(
          {
            success: false,
            error: "Payment verified, but failed to activate subscription.",
          },
          {
            status: 500,
          }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
    });
  } catch (error) {
    console.error("Payment verification error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Payment verification failed.",
      },
      {
        status: 500,
      }
    );
  }
}