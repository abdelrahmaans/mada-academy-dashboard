import {
  Bell,
  CheckCheck,
  ChevronLeft,
  CircleAlert,
  FileCheck2,
  Wallet,
  X,
} from "lucide-react";
import { useState } from "react";

export type NotificationKind =
  | "approval"
  | "escalation"
  | "correction"
  | "warning";

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
  actionLabel?: string;
};

export type NotificationCenterProps = {
  notifications: NotificationItem[];
  onAction?: (notification: NotificationItem) => void;
  onMarkAllRead?: () => void;
  demo?: boolean;
};

function NotificationIcon({ kind }: { kind: NotificationKind }) {
  if (kind === "approval") return <FileCheck2 size={16} />;
  if (kind === "correction") return <Wallet size={16} />;
  if (kind === "warning") return <CircleAlert size={16} />;
  return <CircleAlert size={16} />;
}

function notificationTone(kind: NotificationKind) {
  if (kind === "approval") return "notification-tone-teal";
  if (kind === "correction") return "notification-tone-amber";
  if (kind === "warning") return "notification-tone-red";
  return "notification-tone-violet";
}

export default function NotificationCenter({
  notifications,
  onAction,
  onMarkAllRead,
  demo = true,
}: NotificationCenterProps) {
  const [open, setOpen] = useState(false);
  const unreadCount = notifications.filter(item => item.unread).length;

  return (
    <div className="notification-center">
      <button
        className={`icon-button notification-button ${open ? "is-open" : ""}`}
        aria-label="الإشعارات"
        aria-expanded={open}
        aria-controls="notification-center-popover"
        onClick={() => setOpen(current => !current)}
      >
        {unreadCount > 0 && (
          <span
            className="notification-dot"
            aria-label={`${unreadCount} إشعارات غير مقروءة`}
          />
        )}
        <Bell size={18} />
      </button>
      {open && (
        <section
          id="notification-center-popover"
          className="notification-center-popover"
          role="dialog"
          aria-label="مركز الإشعارات"
        >
          <header className="notification-center-heading">
            <div>
              <strong>الإشعارات</strong>
              <small>
                {unreadCount
                  ? `${unreadCount} تحتاج تدخلك`
                  : "لا توجد عناصر جديدة"}
              </small>
            </div>
            <button
              className="notification-center-close"
              aria-label="إغلاق مركز الإشعارات"
              onClick={() => setOpen(false)}
            >
              <X size={15} />
            </button>
          </header>
          {notifications.length ? (
            <div className="notification-center-list">
              {notifications.map(notification => (
                <article
                  className={`notification-center-item ${notification.unread ? "is-unread" : ""}`}
                  key={notification.id}
                >
                  <span
                    className={`notification-center-icon ${notificationTone(notification.kind)}`}
                  >
                    <NotificationIcon kind={notification.kind} />
                  </span>
                  <div className="notification-center-copy">
                    <strong>{notification.title}</strong>
                    <p>{notification.description}</p>
                    <small>{notification.time}</small>
                    {notification.actionLabel && onAction && (
                      <button
                        className="notification-center-action"
                        onClick={() => {
                          onAction(notification);
                          setOpen(false);
                        }}
                      >
                        {notification.actionLabel} <ChevronLeft size={13} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="notification-center-empty">
              <CheckCheck size={19} />
              <strong>كل شيء تحت السيطرة</strong>
              <span>ستظهر هنا الطلبات التي تحتاج إجراءً.</span>
            </div>
          )}
          <footer className="notification-center-footer">
            {demo && (
              <span className="notification-center-demo">
                DEMO · البيانات محلية
              </span>
            )}
            {unreadCount > 0 && onMarkAllRead && (
              <button onClick={onMarkAllRead}>
                تحديد الكل كمقروء <CheckCheck size={13} />
              </button>
            )}
          </footer>
        </section>
      )}
    </div>
  );
}
