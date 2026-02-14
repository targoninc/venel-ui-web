import {signal} from "@targoninc/jess";
import {currentCallSound, currentSound, setCurrentCallSound, setCurrentSound} from "./Setting.ts";
import {Api} from "./Api.ts";
import {toast} from "../actions.ts";
import {Channel, Message, Reaction, ReactionGroup, User} from "../models/models.ts";
import {LiveInstance} from "../live/LiveInstance";

export const currentUser = signal<User | null>(null);
export const currentChannelId = signal(0);
export const messages = signal<Record<string, Message[]>>({});
export const selectedMessageId = signal(0);
export const reactions = signal<Reaction[]>([]);
export const reactionGroups = signal<ReactionGroup[]>([]);
export const channels = signal<Channel[]>([]);
export const activeChannel = signal<Channel | null>(null);
export const maxPayloadSizeInMb = signal(5);
export const playingLoops = signal<HTMLAudioElement[]>([]);
export const live = signal(false);
export const liveInstance = signal<LiveInstance | null>(null);

if (!currentSound()) {
    setCurrentSound("bloom.mp3");
}

if (!currentCallSound()) {
    setCurrentCallSound("blossom.mp3");
}

Api.getReactionGroups().then(res => {
    if (res.status === 200) {
        reactionGroups.value = res.data;
    } else {
        toast("Failed to get reaction groups: " + res.data.error, "error");
    }
});

Api.getAvailableReactions().then(res => {
    if (res.status === 200) {
        reactions.value = res.data;
    } else {
        toast("Failed to get available reactions: " + res.data.error, "error");
    }
});
