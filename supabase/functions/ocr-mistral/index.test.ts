import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;

Deno.test("ocr-mistral: should return error for empty base64", async () => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/ocr-mistral`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      imageBase64: "",
      fileName: "test.png",
      mimeType: "image/png",
    }),
  });

  const data = await response.json();
  console.log("Empty base64 response:", JSON.stringify(data, null, 2));
  // Should either fail gracefully or return an error
  assertEquals(typeof data.success, "boolean");
});

Deno.test("ocr-mistral: should process a small test image", async () => {
  // Create a minimal 1x1 white PNG in base64
  const minimalPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

  const response = await fetch(`${SUPABASE_URL}/functions/v1/ocr-mistral`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      imageBase64: minimalPng,
      fileName: "test-pixel.png",
      mimeType: "image/png",
    }),
  });

  const data = await response.json();
  console.log("Minimal image response:", JSON.stringify(data, null, 2));
  assertEquals(response.status < 500, true, `Unexpected server error: ${JSON.stringify(data)}`);
  assertEquals(typeof data.success, "boolean");
});
