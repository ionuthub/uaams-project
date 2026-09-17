import { getAuthClient } from "./firebase";

export async function requestApplicationReferences(applicationIds) {
  const user = getAuthClient().currentUser;
  if (!user) throw new Error("Sign in to load your application reference.");
  const response = await fetch("/api/applications/references", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
    body: JSON.stringify({ applicationIds }),
  });
  if (!response.ok) throw new Error("Your application reference could not be assigned. Please try again.");
  const result = await response.json();
  return result.references;
}

export async function withApplicationReferences(applications) {
  const missing = applications.filter((application) => !application.referenceNumber);
  const references = Object.create(null);
  try {
    for (let offset = 0; offset < missing.length; offset += 20) {
      Object.assign(references, await requestApplicationReferences(missing.slice(offset, offset + 20).map((app) => app.id)));
    }
  } catch {
    // A reference service outage must not hide saved records or invent numbers.
    // The shared component explicitly labels the old ID as a temporary fallback.
  }
  return applications.map((app) => references[app.id] ? { ...app, referenceNumber: references[app.id] } : app);
}
