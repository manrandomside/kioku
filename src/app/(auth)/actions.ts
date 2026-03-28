"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";

export async function signInWithEmail(formData: FormData) {
  try {
    const supabase = await createClient();

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

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

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

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

    const email = formData.get("email") as string;

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
