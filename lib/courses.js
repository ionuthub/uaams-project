// lib/courses.js
// v2 Phase 0: courses as a first-class entity (supervisor feedback, 16 July).
// Applications will migrate from university-level to course-level over
// Sprint 3; in Phase 0 courseId is OPTIONAL on applications so all
// existing screens, rules and tests keep working unchanged.
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { getDbClient } from "./firebase";

/** All courses (course picker across universities). */
export async function getCourses() {
  const db = getDbClient();
  const snap = await getDocs(query(collection(db, "courses"), orderBy("name")));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Courses offered by one university (picker after university selection). */
export async function getCoursesForUniversity(universityId) {
  const db = getDbClient();
  const snap = await getDocs(
    query(collection(db, "courses"), where("universityId", "==", universityId), orderBy("name"))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}