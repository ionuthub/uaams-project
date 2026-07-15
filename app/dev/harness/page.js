import { notFound } from "next/navigation";
import Harness from "./Harness";

export default function HarnessPage() {
  if (process.env.ENABLE_TEST_HARNESS !== "true") {
    notFound();
  }

  return <Harness />;
}
