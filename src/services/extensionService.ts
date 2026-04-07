import { supabase } from '@/lib/supabase';
import { differenceInMinutes, addMinutes } from 'date-fns';
import { sendNotification } from './notificationService';

export const extendBooking = async (bookingId: string) => {
  // Fetch current booking
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('end_time, extension_count, slot_id')
    .eq('id', bookingId)
    .single();

  if (fetchError || !booking) {
    throw new Error('Booking not found');
  }

  const endTime = new Date(booking.end_time);
  const now = new Date();

  // Rule: Can only extend in the last 30 minutes
  const minsUntilEnd = differenceInMinutes(endTime, now);
  
  if (minsUntilEnd > 30 || minsUntilEnd < 0) {
    throw new Error('Extension is only allowed in the last 30 minutes of the booking.');
  }

  // Next we need to ensure the slot isn't booked by someone else right after
  // The system rules state: "During extension window: Other users cannot book that slot immediately after end_time"
  // So we just add 30 mins to end_time and check if it overlaps.
  
  const newEndTime = addMinutes(endTime, 30);
  
  // Overlap condition: (new_start < existing_end AND new_end > existing_start)
  // Our new_start is the current end_time. Our new_end is newEndTime
  const { data: overlaps, error: overlapError } = await supabase
    .from('bookings')
    .select('id')
    .eq('slot_id', booking.slot_id)
    .neq('id', bookingId) // don't check against self
    .in('status', ['confirmed'])
    .lt('start_time', newEndTime.toISOString())
    .gt('end_time', endTime.toISOString());

  if (overlapError) {
    throw overlapError;
  }

  if (overlaps && overlaps.length > 0) {
    throw new Error('Cannot extend: The slot is already booked immediately after your session.');
  }

  // Pricing Rule:
  // First extension -> normal rate
  // Second and further -> penalty rate
  const extensionCount = booking.extension_count || 0;
  const isPenalty = extensionCount >= 1;

  // Ideally, process payment here if isPenalty is true, or if normal rate needs to be billed.
  // For now, we assume payment is handled before this logic or bundled.
  
  const surcharge = isPenalty ? 5.00 : 2.00; // Example penalty vs normal

  // Perform extension
  const { data: updatedBooking, error: updateError } = await supabase
    .from('bookings')
    .update({
      end_time: newEndTime.toISOString(),
      extension_count: extensionCount + 1,
      last_extended_at: now.toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (updateError) {
    throw updateError;
  }

  // Trigger notification
  // We need current user id to send notification. 
  // We can fetch user id from supabase.auth.getSession() or assuming the service is called by a logged in user.
  // We'll use the service call context.
  const { data: session } = await supabase.auth.getSession();
  const userId = session?.session?.user?.id;
  if (userId) {
    await sendNotification(userId, `Booking extended by 30 minutes!`);
  }

  return { updatedBooking, surcharge, isPenalty };
};
