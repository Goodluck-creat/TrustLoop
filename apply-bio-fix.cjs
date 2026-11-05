// Fix: restores your original profile actions and moves the bio action into its own file.
const fs = require("fs"), path = require("path");
const root = process.cwd();
const BIO = "\"use server\";\n\nimport { redirect } from \"next/navigation\";\nimport { db } from \"@/lib/db\";\nimport { getUserId } from \"@/lib/session\";\n\n// Saves the signed-in person's public bio (up to 300 characters).\nexport async function updateBio(formData: FormData) {\n  const userId = await getUserId();\n  if (!userId) redirect(\"/login\");\n  const bio = String(formData.get(\"bio\") ?? \"\")\n    .replace(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]/g, \"\")\n    .replace(/\\n{3,}/g, \"\\n\\n\")\n    .trim()\n    .slice(0, 300);\n  await db.user.update({ where: { id: userId }, data: { bio: bio || null } });\n  redirect(`/p/${userId}`);\n}\n";
const cur = path.join(root, "src/app/actions/profile.ts");
const bak = path.join(root, ".roqqu-backup/src/app/actions/profile.ts");
if (!fs.existsSync(bak)) { console.error("Could not find the backup of profile.ts in .roqqu-backup. Stop here and tell me."); process.exit(1); }
const orig = fs.readFileSync(bak, "utf8");
if (!/saveImage/.test(orig)) { console.error("The backup does not look like your original profile.ts. Stop here and tell me."); process.exit(1); }
fs.copyFileSync(bak, cur);
fs.writeFileSync(path.join(root, "src/app/actions/bio.ts"), BIO);
const bs = path.join(root, "src/components/BioSection.tsx");
let t = fs.readFileSync(bs, "utf8");
t = t.replace('"@/app/actions/profile"', '"@/app/actions/bio"');
fs.writeFileSync(bs, t);
console.log("Restored src/app/actions/profile.ts (saveImage and removeImage are back).");
console.log("Wrote src/app/actions/bio.ts and pointed BioSection at it.");
