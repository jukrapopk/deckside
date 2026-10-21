import { PLATFORM_NAME_MAX_LENGTH } from "@/lib/limits";
import { isPlatformIconValue, type PlatformIconValue } from "@/lib/platforms";

export type PlatformFields =
  | { ok: true; name: string; icon: PlatformIconValue }
  | { ok: false; error: string };

/** FormData is untrusted; both backends run the same checks. */
export function readPlatformFields(formData: FormData): PlatformFields {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "");

  if (!name) return { ok: false, error: "Name is required." };
  if (name.length > PLATFORM_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Keep the name to ${PLATFORM_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }
  // Presets are keys; anything else has to be a well-formed `lucide:<name>`.
  // Whether this build ships that name is a rendering concern, so an unknown
  // but valid name saves and draws the default glyph.
  if (!isPlatformIconValue(icon)) return { ok: false, error: "Choose an icon." };

  return { ok: true, name, icon };
}
