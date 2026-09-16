"use client";

import { useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentButtonProps {
  userId: string;
  bookingId: string;
  amount: number;
  onPaymentSuccess?: (paymentResponse: any) => void;
}

export default function PaymentButton({
  userId,
  bookingId,
  amount,
  onPaymentSuccess,
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  const handlePayment = async () => {
    // Prevent multiple clicks
    if (loading) {
      return;
    }

    // Check Razorpay script
    if (!scriptLoaded || !window.Razorpay) {
      alert("Payment gateway is still loading. Please try again.");
      return;
    }

    // Validate user
    if (!userId) {
      alert("User information is missing.");
      return;
    }

    // Validate booking
    if (!bookingId) {
      alert("Booking information is missing.");
      return;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      alert("Invalid payment amount.");
      return;
    }

    // Get public Razorpay Key ID
    const razorpayKeyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

    if (!razorpayKeyId) {
      console.error(
        "NEXT_PUBLIC_RAZORPAY_KEY_ID is missing."
      );

      alert(
        "Razorpay configuration is missing. Please check your .env.local file."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * STEP 1
       * Ask the backend to create a Razorpay order.
       *
       * IMPORTANT:
       * Razorpay order creation must happen on the server.
       */
      const orderResponse = await fetch(
        "/api/payments/create-order",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            amount,
            userId,
            bookingId,
          }),
        }
      );

      const orderData = await orderResponse.json();

      /*
       * Check server response.
       */
      if (!orderResponse.ok) {
        throw new Error(
          orderData?.error ||
            "Failed to create Razorpay order."
        );
      }

      /*
       * Razorpay Order ID is mandatory.
       */
      if (!orderData?.id) {
        throw new Error(
          "Razorpay Order ID was not returned by the server."
        );
      }

      console.log(
        "Razorpay order created:",
        orderData.id
      );

      /*
       * STEP 2
       * Configure Razorpay Checkout.
       */
      const razorpayOptions = {
        key: razorpayKeyId,

        /*
         * Amount comes from the Razorpay order.
         * Razorpay expects the amount in paise.
         */
        amount: orderData.amount,

        currency: orderData.currency || "INR",

        name: "Private Parking System",

        description: "Parking Spot Booking",

        order_id: orderData.id,

        /*
         * Customer information.
         * The backend can optionally return these values.
         */
        prefill: {
          name: orderData.user?.name || "",
          email: orderData.user?.email || "",
          contact: orderData.user?.phone || "",
        },

        /*
         * Additional information attached to checkout.
         */
        notes: {
          bookingId: String(bookingId),
          userId: String(userId),
        },

        theme: {
          color: "#2563eb",
        },

        /*
         * STEP 3
         *
         * Razorpay calls this function after
         * successful payment.
         */
        handler: async function (
          paymentResponse: any
        ) {
          console.log(
            "Razorpay payment response:",
            paymentResponse
          );

          try {
            /*
             * Make sure Razorpay returned all
             * required payment information.
             */
            if (
              !paymentResponse?.razorpay_order_id ||
              !paymentResponse?.razorpay_payment_id ||
              !paymentResponse?.razorpay_signature
            ) {
              throw new Error(
                "Incomplete payment response received from Razorpay."
              );
            }

            /*
             * STEP 4
             *
             * Send payment details to the backend.
             *
             * The backend will verify the Razorpay
             * signature using RAZORPAY_KEY_SECRET.
             */
            const verifyResponse = await fetch(
              "/api/payments/verify",
              {
                method: "POST",

                headers: {
                  "Content-Type": "application/json",
                },

                body: JSON.stringify({
                  razorpay_order_id:
                    paymentResponse.razorpay_order_id,

                  razorpay_payment_id:
                    paymentResponse.razorpay_payment_id,

                  razorpay_signature:
                    paymentResponse.razorpay_signature,

                  bookingId,

                  userId,

                  amount,
                }),
              }
            );

            const verifyData =
              await verifyResponse.json();

            /*
             * Payment verification failed.
             */
            if (
              !verifyResponse.ok ||
              !verifyData?.success
            ) {
              throw new Error(
                verifyData?.error ||
                  "Payment verification failed."
              );
            }

            /*
             * IMPORTANT:
             *
             * At this point the SERVER has verified
             * the Razorpay payment signature.
             *
             * Only now should the booking be
             * considered successfully paid.
             */
            console.log(
              "Payment verified successfully."
            );

            alert(
              "Payment successful! Your parking booking has been confirmed."
            );

            /*
             * Tell the parent booking component that
             * payment has been successfully verified.
             */
            if (onPaymentSuccess) {
              onPaymentSuccess(paymentResponse);
            }
          } catch (error) {
            console.error(
              "Payment verification error:",
              error
            );

            alert(
              error instanceof Error
                ? error.message
                : "Payment verification failed. Please contact support."
            );
          } finally {
            setLoading(false);
          }
        },

        /*
         * User closes the Razorpay window without
         * completing payment.
         */
        modal: {
          ondismiss: function () {
            console.log(
              "Razorpay Checkout closed by user."
            );

            setLoading(false);
          },
        },
      };

      /*
       * STEP 5
       * Create Razorpay Checkout instance.
       */
      const razorpay =
        new window.Razorpay(razorpayOptions);

      /*
       * Handle failed payments.
       */
      razorpay.on(
        "payment.failed",
        function (response: any) {
          console.error(
            "Razorpay payment failed:",
            response?.error
          );

          setLoading(false);

          alert(
            response?.error?.description ||
              "Payment failed. Please try again."
          );
        }
      );

      /*
       * STEP 6
       * Open Razorpay Checkout.
       */
      razorpay.open();
    } catch (error) {
      console.error(
        "Payment initialization failed:",
        error
      );

      setLoading(false);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to initialize payment gateway."
      );
    }
  };

  return (
    <>
      {/* Razorpay Checkout Script */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log(
            "Razorpay Checkout loaded successfully."
          );

          setScriptLoaded(true);
        }}
        onError={() => {
          console.error(
            "Failed to load Razorpay Checkout."
          );

          setScriptLoaded(false);

          alert(
            "Unable to load Razorpay payment gateway."
          );
        }}
      />

      {/* Payment Button */}
      <button
        type="button"
        onClick={handlePayment}
        disabled={loading || !scriptLoaded}
        className="bg-blue-600 text-white px-4 py-2 rounded font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "Processing..."
          : !scriptLoaded
          ? "Loading Payment..."
          : `Pay ₹${amount}`}
      </button>
    </>
  );
}