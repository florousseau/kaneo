import icons from "@/constants/project-icons";
import { cn } from "@/lib/cn";
import type Task from "@/types/task";

type TaskProjectBadgeProps = {
  task: Pick<Task, "projectName" | "projectIcon">;
  className?: string;
};

/** Names the task's project in views that mix several projects. */
export function TaskProjectBadge({ task, className }: TaskProjectBadgeProps) {
  if (!task.projectName) return null;
  const ProjectIcon =
    icons[task.projectIcon as keyof typeof icons] || icons.Layout;

  return (
    <span
      className={cn(
        "inline-flex max-w-40 min-w-0 items-center gap-1 rounded border border-border/70 bg-muted/55 px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground",
        className,
      )}
      title={task.projectName}
    >
      <ProjectIcon className="size-3 shrink-0" aria-hidden="true" />
      <span className="truncate">{task.projectName}</span>
    </span>
  );
}
