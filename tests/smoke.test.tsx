import { render, screen } from "@testing-library/react";

import { createConnectionStore } from "../app/stores/connection-store";
import { createDeckStore } from "../app/stores/deck-store";
import { createObsStore } from "../app/stores/obs-store";
import { DEFAULT_DECK_CONFIG } from "../app/features/deck/types";
import { FakeObsClient } from "../app/features/obs/fake-obs-client";
import { WebdeckApp } from "../app/routes/_index";

describe("WebdeckApp", () => {
  it("renders the first-launch setup shell", async () => {
    render(
      <WebdeckApp
        connectionStore={createConnectionStore({
          repository: {
            get: async () => undefined,
            save: async () => undefined,
          },
        })}
        deckStore={createDeckStore({
          repository: {
            get: async () => DEFAULT_DECK_CONFIG,
            save: async () => undefined,
          },
        })}
        obsStore={createObsStore()}
        obsClient={new FakeObsClient()}
      />,
    );

    expect(
      await screen.findByRole("heading", {
        name: /connect to obs/i,
      }),
    ).toBeInTheDocument();
  });
});
