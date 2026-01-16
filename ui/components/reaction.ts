import {computedSignal, create, when, signal, signalMap} from "/f.js";
import {CommonTemplates} from "./common.ts";
import {Store} from "../api/Store.ts";
import {Live} from "../live/Live.ts";
import {playReactionAnimation} from "../actions.ts";

export class ReactionTemplates {
    static reactionTrigger(message, messages) {
        const menuShown = signal(false);

        return create("div")
            .classes("reaction-trigger", "flex")
            .children(
                CommonTemplates.buttonWithIcon("add_reaction", "", e => {
                    e.preventDefault();
                    menuShown.value = true;
                    setTimeout(() => {
                        document.addEventListener("click", (e) => {
                            if (e.target.closest(".reaction-menu")) {
                                return;
                            }
                            menuShown.value = false;
                        }, {once: true});
                    }, 0);
                }, ["reaction-button"]),
                when(menuShown, ReactionTemplates.reactionMenu(message, messages)),
            ).build();
    }

    static reactionMenu(message) {
        const reactions = Store.get("reactions");
        const groups = Store.get("reactionGroups");
        const search = signal("");
        const filteredReactions = computedSignal(search, search => {
            return reactions.value.filter(reaction => reaction.identifier.includes(search));
        });
        const groupedFilteredReactions = computedSignal(filteredReactions, (reactions) => {
            const out = {};
            reactions.forEach(reaction => {
                const group = groups.value.find(group => group.id === reaction.groupId);
                if (!out[group.id]) {
                    out[group.id] = [];
                }
                out[group.id].push(reaction);
            });
            return out;
        });

        return create("div")
            .classes("reaction-menu", "card", "flex-v")
            .children(
                CommonTemplates.input("text", "reaction_search", "Search reactions", "👀", search, () => {}, false, "off", () => {}, (e) => {
                    search.value = e.target.value;
                }),
                signalMap(groups, create("div")
                        .classes("flex-v", "reaction-icons"),
                    group => ReactionTemplates.reactionGroup(group, groupedFilteredReactions, message)),
            ).build();
    }

    static reaction(reaction, message) {
        return create("div")
            .classes("reaction-icon")
            .text(reaction.content)
            .title(`:${reaction.identifier}:`)
            .on("click", e => {
                Live.send({
                    type: "addReaction",
                    messageId: message.id,
                    reactionId: reaction.id,
                });
            }).build();
    }

    static reactionGroup(group, groupedFilteredReactions, message) {
        const reactions = computedSignal(groupedFilteredReactions, reactions => reactions[group.id] || []);
        const hasReactions = computedSignal(reactions, reactions => reactions.length > 0);

        return create("div")
            .classes("flex-v")
            .children(
                when(hasReactions, create("h3")
                    .classes("text-small")
                    .text(group.display)
                    .build()),
                signalMap(reactions, create("div")
                        .classes("flex", "reaction-icon-grid"),
                    reaction => ReactionTemplates.reaction(reaction, message))
            ).build();
    }

    static reactionDisplay(reactions, message) {
        const reactionCounts = {};
        reactions.forEach(reaction => {
            if (!reactionCounts[reaction.id]) {
                reactionCounts[reaction.id] = 0;
            }
            reactionCounts[reaction.id]++;
        });
        const uniqueReactions = reactions.filter((reaction, index, self) => {
            return self.findIndex(r => r.id === reaction.id) === index;
        });
        const user = Store.get("user");

        return create("div")
            .classes("flex")
            .children(
                uniqueReactions.map(reaction => {
                    const activeClass = reactions.some(r => r.id === reaction.id && r.userId === user.value.id) ? "active" : "_";

                    const reactionDom = create("div")
                        .classes("reaction-display", "pill", activeClass)
                        .text(reaction.content + " " + reactionCounts[reaction.id])
                        .onclick(e => {
                            if (activeClass !== "active") {
                                Live.send({
                                    type: "addReaction",
                                    messageId: message.id,
                                    reactionId: reaction.id,
                                });
                                playReactionAnimation(reaction.content, e.clientX, e.clientY);
                                return;
                            }

                            Live.send({
                                type: "removeReaction",
                                messageId: message.id,
                                reactionId: reaction.id,
                            });
                        })
                        .build();

                    if (reaction.isNew) {
                        setTimeout(() => {
                            const rect = reactionDom.getBoundingClientRect();
                            const x = rect.left + rect.width / 2;
                            const y = rect.top + rect.height / 2;
                            playReactionAnimation(reaction.content, x, y);
                        }, 100);
                    }

                    return reactionDom;
                }),
            ).build();
    }
}