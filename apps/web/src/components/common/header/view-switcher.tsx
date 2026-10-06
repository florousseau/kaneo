import {
  CalendarDays,
  CalendarRange,
  SquareKanban,
  SquircleDashed,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export type TaskView = "backlog" | "board" | "calendar" | "gantt";

type ViewSwitcherProps = {
  activeView: TaskView;
  onSelectView: (view: TaskView) => void;
  className?: string;
};

export default function ViewSwitcher({
  activeView,
  onSelectView,
  className,
}: ViewSwitcherProps) {
  const { t } = useTranslation();
  const views = [
    { view: "backlog", icon: SquircleDashed, label: "Backlog" },
    { view: "board", icon: SquareKanban, label: t("tasks:title") },
    { view: "calendar", icon: CalendarRange, label: t("tasks:calendar.title") },
    { view: "gantt", icon: CalendarDays, label: "Gantt" },
  ] as const;

  return (
    <div
      className={cn(
        "h-8 items-center gap-0.5 rounded-lg border border-border/80 bg-background p-0.5",
        className,
      )}
    >
      {views.map(({ view, icon: Icon, label }) => (
        <Button
          key={view}
          variant={activeView === view ? "secondary" : "ghost"}
          size="xs"
          onClick={() => onSelectView(view)}
          className={cn(
            "h-6 gap-1.5 rounded-md px-2 text-xs",
            activeView !== view && "text-muted-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </Button>
      ))}
    </div>
  );
}
