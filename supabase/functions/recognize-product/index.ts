import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GEMINI_MODEL = Deno.env.get("GEMINI_VISION_MODEL") || "gemini-3.1-flash-lite";

function jsonResponse(payload: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
  });
}

function parseJsonText(text: string): Record<string, any> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch (_) {
    // Gemini sometimes wraps JSON in a code fence or adds a short sentence.
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    return JSON.parse(trimmed.slice(first, last + 1));
  }
  throw new Error("AI mengembalikan format yang tidak dapat dibaca.");
}

function getPublishableKey(): string | null {
  const keyMapRaw = Deno.env.get("SUPABASE_PUBLISHABLE_KEYS");
  if (keyMapRaw) {
    try {
      const keyMap = JSON.parse(keyMapRaw);
      if (keyMap && typeof keyMap.default === "string") return keyMap.default;
      if (keyMap && typeof keyMap === "object") {
        const firstKey = Object.values(keyMap).find((value) => typeof value === "string");
        if (typeof firstKey === "string") return firstKey;
      }
    } catch (_) {
      // Continue to legacy environment variables.
    }
  }
  return Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    Deno.env.get("SUPABASE_ANON_KEY") ??
    null;
}

function cleanTerms(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((term: unknown) => term !== null && term !== undefined)
    .map((term: unknown) => String(term).trim().slice(0, 60))
    .filter(Boolean)
    .slice(0, max);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ error: "Metode tidak didukung." }, 405);
  }

  // The app must be logged in. Keep Verify JWT enabled in Supabase.
  const authorization = req.headers.get("Authorization") ?? "";
  const tokenMatch = authorization.match(/^Bearer\s+(.+)$/i);
  const userToken = tokenMatch?.[1]?.trim();
  if (!userToken) {
    return jsonResponse({ error: "Silakan login untuk menggunakan pencarian foto AI." }, 401);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = getPublishableKey();
  if (!supabaseUrl || !publishableKey) {
    return jsonResponse({
      error: "Konfigurasi Supabase belum lengkap. Periksa pengaturan project Supabase.",
    }, 500);
  }

  const supabase = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(userToken);
  if (userError || !userData.user) {
    return jsonResponse({
      error: "Sesi login tidak valid. Keluar dari aplikasi, lalu masuk kembali.",
    }, 401);
  }

  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (!geminiKey) {
    return jsonResponse({
      error: "Kunci Gemini belum dipasang. Tambahkan secret bernama GEMINI_API_KEY di Supabase → Edge Functions → Secrets.",
    }, 503);
  }

  let body: { action?: string; imageDataUrl?: string };
  try {
    const raw = await req.text();
    if (raw.length > 5_500_000) {
      return jsonResponse({ error: "Foto terlalu besar. Ambil foto dengan ukuran lebih kecil." }, 413);
    }
    body = JSON.parse(raw);
    if (!body || typeof body !== "object") throw new Error("Invalid body");
  } catch (_) {
    return jsonResponse({ error: "Permintaan tidak dapat dibaca. Coba muat ulang aplikasi." }, 400);
  }

  const action = body.action === "test" ? "test" : "recognize";
  let imagePart: Record<string, unknown> | null = null;

  if (action === "recognize") {
    const imageDataUrl = String(body.imageDataUrl ?? "");
    const imageMatch = imageDataUrl.match(/^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/);
    if (!imageMatch) {
      return jsonResponse({
        error: "Foto tidak dapat diproses. Gunakan foto JPG, PNG, atau WEBP dan coba lagi.",
      }, 400);
    }
    imagePart = {
      inline_data: {
        mime_type: `image/${imageMatch[1]}`,
        data: imageMatch[2],
      },
    };
  }

  const prompt = action === "test"
    ? "Ini adalah tes koneksi. Balas hanya dengan kata OK."
    : `Kamu membantu pemilik toko kelontong di Indonesia mencari produk dalam katalog toko berdasarkan foto.
Tujuan utama adalah mengenali JENIS BARANG, bukan mensyaratkan merek atau kemasan harus sama persis.
Analisis satu barang utama yang paling menonjol.
- product_type: jenis barang yang PALING mungkin dan paling spesifik, misalnya "gula pasir", "beras", "sabun mandi batang", atau "minyak goreng".
- product_type_candidates: array maksimal 3 jenis barang yang masuk akal, urutkan dari paling mungkin. Jika barang jelas, isi satu jenis saja. Jika tampilan memang ambigu (misalnya butiran putih dalam plastik bening dapat berupa gula atau beras), masukkan alternatif yang benar-benar mungkin dan urutkan berdasarkan ciri visual. Jangan membuat alternatif hanya karena satu kategori.
- brand: isi hanya jika nama merek benar-benar terbaca pada foto; jika tidak terbaca atau meragukan, null.
- variant: isi hanya jika tulisan varian benar-benar terbaca; jika tidak, null. Jangan menebak varian dari warna kemasan.
- size: isi hanya jika ukuran/berat benar-benar terbaca; jika tidak, null.
- search_terms: 3 sampai 6 istilah Bahasa Indonesia yang membantu pencarian jenis barang.
- related_terms: 1 sampai 4 sinonim atau bentuk barang yang benar-benar sejenis, bukan barang dari kategori yang sama saja.
Jangan menebak merek, varian, ukuran, isi, jumlah, harga, atau informasi yang tidak terbaca. Bedakan ciri visual jenis barang; jangan menyimpulkan gula atau beras hanya dari warna putih kemasannya.
Jika barang tidak jelas, gunakan product_type "", product_type_candidates [], brand null, variant null, dan confidence "low".
Balas hanya objek JSON dengan struktur persis:
{
  "product_type": "jenis barang paling mungkin",
  "product_type_candidates": ["jenis paling mungkin", "alternatif jika memang ambigu"],
  "brand": null,
  "variant": null,
  "size": null,
  "search_terms": ["istilah jenis barang", "sinonim"],
  "related_terms": ["barang yang benar-benar sejenis"],
  "confidence": "high|medium|low"
}`;

  const parts: Record<string, unknown>[] = [{ text: prompt }];
  if (imagePart) parts.push(imagePart);

  const geminiStartedAt = Date.now();
  let geminiResponse: Response;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 35000);
  try {
    geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: "POST",
        headers: {
          "x-goog-api-key": geminiKey,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: action === "test"
            ? {
              maxOutputTokens: 64,
              thinkingConfig: { thinkingLevel: "MINIMAL" },
            }
            : {
              maxOutputTokens: 512,
              thinkingConfig: { thinkingLevel: "MINIMAL" },
              responseMimeType: "application/json",
            },
        }),
      },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("Gemini network/timeout error", error);
    return jsonResponse({
      error: timedOut
        ? "Analisis foto melewati batas waktu 35 detik. Coba foto satu barang dengan posisi lebih dekat dan jaringan internet yang stabil."
        : "Tidak dapat menghubungi server Gemini. Periksa koneksi internet atau coba lagi beberapa saat.",
    }, timedOut ? 504 : 502);
  } finally {
    clearTimeout(timeoutId);
  }

  const geminiDurationMs = Date.now() - geminiStartedAt;
  console.info("Gemini vision response", JSON.stringify({
    model: GEMINI_MODEL,
    action,
    status: geminiResponse.status,
    durationMs: geminiDurationMs,
    imageBase64Length: imagePart ? String((imagePart as any).inline_data?.data ?? "").length : 0,
  }));

  const geminiPayload = await geminiResponse.json().catch(() => ({}));
  if (!geminiResponse.ok) {
    const apiMessage = geminiPayload?.error?.message;
    const detail = typeof apiMessage === "string"
      ? apiMessage.slice(0, 300)
      : "Google tidak memberikan keterangan tambahan.";
    console.error("Gemini request failed", geminiResponse.status, detail);

    if (geminiResponse.status === 429) {
      return jsonResponse({
        error: "Kuota atau batas permintaan Gemini sedang tercapai. Tunggu beberapa saat sebelum mencoba lagi. Detail: " + detail,
      }, 429);
    }
    if (geminiResponse.status === 401 || geminiResponse.status === 403) {
      return jsonResponse({
        error: "Google menolak API Key Gemini. Periksa apakah GEMINI_API_KEY benar dan Gemini API diizinkan untuk key tersebut. Detail: " + detail,
      }, 502);
    }
    if (geminiResponse.status === 404) {
      return jsonResponse({
        error: `Model ${GEMINI_MODEL} tidak tersedia untuk API Key/project ini. Periksa akses Gemini API. Detail: ` + detail,
      }, 502);
    }
    if (geminiResponse.status >= 500) {
      return jsonResponse({
        error: "Server Gemini sedang mengalami gangguan sementara. Coba lagi beberapa saat. Detail: " + detail,
      }, 502);
    }
    return jsonResponse({
      error: `Gemini menolak permintaan (HTTP ${geminiResponse.status}). Detail: ` + detail,
    }, 502);
  }

  const candidate = geminiPayload?.candidates?.[0];
  const outputText = (candidate?.content?.parts ?? [])
    .map((part: Record<string, unknown>) => typeof part.text === "string" ? part.text : "")
    .join("\n")
    .trim();

  if (!outputText) {
    const reason = candidate?.finishReason ?? geminiPayload?.promptFeedback?.blockReason ?? "tidak diketahui";
    console.error("Gemini returned no text", reason);
    return jsonResponse({
      error: action === "test"
        ? `Gemini merespons tanpa teks (alasan: ${reason}). Coba lagi.`
        : `Gemini belum memberikan hasil pengenalan (alasan: ${reason}). Ambil foto yang lebih jelas lalu coba lagi.`,
    }, 502);
  }

  if (action === "test") {
    return jsonResponse({
      ok: true,
      model: GEMINI_MODEL,
      message: "Koneksi ke Gemini berhasil.",
      response_ms: geminiDurationMs,
    });
  }

  try {
    const result = parseJsonText(outputText);
    const productType = String(result.product_type ?? result.detected_name ?? "")
      .trim().slice(0, 120);
    const detectedName = String(result.detected_name ?? productType ?? "Barang belum dikenali")
      .trim().slice(0, 120);
    const category = String(result.category ?? "Lainnya").trim().slice(0, 60) || "Lainnya";
    const confidence = ["high", "medium", "low"].includes(result.confidence)
      ? result.confidence
      : "low";

    return jsonResponse({
      product_type: productType,
      product_type_candidates: (() => {
        const candidates = cleanTerms(result.product_type_candidates, 3);
        const normalizedPrimary = productType.toLocaleLowerCase("id-ID");
        const ordered = normalizedPrimary && !candidates.some((item) => item.toLocaleLowerCase("id-ID") === normalizedPrimary)
          ? [productType, ...candidates]
          : candidates;
        return ordered.slice(0, 3);
      })(),
      detected_name: detectedName || "Barang belum dikenali",
      category,
      brand: result.brand ? String(result.brand).slice(0, 60) : null,
      variant: result.variant ? String(result.variant).slice(0, 80) : null,
      size: result.size ? String(result.size).slice(0, 40) : null,
      search_terms: cleanTerms(result.search_terms, 8),
      related_terms: cleanTerms(result.related_terms, 6),
      confidence,
      visual_notes: result.visual_notes ? String(result.visual_notes).slice(0, 240) : "",
      analysis_ms: geminiDurationMs,
    });
  } catch (error) {
    console.error("Could not parse Gemini vision result", error);
    return jsonResponse({
      error: "Gemini berhasil dihubungi, tetapi hasil pengenalan tidak terbaca. Coba ambil foto ulang.",
    }, 502);
  }
});
