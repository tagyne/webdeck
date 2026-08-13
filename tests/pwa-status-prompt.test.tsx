import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { PwaStatusPrompt } from "../app/components/pwa-status-prompt";

const mockUpdateServiceWorker = vi.fn();
const mockSetNeedRefresh = vi.fn();
const mockSetOfflineReady = vi.fn();

const pwaState = {
  needRefresh: false,
  offlineReady: false,
};

vi.mock("../app/lib/pwa", () => ({
  useRegisterSW: () => ({
    needRefresh: [pwaState.needRefresh, mockSetNeedRefresh],
    offlineReady: [pwaState.offlineReady, mockSetOfflineReady],
    updateServiceWorker: mockUpdateServiceWorker,
  }),
}));

describe("PwaStatusPrompt", () => {
  beforeEach(() => {
    pwaState.needRefresh = false;
    pwaState.offlineReady = false;
    mockUpdateServiceWorker.mockReset();
    mockSetNeedRefresh.mockReset();
    mockSetOfflineReady.mockReset();
  });

  it("stays hidden when the service worker has nothing to report", () => {
    const { container } = render(<PwaStatusPrompt />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows the offline-ready message and can be dismissed", () => {
    pwaState.offlineReady = true;

    render(<PwaStatusPrompt />);

    expect(
      screen.getByText(/ready to show your saved deck while offline/i),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /reload app/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(mockSetOfflineReady).toHaveBeenCalledWith(false);
    expect(mockSetNeedRefresh).toHaveBeenCalledWith(false);
  });

  it("shows the update action and reloads only after explicit user input", () => {
    pwaState.needRefresh = true;

    render(<PwaStatusPrompt />);

    expect(
      screen.getByText(/newer version of webdeck is ready/i),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /reload app/i }));

    expect(mockUpdateServiceWorker).toHaveBeenCalledWith(true);
  });
});
