"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signIn(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const identifier = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!identifier || !password) {
    return { error: "Vui lòng nhập email/tên đăng nhập và mật khẩu." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { error: "Chưa cấu hình Supabase. Kiểm tra file .env.local." };
  }

  // Chấp nhận cả email lẫn username: không có "@" → tra username → lấy email
  let email = identifier.toLowerCase();
  if (!email.includes("@")) {
    const { data: resolved } = await supabase.rpc("resolve_login_identifier", {
      p_identifier: identifier,
    });
    if (typeof resolved === "string" && resolved.includes("@")) {
      email = resolved.toLowerCase();
    }
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "Email/tên đăng nhập hoặc mật khẩu không đúng." };
  }

  revalidatePath("/", "layout");
  // Chuyển ngay sang Dashboard — không redirect thì trang login vẫn đứng yên.
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/admin/login");
}
