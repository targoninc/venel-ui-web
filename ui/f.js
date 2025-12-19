export class FJS {
    static create(tag = 'div') {
        return new DomNode(tag);
    }

    static signal(initialValue) {
        return new FjsObservable(initialValue);
    }

    static div() {
        return FJS.create('div');
    }

    static span() {
        return FJS.create('span');
    }

    static p() {
        return FJS.create('p');
    }

    static a() {
        return FJS.create('a');
    }

    static img() {
        return FJS.create('img');
    }

    static input() {
        return FJS.create('input');
    }

    static button() {
        return FJS.create('button');
    }

    static label() {
        return FJS.create('label');
    }

    static form() {
        return FJS.create('form');
    }

    static select() {
        return FJS.create('select');
    }

    static option() {
        return FJS.create('option');
    }

    static textarea() {
        return FJS.create('textarea');
    }

    static header() {
        return FJS.create('header');
    }

    static footer() {
        return FJS.create('footer');
    }

    static main() {
        return FJS.create('main');
    }

    static section() {
        return FJS.create('section');
    }

    static article() {
        return FJS.create('article');
    }

    static aside() {
        return FJS.create('aside');
    }

    static nav() {
        return FJS.create('nav');
    }

    static ul() {
        return FJS.create('ul');
    }

    static ol() {
        return FJS.create('ol');
    }

    static li() {
        return FJS.create('li');
    }

    static h1() {
        return FJS.create('h1');
    }

    static h2() {
        return FJS.create('h2');
    }

    static h3() {
        return FJS.create('h3');
    }

    static h4() {
        return FJS.create('h4');
    }

    static h5() {
        return FJS.create('h5');
    }

    static h6() {
        return FJS.create('h6');
    }

    static table() {
        return FJS.create('table');
    }

    static thead() {
        return FJS.create('thead');
    }

    static tbody() {
        return FJS.create('tbody');
    }

    static tr() {
        return FJS.create('tr');
    }

    static th() {
        return FJS.create('th');
    }

    static td() {
        return FJS.create('td');
    }

    static strong() {
        return FJS.create('strong');
    }

    static em() {
        return FJS.create('em');
    }

    static i() {
        return FJS.create('i');
    }

    static b() {
        return FJS.create('b');
    }

    static u() {
        return FJS.create('u');
    }

    static s() {
        return FJS.create('s');
    }

    static code() {
        return FJS.create('code');
    }

    static pre() {
        return FJS.create('pre');
    }

    static blockquote() {
        return FJS.create('blockquote');
    }

    static hr() {
        return FJS.create('hr');
    }

    static br() {
        return FJS.create('br');
    }

    static canvas() {
        return FJS.create('canvas');
    }

    static video() {
        return FJS.create('video');
    }

    static audio() {
        return FJS.create('audio');
    }

    static iframe() {
        return FJS.create('iframe');
    }
}

export function create(tag) {
    return FJS.create(tag);
}

export function signal(initialValue) {
    return FJS.signal(initialValue);
}

export function nullElement() {
    return create("div").styles("display", "none").build();
}

export function ifjs(condition, element, inverted = false) {
    if (condition && condition.constructor === FjsObservable) {
        const state = signal(condition.value ? (inverted ? nullElement() : element) : (inverted ? element : nullElement()));
        condition.subscribe((newValue) => {
            if (newValue) {
                state.value = inverted ? nullElement() : element;
            } else {
                state.value = inverted ? element : nullElement();
            }
        });
        return state;
    } else {
        return condition ? (inverted ? nullElement() : element) : (inverted ? element : nullElement());
    }
}

/**
 *
 * @param arrayState {FjsObservable} An FjsObservable that represents an array.
 * @param wrapper {DomNode} A DomNode that will be used to wrap each element of the array. DO NOT CALL .build() on this.
 * @param callback {Function} A function that will be called with the new value of the arrayState.
 * @returns {*}
 */
export function signalMap(arrayState, wrapper, callback) {
    if (arrayState.constructor !== FjsObservable) {
        throw new Error('Invalid argument type for signalMap. Must be an FjsObservable.');
    }

    const update = (newValue) => {
        if (!newValue) {
            return;
        }
        const children = [];
        for (let i = 0; i < newValue.length; i++) {
            children.push(callback(newValue[i], i));
        }
        wrapper.overwriteChildren(...children);
    };
    arrayState.subscribe(update);
    update(arrayState.value);

    return wrapper.build();
}

/**
 * Short wrapper to make dependent signals easier.
 * @param sourceSignal {FjsObservable} Whenever the source signal is updated, the updateMethod gets called to update the output signal.
 * @param updateMethod {Function} Should return the value to update the output signal with.
 */
export function computedSignal(sourceSignal, updateMethod) {
    const returnSignal = signal(updateMethod(sourceSignal.value));
    sourceSignal.subscribe((newVal) => {
        try {
            returnSignal.value = updateMethod(newVal);
        } catch (e) {
            returnSignal.value = null;
        }
    });
    return returnSignal;
}

export function signalFromProperty(sourceSignal, propertyName) {
    return computedSignal(sourceSignal, (source) => {
        if (!source) {
            return null;
        }
        return source[propertyName];
    });
}

export function stack(message, debugInfo = {}) {
    console.warn(message, { debugInfo }, (new Error()).stack);
}

export class TypeHelper {
    static assertString(value, valueName = 'value') {
        const result = value.constructor === String;
        if (!result) {
            console.log('TypeHelper.isString: value is not a string for ' + valueName + ': ', value);
        }
        return result;
    }

    static assertFunction(value, valueName = 'value') {
        const result = value.constructor === Function;
        if (!result) {
            console.log('TypeHelper.isFunction: value is not a function for ' + valueName + ': ', value);
        }
        return result;
    }
}

export class FjsStore {
    static keyName = "__fjs_store__";

    static get(key) {
        return window[this.keyName][key];
    }

    static set(key, value) {
        window[this.keyName][key] = value;
    }

    static clear() {
        window[this.keyName] = {};
    }

    static remove(key) {
        delete window[this.keyName][key];
    }

    static getAll() {
        return window[this.keyName];
    }

    static keys() {
        return Object.keys(window[this.keyName]);
    }

    static values() {
        return Object.values(window[this.keyName]);
    }

    static getSignalValue(key) {
        return this.get(key).value;
    }

    static setSignalValue(key, value) {
        this.get(key).value = value;
    }
}

export function store() {
    if (!window[FjsStore.keyName]) {
        window[FjsStore.keyName] = {};
    }
    return FjsStore;
}

export class FjsObservable {
    _callbacks = [];
    _value;
    _values = {};

    constructor(initialValue, updateCallback = () => {
    }, key = null) {
        this._value = initialValue;
        this._values = {};
        this._callbacks.push(updateCallback);
        if (key) {
            store().set(key, this);
        }
    }

    /**
     * Creates an object with boolean signals that update when {this} updates.
     * @param assignments {Object} e.g. { someKey: { onTrue: value1, onFalse: value2 } }
     */
    boolValues(assignments = {}) {
        for (let key in assignments) {
            this._values[key] = signal(this._value ? assignments[key].onTrue : assignments[key].onFalse);
        }
        this.subscribe((newValue) => {
            for (let key in assignments) {
                this._values[key].value = newValue ? assignments[key].onTrue : assignments[key].onFalse;
            }
        });
        return this._values;
    }

    unsubscribeAll() {
        this._callbacks = [];
    }

    subscribe(callback) {
        this._callbacks.push(callback);
    }

    unsubscribe(callback) {
        const index = this._callbacks.indexOf(callback);
        if (index >= 0) {
            this._callbacks.splice(index, 1);
        }
    }

    get onUpdate() {
        return this._callbacks;
    }

    set onUpdate(callback) {
        this._callbacks.push(callback);
    }

    get value() {
        return this._value;
    }

    set value(value) {
        const changed = this._value !== value;
        this._value = value;
        this._callbacks.forEach(callback => callback(value, changed));
    }
}

export function isValidElement(element) {
    const validTypes = [HTMLElement, SVGElement];
    return validTypes.some(type => element instanceof type);
}

export class DomNode {
    _node;
    svgTags = ['svg', 'g', 'circle', 'ellipse', 'line', 'path', 'polygon', 'polyline', 'rect', 'text', 'textPath', 'tspan'];

    constructor(tag) {
        if (this.svgTags.includes(tag)) {
            this._node = document.createElementNS("http://www.w3.org/2000/svg", tag);
        } else {
            this._node = document.createElement(tag);
        }
    }

    build() {
        if (!isValidElement(this._node)) {
            throw new Error('Invalid node type. Must be an HTMLElement or a subclass.');
        }
        return this._node;
    }

    wrapProperty(property, value) {
        if (value && value.constructor === FjsObservable) {
            this._node[property] = value.value;
            value.onUpdate = (newValue) => {
                this._node[property] = newValue;
            };
        } else {
            this._node[property] = value;
        }
    }

    class(className) {
        return this.classes(className);
    }

    classes() {
        const classes = [...arguments];
        for (let cls of classes) {
            if (cls && cls.constructor === FjsObservable) {
                let previousValue = cls.value;
                this._node.classList.add(previousValue);
                cls.onUpdate = (newValue) => {
                    this._node.classList.remove(previousValue);
                    this._node.classList.add(newValue);
                    previousValue = newValue;
                };
            } else {
                this._node.classList.add(cls);
            }
        }
        return this;
    }

    attribute(key, value) {
        return this.attributes(key, value);
    }

    attributes() {
        if (arguments.length % 2 === 0) {
            for (let i = 0; i < arguments.length; i += 2) {
                const key = arguments[i];
                const value = arguments[i + 1];
                TypeHelper.assertString(key, 'attributes/key');
                if (value && value.constructor === FjsObservable) {
                    this._node.setAttribute(key, value.value);
                    value.onUpdate = (newValue) => {
                        this._node.setAttribute(key, newValue);
                    };
                } else {
                    this._node.setAttribute(key, value);
                }
            }
        } else {
            throw new Error('Invalid number of arguments for attributes. Must be even. (key, value, key, value, ...)');
        }
        return this;
    }

    id(id) {
        this.wrapProperty('id', id);
        return this;
    }

    text(text) {
        this.wrapProperty('innerText', text);
        return this;
    }

    title(title) {
        this.wrapProperty('title', title);
        return this;
    }

    html(html) {
        this.wrapProperty('innerHTML', html);
        return this;
    }

    children() {
        for (let node of arguments) {
            if (isValidElement(node)) {
                this._node.appendChild(node);
            } else if (node instanceof DomNode) {
                this._node.appendChild(node.build());
            } else if (node && node.constructor === FjsObservable) {
                let childNode = node.value;
                if (!isValidElement(childNode)) {
                    // Create a placeholder div if the value is not an HTMLElement so we can swap it out later
                    childNode = nullElement();
                }
                this._node.appendChild(childNode);
                node.onUpdate = (newValue) => {
                    if (isValidElement(newValue)) {
                        this._node.replaceChild(newValue, childNode);
                        childNode = newValue;
                    } else if (newValue.constructor === DomNode) {
                        this._node.replaceChild(newValue.build(), childNode);
                        childNode = newValue.build();
                    } else {
                        stack('Unexpected value for child. Must be an HTMLElement or a subclass.', newValue);
                    }
                };
            } else if (node && node.constructor === Array) {
                for (let childNode of node) {
                    this.children(childNode);
                }
            } else {
                if (node) {
                    stack('Invalid node type. Must be an HTMLElement or a subclass.', node);
                }
            }
        }
        return this;
    }

    overwriteChildren() {
        this._node.innerHTML = '';
        return this.children(...arguments);
    }

    child() {
        return this.children(...arguments);
    }

    role(role) {
        this.wrapProperty('role', role);
        return this;
    }

    prefixedAttribute(prefix, key, value) {
        return this.attributes(`${prefix}-${key}`, value);
    }

    aria(key, value) {
        return this.prefixedAttribute('aria', key, value);
    }

    data(key, value) {
        return this.prefixedAttribute('data', key, value);
    }

    onclick(callback) {
        this._node.onclick = callback;
        return this;
    }

    onauxclick(callback) {
        this._node.onauxclick = callback;
        return this;
    }

    ondblclick(callback) {
        this._node.ondblclick = callback;
        return this;
    }

    onchange(callback) {
        this._node.onchange = callback;
        return this;
    }

    oninput(callback) {
        this._node.oninput = callback;
        return this;
    }

    onkeydown(callback) {
        this._node.onkeydown = callback;
        return this;
    }

    onkeyup(callback) {
        this._node.onkeyup = callback;
        return this;
    }

    onmousedown(callback) {
        this._node.onmousedown = callback;
        return this;
    }

    onmouseup(callback) {
        this._node.onmouseup = callback;
        return this;
    }

    onmouseover(callback) {
        this._node.onmouseover = callback;
        return this;
    }

    onmouseout(callback) {
        this._node.onmouseout = callback;
        return this;
    }

    onmousemove(callback) {
        this._node.onmousemove = callback;
        return this;
    }

    onmouseenter(callback) {
        this._node.onmouseenter = callback;
        return this;
    }

    onmouseleave(callback) {
        this._node.onmouseleave = callback;
        return this;
    }

    oncontextmenu(callback) {
        this._node.oncontextmenu = callback;
        return this;
    }

    onwheel(callback) {
        this._node.onwheel = callback;
        return this;
    }

    ondrag(callback) {
        this._node.ondrag = callback;
        return this;
    }

    ondragend(callback) {
        this._node.ondragend = callback;
        return this;
    }

    ondragenter(callback) {
        this._node.ondragenter = callback;
        return this;
    }

    ondragstart(callback) {
        this._node.ondragstart = callback;
        return this;
    }

    ondragleave(callback) {
        this._node.ondragleave = callback;
        return this;
    }

    ondragover(callback) {
        this._node.ondragover = callback;
        return this;
    }

    ondrop(callback) {
        this._node.ondrop = callback;
        return this;
    }

    onscroll(callback) {
        this._node.onscroll = callback;
        return this;
    }

    onfocus(callback) {
        this._node.onfocus = callback;
        return this;
    }

    onblur(callback) {
        this._node.onblur = callback;
        return this;
    }

    onfocusin(callback) {
        this._node.onfocusin = callback;
        return this;
    }

    onfocusout(callback) {
        this._node.onfocusout = callback;
        return this;
    }

    onresize(callback) {
        this._node.onresize = callback;
        return this;
    }

    onselect(callback) {
        this._node.onselect = callback;
        return this;
    }

    onsubmit(callback) {
        this._node.onsubmit = callback;
        return this;
    }

    onreset(callback) {
        this._node.onreset = callback;
        return this;
    }

    onabort(callback) {
        this._node.onabort = callback;
        return this;
    }

    onerror(callback) {
        this._node.onerror = callback;
        return this;
    }

    oncanplay(callback) {
        this._node.oncanplay = callback;
        return this;
    }

    oncanplaythrough(callback) {
        this._node.oncanplaythrough = callback;
        return this;
    }

    ondurationchange(callback) {
        this._node.ondurationchange = callback;
        return this;
    }

    onemptied(callback) {
        this._node.onemptied = callback;
        return this;
    }

    onended(callback) {
        this._node.onended = callback;
        return this;
    }

    onloadeddata(callback) {
        this._node.onloadeddata = callback;
        return this;
    }

    onloadedmetadata(callback) {
        this._node.onloadedmetadata = callback;
        return this;
    }

    onloadstart(callback) {
        this._node.onloadstart = callback;
        return this;
    }

    onpause(callback) {
        this._node.onpause = callback;
        return this;
    }

    onplay(callback) {
        this._node.onplay = callback;
        return this;
    }

    onplaying(callback) {
        this._node.onplaying = callback;
        return this;
    }

    onprogress(callback) {
        this._node.onprogress = callback;
        return this;
    }

    onratechange(callback) {
        this._node.onratechange = callback;
        return this;
    }

    onseeked(callback) {
        this._node.onseeked = callback;
        return this;
    }

    onseeking(callback) {
        this._node.onseeking = callback;
        return this;
    }

    onstalled(callback) {
        this._node.onstalled = callback;
        return this;
    }

    onsuspend(callback) {
        this._node.onsuspend = callback;
        return this;
    }

    ontimeupdate(callback) {
        this._node.ontimeupdate = callback;
        return this;
    }

    onvolumechange(callback) {
        this._node.onvolumechange = callback;
        return this;
    }

    onwaiting(callback) {
        this._node.onwaiting = callback;
        return this;
    }

    oncopy(callback) {
        this._node.oncopy = callback;
        return this;
    }

    oncut(callback) {
        this._node.oncut = callback;
        return this;
    }

    onpaste(callback) {
        this._node.onpaste = callback;
        return this;
    }

    onanimationstart(callback) {
        this._node.onanimationstart = callback;
        return this;
    }

    onanimationend(callback) {
        this._node.onanimationend = callback;
        return this;
    }

    onanimationiteration(callback) {
        this._node.onanimationiteration = callback;
        return this;
    }

    ontransitionend(callback) {
        this._node.ontransitionend = callback;
        return this;
    }

    on(eventName, callback) {
        this._node.addEventListener(eventName, callback);
        return this;
    }

    open(open) {
        this.wrapProperty('open', open);
        return this;
    }

    src(src) {
        this.wrapProperty('src', src);
        return this;
    }

    alt(alt) {
        this.wrapProperty('alt', alt);
        return this;
    }

    css(css) {
        this._node.style.cssText = css;
        return this;
    }

    style(key, value) {
        return this.styles(key, value);
    }

    styles() {
        if (arguments.length % 2 === 0) {
            for (let i = 0; i < arguments.length; i += 2) {
                const key = arguments[i];
                const value = arguments[i + 1];
                if (key.constructor !== String) {
                    throw new Error('Invalid key type for styles. Must be a string.');
                }
                if (value && value.constructor === FjsObservable) {
                    this._node.style[key] = value.value;
                    value.onUpdate = (newValue) => {
                        this._node.style[key] = newValue;
                    };
                } else {
                    this._node.style[key] = value;
                }
            }
        } else {
            throw new Error('Invalid number of arguments for styles. Must be even. (key, value, key, value, ...)');
        }
        return this;
    }

    width(width) {
        this.wrapProperty('width', width);
        return this;
    }

    height(height) {
        this.wrapProperty('height', height);
        return this;
    }

    type(type) {
        this.wrapProperty('type', type);
        return this;
    }

    name(name) {
        this.wrapProperty('name', name);
        return this;
    }

    value(value) {
        this.wrapProperty('value', value);
        return this;
    }

    placeholder(placeholder) {
        this.wrapProperty('placeholder', placeholder);
        return this;
    }

    for(forId) {
        this.wrapProperty('for', forId);
        return this;
    }

    checked(checked) {
        this.wrapProperty('checked', checked);
        return this;
    }

    disabled(disabled) {
        this.wrapProperty('disabled', disabled);
        return this;
    }

    selected(selected) {
        this.wrapProperty('selected', selected);
        return this;
    }

    href(href) {
        this.wrapProperty('href', href);
        return this;
    }

    target(target) {
        this.wrapProperty('target', target);
        return this;
    }

    rel(rel) {
        this.wrapProperty('rel', rel);
        return this;
    }

    required(required) {
        this.wrapProperty('required', required);
        return this;
    }

    multiple(multiple) {
        this.wrapProperty('multiple', multiple);
        return this;
    }

    accept(accept) {
        this.wrapProperty('accept', accept);
        return this;
    }

    acceptCharset(acceptCharset) {
        this.wrapProperty('acceptCharset', acceptCharset);
        return this;
    }

    action(action) {
        this.wrapProperty('action', action);
        return this;
    }

    autocomplete(autocomplete) {
        this.wrapProperty('autocomplete', autocomplete);
        return this;
    }

    enctype(enctype) {
        this.wrapProperty('enctype', enctype);
        return this;
    }

    method(method) {
        this.wrapProperty('method', method);
        return this;
    }

    novalidate(novalidate) {
        this.wrapProperty('novalidate', novalidate);
        return this;
    }
}