import { useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import ProjectSocket from "@/components/common/project-socket";
import ViewSwitcher, {
  type TaskView,
} from "@/components/common/header/view-switcher";
import WorkspaceCrumbSelect from "@/components/common/header/workspace-crumb-select";
import Layout from "@/components/common/layout";
import { KbdSequence } from "@/components/ui/kbd";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { shortcuts } from "@/constants/shortcuts";
import { useRegisterShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { cn } from "@/lib/cn";
import { useBackgroundStore } from "@/store/background";
import { useUserPreferencesStore } from "@/store/user-preferences";

const viewRoutes = {
  backlog: "/dashboard/workspace/$workspaceId/all-projects/backlog",
  board: "/dashboard/workspace/$workspaceId/all-projects/board",
  calendar: "/dashboard/workspace/$workspaceId/all-projects/calendar",
  gantt: "/dashboard/workspace/$workspaceId/all-projects/gantt",
} as const;

type AllProjectsLayoutProps = {
  workspaceId: string;
  /** Projects whose boards are shown; each keeps its realtime connection. */
  projectIds: string[];
  activeView: TaskView;
  headerActions?: ReactNode;
  children: ReactNode;
};

export default function AllProjectsLayout({
  workspaceId,
  projectIds,
  activeView,
  headerActions,
  children,
}: AllProjectsLayoutProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { background } = useBackgroundStore();
  const setViewMode = useUserPreferencesStore((state) => state.setViewMode);

  const showView = (view: TaskView) =>
    navigate({ to: viewRoutes[view], params: { workspaceId } });

  useRegisterShortcuts({
    sequentialShortcuts: {
      [shortcuts.view.prefix]: {
        [shortcuts.view.board]: () => {
          setViewMode("board");
          showView("board");
        },
        [shortcuts.view.list]: () => {
          setViewMode("list");
          showView("board");
        },
        [shortcuts.view.backlog]: () => showView("backlog"),
        [shortcuts.view.calendar]: () => showView("calendar"),
        [shortcuts.view.gantt]: () => showView("gantt"),
      },
    },
  });

  return (
    <Layout>
      {projectIds.map((projectId) => (
        <ProjectSocket key={projectId} projectId={projectId} />
      ))}
      <Layout.Header
        className={cn("h-11 border-border/80 px-2", {
          "bg-card/90 backdrop-blur": !!background,
        })}
      >
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <SidebarTrigger className="-ml-1 h-7 w-7 cursor-pointer text-foreground/85 hover:text-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="flex items-center gap-2 text-[10px]">
                    Toggle sidebar
                    <KbdSequence
                      keys={[
                        shortcuts.sidebar.prefix,
                        shortcuts.sidebar.toggle,
                      ]}
                    />
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <div className="h-4 w-px shrink-0 bg-border/80" />

            <div className="hidden min-w-0 items-center gap-1 md:flex">
              <WorkspaceCrumbSelect />
              <span className="text-foreground/30 text-xs">/</span>
              <span className="truncate px-2 text-foreground text-xs">
                {t("navigation:allProjects.title")}
              </span>
            </div>

            <ViewSwitcher
              activeView={activeView}
              onSelectView={showView}
              className="inline-flex"
            />
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {headerActions}
          </div>
        </div>
      </Layout.Header>

      <Layout.Content>{children}</Layout.Content>
    </Layout>
  );
}
