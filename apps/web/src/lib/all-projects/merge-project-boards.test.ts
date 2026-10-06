import { describe, expect, it } from "vite-plus/test";
import type { ProjectWithTasks } from "@/types/project";
import type Task from "@/types/task";
import {
  ALL_PROJECTS_ID,
  findTaskProjectId,
  mergeProjectBoards,
} from "./merge-project-boards";

function task(id: string, projectId: string, status: string): Task {
  return {
    id,
    title: id,
    number: 1,
    description: null,
    status,
    priority: null,
    startDate: null,
    dueDate: null,
    position: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    userId: null,
    assigneeId: null,
    assigneeName: null,
    projectId,
  };
}

function column(
  slug: string,
  position: number,
  tasks: Task[],
  isFinal = false,
) {
  return { id: slug, slug, name: slug, position, icon: null, isFinal, tasks };
}

function board(
  id: string,
  columns: ProjectWithTasks["columns"],
  extra: Partial<ProjectWithTasks> = {},
): ProjectWithTasks {
  return {
    id,
    name: `Project ${id}`,
    slug: id.toUpperCase(),
    icon: "Layout",
    description: null,
    descriptionDeferred: false,
    isPublic: false,
    workspaceId: "ws",
    columns,
    plannedTasks: [],
    archivedTasks: [],
    ...extra,
  };
}

describe("mergeProjectBoards", () => {
  it("lines up shared statuses and tags each task with its project", () => {
    const merged = mergeProjectBoards(
      [
        board("a", [column("to-do", 0, [task("a1", "a", "to-do")])]),
        board("b", [column("to-do", 0, [task("b1", "b", "to-do")])]),
      ],
      "ws",
      "All projects",
    );

    expect(merged.id).toBe(ALL_PROJECTS_ID);
    expect(merged.columns).toHaveLength(1);
    expect(merged.columns[0]?.tasks.map((t) => [t.id, t.projectSlug])).toEqual([
      ["a1", "A"],
      ["b1", "B"],
    ]);
    expect(merged.columns[0]?.tasks[1]?.projectName).toBe("Project b");
  });

  it("keeps custom statuses and orders columns by their lowest position", () => {
    const merged = mergeProjectBoards(
      [
        board("a", [column("to-do", 0, []), column("done", 3, [], true)]),
        board("b", [column("to-do", 0, []), column("qa", 2, [])]),
      ],
      "ws",
      "All projects",
    );

    expect(merged.columns.map((c) => c.slug)).toEqual(["to-do", "qa", "done"]);
    expect(merged.columns.find((c) => c.slug === "done")?.isFinal).toBe(true);
  });

  it("does not mutate the source boards", () => {
    const source = board("a", [column("to-do", 0, [task("a1", "a", "to-do")])]);
    mergeProjectBoards([source, source], "ws", "All projects");

    expect(source.columns[0]?.tasks).toHaveLength(1);
    expect(source.columns[0]?.tasks[0]?.projectSlug).toBeUndefined();
  });

  it("merges planned and archived tasks", () => {
    const merged = mergeProjectBoards(
      [
        board("a", [], { plannedTasks: [task("p1", "a", "planned")] }),
        board("b", [], { archivedTasks: [task("x1", "b", "archived")] }),
      ],
      "ws",
      "All projects",
    );

    expect(merged.plannedTasks.map((t) => t.projectSlug)).toEqual(["A"]);
    expect(merged.archivedTasks.map((t) => t.projectSlug)).toEqual(["B"]);
  });
});

describe("findTaskProjectId", () => {
  it("finds tasks in columns, planned and archived lists", () => {
    const merged = mergeProjectBoards(
      [
        board("a", [column("to-do", 0, [task("a1", "a", "to-do")])], {
          plannedTasks: [task("p1", "a", "planned")],
        }),
        board("b", [], { archivedTasks: [task("x1", "b", "archived")] }),
      ],
      "ws",
      "All projects",
    );

    expect(findTaskProjectId(merged, "a1")).toBe("a");
    expect(findTaskProjectId(merged, "p1")).toBe("a");
    expect(findTaskProjectId(merged, "x1")).toBe("b");
    expect(findTaskProjectId(merged, "missing")).toBeUndefined();
    expect(findTaskProjectId(merged, undefined)).toBeUndefined();
  });
});
