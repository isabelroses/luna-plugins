import { Tracer, type LunaUnload } from "@luna/core";
import { MediaItem, PlayState } from "@luna/lib";

export const { trace, errSignal } = Tracer("[tealfm-scrobbler]");

import { TealFm } from "./TealFm";
import { makeTrackPayload } from "./makeTrackPayload";

export { Settings } from "./Settings";

export const unloads = new Set<LunaUnload>();

unloads.add(
	MediaItem.onMediaTransition(unloads, async (mediaItem) => {
		const payload = await makeTrackPayload(mediaItem);
		TealFm.updateNowPlaying(payload).catch(trace.msg.err.withContext(`Failed to update NowPlaying!`));
	})
);

unloads.add(
	PlayState.onScrobble(unloads, async (mediaItem) => {
		const payload = await makeTrackPayload(mediaItem);
		TealFm.scrobble(payload).catch(trace.msg.err.withContext(`Failed to scrobble!`));
	})
);
