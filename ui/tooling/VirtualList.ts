import {AnyElement, compute, create, Signal, signal, signalMap} from "@targoninc/jess";
import {target} from "../index";

export class VirtualList {
    /**
     * Renders a virtualized list.
     * @param itemsSignal Signal<any[]> - The list of items to render.
     * @param renderItem (item, indexSignal) => AnyElement - Function to render each item.
     * @param options {
     *     itemHeight: number, // Estimated or fixed height
     *     scanCount: number, // Buffer count
     * }
     */
    static render(itemsSignal: Signal<any[]>, renderItem: (item: any, index: number) => AnyElement, options: {
        itemHeight?: number,
        scanCount?: number,
        classes?: string[],
        styles?: string[]
    } = {}) {
        const itemHeight = options.itemHeight ?? 50;
        const scanCount = options.scanCount ?? 10;

        const scrollTop = signal(0);
        const containerHeight = signal(500); // Default, will update

        const container = create("div")
            .classes("virtual-list-container", "full-height", "full-width", ...(options.classes || []))
            .styles("overflow-y", "auto", "display", "flex", "flex-direction", "column", "position", "relative", ...(options.styles || []))
            .on("scroll", (e) => {
                scrollTop.value = target(e).scrollTop;
            })
            .build();

        // Use ResizeObserver to update container height
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target === container) {
                    containerHeight.value = entry.contentRect.height;
                }
            }
        });
        resizeObserver.observe(container);

        const visibleRange = compute((top, height) => {
            return {
                start: Math.floor(top / itemHeight),
                end: Math.ceil((top + height) / itemHeight)
            };
        }, scrollTop, containerHeight);

        const totalHeight = compute((items) => {
            return items.length * itemHeight;
        }, itemsSignal);

        const renderData = compute((range) => {
            const items = itemsSignal.value;
            const start = Math.max(0, range.start - scanCount);
            const end = Math.min(items.length, range.end + scanCount);
            const visibleItems = items.slice(start, end);
            return {items: visibleItems, start, end};
        }, visibleRange);

        // We'll use a single filler element to set the scrollable height
        const filler = create("div")
            .styles("width", "100%", "opacity", "0", "pointer-events", "none", "position", "absolute", "top", "0", "left", "0")
            .build();

        // Update filler height
        totalHeight.subscribe((h) => {
            filler.style.height = `${h}px`;
        });

        // The list container
        const listItemsContainer = create("div")
            .classes("virtual-list-items")
            .styles("position", "absolute", "top", "0", "left", "0", "width", "100%", "display", "flex", "flex-direction", "column");

        const visibleItemsArray = compute((data) => data.items, renderData);

        // Update top padding or transform of the listItemsContainer to position it correctly
        renderData.subscribe((data) => {
            const offsetY = data.start * itemHeight;
            listItemsContainer._node.style.transform = `translateY(${offsetY}px)`;
        });

        container.appendChild(filler);
        container.appendChild(create("div")
            .children(
                signalMap(visibleItemsArray,
                    listItemsContainer,
                    renderItem
                )
            ).build());

        // Initial set
        const initialOffsetY = renderData.value.start * itemHeight;
        listItemsContainer._node.style.transform = `translateY(${initialOffsetY}px)`;
        filler.style.height = `${totalHeight.value}px`;

        return container;
    }
}
