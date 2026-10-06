import type { QueryClient } from "@tanstack/react-query";
import getTasks from "@/fetchers/task/get-tasks";
import { markBoardCacheChanged } from "@/lib/board-cache-version";

type Board = Awaited<ReturnType<typeof getTasks>>;

/**
 * Query function for `["tasks", projectId]`. A board loads in several pages,
 * so an invalidation that lands mid-load is replayed once the load settles.
 */
export async function fetchProjectBoard(
  queryClient: QueryClient,
  projectId: string,
  signal: AbortSignal,
  onProgress?: (board: Board) => void,
) {
  markBoardCacheChanged(queryClient, projectId);
  const hasCachedBoard = !!queryClient.getQueryData(["tasks", projectId]);
  let invalidated = false;
  const unsubscribe = hasCachedBoard
    ? () => {}
    : queryClient.getQueryCache().subscribe((event) => {
        if (
          event.query.queryKey[0] !== "tasks" ||
          event.query.queryKey[1] !== projectId
        )
          return;
        if (event.type === "updated" && event.action.type === "invalidate")
          invalidated = true;
        if (
          event.type === "removed" ||
          (event.type === "updated" && event.query.state.fetchStatus === "idle")
        ) {
          unsubscribe();
          if (
            invalidated &&
            !signal.aborted &&
            event.type === "updated" &&
            event.action.type === "success"
          ) {
            queueMicrotask(() => {
              if (
                signal.aborted ||
                !queryClient.getQueryData(["tasks", projectId])
              )
                return;
              void queryClient.invalidateQueries({
                queryKey: ["tasks", projectId],
              });
            });
          }
        }
      });
  try {
    return await getTasks(projectId, signal, (board) => {
      if (!hasCachedBoard) onProgress?.(board);
    });
  } catch (error) {
    unsubscribe();
    throw error;
  }
}
