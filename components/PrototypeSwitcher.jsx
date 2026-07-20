"use client";

import { useState } from "react";
import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Upload,
  CreditCard,
  Bell,
  Settings,
  HelpCircle,
  Users,
  BadgeCheck,
  BookOpen,
  Mail,
  ChevronUp,
} from "lucide-react";

export default function PrototypeSwitcher({ currentScreen, setScreen, user, profile, onSignOut }) {
  const [isOpen, setIsOpen] = useState(false);

  const screens = [
    { group: "Public", items: [
      { id: "landing", label: "Landing page" },
      { id: "universities", label: "Universities directory" },
      { id: "courses", label: "Course search" },
      { id: "course-detail", label: "Course details" },
      { id: "support", label: "Help centre" },
    ]},
    { group: "Authentication", items: [
      { id: "login", label: "Sign in" },
      { id: "register", label: "Create account" },
    ]},
    { group: "Applicant portal", items: [
      { id: "dashboard", label: "Dashboard" },
      { id: "applications", label: "My applications" },
      { id: "form", label: "Application form" },
      { id: "documents", label: "Document library" },
      { id: "payments", label: "Payments" },
      { id: "notifications", label: "Notifications" },
      { id: "account", label: "Account settings" },
    ]},
    { group: "Staff workspace", items: [
      { id: "staff-overview", label: "Admissions overview" },
      { id: "admissions", label: "Applications queue" },
      { id: "detail", label: "Application detail & decision" },
      { id: "staff-documents", label: "Document requests" },
      { id: "staff-decisions", label: "Decision history" },
      { id: "admin", label: "University settings" },
    ]}
  ];

  return (
    <>
      <div className="prototype-bar" role="note">
        <span>UAAMS integrated application design</span>
        <span className="prototype-status">
          {user
            ? `Signed in as ${user.email} (${profile?.role || "student"})`
            : "Preview Mode · Connected to Live Firebase"}
        </span>
      </div>

      <aside className="prototype-switcher" aria-label="Prototype screen navigator">
        <button
          className="prototype-launcher"
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
        >
          <Sparkles className="w-4 h-4" />
          <span>Screens</span>
          <ChevronUp style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </button>

        {isOpen && (
          <div className="prototype-menu" role="dialog" aria-label="Screen navigator menu">
            <div className="prototype-menu-header">
              <strong>Interactive Prototype Navigator</strong>
              <p>Jump to any screen or test authentication & admissions workflows.</p>
            </div>

            <div className="prototype-screen-groups">
              {screens.map((group) => (
                <div key={group.group} className="prototype-group">
                  <span className="prototype-group-title">{group.group}</span>
                  <div className="prototype-button-grid">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        className={`prototype-nav-button ${currentScreen === item.id ? "is-active" : ""}`}
                        onClick={() => {
                          setScreen(item.id);
                          setIsOpen(false);
                        }}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {user && (
              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <small style={{ color: "var(--muted)" }}>Current Session: <b>{user.email}</b></small>
                <button
                  type="button"
                  className="button button-quiet button-small"
                  onClick={() => {
                    onSignOut();
                    setIsOpen(false);
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
