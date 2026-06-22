import { NavLink } from "react-router-dom";
import { ClipboardList, Layers, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/", label: "Testlar", icon: ClipboardList, end: true },
  { to: "/topics", label: "Mavzular", icon: Layers, end: false },
  { to: "/calendar", label: "Kalendar", icon: CalendarClock, end: false },
];

export function BottomNav({ dueCount = 0 }: { dueCount?: number }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-20 border-t-2 border-line bg-card">
      <div className="max-w-xl mx-auto grid grid-cols-3">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "relative flex flex-col items-center gap-0.5 py-2.5 font-extrabold text-xs",
                isActive ? "text-grass-dark" : "text-faint"
              )
            }
          >
            <Icon className="h-6 w-6" />
            {label}
            {to === "/calendar" && dueCount > 0 && (
              <span className="absolute top-1 right-[28%] grid h-4 min-w-4 place-items-center rounded-full bg-fox px-1 text-[10px] text-white">
                {dueCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
