// lib/course-catalog.mjs
// Public course catalogue for the participating university.
//
// The seeded database now has TWO universities (#25, #199): Southampton
// Solent and the University of Portsmouth. The public screens present those
// institutions and this catalogue instead of the placeholder universities
// from the design prototype. Applications still reference the university
// document in Firestore; the catalogue is presentation content for the
// public pages.
//
// A second institution matters beyond content: PRD section 7 requires
// "support multiple universities", and until there were two the claim could
// not be demonstrated - see the isolation test in e2e/isolation-path.spec.mjs.
//
// Sprint 3 candidate: move this into a read-only /courses collection so a
// university's catalogue is data rather than code.

export const SOLENT = {
  id: "solent",
  code: "SSU",
  name: "Southampton Solent University",
  city: "Southampton",
  statusLine: "Southampton · University status since 2005",
  blurb:
    "Industry-focused teaching on a single city campus, with strong maritime heritage, modern facilities and close employer links across the Solent region.",
  campusImage: "/assets/campuses/harborview-campus.webp",
  campusAlt: "Waterside campus buildings representing Southampton Solent University",
};

export const PORTSMOUTH = {
  id: "portsmouth",
  code: "UOP",
  name: "University of Portsmouth",
  city: "Portsmouth",
  statusLine: "Portsmouth · University status since 1992",
  blurb:
    "A waterfront civic university with particular strength in computing, forensics and international business, set in a compact city campus on the south coast.",
  campusImage: "/assets/campuses/harborview-campus.webp",
  campusAlt: "City campus buildings representing the University of Portsmouth",
};

/** Every institution the public pages present, in display order. */
export const UNIVERSITIES = [SOLENT, PORTSMOUTH];

const UG_DEADLINE = "31 Jan 2027";
const PG_DEADLINE = "30 Apr 2027";
const START = "September 2027";
const FEE = "£25";

function course(entry) {
  return {
    university: SOLENT.name,
    universityId: SOLENT.id,
    code: SOLENT.code,
    location: SOLENT.city,
    start: START,
    fee: FEE,
    ...entry,
  };
}

export const SOLENT_COURSES = [
  course({
    id: "ssu-computer-science",
    title: "BSc (Hons) Computer Science",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "computing",
    school: "School of Computing",
    description: "Build strong foundations in programming, systems and responsible computing with a final year project of your own.",
    overview: "Study programming, databases, software engineering, intelligent systems and cyber security, finishing with an individual capstone project shaped around your ambitions.",
    modules: [
      { heading: "Year one", items: ["Programming foundations", "Computer systems", "Data and information"] },
      { heading: "Year two", items: ["Software engineering", "Algorithms and AI", "Team project"] },
      { heading: "Year three", items: ["Advanced topics", "Cyber security", "Individual project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BBB", note: "Ideally including Mathematics or Computer Science." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-cyber-security",
    title: "BSc (Hons) Cyber Security",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "computing",
    school: "School of Computing",
    description: "Learn to defend networks, investigate incidents and design secure systems in dedicated security labs.",
    overview: "Work hands-on with network defence, digital forensics, ethical hacking and security architecture, building towards industry certifications alongside your degree.",
    modules: [
      { heading: "Year one", items: ["Networks and operating systems", "Programming for security", "Cyber fundamentals"] },
      { heading: "Year two", items: ["Ethical hacking", "Digital forensics", "Secure systems design"] },
      { heading: "Year three", items: ["Incident response", "Security operations", "Individual project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BCC", note: "A technology related subject is helpful but not required." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-software-engineering",
    title: "BSc (Hons) Software Engineering",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "computing",
    school: "School of Computing",
    description: "Engineer reliable software in agile teams, from requirements through testing to deployment.",
    overview: "Focus on the discipline of building software that lasts: requirements, architecture, quality assurance, DevOps practice and sustained team delivery on real briefs.",
    modules: [
      { heading: "Year one", items: ["Programming foundations", "Web development", "Databases"] },
      { heading: "Year two", items: ["Agile team project", "Testing and quality", "Cloud platforms"] },
      { heading: "Year three", items: ["Software architecture", "DevOps practice", "Individual project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BCC", note: "Ideally including a STEM subject." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-data-analytics",
    title: "MSc Data Analytics",
    level: "Postgraduate",
    mode: "Full time",
    duration: "1 year",
    deadline: PG_DEADLINE,
    subject: "data-science",
    school: "School of Computing",
    description: "Combine statistics, machine learning and visual storytelling on real organisational data.",
    overview: "An intensive conversion-friendly programme covering statistical methods, machine learning, data engineering and communication, ending with an applied dissertation with an industry partner where possible.",
    modules: [
      { heading: "Semester one", items: ["Statistical methods", "Data engineering", "Programming for analytics"] },
      { heading: "Semester two", items: ["Machine learning", "Visualisation and reporting", "Ethics and governance"] },
      { heading: "Dissertation", items: ["Applied research project", "Industry engagement", "Professional practice"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "2:2 honours degree", note: "In a numerate, computing or business subject; relevant experience considered." },
      { label: "International applicants", value: "Accepted equivalent degree", note: "Equivalent international qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-applied-ai",
    title: "MSc Applied Artificial Intelligence",
    level: "Postgraduate",
    mode: "Full time",
    duration: "1 year",
    deadline: PG_DEADLINE,
    subject: "computing",
    school: "School of Computing",
    description: "Design, evaluate and deploy practical AI systems with an emphasis on responsible use.",
    overview: "Move from machine learning foundations to deployed, monitored AI systems, with dedicated attention to safety, fairness and the realities of production environments.",
    modules: [
      { heading: "Semester one", items: ["Machine learning foundations", "Python for AI", "Data pipelines"] },
      { heading: "Semester two", items: ["Deep learning", "Natural language processing", "Responsible AI"] },
      { heading: "Dissertation", items: ["Applied AI project", "Deployment and MLOps", "Professional practice"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "2:2 honours degree", note: "In computing, engineering, mathematics or a related subject." },
      { label: "International applicants", value: "Accepted equivalent degree", note: "Equivalent international qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-business-management",
    title: "BA (Hons) Business Management",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "business",
    school: "Solent Business School",
    description: "Develop commercial judgment through live briefs, placements and global business perspectives.",
    overview: "Learn how organisations really work across marketing, finance, operations and people, applying it all to live client briefs and an optional placement year.",
    modules: [
      { heading: "Year one", items: ["Business environments", "Marketing essentials", "Managing people"] },
      { heading: "Year two", items: ["Operations and projects", "Finance for managers", "Live client brief"] },
      { heading: "Year three", items: ["Strategy", "Entrepreneurship", "Consultancy project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BCC", note: "No specific subjects required." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-mba",
    title: "MBA Global Leadership",
    level: "Postgraduate",
    mode: "Full time",
    duration: "1 year",
    deadline: PG_DEADLINE,
    subject: "business",
    school: "Solent Business School",
    description: "Sharpen strategic leadership with an internationally diverse cohort and applied consultancy work.",
    overview: "A practice-led MBA built around strategic decision making, leading change and responsible management, culminating in a consultancy project for a real organisation.",
    modules: [
      { heading: "Semester one", items: ["Strategic management", "Leading people and change", "Financial decision making"] },
      { heading: "Semester two", items: ["Global operations", "Innovation and digital business", "Responsible leadership"] },
      { heading: "Capstone", items: ["Consultancy project", "Executive coaching", "Career development"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "2:2 honours degree", note: "Plus normally two years of relevant work experience." },
      { label: "International applicants", value: "Accepted equivalent degree", note: "Equivalent international qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-yacht-design",
    title: "BEng (Hons) Yacht and Powercraft Design",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "maritime",
    school: "School of Engineering",
    description: "Design small craft from first principles in one of the few dedicated yacht design degrees in the world.",
    overview: "Naval architecture, hydrodynamics, structures and production engineering applied to sail and power craft, taught minutes from one of Europe's busiest waterfronts.",
    modules: [
      { heading: "Year one", items: ["Engineering principles", "Marine drawing and CAD", "Fluid mechanics"] },
      { heading: "Year two", items: ["Naval architecture", "Structures and materials", "Powercraft systems"] },
      { heading: "Year three", items: ["Design optimisation", "Production engineering", "Major design project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BBC", note: "Including Mathematics or Physics." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-maritime-business",
    title: "BSc (Hons) Maritime Business and Logistics",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "maritime",
    school: "Warsash Maritime School",
    description: "Study shipping, ports and global supply chains in the UK's leading maritime city.",
    overview: "Understand how global trade moves: ship operations, port management, chartering, maritime law and logistics analytics, with strong industry links across the Solent.",
    modules: [
      { heading: "Year one", items: ["Introduction to shipping", "Global supply chains", "Maritime geography"] },
      { heading: "Year two", items: ["Port operations", "Chartering and broking", "Maritime law"] },
      { heading: "Year three", items: ["Logistics analytics", "Strategy in shipping", "Industry project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BCC", note: "No specific subjects required." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-graphic-design",
    title: "BA (Hons) Graphic Design",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "design",
    school: "School of Art, Design and Fashion",
    description: "Build a distinctive portfolio across brand, editorial, motion and digital design.",
    overview: "Studio-based teaching with live briefs, competitions and industry critique, graduating with a portfolio shaped for brand, editorial, motion or digital practice.",
    modules: [
      { heading: "Year one", items: ["Design principles", "Typography", "Image making"] },
      { heading: "Year two", items: ["Brand identity", "Editorial and motion", "Live studio briefs"] },
      { heading: "Year three", items: ["Portfolio development", "Professional practice", "Final major project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level CCC plus portfolio", note: "A creative portfolio is reviewed as part of the application." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-film-production",
    title: "BA (Hons) Film Production",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "media",
    school: "School of Media and Film",
    description: "Crew real productions from day one using industry-standard kit, studios and post facilities.",
    overview: "Learn every stage of production by making films continuously: developing, shooting and finishing work in professional facilities, and graduating with a screening-ready portfolio.",
    modules: [
      { heading: "Year one", items: ["Camera and lighting", "Editing foundations", "Short film production"] },
      { heading: "Year two", items: ["Directing and producing", "Sound and post production", "Documentary practice"] },
      { heading: "Year three", items: ["Advanced production", "Industry engagement", "Graduation film"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level CCC", note: "A showreel or creative portfolio strengthens an application." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-football-studies",
    title: "BSc (Hons) Football Studies",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "sport",
    school: "School of Sport, Health and Social Sciences",
    description: "Study the world's game across coaching, analysis, business and community development.",
    overview: "A pioneering programme examining football from every angle: coaching practice, performance analysis, club operations, media and the game's social role.",
    modules: [
      { heading: "Year one", items: ["Coaching foundations", "Football in society", "Performance fundamentals"] },
      { heading: "Year two", items: ["Match and data analysis", "Football business", "Community programmes"] },
      { heading: "Year three", items: ["Talent development", "Applied placement", "Research project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level CCC", note: "No specific subjects required." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  course({
    id: "ssu-adult-nursing",
    title: "BSc (Hons) Adult Nursing",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "health",
    school: "School of Sport, Health and Social Sciences",
    description: "Qualify for registration as an adult nurse through balanced clinical placements and simulation.",
    overview: "Half your time in supervised clinical placements across the region and half in teaching and high-fidelity simulation, meeting professional registration requirements on graduation.",
    modules: [
      { heading: "Year one", items: ["Foundations of nursing", "Anatomy and physiology", "First placements"] },
      { heading: "Year two", items: ["Acute and community care", "Pharmacology", "Extended placements"] },
      { heading: "Year three", items: ["Complex care", "Leadership in practice", "Consolidation placement"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BCC", note: "Plus interview, occupational health clearance and an enhanced DBS check." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 7.0", note: "Required for professional registration." },
    ],
  }),
];

/** Same shape as course(), but stamped with Portsmouth rather than Solent. */
function portsmouthCourse(entry) {
  return {
    university: PORTSMOUTH.name,
    universityId: PORTSMOUTH.id,
    code: PORTSMOUTH.code,
    location: PORTSMOUTH.city,
    start: START,
    fee: FEE,
    ...entry,
  };
}

export const PORTSMOUTH_COURSES = [
  portsmouthCourse({
    id: "uop-cyber-forensics",
    title: "BSc (Hons) Cybersecurity and Forensic Computing",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "computing",
    school: "School of Computing",
    description: "Investigate incidents and recover digital evidence to a standard that stands up in court.",
    overview: "Combine network defence with the discipline of forensic investigation: evidence handling, chain of custody, malware analysis and expert reporting, taught in dedicated forensic labs.",
    modules: [
      { heading: "Year one", items: ["Networks and operating systems", "Programming foundations", "Introduction to digital forensics"] },
      { heading: "Year two", items: ["Malware analysis", "Evidence handling and law", "Penetration testing"] },
      { heading: "Year three", items: ["Advanced forensics", "Incident response", "Individual project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BBC", note: "A technology or science subject is helpful but not required." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  portsmouthCourse({
    id: "uop-international-business",
    title: "BA (Hons) International Business Management",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "business",
    school: "Portsmouth Business School",
    description: "Manage across borders, with a language option and the choice of a year abroad.",
    overview: "Study how organisations trade and operate internationally: cross-cultural management, global markets, trade and finance, with an optional placement or exchange year.",
    modules: [
      { heading: "Year one", items: ["Global business environment", "Principles of management", "Economics for business"] },
      { heading: "Year two", items: ["Cross-cultural management", "International marketing", "Trade and finance"] },
      { heading: "Year three", items: ["Global strategy", "Emerging markets", "Consultancy project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BCC", note: "No specific subjects required." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  portsmouthCourse({
    id: "uop-marine-biology",
    title: "BSc (Hons) Marine Biology",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "maritime",
    school: "School of Biological Sciences",
    description: "Study marine ecosystems with fieldwork on the Solent and beyond.",
    overview: "Marine ecology, oceanography and conservation taught with regular fieldwork, laboratory practice and a research project on a coastline that sits on the doorstep.",
    modules: [
      { heading: "Year one", items: ["Marine ecosystems", "Biological principles", "Field skills"] },
      { heading: "Year two", items: ["Oceanography", "Marine conservation", "Research methods"] },
      { heading: "Year three", items: ["Fisheries and policy", "Applied field project", "Individual project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BBC", note: "Including Biology." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  portsmouthCourse({
    id: "uop-msc-data-science",
    title: "MSc Data Science and Analytics",
    level: "Postgraduate",
    mode: "Full time",
    duration: "1 year",
    deadline: PG_DEADLINE,
    subject: "data-science",
    school: "School of Computing",
    description: "Turn large, messy datasets into decisions organisations can act on.",
    overview: "Statistical modelling, machine learning and data engineering, with attention to communicating findings clearly, ending in an applied dissertation.",
    modules: [
      { heading: "Semester one", items: ["Statistical modelling", "Data engineering", "Programming for data science"] },
      { heading: "Semester two", items: ["Machine learning", "Big data platforms", "Ethics and governance"] },
      { heading: "Dissertation", items: ["Applied research project", "Industry engagement", "Professional practice"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "2:2 honours degree", note: "In a numerate or computing subject; relevant experience considered." },
      { label: "International applicants", value: "Accepted equivalent degree", note: "Equivalent international qualifications are accepted." },
      { label: "English language", value: "IELTS 6.5", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
  portsmouthCourse({
    id: "uop-mechanical-engineering",
    title: "BEng (Hons) Mechanical Engineering",
    level: "Undergraduate",
    mode: "Full time",
    duration: "3 years",
    deadline: UG_DEADLINE,
    subject: "computing",
    school: "School of Mechanical and Design Engineering",
    description: "Design and test mechanical systems in well-equipped engineering labs.",
    overview: "Thermodynamics, materials, dynamics and design brought together through laboratory work and a substantial individual design project.",
    modules: [
      { heading: "Year one", items: ["Engineering mathematics", "Materials and structures", "Design principles"] },
      { heading: "Year two", items: ["Thermodynamics", "Dynamics and control", "Manufacturing"] },
      { heading: "Year three", items: ["Finite element analysis", "Engineering management", "Individual project"] },
    ],
    entryRequirements: [
      { label: "Academic qualifications", value: "A-level BBC", note: "Including Mathematics and preferably Physics." },
      { label: "International applicants", value: "Accepted equivalent qualification", note: "Equivalent international secondary or diploma qualifications are accepted." },
      { label: "English language", value: "IELTS 6.0", note: "Or an accepted equivalent for non-native English speakers." },
    ],
  }),
];

/** Every course across every institution, for search and listing screens. */
export const ALL_COURSES = [...SOLENT_COURSES, ...PORTSMOUTH_COURSES];

const COURSES_BY_UNIVERSITY = {
  [SOLENT.id]: SOLENT_COURSES,
  [PORTSMOUTH.id]: PORTSMOUTH_COURSES,
};

/** Courses for one university id; an unknown id has an empty catalogue. */
export function coursesForUniversity(universityId) {
  return COURSES_BY_UNIVERSITY[universityId] || [];
}

/** Find one course across all institutions, for the detail screen. */
export function findCourse(courseId) {
  return ALL_COURSES.find((item) => item.id === courseId) || null;
}
