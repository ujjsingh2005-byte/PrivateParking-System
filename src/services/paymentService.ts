export const initiatePayment = async (amount: number, userId: string, bookingId?: string) => {
  const response = await fetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, userId, bookingId }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to initiate payment');
  }

  return response.json();
};

export const verifyPayment = async (paymentResponse: any, userId: string, bookingId?: string) => {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...paymentResponse,
      userId,
      bookingId
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Payment verification failed');
  }

  return response.json();
};
