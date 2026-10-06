import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import BoardHeaderSearch from "@/components/board/board-header-search";
import BoardSkeleton from "@/components/board/board-skeleton";
import BoardToolbar from "@/components/board/board-toolbar";
import ProjectLayout from "@/components/common/project-layout";
import KanbanBoard from "@/components/kanban-board";
import ListView from "@/components/list-view";
import PageTitle from "@/components/page-title";
import type { CustomFieldDefinition } from "@/components/project/custom-field-editor";
import CreateTaskModal from "@/components/shared/modals/create-task-modal";
import TaskDetailsSheet from "@/components/task/task-details-sheet";
import { shortcuts } from "@/constants/shortcuts";
import useGetCustomFieldFilterValues from "@/hooks/queries/custom-field/use-get-custom-field-filter-values";
import useGetCustomFieldsByProject from "@/hooks/queries/custom-field/use-get-custom-fields-by-project";
import useGetLabelsByWorkspace from "@/hooks/queries/label/use-get-labels-by-workspace";
import { useDescriptionMatches } from "@/hooks/queries/task/use-description-matches";
import { useGetTasks } from "@/hooks/queries/task/use-get-tasks";
import { useGetActiveWorkspaceUsers } from "@/hooks/queries/workspace-users/use-get-active-workspace-users";
import { useBoardSort } from "@/hooks/use-board-sort";
import { useRegisterShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useTaskFiltersWithLabelsSupport } from "@/hooks/use-task-filters-with-labels-support";
import { cn } from "@/lib/cn";
import { sortTasks } from "@/lib/sort-tasks";
import { useBackgroundStore } from "@/store/background";
import useProjectStore from "@/store/project";
import { useUserPreferencesStore } from "@/store/user-preferences";

type BoardSearchParams = {
  taskId?: string;
};

export const Route = createFileRoute(
  "/_layout/_authenticated/dashboard/workspace/$workspaceId/project/$projectId/board",
)({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>): BoardSearchParams => ({
    taskId: typeof search.taskId === "string" ? search.taskId : undefined,
  }),
});

function RouteComponent() {
  const { t } = useTranslation();
  const { projectId, workspaceId } = Route.useParams();
  const { taskId } = Route.useSearch();
  const navigate = useNavigate();
  const {
    data,
    isError: boardError,
    isFetching: boardFetching,
    refetch: retryBoard,
  } = useGetTasks(projectId);
  const { project, setProject } = useProjectStore();
  const { viewMode, setViewMode } = useUserPreferencesStore();
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [boardSearchQuery, setBoardSearchQuery] = useState("");
  const { sort, setSort } = useBoardSort(projectId);
  const { background } = useBackgroundStore();

  const { data: users } = useGetActiveWorkspaceUsers(workspaceId);
  const { data: workspaceLabels = [] } = useGetLabelsByWorkspace(workspaceId);

  const { data: rawCustomFields = [] } = useGetCustomFieldsByProject(projectId);

  const { data: filterValuesData = [] } =
    useGetCustomFieldFilterValues(projectId);

  const customFieldDefinitions = useMemo<CustomFieldDefinition[]>(
    () =>
      rawCustomFields.map((f, index) => ({
        ...f,
        type: f.type as CustomFieldDefinition["type"],
        options: Array.isArray(f.options) ? (f.options as string[]) : null,
        position: index,
      })),
    [rawCustomFields],
  );

  const usedCustomFieldValues = useMemo<Record<string, string[]>>(() => {
    return Object.fromEntries(
      filterValuesData.map((f) => [f.fieldId, f.values]),
    );
  }, [filterValuesData]);

  const handleCloseTaskSheet = useCallback(() => {
    navigate({
      to: ".",
      search: {},
      replace: true,
    });
  }, [navigate]);

  useRegisterShortcuts({
    sequentialShortcuts: {
      [shortcuts.view.prefix]: {
        [shortcuts.view.board]: () => setViewMode("board"),
        [shortcuts.view.list]: () => setViewMode("list"),
        [shortcuts.view.calendar]: () =>
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/calendar",
            params: { workspaceId, projectId },
          }),
        [shortcuts.view.gantt]: () =>
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/gantt",
            params: { workspaceId, projectId },
          }),
        [shortcuts.view.backlog]: () =>
          navigate({
            to: "/dashboard/workspace/$workspaceId/project/$projectId/backlog",
            params: { workspaceId, projectId },
          }),
      },
    },
  });

  useEffect(() => {
    if (data) {
      setProject(data);
    }
  }, [data, setProject]);

  const descriptionSearch = useDescriptionMatches(
    projectId,
    project,
    boardSearchQuery,
  );

  const {
    filters,
    updateFilter,
    updateLabelFilter,
    updateCustomFieldFilter,
    filteredProject,
    hasActiveFilters,
    clearFilters,
  } = useTaskFiltersWithLabelsSupport(
    project,
    projectId,
    boardSearchQuery,
    descriptionSearch.ids,
  );

  const sortedProject = useMemo(() => {
    if (!filteredProject || sort.field === "position") return filteredProject;
    return {
      ...filteredProject,
      columns: filteredProject.columns.map((column) => ({
        ...column,
        tasks: sortTasks(column.tasks, sort),
      })),
    };
  }, [filteredProject, sort]);

  const boardHeaderSearch = (
    <BoardHeaderSearch
      value={boardSearchQuery}
      onChange={setBoardSearchQuery}
    />
  );

  return (
    <ProjectLayout
      projectId={projectId}
      workspaceId={workspaceId}
      activeView="board"
      headerActions={boardHeaderSearch}
    >
      <PageTitle
        title={`${project?.name} · ${viewMode === "board" ? t("tasks:view.board") : t("tasks:view.list")}`}
        hideAppName
      />
      <div className="relative flex flex-col h-full min-h-0 overflow-hidden">
        <BoardToolbar
          project={project}
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
          customFieldDefinitions={customFieldDefinitions}
          usedCustomFieldValues={usedCustomFieldValues}
        />

        {descriptionSearch.isLoading && (
          <p role="status" className="px-4 py-2 text-sm text-muted-foreground">
            {t("tasks:descriptionSearchLoading")}
          </p>
        )}
        {descriptionSearch.isError && (
          <p role="alert" className="px-4 py-2 text-sm text-destructive">
            {t("tasks:descriptionSearchError")}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void descriptionSearch.retry()}
            >
              {t("tasks:descriptionRetry")}
            </button>
          </p>
        )}

        {boardError && (
          <p role="alert" className="p-4 text-destructive">
            {t("tasks:calendar.loadError")}{" "}
            <button
              type="button"
              className="underline"
              onClick={() => void retryBoard()}
            >
              {t("tasks:descriptionRetry")}
            </button>
          </p>
        )}
        <div
          className={cn("flex h-full flex-1 overflow-hidden", {
            "bg-background": !background,
          })}
        >
          {sortedProject ? (
            viewMode === "board" ? (
              <KanbanBoard
                project={sortedProject}
                disableCollectionActions={boardFetching || boardError}
                disableDragDrop={
                  boardFetching ||
                  boardError ||
                  (sort.field !== "position" &&
                    sort.field !== "number" &&
                    sort.field !== "priority")
                }
                sortedByNumber={sort.field === "number"}
                sortedByPriority={sort.field === "priority"}
              />
            ) : (
              <ListView
                project={sortedProject}
                disableCollectionActions={boardFetching || boardError}
                disableDragDrop={
                  boardFetching || boardError || sort.field !== "position"
                }
              />
            )
          ) : boardError ? null : (
            <BoardSkeleton />
          )}
        </div>

        <CreateTaskModal
          open={isTaskModalOpen}
          projectId={projectId}
          onClose={() => setIsTaskModalOpen(false)}
        />

        <TaskDetailsSheet
          taskId={taskId}
          projectId={projectId}
          workspaceId={workspaceId}
          onClose={handleCloseTaskSheet}
        />
      </div>
    </ProjectLayout>
  );
}
