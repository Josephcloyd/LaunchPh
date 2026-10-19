export type GuestRsvp = {
  attending: boolean | null;
  attendee_count: number | null;
  meal_notes: string | null;
  responded_at: string;
};

export type WeddingGuestRecord = {
  id: string;
  display_name: string;
  party_size: number;
  created_at: string;
  rsvps: GuestRsvp | null;
};

export type GuestMutationResult = {
  ok: boolean;
  message: string;
  invitePath?: string;
};

export type RsvpSubmissionResult = {
  ok: boolean;
  message: string;
};

