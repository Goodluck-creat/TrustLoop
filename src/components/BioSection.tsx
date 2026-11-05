import { updateBio } from "@/app/actions/bio";

// A short public bio on the Trust Passport. Only the owner sees the edit form.
export default function BioSection({ bio, isSelf, isOrg }: { bio: string | null; isSelf: boolean; isOrg: boolean }) {
  if (!bio && !isSelf) return null;
  return (
    <div className="mt-4">
      {bio ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90 sm:text-base">{bio}</p>
      ) : (
        <p className="text-sm text-muted">
          {isOrg ? "Tell freelancers who you are and what kind of work you hire for." : "Tell hirers who you are and what you are good at."}
        </p>
      )}
      {isSelf && (
        <details className="mt-2">
          <summary className="cursor-pointer text-sm font-semibold text-forest underline">{bio ? "Edit bio" : "Add a bio"}</summary>
          <form action={updateBio} className="mt-2 space-y-2">
            <label htmlFor="bio" className="sr-only">Bio</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={bio ?? ""}
              maxLength={300}
              rows={4}
              placeholder={isOrg ? "For example: A small design studio in Awka. We hire for logos, social posts and short videos." : "For example: Graphic designer in Awka. I make logos and flyers, and I deliver on time."}
              className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 text-base outline-none focus:border-forest"
            />
            <p className="text-xs text-muted">Up to 300 characters. Anyone who opens your Trust Passport can read this.</p>
            <button className="rounded-xl bg-forest px-5 py-2.5 text-sm font-bold text-white">Save bio</button>
          </form>
        </details>
      )}
    </div>
  );
}
