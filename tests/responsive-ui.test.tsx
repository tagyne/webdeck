import { render, screen, within } from "@testing-library/react";

import { Button } from "../app/components/ui/button";
import { WebdeckApp } from "../app/routes/_index";
import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { createStarterDeckConfig } from "../app/features/deck/types";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";

describe("responsive UI safeguards", () => {
  it("gives shared buttons a minimum touch-target height", () => {
    render(<Button>Press</Button>);

    expect(screen.getByRole("button", { name: /press/i })).toHaveClass("min-h-11");
  });

  it("groups the deck tools in a wrapping control row for smaller screens", async () => {
    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => ({
              host: "192.168.1.20",
              port: 4455,
            }),
            save: async () => undefined,
          },
        })}
        deckStore={createDeckStore({
          repository: {
            get: async () => createStarterDeckConfig(),
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    await screen.findByRole("heading", { name: /main obs deck/i });

    const tools = screen.getByRole("group", { name: /deck tools/i });

    expect(tools).toHaveClass("flex");
    expect(tools).toHaveClass("flex-wrap");
    expect(tools).toHaveClass("gap-3");

    expect(within(tools).getByRole("button", { name: /edit deck/i })).toBeInTheDocument();
    expect(within(tools).getByRole("button", { name: /import \/ export/i })).toBeInTheDocument();
  });
});
