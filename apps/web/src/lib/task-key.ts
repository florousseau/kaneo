import type Task from "@/types/task";

/** Human task key such as `KAN-12`, preferring the task's own project slug. */
export function getTaskKey(
  task: Pick<Task, "number" | "projectSlug">,
  fallbackSlug?: string | null,
) {
  const slug = task.projectSlug || fallbackSlug;
  return slug && task.number != null ? `${slug}-${task.number}` : "";
}
