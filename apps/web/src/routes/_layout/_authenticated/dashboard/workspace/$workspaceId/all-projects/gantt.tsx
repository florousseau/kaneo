import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import AllProjectsLayout from "@/components/common/all-projects-layout";
import GanttView from "@/components/gantt/gantt-view";
import PageTitle from "@/components/page-title";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { useGetAllProjectTasks } from "@/hooks/queries/task/use-get-all-project-tasks";
import {
  ALL_PROJECTS_ID,
  findTaskProjectId,
} from "@/lib/all-projects/merge-project-boards";

type GanttSearchParams = {
  taskId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/all-projects/gantt",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): GanttSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { taskId } = Route.useSearch();
  const navigate = useNavigate();
  const { board, projectIds } = useGetAllProjectTasks(workspaceId);
  const taskProjectId = findTaskProjectId(board, taskId);

  return (
    <AllProjectsLayout
      workspaceId={workspaceId}
      projectIds={projectIds}
      activeView="gantt"
    >
      <PageTitle
        title={t("tasks:gantt.pageTitle", {
          name: t("navigation:allProjects.title"),
        })}
        hideAppName
      />
      <div className="flex h-full min-h-0 flex-col bg-background">
        <GanttView
          project={board}
          scopeKey={`${ALL_PROJECTS_ID}:${workspaceId}`}
          onOpenTask={(nextTaskId) =>
            navigate({
              to: ".",
              search: { taskId: nextTaskId },
              replace: true,
            })
          }
        />

        <TaskDetailsSheet
          taskId={taskProjectId ? taskId : undefined}
          projectId={taskProjectId ?? ""}
          workspaceId={workspaceId}
          onClose={() =>
            navigate({
              to: ".",
              search: {},
              replace: true,
            })
          }
        />
      </div>
    </AllProjectsLayout>
  );
}
