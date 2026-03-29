"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const authSchema = z.object({
  email: z.string().email("Email tidak valid").max(255),
  password: z.string().min(6, "Password minimal 6 karakter").max(128),
});

const emailOnlySchema = z.object({
  email: z.string().email("Email tidak valid").max(255),
});

export async function signInWithEmail(formData: FormData) {
  try {
    const supabase = await createClient();

    const parsed = authSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
    }
    const { email, password } = parsed.data;

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[signInWithEmail]", error);
    return { error: "Terjadi kesalahan saat login" };
  }

  redirect("/home");
}

export async function signUpWithEmail(formData: FormData) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const origin = headersList.get("origin") ?? "";

    const parsed = authSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
    }
    const { email, password } = parsed.data;

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[signUpWithEmail]", error);
    return { error: "Terjadi kesalahan saat mendaftar" };
  }

  redirect("/login?message=check_email");
}

export async function signInWithOAuth(provider: "google" | "github", mode: "login" | "register" = "login") {
  let redirectUrl: string | undefined;

  try {
    const supabase = await createClient();
    const headersList = await headers();
    const origin = headersList.get("origin") ?? "";

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${origin}/auth/callback?mode=${mode}`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    redirectUrl = data.url;
  } catch (error) {
    console.error("[signInWithOAuth]", error);
    return { error: "Terjadi kesalahan saat login OAuth" };
  }

  if (redirectUrl) {
    redirect(redirectUrl);
  }
}

export async function signInWithMagicLink(formData: FormData) {
  try {
    const supabase = await createClient();
    const headersList = await headers();
    const origin = headersList.get("origin") ?? "";

    const parsed = emailOnlySchema.safeParse({ email: formData.get("email") });
    if (!parsed.success) {
      return { error: parsed.error.issues[0]?.message ?? "Input tidak valid" };
    }
    const { email } = parsed.data;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error("[signInWithMagicLink]", error);
    return { error: "Terjadi kesalahan saat mengirim magic link" };
  }
}

export async function signOut() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    revalidatePath("/", "layout");
  } catch (error) {
    console.error("[signOut]", error);
    return { error: "Terjadi kesalahan saat logout" };
  }

  redirect("/login");
}
