import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BacklogListView from "@/components/backlog-list-view";
import BoardHeaderSearch from "@/components/board/board-header-search";
import AllProjectsLayout from "@/components/common/all-projects-layout";
import SortControl from "@/components/common/sort-control";
import PageTitle from "@/components/page-title";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { useGetAllProjectTasks } from "@/hooks/queries/task/use-get-all-project-tasks";
import { findTaskProjectId } from "@/lib/all-projects/merge-project-boards";
import { type SortConfig, sortTasks } from "@/lib/sort-tasks";
import { getTaskKey } from "@/lib/task-key";
import useProjectStore from "@/store/project";
import type Task from "@/types/task";

type BacklogSearchParams = {
  taskId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/all-projects/backlog",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): BacklogSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
});

function matchesQuery(task: Task, query: string) {
  return (
    task.title.toLowerCase().includes(query) ||
    getTaskKey(task).toLowerCase().startsWith(query) ||
    (task.projectName?.toLowerCase().includes(query) ?? false)
  );
}

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { taskId } = Route.useSearch();
  const navigate = useNavigate();
  const { board, projectIds, isError, refetch } =
    useGetAllProjectTasks(workspaceId);
  const setProject = useProjectStore((state) => state.setProject);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortConfig>({
    field: "position",
    direction: "asc",
  });

  // Rows read the stored board for task keys and completed columns.
  useEffect(() => {
    if (board) setProject(board);
  }, [board, setProject]);

  const visibleBoard = useMemo(() => {
    if (!board) return undefined;
    const query = searchQuery.trim().toLowerCase();
    const prepare = (tasks: Task[]) => {
      const matching = query
        ? tasks.filter((task) => matchesQuery(task, query))
        : tasks;
      return sort.field === "position" ? matching : sortTasks(matching, sort);
    };
    return {
      ...board,
      plannedTasks: prepare(board.plannedTasks),
      archivedTasks: prepare(board.archivedTasks),
    };
  }, [board, searchQuery, sort]);

  const taskProjectId = findTaskProjectId(board, taskId);

  const handleCloseTaskSheet = useCallback(() => {
    navigate({ to: ".", search: {}, replace: true });
  }, [navigate]);

  return (
    <AllProjectsLayout
      workspaceId={workspaceId}
      projectIds={projectIds}
      activeView="backlog"
      headerActions={
        <BoardHeaderSearch value={searchQuery} onChange={setSearchQuery} />
      }
    >
      <PageTitle
        title={t("tasks:backlog.pageTitle", {
          name: t("navigation:allProjects.title"),
        })}
      />
      <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
        <div className="border-border/80 border-b bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
          <div className="flex min-h-12 items-center px-3 py-2 md:px-4">
            <SortControl sort={sort} onSortChange={setSort} />
          </div>
        </div>

        {isError && (
          <p role="alert" className="p-4 text-destructive">
            {t("tasks:calendar.loadError")}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void refetch()}
            >
              {t("tasks:descriptionRetry")}
            </button>
          </p>
        )}

        <div className="flex-1 overflow-hidden bg-card h-full">
          {visibleBoard ? (
            // Reordering is per project, so a mixed backlog stays read-only.
            <BacklogListView project={visibleBoard} disableDragDrop />
          ) : isError ? null : (
            <div className="flex h-full items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-lg animate-pulse mx-auto" />
                <div className="space-y-2">
                  <div className="w-48 h-4 bg-muted rounded animate-pulse mx-auto" />
                  <div className="w-64 h-3 bg-muted rounded animate-pulse mx-auto" />
                </div>
              </div>
            </div>
          )}
        </div>

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
