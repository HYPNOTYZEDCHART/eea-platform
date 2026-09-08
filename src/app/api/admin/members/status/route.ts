import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { membership_id, status, expires_at } = await req.json();

    if (!membership_id || !status) {
      return NextResponse.json(
        { error: "Matricule et statut requis." },
        { status: 400 }
      );
    }

    try {
      const supabaseAdmin = getSupabaseAdmin();
      const updatePayload: Record<string, any> = { status };
      if (expires_at) {
        updatePayload.expires_at = expires_at;
      }

      const { data, error } = await supabaseAdmin
        .from("members")
        .update(updatePayload)
        .eq("membership_id", membership_id)
        .select()
        .single();

      if (error) {
        console.error("Erreur mise à jour Supabase:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, member: data });
    } catch (dbErr: any) {
      console.warn("Notice: Base Supabase indisponible côté serveur:", dbErr?.message);
      return NextResponse.json({ success: true, localFallback: true }, { status: 200 });
    }
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur serveur" },
      { status: 500 }
    );
  }
}
