import {
  type UseQueryResult,
  useQueries,
  useQueryClient,
} from "@tanstack/react-query";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import useGetProjects from "@/hooks/queries/project/use-get-projects";
import { mergeProjectBoards } from "@/lib/all-projects/merge-project-boards";
import type { ProjectWithTasks } from "@/types/project";
import { fetchProjectBoard } from "./fetch-project-board";

type BoardResult = UseQueryResult<ProjectWithTasks | undefined>;

// Module scope keeps `combine` stable, so its result only changes with data.
function combineBoards(results: BoardResult[]) {
  return {
    data: results.map((result) => result.data),
    isPending: results.some((result) => result.isPending),
    isError: results.some((result) => result.isError),
    isFetching: results.some((result) => result.isFetching),
    refetch: () =>
      Promise.all(
        results
          .filter((result) => result.isError)
          .map((result) => result.refetch()),
      ),
  };
}

/**
 * Loads every project board of a workspace through the same `["tasks", id]`
 * cache entries the project views use, so mutations and realtime patches made
 * for one project show up here without extra wiring.
 */
export function useGetAllProjectTasks(workspaceId: string) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const projectsQuery = useGetProjects({ workspaceId });
  const projects = projectsQuery.data ?? [];

  const boards = useQueries({
    queries: projects.map((project) => ({
      queryKey: ["tasks", project.id],
      queryFn: ({ signal }: { signal: AbortSignal }) =>
        fetchProjectBoard(queryClient, project.id, signal),
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    })),
    combine: combineBoards,
  });

  const name = t("navigation:allProjects.title");
  const board = useMemo(() => {
    if (!projectsQuery.data || boards.isPending) return undefined;
    return mergeProjectBoards(
      boards.data.filter((entry) => entry !== undefined),
      workspaceId,
      name,
    );
  }, [projectsQuery.data, boards.isPending, boards.data, workspaceId, name]);

  return {
    board,
    projectIds: projects.map((project) => project.id),
    isLoading: projectsQuery.isPending || (!board && !boards.isError),
    isError: projectsQuery.isError || boards.isError,
    isFetching: projectsQuery.isFetching || boards.isFetching,
    refetch: () =>
      projectsQuery.isError ? projectsQuery.refetch() : boards.refetch(),
  };
}
