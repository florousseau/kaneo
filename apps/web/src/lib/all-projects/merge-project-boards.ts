import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";

// Stands in for a project id wherever the unified view reuses project
// components. It never reaches the API: modals fall back to a project picker.
export const ALL_PROJECTS_ID = "all-projects";

type MergedColumn = ProjectWithTasks["columns"][number];

function withProject(project: ProjectWithTasks) {
  return (task: Task): Task => ({
    ...task,
    projectName: project.name,
    projectSlug: project.slug,
    projectIcon: project.icon,
  });
}

/**
 * Combines several project boards into one board-shaped object. Columns are
 * matched by status slug, so projects that share the default workflow line up
 * and custom statuses get their own column, ordered by their lowest position.
 */
export function mergeProjectBoards(
  boards: ProjectWithTasks[],
  workspaceId: string,
  name: string,
): ProjectWithTasks {
  const columns = new Map<string, MergedColumn>();
  const plannedTasks: Task[] = [];
  const archivedTasks: Task[] = [];

  for (const board of boards) {
    const annotate = withProject(board);
    for (const column of board.columns) {
      const existing = columns.get(column.slug);
      const tasks = column.tasks.map(annotate);
      if (existing) {
        existing.tasks.push(...tasks);
        existing.isFinal = existing.isFinal || column.isFinal;
        existing.position = Math.min(
          existing.position ?? 0,
          column.position ?? 0,
        );
      } else {
        columns.set(column.slug, { ...column, id: column.slug, tasks });
      }
    }
    plannedTasks.push(...board.plannedTasks.map(annotate));
    archivedTasks.push(...board.archivedTasks.map(annotate));
  }

  return {
    id: ALL_PROJECTS_ID,
    name,
    slug: "",
    icon: null,
    description: null,
    descriptionDeferred: false,
    isPublic: false,
    workspaceId,
    backgroundVersion: null,
    columns: Array.from(columns.values()).sort(
      (left, right) => (left.position ?? 0) - (right.position ?? 0),
    ),
    plannedTasks,
    archivedTasks,
  };
}

export function findTaskProjectId(
  board: ProjectWithTasks | undefined,
  taskId: string | undefined,
) {
  if (!board || !taskId) return undefined;
  const tasks = [
    ...board.columns.flatMap((column) => column.tasks),
    ...board.plannedTasks,
    ...board.archivedTasks,
  ];
  return tasks.find((task) => task.id === taskId)?.projectId;
}
