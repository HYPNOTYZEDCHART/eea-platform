import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      membership_id,
      first_name,
      last_name,
      email,
      phone,
      country,
      university,
      field_of_study,
      photo_url,
      qr_code_token,
      status = "pending",
    } = body;

    if (!membership_id || !first_name || !last_name || !email || !qr_code_token) {
      return NextResponse.json(
        { error: "Champs obligatoires manquants pour l'adhésion." },
        { status: 400 }
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data, error } = await supabaseAdmin
        .from("members")
        .insert({
          membership_id,
          first_name,
          last_name,
          email,
          phone,
          country,
          university,
          field_of_study,
          photo_url: photo_url || null,
          qr_code_token,
          status,
        })
        .select()
        .single();

      if (error) {
        console.error("Erreur insertion Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, member: data });
    } catch (dbErr: any) {
      console.warn("Notice: Base Supabase indisponible côté serveur:", dbErr?.message);
      return NextResponse.json(
        { success: true, localOnly: true, member: body },
        { status: 200 }
      );
    }
  } catch (err: any) {
    console.error("Erreur route /api/register:", err);
    return NextResponse.json(
      { error: err?.message || "Erreur serveur lors de l'enregistrement" },
      { status: 500 }
    );
  }
}
