import { getSupabaseBrowserClient } from "@/services/supabase-browser";

export const authService = {
  async signIn(email: string, password: string) {
    const client = getSupabaseBrowserClient();
    if (!client) return { developmentMode: true as const, sessionActive: false };
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { developmentMode: false as const, sessionActive: Boolean(data.session) };
  },
  async signUp(email: string, password: string, firstName: string, middleName: string, lastName: string) {
    const client = getSupabaseBrowserClient();
    if (!client) return { developmentMode: true as const, needsEmailVerification: false };
    const fullName = [firstName, middleName, lastName].map(part => part.trim()).filter(Boolean).join(" ");
    const { data, error } = await client.auth.signUp({ email, password, options: { data: { first_name: firstName.trim(), middle_name: middleName.trim() || null, last_name: lastName.trim(), full_name: fullName, timezone: "Asia/Manila" } } });
    if (error) throw error;
    return { developmentMode: false as const, needsEmailVerification: !data.session };
  },
  async sendMagicLink(email: string) {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Supabase is not configured.");
    const { error } = await client.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    if (error) throw error;
  },
  async sendPasswordReset(email: string) {
    const client = getSupabaseBrowserClient();
    if (!client) throw new Error("Supabase is not configured.");
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/reset-password` });
    if (error) throw error;
  },
  async signOut() {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    const { error } = await client.auth.signOut();
    if (error) throw error;
  },
};
