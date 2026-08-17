import { runDeckAction } from "../app/features/obs/action-runner";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";

describe("OBS adapter boundary", () => {
  it("runs deck actions through the fake client without OBS", async () => {
    const client = new FakeObsClient();

    await runDeckAction(client, {
      type: "toggleInputMute",
      inputName: "Mic/Aux",
    });

    await runDeckAction(client, {
      type: "setCurrentProgramScene",
      sceneName: "Gameplay",
    });

    await runDeckAction(client, {
      type: "toggleSourceVisibility",
      sceneName: "Gameplay",
      sourceName: "Camera",
    });

    await runDeckAction(client, { type: "startStream" });
    await runDeckAction(client, { type: "toggleRecordPause" });

    expect(client.calls).toEqual([
      { type: "toggleInputMute", inputName: "Mic/Aux" },
      { type: "setCurrentProgramScene", sceneName: "Gameplay" },
      {
        type: "toggleSourceVisibility",
        sceneName: "Gameplay",
        sourceName: "Camera",
      },
      { type: "startStream" },
      { type: "toggleRecordPause" },
    ]);
    expect(client.state.activeSceneName).toBe("Gameplay");
    expect(client.state.mutedInputs["Mic/Aux"]).toBe(true);
    expect(client.state.visibleSources["Gameplay::Camera"]).toBe(false);
    expect(client.state.isStreaming).toBe(true);
    expect(client.state.isRecordPaused).toBe(true);
  });

  it("switches profiles through the fake client", async () => {
    const client = new FakeObsClient();

    client.pushState({
      profileNames: ["Gaming", "Streaming"],
      currentProfileName: "Gaming",
    });

    await client.setCurrentProfile("Streaming");

    expect(client.calls.at(-1)).toEqual({
      type: "setCurrentProfile",
      profileName: "Streaming",
    });
    expect(client.state.currentProfileName).toBe("Streaming");
    expect(client.state.profileNames).toEqual(["Gaming", "Streaming"]);
  });
});
