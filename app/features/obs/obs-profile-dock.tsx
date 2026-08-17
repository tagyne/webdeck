import { Tabs, TabsList, TabsTab } from "../../components/ui/tabs";
import type { ObsConnectionStatus } from "./types";

export function ObsProfileDock({
  connectionStatus,
  currentProfileName,
  profileNames,
  isBusy,
  onSelectProfile,
}: {
  connectionStatus: ObsConnectionStatus;
  currentProfileName?: string;
  profileNames: string[];
  isBusy?: boolean;
  onSelectProfile: (profileName: string) => void;
}) {
  if (profileNames.length === 0) {
    return null;
  }

  const value = currentProfileName && profileNames.includes(currentProfileName)
    ? currentProfileName
    : profileNames[0];
  const isConnected = connectionStatus === "connected";

  return (
    <div className="fixed inset-x-0 bottom-4 z-40 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]">
      <Tabs
        aria-label="OBS profiles"
        className="w-fit max-w-full"
        value={value}
        onValueChange={(nextValue) => {
          if (!isConnected || isBusy || !nextValue) {
            return;
          }

          onSelectProfile(nextValue);
        }}
      >
        <TabsList className="w-fit justify-start" loopFocus activateOnFocus>
          {profileNames.map((profileName) => (
            <TabsTab
              key={profileName}
              disabled={!isConnected || isBusy}
              value={profileName}
            >
              {profileName}
            </TabsTab>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
