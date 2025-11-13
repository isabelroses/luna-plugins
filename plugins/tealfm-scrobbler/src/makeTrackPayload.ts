import { ftch } from "@luna/core";
import type { MediaItem } from "@luna/lib";
import type { IRecording } from "musicbrainz-api";
import { trace } from ".";

import { type Payload, MusicServiceDomain } from "./ListenBrainzTypes";

const delUndefined = <O extends Record<any, any>>(obj: O) => {
	for (const key in obj) if (obj[key] === undefined) delete obj[key];
};

const releaseFromRecording = async (recording_mbid: string) => {
	const release = await ftch
		.json<IRecording>(`https://musicbrainz.org/ws/2/recording/${recording_mbid}?inc=releases+media+artist-credits+isrcs&fmt=json`)
		.then(({ releases }) => releases?.filter((release) => release["text-representation"].language === "eng")[0] ?? releases?.[0])
		.catch(trace.warn.withContext("brainzItem.getISRCRecordings"));

	return release;
};

export const makeTrackPayload = async (mediaItem: MediaItem): Promise<Payload> => {
	const album = await mediaItem.album();

	const trackPayload: Payload = {
		listened_at: Math.floor(Date.now() / 1000),
		track_metadata: {
			artist_name: (await mediaItem.artist())?.name!,
			track_name: (await mediaItem.title())!,
			release_name: await album?.title(),
		},
	};

  const recording_mbid = await mediaItem.brainzId();
  const release = recording_mbid ? await releaseFromRecording(recording_mbid) : undefined;

	trackPayload.track_metadata.additional_info = {
		recording_mbid,
    release_mbid: release?.id,
		isrc: await mediaItem.isrc(),
		tracknumber: mediaItem.trackNumber,
		music_service: MusicServiceDomain.TIDAL,
		origin_url: mediaItem.url,
		duration: mediaItem.duration,
		media_player: "Tidal Desktop",
		submission_client: "TidaLuna Scrobbler",
	};

	delUndefined(trackPayload.track_metadata.additional_info);

	return trackPayload;
};
