import type { InvitationDesign } from "@/lib/site-design";

export type InvitationKind = "wedding" | "debut";

export type WeddingDraft = {
  projectId: string;
  projectName: string;
  eventKind: InvitationKind;
  brideFirstName: string;
  brideMiddleName: string;
  brideLastName: string;
  groomFirstName: string;
  groomMiddleName: string;
  groomLastName: string;
  celebrantFirstName: string;
  celebrantMiddleName: string;
  celebrantLastName: string;
  date: string;
  venue: string;
  mapUrl: string;
  story: string;
  souvenirMessage: string;
  photoAlbumUrl: string;
  design: InvitationDesign;
};

export type WeddingDraftSaveResult =
  | { ok: true; savedAt: string }
  | { ok: false; message: string };
