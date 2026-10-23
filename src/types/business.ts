export type BusinessSiteContent = {
  businessName: string;
  businessType: string;
  tagline: string;
  about: string;
  services: string;
  phone: string;
  email: string;
  hours: string;
  address: string;
  mapUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  bookingEnabled: boolean;
};

export type BusinessDraft = BusinessSiteContent & {
  projectId: string;
  projectName: string;
};

export type BusinessDraftSaveResult =
  | { ok: true; savedAt: string }
  | { ok: false; message: string };
