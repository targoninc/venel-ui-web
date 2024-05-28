import {create, ifjs, signalMap} from "https://fjs.targoninc.com/f.js";
import {CommonTemplates} from "./common.mjs";

export class PopupComponents {
    static popup(content, classes = []) {
        return create("div")
            .classes(...classes)
            .children(
                create("div")
                    .classes("popup-content")
                    .children(content)
                    .build()
            ).build();
    }

    static searchPopup(onclose, onsearch, onselect, searchResults, renderResult = (result) => PopupComponents.searchResult(result, onselect), title = "Search", inputLabel = "", classes = []) {
        return create("div")
            .classes("card", ...classes)
            .children(
                create("div")
                    .classes("flex-v")
                    .children(
                        create("div")
                            .classes("flex", "space-between")
                            .children(
                                ifjs(title, create("h3").text(title).build()),
                                PopupComponents.closeButton(onclose),
                            ).build(),
                        CommonTemplates.responsiveInput("text", "search", inputLabel, inputLabel, "", onsearch),
                        ifjs(searchResults, signalMap(searchResults,
                            create("div")
                                .classes("flex-v"),
                            renderResult
                        )),
                        ifjs(searchResults, create("div")
                            .classes("no-results")
                            .text("No results found")
                            .build(), true),
                    ).build()
            ).build();
    }

    static closeButton(onclose) {
        return CommonTemplates.buttonWithIcon("close", "Close", onclose, ["no-border", "self-end"])
    }

    static searchResult(result, onselect) {
        return create("div")
            .classes("search-result")
            .onclick(() => onselect(result))
            .children(
                create("span")
                    .text(result)
                    .build()
            ).build();
    }
}