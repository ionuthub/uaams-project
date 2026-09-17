export default function ApplicationReference({ application }) {
  return (
    <p className="m-0 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-muted">
      <span className="font-medium">{application.referenceNumber ? "Application reference:" : "Application ID:"}</span>
      <span className="font-mono font-semibold text-navy-900 [overflow-wrap:anywhere] min-w-0">{application.referenceNumber || application.id}</span>
      {!application.referenceNumber && <span className="basis-full text-xs">Short reference temporarily unavailable. This ID still identifies your application.</span>}
    </p>
  );
}
