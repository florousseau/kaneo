import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BoardHeaderSearch from "@/components/board/board-header-search";
import BoardSkeleton from "@/components/board/board-skeleton";
import BoardToolbar from "@/components/board/board-toolbar";
import AllProjectsLayout from "@/components/common/all-projects-layout";
import KanbanBoard from "@/components/kanban-board";
import ListView from "@/components/list-view";
import PageTitle from "@/components/page-title";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import useGetLabelsByWorkspace from "@/hooks/queries/label/use-get-labels-by-workspace";
import { useGetAllProjectTasks } from "@/hooks/queries/task/use-get-all-project-tasks";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { useBoardSort } from "@/hooks/use-board-sort";
import { useTaskFiltersWithLabelsSupport } from "@/hooks/use-task-filters-with-labels-support";
import {
  ALL_PROJECTS_ID,
  findTaskProjectId,
} from "@/lib/all-projects/merge-project-boards";
import { sortTasks } from "@/lib/sort-tasks";
import useProjectStore from "@/store/project";
import { useUserPreferencesStore } from "@/store/user-preferences";

type BoardSearchParams = {
  taskId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/all-projects/board",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): BoardSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { workspaceId } = Route.useParams();
  const { taskId } = Route.useSearch();
  const navigate = useNavigate();
  const { board, projectIds, isError, refetch } =
    useGetAllProjectTasks(workspaceId);
  const setProject = useProjectStore((state) => state.setProject);
  const { viewMode, setViewMode } = useUserPreferencesStore();
  const [searchQuery, setSearchQuery] = useState("");
  const scopeKey = `${ALL_PROJECTS_ID}:${workspaceId}`;
  const { sort, setSort } = useBoardSort(scopeKey);

  const { data: users } = useGetActiveWorkspaceUsers(workspaceId);
  const { data: workspaceLabels = [] } = useGetLabelsByWorkspace(workspaceId);

  // Cards read the stored board for task keys and completed columns.
  useEffect(() => {
    if (board) setProject(board);
  }, [board, setProject]);

  const {
    filters,
    updateFilter,
    updateLabelFilter,
    updateCustomFieldFilter,
    filteredProject,
    hasActiveFilters,
    clearFilters,
  } = useTaskFiltersWithLabelsSupport(board, scopeKey, searchQuery);

  const sortedBoard = useMemo(() => {
    if (!filteredProject || sort.field === "position") return filteredProject;
    return {
      ...filteredProject,
      columns: filteredProject.columns.map((column) => ({
        ...column,
        tasks: sortTasks(column.tasks, sort),
      })),
    };
  }, [filteredProject, sort]);

  const taskProjectId = findTaskProjectId(board, taskId);

  const handleCloseTaskSheet = useCallback(() => {
    navigate({ to: ".", search: {}, replace: true });
  }, [navigate]);

  return (
    <AllProjectsLayout
      workspaceId={workspaceId}
      projectIds={projectIds}
      activeView="board"
      headerActions={
        <BoardHeaderSearch value={searchQuery} onChange={setSearchQuery} />
      }
    >
      <PageTitle
        title={`${t("navigation:allProjects.title")} · ${viewMode === "board" ? t("tasks:view.board") : t("tasks:view.list")}`}
        hideAppName
      />
      <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
        <BoardToolbar
          project={board}
          filters={filters}
          updateFilter={updateFilter}
          updateLabelFilter={updateLabelFilter}
          updateCustomFieldFilter={updateCustomFieldFilter}
          clearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
          users={users}
          workspaceLabels={workspaceLabels}
          viewMode={viewMode}
          setViewMode={setViewMode}
          sort={sort}
          onSortChange={setSort}
        />

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
        <div className="flex h-full flex-1 overflow-hidden bg-background">
          {/* Statuses differ between projects, so cards cannot be dragged
              between merged columns; status changes go through the task. */}
          {sortedBoard ? (
            viewMode === "board" ? (
              <KanbanBoard
                project={sortedBoard}
                disableCollectionActions
                disableDragDrop
              />
            ) : (
              <ListView
                project={sortedBoard}
                disableCollectionActions
                disableDragDrop
              />
            )
          ) : isError ? null : (
            <BoardSkeleton />
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
