import { executeObsAction, type ObsClient } from "./obs-client";
import type { DeckButtonAction } from "./types";

export async function runDeckAction(client: ObsClient, action: DeckButtonAction) {
  return executeObsAction(client, action);
}
