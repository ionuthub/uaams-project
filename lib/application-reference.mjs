export function applicationReference(application) {
  return application.referenceNumber || application.id;
}

export function matchesApplicationSearch(application, search) {
  const needle = search.trim().toLowerCase();
  return [application.form?.fullName, application.id, application.referenceNumber]
    .some((value) => typeof value === "string" && value.toLowerCase().includes(needle));
}

export function formatReference(year, sequence) {
  if (!Number.isInteger(year) || year < 2000 || year > 9999 ||
      !Number.isSafeInteger(sequence) || sequence < 1) {
    throw new Error("reference/invalid-counter");
  }
  return `APP-${year}-${String(sequence).padStart(5, "0")}`;
}
