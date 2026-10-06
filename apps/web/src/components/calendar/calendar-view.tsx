import { addMonths, startOfMonth, subMonths } from "date-fns";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import CalendarToolbar from "@/components/calendar/calendar-toolbar";
import MonthGrid from "@/components/calendar/month-grid";
import { buildMonthWeeks } from "@/components/calendar/month-grid-model";
import { useIsMobile } from "@/hooks/use-mobile";
import { toScheduledTasks } from "@/lib/task-schedule";
import { useUserPreferencesStore } from "@/store/user-preferences";
import type { ProjectWithTasks } from "@/types/project";

// Lanes are capped so a busy week cannot push a row taller than the viewport;
// anything past the cap surfaces as a per-day overflow hint.
const MAX_LANES_DESKTOP = 3;
const MAX_LANES_MOBILE = 2;

type CalendarViewProps = {
  project: ProjectWithTasks | undefined;
  isLoading: boolean;
  isError: boolean;
  onOpenTask: (taskId: string) => void;
};

export default function CalendarView({
  project,
  isLoading,
  isError,
  onOpenTask,
}: CalendarViewProps) {
  const { t } = useTranslation();
  const weekStartsOn = useUserPreferencesStore((state) => state.weekStartsOn);
  const isMobile = useIsMobile();
  const [visibleMonth, setVisibleMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  const scheduledTasks = useMemo(() => toScheduledTasks(project), [project]);

  const weeks = useMemo(
    () => buildMonthWeeks(visibleMonth, weekStartsOn),
    [visibleMonth, weekStartsOn],
  );

  const handlePreviousMonth = useCallback(() => {
    setVisibleMonth((current) => subMonths(current, 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setVisibleMonth((current) => addMonths(current, 1));
  }, []);

  const handleToday = useCallback(() => {
    setVisibleMonth(startOfMonth(new Date()));
  }, []);

  return (
    <>
      <CalendarToolbar
        visibleMonth={visibleMonth}
        onPreviousMonth={handlePreviousMonth}
        onNextMonth={handleNextMonth}
        onToday={handleToday}
      />

      {isLoading ? (
        <div className="border-b border-border/80 px-4 py-3 text-center">
          <p className="text-sm text-muted-foreground">
            {t("common:empty.loading")}
          </p>
        </div>
      ) : isError ? (
        <div className="border-b border-border/80 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-destructive">
            {t("tasks:calendar.loadError")}
          </p>
        </div>
      ) : scheduledTasks.length === 0 ? (
        <div className="border-b border-border/80 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-foreground">
            {t("tasks:calendar.noTasks")}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {t("tasks:calendar.noTasksSubtitle")}
          </p>
        </div>
      ) : null}

      <MonthGrid
        weeks={weeks}
        tasks={scheduledTasks}
        visibleMonth={visibleMonth}
        maxLanes={isMobile ? MAX_LANES_MOBILE : MAX_LANES_DESKTOP}
        projectSlug={project?.slug}
        onOpenTask={onOpenTask}
      />
    </>
  );
}
