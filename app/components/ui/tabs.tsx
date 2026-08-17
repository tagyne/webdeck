import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const tabsListVariants = cva(
  "flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-[calc(var(--radius-lg)+2px)] border bg-muted/40 p-1 text-foreground no-scrollbar",
);

const tabsTabVariants = cva(
  "inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-full px-4 text-sm font-medium text-muted-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 data-active:bg-background data-active:text-foreground data-active:shadow-sm data-disabled:pointer-events-none data-disabled:opacity-50",
);

function Tabs({
  className,
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn(className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(tabsListVariants(), className)}
      {...props}
    />
  );
}

function TabsTab({
  className,
  ...props
}: TabsPrimitive.Tab.Props & VariantProps<typeof tabsTabVariants>) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-tab"
      className={cn(tabsTabVariants(), className)}
      {...props}
    />
  );
}

function TabsPanel({
  className,
  ...props
}: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-panel"
      className={cn(className)}
      {...props}
    />
  );
}

function TabsIndicator({
  className,
  ...props
}: TabsPrimitive.Indicator.Props) {
  return (
    <TabsPrimitive.Indicator
      data-slot="tabs-indicator"
      className={cn(className)}
      {...props}
    />
  );
}

export { Tabs, TabsIndicator, TabsList, TabsPanel, TabsTab };
