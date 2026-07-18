export const metadata = { title: "Privacy notice | UAAMS" };

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: "760px", margin: "0 auto", padding: "48px 20px", lineHeight: 1.65 }}>
      <h1>UAAMS privacy notice</h1>
      <p>UAAMS is a university application proof of concept. It collects account, contact, academic, application and supporting-document information so an authorised university admissions officer can review an application and record a decision.</p>
      <h2>How information is used</h2>
      <p>Information is used only to provide the application workflow, protect role-based access, communicate important account or decision events, and demonstrate the agreed university project requirements.</p>
      <h2>Access and storage</h2>
      <p>Firebase Authentication, Firestore and Cloud Storage hold the proof-of-concept data. Applicants can access their own records. Admissions officers can access only applications associated with their assigned university.</p>
      <h2>Your choices</h2>
      <p>Do not submit real sensitive evidence during development testing. Requests to correct or remove test data should be sent to the project owner. The production-ready retention and deletion process must be approved before real-world use.</p>
      <p><a href="/register">Return to registration</a></p>
    </main>
  );
}
