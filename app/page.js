"use client";
import { useState, useEffect } from "react";
import { watchAuth, getUserProfile, logout } from "../lib/auth";
import { getUniversities } from "../lib/db";

import PrototypeSwitcher from "../components/PrototypeSwitcher";
import ToastNotification from "../components/ToastNotification";
import PublicFooter from "../components/PublicFooter";
import GlobalModals from "../components/GlobalModals";

import LandingScreen from "../components/LandingScreen";
import UniversitiesScreen from "../components/UniversitiesScreen";
import CoursesScreen from "../components/CoursesScreen";
import CourseDetailScreen from "../components/CourseDetailScreen";
import SupportScreen from "../components/SupportScreen";

import LoginScreen from "../components/LoginScreen";
import RegisterScreen from "../components/RegisterScreen";
import VerifyEmailScreen from "../components/VerifyEmailScreen";

import StudentPortal from "../components/StudentPortal";
import StaffPortal from "../components/StaffPortal";
import SessionTimeoutWarning from "../components/SessionTimeoutWarning";

export default function Home() {
  const [screen, setScreen] = useState("landing");
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [universities, setUniversities] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeModal, setActiveModal] = useState(null);

  const [toast, setToast] = useState({ visible: false, title: "", message: "" });

  const notify = (title, message) => {
    setToast({ visible: true, title, message });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), 3500);
  };

  useEffect(() => {
    // Load initial universities list
    getUniversities()
      .then((unis) => setUniversities(unis))
      .catch((e) => console.error(e));

    // Watch auth state
    try {
      const unsub = watchAuth(async (u) => {
        setUser(u);
        if (u) {
          const p = await getUserProfile(u.uid);
          setProfile(p);
        } else {
          setProfile(null);
        }
      });
      return unsub;
    } catch (err) {
      console.error(err);
      return undefined;
    }
  }, []);

  const handleSignOut = async () => {
    try {
      await logout();
      setUser(null);
      setProfile(null);
      notify("Signed Out", "You have been signed out.");
      setScreen("landing");
    } catch (err) {
      notify("Error", err.message);
    }
  };

  const handleStartApplication = (course) => {
    if (course) setSelectedCourse(course);
    setScreen("form");
  };

  const isPublicScreen = ["landing", "universities", "courses", "course-detail", "support"].includes(screen);
  const isStudentPortalRoute = ["dashboard", "applications", "form", "documents", "payments", "notifications", "account", "confirmation", "decision-outcome"].includes(screen);
  const isStaffPortalRoute = ["staff-overview", "admissions", "detail", "staff-documents", "staff-decisions", "admin"].includes(screen);

  return (
    <main>
      {/* 1. Prototype Nav Switcher & Toast Notifications */}
      <PrototypeSwitcher
        currentScreen={screen}
        setScreen={setScreen}
        user={user}
        profile={profile}
        onSignOut={handleSignOut}
      />
      <ToastNotification toast={toast} />

      {/* 2. Public Screens */}
      {screen === "landing" && (
        <LandingScreen
          setScreen={setScreen}
          universities={universities}
          onSelectCourse={(c) => setSelectedCourse(c)}
          user={user}
          onSignOut={handleSignOut}
        />
      )}

      {screen === "universities" && (
        <UniversitiesScreen
          setScreen={setScreen}
          universities={universities}
          user={user}
          onSignOut={handleSignOut}
        />
      )}

      {screen === "courses" && (
        <CoursesScreen
          setScreen={setScreen}
          user={user}
          onSignOut={handleSignOut}
          onSelectCourse={(c) => setSelectedCourse(c)}
        />
      )}

      {screen === "course-detail" && (
        <CourseDetailScreen
          setScreen={setScreen}
          selectedCourse={selectedCourse}
          user={user}
          onStartApplication={handleStartApplication}
        />
      )}

      {screen === "support" && (
        <SupportScreen
          setScreen={setScreen}
          user={user}
          onSignOut={handleSignOut}
          onOpenModal={(name) => setActiveModal(name)}
        />
      )}

      {/* 3. Auth Screens */}
      {screen === "login" && (
        <LoginScreen
          setScreen={setScreen}
          onLoginSuccess={async (u) => {
            const p = await getUserProfile(u.uid);
            setProfile(p);
            if (p?.role === "admin") setScreen("staff-overview");
            else setScreen("dashboard");
          }}
          notify={notify}
        />
      )}

      {screen === "register" && (
        <RegisterScreen
          setScreen={setScreen}
          onRegisterSuccess={() => setScreen("verify-email")}
          notify={notify}
        />
      )}

      {screen === "verify-email" && (
        <VerifyEmailScreen
          setScreen={setScreen}
          user={user}
          notify={notify}
        />
      )}

      {/* 4. Student Applicant Portal */}
      {isStudentPortalRoute && (
        <StudentPortal
          subRoute={screen}
          setScreen={setScreen}
          user={user}
          profile={profile}
          onSignOut={handleSignOut}
          notify={notify}
          onOpenModal={(name) => setActiveModal(name)}
        />
      )}

      {/* 5. Staff Admissions Workspace */}
      {isStaffPortalRoute && (
        <StaffPortal
          subRoute={screen}
          setScreen={setScreen}
          user={user}
          profile={profile}
          onSignOut={handleSignOut}
          notify={notify}
        />
      )}

      {/* 6. Public Footer & Modals */}
      {isPublicScreen && (
        <PublicFooter
          setScreen={setScreen}
          onOpenModal={(name) => setActiveModal(name)}
        />
      )}

      <GlobalModals
        activeModal={activeModal}
        onCloseModal={() => setActiveModal(null)}
        notify={notify}
      />

      <SessionTimeoutWarning
        user={user}
        onSignOut={handleSignOut}
        onExtendSession={() => notify("Session Extended", "Your active session has been renewed.")}
      />
    </main>
  );
}
