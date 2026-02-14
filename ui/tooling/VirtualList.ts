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
    static render(itemsSignal: Signal<any[]>, renderItem: (item: any, index: number) => AnyElement, options = {
        itemHeight: 50,
        scanCount: 10,
        classes: [] as string[],
        styles: []
    }) {
        const scrollTop = signal(0);
        const containerHeight = signal(500); // Default, will update

        const container = create("div")
            .classes("virtual-list-container", "full-height", "full-width")
            .styles("overflow-y", "auto", "display", "flex", "flex-direction", "column", "position", "relative")
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

        const visibleRange = compute((top) => {
            return {
                start: Math.floor(top / options.itemHeight),
                end: Math.ceil((top + containerHeight.value) / options.itemHeight)
            };
        }, scrollTop);

        const totalHeight = compute((items) => {
            return items.length * options.itemHeight;
        }, itemsSignal);

        const renderData = compute((range) => {
            const items = itemsSignal.value;
            const start = Math.max(0, range.start - options.scanCount);
            const end = Math.min(items.length, range.end + options.scanCount);
            const visibleItems = items.slice(start, end);
            return {items: visibleItems, start, end};
        }, visibleRange);

        // The content wrapper maintains the total height and positions items absolutely or via padding
        // Since @targoninc/jess signalMap handles diffing, we can map over visible items

        // We'll use a single filler element to set the scrollable height
        const filler = create("div")
            .styles("width", "1px", "opacity", "0", "pointer-events", "none")
            .build();

        // Update filler height
        const updateFiller = () => {
            filler.style.height = `${totalHeight.value}px`;
        };
        // We need to subscribe manually or use an effect if available, or just compute
        // assuming compute subscribes
        // Using `compute` to create a derived signal that side-effects (updates filler style) is one way,
        // or just subscribe to totalHeight.
        totalHeight.subscribe((h) => {
            filler.style.height = `${h}px`;
        });
        // Initial set
        filler.style.height = `${totalHeight.value}px`;

        // The list container
        const listItemsContainer = create("div")
            .classes("virtual-list-items")
            .styles("position", "absolute", "top", "0", "left", "0", "width", "100%", "display", "flex", "flex-direction", "column");

        // Render visible items
        // We need a signal for the array of visible items
        const visibleItemsArray = compute((data) => data.items, renderData);

        // Update top padding or transform of the listItemsContainer to position it correctly
        const listContainerTransform = compute((data) => {
            const offsetY = data.start * options.itemHeight;
            listItemsContainer._node.style.transform = `translateY(${offsetY}px)`;
            return offsetY;
        }, renderData);

        // We need to pass the list contents
        // signalMap expects a signal of array.
        const itemsRendered = signalMap(visibleItemsArray,
            listItemsContainer,
            renderItem
        );

        container.appendChild(filler);
        container.appendChild(itemsRendered); // signalMap returns the wrapper element (listItemsContainer populated)
        // Wait, signalMap returns the wrapper element?
        // In chat.ts:
        // .children(signalMap(...))
        // So yes.

        return container;
    }
}
