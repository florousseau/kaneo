import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import CalendarView from "@/components/calendar/calendar-view";
import AllProjectsLayout from "@/components/common/all-projects-layout";
import PageTitle from "@/components/page-title";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { useGetAllProjectTasks } from "@/hooks/queries/task/use-get-all-project-tasks";
import { findTaskProjectId } from "@/lib/all-projects/merge-project-boards";

type CalendarSearchParams = {
  taskId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/all-projects/calendar",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): CalendarSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { taskId } = Route.useSearch();
  const navigate = useNavigate();
  const { board, projectIds, isLoading, isError } =
    useGetAllProjectTasks(workspaceId);
  const taskProjectId = findTaskProjectId(board, taskId);

  const handleOpenTask = useCallback(
    (nextTaskId: string) => {
      navigate({ to: ".", search: { taskId: nextTaskId }, replace: true });
    },
    [navigate],
  );

  const handleCloseTaskSheet = useCallback(() => {
    navigate({ to: ".", search: {}, replace: true });
  }, [navigate]);

  return (
    <AllProjectsLayout
      workspaceId={workspaceId}
      projectIds={projectIds}
      activeView="calendar"
    >
      <PageTitle
        title={t("tasks:calendar.pageTitle", {
          name: t("navigation:allProjects.title"),
        })}
        hideAppName
      />
      <div className="flex h-full min-h-0 flex-col bg-background">
        <CalendarView
          project={board}
          isLoading={isLoading}
          isError={isError}
          onOpenTask={handleOpenTask}
        />

        <TaskDetailsSheet
          taskId={taskProjectId ? taskId : undefined}
          projectId={taskProjectId ?? ""}
          workspaceId={workspaceId}
          onClose={handleCloseTaskSheet}
        />
      </div>
    </AllProjectsLayout>
  );
}
