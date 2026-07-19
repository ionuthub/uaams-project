"use client";

export default function ToastNotification({ toast }) {
  if (!toast || !toast.visible) return null;
  return (
    <aside className="toast" aria-live="polite" role="status">
      <strong>{toast.title}</strong>
      <span>{toast.message}</span>
    </aside>
  );
}
