import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type getTasks from "@/fetchers/task/get-tasks";
import { fetchProjectBoard } from "./fetch-project-board";

export function useGetTasks(projectId: string) {
  const queryClient = useQueryClient();
  const [progress, setProgress] =
    useState<Awaited<ReturnType<typeof getTasks>>>();
  const query = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async ({ signal }) => {
      setProgress(undefined);
      try {
        return await fetchProjectBoard(
          queryClient,
          projectId,
          signal,
          setProgress,
        );
      } finally {
        setProgress(undefined);
      }
    },
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    enabled: !!projectId,
  });
  return {
    ...query,
    data: query.data ?? (query.isFetching ? progress : undefined),
  };
}
