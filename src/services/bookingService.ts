import { supabase } from '@/lib/supabase';
import { sendNotification } from './notificationService';

export interface BookingData {
  user_id: string;
  slot_id: string;
  start_time: Date;
  end_time: Date;
}

export const checkAvailability = async (slotId: string, startTime: Date, endTime: Date): Promise<boolean> => {
  // Overlap condition: (new_start < existing_end AND new_end > existing_start)
  const { data, error } = await supabase
    .from('bookings')
    .select('id')
    .eq('slot_id', slotId)
    .in('status', ['confirmed'])
    .lt('start_time', endTime.toISOString())
    .gt('end_time', startTime.toISOString());

  if (error) {
    console.error('Error checking availability:', error);
    return false;
  }

  // If array has length, there is an overlap
  return data.length === 0;
};

export const createBooking = async (bookingData: BookingData) => {
  const isAvailable = await checkAvailability(
    bookingData.slot_id,
    bookingData.start_time,
    bookingData.end_time
  );

  if (!isAvailable) {
    throw new Error('Slot is not available for the selected time');
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      user_id: bookingData.user_id,
      slot_id: bookingData.slot_id,
      start_time: bookingData.start_time.toISOString(),
      end_time: bookingData.end_time.toISOString(),
      status: 'confirmed',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Trigger notification
  await sendNotification(bookingData.user_id, `Booking confirmed for Slot #${data.slot_id}!`);

  return data;
};

export const getUserBookings = async (userId: string) => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, parking_slots(slot_number, price_per_hour_override, zones(name, price_per_hour))')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};
