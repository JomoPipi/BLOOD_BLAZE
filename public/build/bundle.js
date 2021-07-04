
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\Nomination.svelte generated by Svelte v3.38.2 */
    const file$4 = "src\\Nomination.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div0;
    	let h1;
    	let t0;
    	let t1;
    	let t2;
    	let h2;
    	let t4;
    	let div1;
    	let span1;
    	let form;
    	let input;
    	let t5;
    	let button;
    	let t7;
    	let span0;
    	let t8;
    	let bloodblaze;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h1 = element("h1");
    			t0 = text("BLOOD ");
    			t1 = text(/*blaze*/ ctx[0]);
    			t2 = space();
    			h2 = element("h2");
    			h2.textContent = "A Devastating Bloodbath of Boundless Mortality";
    			t4 = space();
    			div1 = element("div");
    			span1 = element("span");
    			form = element("form");
    			input = element("input");
    			t5 = space();
    			button = element("button");
    			button.textContent = "GO";
    			t7 = space();
    			span0 = element("span");
    			t8 = space();
    			bloodblaze = element("bloodblaze");
    			attr_dev(h1, "class", "svelte-1ggq3y7");
    			add_location(h1, file$4, 34, 2, 858);
    			attr_dev(h2, "class", "svelte-1ggq3y7");
    			add_location(h2, file$4, 35, 2, 886);
    			attr_dev(div0, "class", "title svelte-1ggq3y7");
    			add_location(div0, file$4, 33, 1, 835);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "placeholder", "Enter your name");
    			attr_dev(input, "pattern", "[A-Za-z0-9 _]*");
    			attr_dev(input, "class", "svelte-1ggq3y7");
    			add_location(input, file$4, 40, 4, 1047);
    			attr_dev(button, "class", "svelte-1ggq3y7");
    			add_location(button, file$4, 44, 4, 1180);
    			attr_dev(form, "type", "text");
    			attr_dev(form, "action", "");
    			add_location(form, file$4, 39, 3, 989);
    			add_location(span0, file$4, 46, 2, 1217);
    			attr_dev(span1, "class", "inner svelte-1ggq3y7");
    			add_location(span1, file$4, 38, 2, 964);
    			attr_dev(div1, "class", "svelte-1ggq3y7");
    			add_location(div1, file$4, 37, 1, 955);
    			attr_dev(bloodblaze, "class", "svelte-1ggq3y7");
    			add_location(bloodblaze, file$4, 48, 1, 1236);
    			attr_dev(main, "class", "svelte-1ggq3y7");
    			add_location(main, file$4, 32, 0, 826);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(h1, t0);
    			append_dev(h1, t1);
    			append_dev(div0, t2);
    			append_dev(div0, h2);
    			append_dev(main, t4);
    			append_dev(main, div1);
    			append_dev(div1, span1);
    			append_dev(span1, form);
    			append_dev(form, input);
    			append_dev(form, t5);
    			append_dev(form, button);
    			append_dev(span1, t7);
    			append_dev(span1, span0);
    			append_dev(main, t8);
    			append_dev(main, bloodblaze);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", sanitizeText, false, false, false),
    					listen_dev(form, "submit", /*tryUsername*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*blaze*/ 1) set_data_dev(t1, /*blaze*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function sanitizeText(event) {
    	event.target.value = event.target.value.replace(/[^A-Za-z0-9 _]/g, "");
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nomination", slots, []);
    	let { proceed } = $$props;
    	let { blaze } = $$props;
    	let { socket } = $$props;

    	onMount(() => {
    		socket.on("nomination", ([success, name]) => {
    			if (success) {
    				proceed(name);
    			}

    			alert(success
    			? `Welcome, ${name}!`
    			: `Sorry, "${name}" is not available.`);
    		});

    		// To speed things up while testing:
    		if (DEV_MODE) {
    			socket.emit("nomination", Math.random().toString());
    		}
    	});

    	function tryUsername(e) {
    		e.preventDefault();
    		const input = e.target.children[0];

    		if (input.value) {
    			socket.emit("nomination", input.value);
    			input.value = "";
    		}
    	}

    	const writable_props = ["proceed", "blaze", "socket"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nomination> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("proceed" in $$props) $$invalidate(2, proceed = $$props.proceed);
    		if ("blaze" in $$props) $$invalidate(0, blaze = $$props.blaze);
    		if ("socket" in $$props) $$invalidate(3, socket = $$props.socket);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		proceed,
    		blaze,
    		socket,
    		tryUsername,
    		sanitizeText
    	});

    	$$self.$inject_state = $$props => {
    		if ("proceed" in $$props) $$invalidate(2, proceed = $$props.proceed);
    		if ("blaze" in $$props) $$invalidate(0, blaze = $$props.blaze);
    		if ("socket" in $$props) $$invalidate(3, socket = $$props.socket);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [blaze, tryUsername, proceed, socket];
    }

    class Nomination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { proceed: 2, blaze: 0, socket: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nomination",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*proceed*/ ctx[2] === undefined && !("proceed" in props)) {
    			console.warn("<Nomination> was created without expected prop 'proceed'");
    		}

    		if (/*blaze*/ ctx[0] === undefined && !("blaze" in props)) {
    			console.warn("<Nomination> was created without expected prop 'blaze'");
    		}

    		if (/*socket*/ ctx[3] === undefined && !("socket" in props)) {
    			console.warn("<Nomination> was created without expected prop 'socket'");
    		}
    	}

    	get proceed() {
    		throw new Error("<Nomination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set proceed(value) {
    		throw new Error("<Nomination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get blaze() {
    		throw new Error("<Nomination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set blaze(value) {
    		throw new Error("<Nomination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get socket() {
    		throw new Error("<Nomination>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socket(value) {
    		throw new Error("<Nomination>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\uielements\DirectionPad.svelte generated by Svelte v3.38.2 */
    const file$3 = "src\\uielements\\DirectionPad.svelte";

    function create_fragment$3(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "class", "svelte-eupre8");
    			add_location(canvas_1, file$3, 45, 0, 1271);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[2](canvas_1);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[2](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("DirectionPad", slots, []);
    	let canvas;
    	let W;
    	let H;
    	let ctx;
    	const size = window.innerWidth / 2.5 / PHI;
    	let { callback = () => 0 } = $$props;
    	let angle = 0;

    	onMount(() => {
    		W = $$invalidate(0, canvas.width = H = $$invalidate(0, canvas.height = size, canvas), canvas);
    		ctx = canvas.getContext("2d");

    		// TODO: move to CSS
    		$$invalidate(0, canvas.style.margin = "5px", canvas);

    		$$invalidate(0, canvas.style.backgroundColor = "transparent", canvas);
    		render();
    		$$invalidate(0, canvas.ontouchstart = () => callback(angle, true), canvas);
    		$$invalidate(0, canvas.ontouchmove = touchmove, canvas);
    		$$invalidate(0, canvas.ontouchend = () => callback(angle, false), canvas);

    		function touchmove(e) {
    			const l = +canvas.offsetLeft;
    			const t = +canvas.offsetTop;
    			const x = e.targetTouches[0].clientX - l - W / 2;
    			const y = e.targetTouches[0].clientY - t - H / 2;
    			const a = Math.atan2(y, x);
    			angle = a;
    			render();
    			callback(a, true);
    		}
    	});

    	function render() {
    		ctx.clearRect(0, 0, W, H);
    		ctx.strokeStyle = "#fba";
    		const r = 40;
    		const [x, y] = [Math.cos(angle) * r + W / 2, Math.sin(angle) * r + H / 2];
    		ctx.beginPath();
    		ctx.arc(W / 2, H / 2, r, 0, 7);
    		ctx.closePath();
    		ctx.stroke();
    		ctx.beginPath();
    		ctx.arc(x, y, 6, 0, 7);
    		ctx.fill();
    	}

    	const writable_props = ["callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DirectionPad> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("callback" in $$props) $$invalidate(1, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		canvas,
    		W,
    		H,
    		ctx,
    		size,
    		callback,
    		angle,
    		render
    	});

    	$$self.$inject_state = $$props => {
    		if ("canvas" in $$props) $$invalidate(0, canvas = $$props.canvas);
    		if ("W" in $$props) W = $$props.W;
    		if ("H" in $$props) H = $$props.H;
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("callback" in $$props) $$invalidate(1, callback = $$props.callback);
    		if ("angle" in $$props) angle = $$props.angle;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [canvas, callback, canvas_1_binding];
    }

    class DirectionPad extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { callback: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DirectionPad",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get callback() {
    		throw new Error("<DirectionPad>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<DirectionPad>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\uielements\Joystick.svelte generated by Svelte v3.38.2 */
    const file$2 = "src\\uielements\\Joystick.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let canvas_1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "class", "svelte-1tbg9p3");
    			add_location(canvas_1, file$2, 84, 4, 2542);
    			attr_dev(div, "class", "svelte-1tbg9p3");
    			add_location(div, file$2, 83, 0, 2509);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, canvas_1);
    			/*canvas_1_binding*/ ctx[3](canvas_1);
    			/*div_binding*/ ctx[4](div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*canvas_1_binding*/ ctx[3](null);
    			/*div_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const radius = 40;
    const lineWidth = 8;

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Joystick", slots, []);
    	let container;
    	let canvas;
    	let W;
    	let H;
    	let ctx;
    	let point;
    	const size2 = window.innerWidth / 2.5 / PHI;
    	const size1 = window.innerWidth / 3;
    	let { callback = () => 0 } = $$props;

    	onMount(() => {
    		W = $$invalidate(1, canvas.width = H = $$invalidate(1, canvas.height = size1 | 0, canvas), canvas);
    		$$invalidate(0, container.style.width = $$invalidate(0, container.style.height = size2 + "px", container), container);
    		const d = size2 - size2 / PHI;
    		$$invalidate(1, canvas.style.left = $$invalidate(1, canvas.style.top = Math.round(-d / 2) + "px", canvas), canvas);
    		ctx = canvas.getContext("2d");
    		point = [W / 2, H / 2];
    		render();
    		$$invalidate(0, container.ontouchstart = touchstart, container);
    		$$invalidate(0, container.ontouchmove = touchmove, container);
    		$$invalidate(0, container.ontouchend = touchend, container);
    		let startX = 0;
    		let startY = 0;

    		function touchstart(e) {
    			startX = e.targetTouches[0].clientX;
    			startY = e.targetTouches[0].clientY;
    		}

    		function touchmove(e) {
    			const x = e.targetTouches[0].clientX - startX;
    			const y = e.targetTouches[0].clientY - startY;

    			/*
    -- "restrict" it to a circle of radius W/2:
    if sqrt(x**2 + y**2) > W/2 then
        we need k such that
        W/2 = sqrt((x*k)**2 + (y*k)**2)

        (W/2)**2 = (x*k)**2 + (y*k)**2
        (W/2)**2  = k**2 * (x**2 + y**2)
        (W/2)**2  / (x**2 + y**2) = k**2
        k = sqrt((W/2)**2 / (x**2 + y**2))
    */
    			const r2 = Math.pow(W / 2 - radius - lineWidth, 2);

    			const a = Math.pow(x, 2) + Math.pow(y, 2);
    			const k = Math.sqrt(r2 / a);
    			const [jx, jy] = a > r2 ? [x * k, y * k] : [x, y];
    			point[0] = jx + W / 2;
    			point[1] = jy + W / 2;
    			render();
    			callback(2 * (point[0] / W - 0.5), 2 * (point[1] / H - 0.5));
    		}

    		function touchend() {
    			point[0] = W / 2;
    			point[1] = H / 2;
    			render();
    			return callback(0, 0);
    		}
    	});

    	function render() {
    		ctx.clearRect(0, 0, W, H);
    		ctx.strokeStyle = "black";
    		ctx.lineWidth = lineWidth;
    		ctx.fillStyle = "rgb(71, 61, 61)";
    		ctx.beginPath();
    		const [x, y] = point;
    		ctx.arc(x, y, radius, 0, 7);
    		ctx.closePath();
    		ctx.stroke();
    		ctx.fill();
    		const X = x - W / 2;
    		const Y = y - H / 2;
    		const rot = 1.5 * Math.PI / 4; // 16

    		$$invalidate(
    			1,
    			canvas.style.transform = `
        perspective(200px) 
        rotateY(${rot * X | 0}deg)
        rotateX(${-rot * Y | 0}deg)`,
    			canvas
    		);
    	}

    	const writable_props = ["callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Joystick> was created with unknown prop '${key}'`);
    	});

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("callback" in $$props) $$invalidate(2, callback = $$props.callback);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		container,
    		canvas,
    		W,
    		H,
    		ctx,
    		point,
    		size2,
    		size1,
    		radius,
    		lineWidth,
    		callback,
    		render
    	});

    	$$self.$inject_state = $$props => {
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("canvas" in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ("W" in $$props) W = $$props.W;
    		if ("H" in $$props) H = $$props.H;
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("point" in $$props) point = $$props.point;
    		if ("callback" in $$props) $$invalidate(2, callback = $$props.callback);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [container, canvas, callback, canvas_1_binding, div_binding];
    }

    class Joystick extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { callback: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Joystick",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get callback() {
    		throw new Error("<Joystick>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<Joystick>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class ClientPredictedBullet {
        timeCreated;
        data;
        constructor(p, joystick) {
            this.timeCreated = Date.now();
            this.data = createBullet(p, joystick);
        }
    }

    /* src\GameClient.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1, console: console_1$1 } = globals;
    const file$1 = "src\\GameClient.svelte";

    // (222:4) {#if devMode()}
    function create_if_block$1(ctx) {
    	let button0;
    	let t1;
    	let div;
    	let button1;
    	let t3;
    	let label0;
    	let input0;
    	let t4;
    	let h40;
    	let t6;
    	let label1;
    	let input1;
    	let t7;
    	let h41;
    	let t9;
    	let label2;
    	let input2;
    	let t10;
    	let h42;
    	let t12;
    	let label3;
    	let input3;
    	let t13;
    	let h43;
    	let t15;
    	let label4;
    	let input4;
    	let t16;
    	let h44;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "⚙️";
    			t1 = space();
    			div = element("div");
    			button1 = element("button");
    			button1.textContent = "back";
    			t3 = space();
    			label0 = element("label");
    			input0 = element("input");
    			t4 = space();
    			h40 = element("h4");
    			h40.textContent = "Enable client-side prediction (reduces lag)";
    			t6 = space();
    			label1 = element("label");
    			input1 = element("input");
    			t7 = space();
    			h41 = element("h4");
    			h41.textContent = "Show server player position";
    			t9 = space();
    			label2 = element("label");
    			input2 = element("input");
    			t10 = space();
    			h42 = element("h4");
    			h42.textContent = "Show server bullet positions";
    			t12 = space();
    			label3 = element("label");
    			input3 = element("input");
    			t13 = space();
    			h43 = element("h4");
    			h43.textContent = "Show client bullet positions";
    			t15 = space();
    			label4 = element("label");
    			input4 = element("input");
    			t16 = space();
    			h44 = element("h4");
    			h44.textContent = "Show predicted client bullet positions";
    			attr_dev(button0, "class", "settings-button svelte-15f4wix");
    			add_location(button0, file$1, 222, 8, 8515);
    			add_location(button1, file$1, 226, 12, 8698);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$1, 231, 16, 8823);
    			attr_dev(h40, "class", "svelte-15f4wix");
    			add_location(h40, file$1, 232, 16, 8917);
    			attr_dev(label0, "class", "svelte-15f4wix");
    			add_location(label0, file$1, 230, 12, 8798);
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$1, 236, 16, 9034);
    			attr_dev(h41, "class", "svelte-15f4wix");
    			add_location(h41, file$1, 237, 16, 9118);
    			attr_dev(label1, "class", "svelte-15f4wix");
    			add_location(label1, file$1, 235, 12, 9009);
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$1, 241, 16, 9219);
    			attr_dev(h42, "class", "svelte-15f4wix");
    			add_location(h42, file$1, 242, 16, 9303);
    			attr_dev(label2, "class", "svelte-15f4wix");
    			add_location(label2, file$1, 240, 12, 9194);
    			attr_dev(input3, "type", "checkbox");
    			add_location(input3, file$1, 246, 16, 9405);
    			attr_dev(h43, "class", "svelte-15f4wix");
    			add_location(h43, file$1, 247, 16, 9489);
    			attr_dev(label3, "class", "svelte-15f4wix");
    			add_location(label3, file$1, 245, 12, 9380);
    			attr_dev(input4, "type", "checkbox");
    			add_location(input4, file$1, 251, 16, 9591);
    			attr_dev(h44, "class", "svelte-15f4wix");
    			add_location(h44, file$1, 252, 16, 9684);
    			attr_dev(label4, "class", "svelte-15f4wix");
    			add_location(label4, file$1, 250, 12, 9566);
    			attr_dev(div, "class", "settings-page svelte-15f4wix");
    			toggle_class(div, "show", /*settingsPage*/ ctx[4].isOpen);
    			add_location(div, file$1, 225, 8, 8624);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button1);
    			append_dev(div, t3);
    			append_dev(div, label0);
    			append_dev(label0, input0);
    			input0.checked = /*DEV_SETTINGS*/ ctx[3].enableClientSidePrediction;
    			append_dev(label0, t4);
    			append_dev(label0, h40);
    			append_dev(div, t6);
    			append_dev(div, label1);
    			append_dev(label1, input1);
    			input1.checked = /*DEV_SETTINGS*/ ctx[3].showServerPlayer;
    			append_dev(label1, t7);
    			append_dev(label1, h41);
    			append_dev(div, t9);
    			append_dev(div, label2);
    			append_dev(label2, input2);
    			input2.checked = /*DEV_SETTINGS*/ ctx[3].showServerBullet;
    			append_dev(label2, t10);
    			append_dev(label2, h42);
    			append_dev(div, t12);
    			append_dev(div, label3);
    			append_dev(label3, input3);
    			input3.checked = /*DEV_SETTINGS*/ ctx[3].showClientBullet;
    			append_dev(label3, t13);
    			append_dev(label3, h43);
    			append_dev(div, t15);
    			append_dev(div, label4);
    			append_dev(label4, input4);
    			input4.checked = /*DEV_SETTINGS*/ ctx[3].showClientPredictedBullet;
    			append_dev(label4, t16);
    			append_dev(label4, h44);

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*settingsPage*/ ctx[4].toggle)) /*settingsPage*/ ctx[4].toggle.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*settingsPage*/ ctx[4].toggle)) /*settingsPage*/ ctx[4].toggle.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[11]),
    					listen_dev(input1, "change", /*input1_change_handler*/ ctx[12]),
    					listen_dev(input2, "change", /*input2_change_handler*/ ctx[13]),
    					listen_dev(input3, "change", /*input3_change_handler*/ ctx[14]),
    					listen_dev(input4, "change", /*input4_change_handler*/ ctx[15])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*DEV_SETTINGS*/ 8) {
    				input0.checked = /*DEV_SETTINGS*/ ctx[3].enableClientSidePrediction;
    			}

    			if (dirty & /*DEV_SETTINGS*/ 8) {
    				input1.checked = /*DEV_SETTINGS*/ ctx[3].showServerPlayer;
    			}

    			if (dirty & /*DEV_SETTINGS*/ 8) {
    				input2.checked = /*DEV_SETTINGS*/ ctx[3].showServerBullet;
    			}

    			if (dirty & /*DEV_SETTINGS*/ 8) {
    				input3.checked = /*DEV_SETTINGS*/ ctx[3].showClientBullet;
    			}

    			if (dirty & /*DEV_SETTINGS*/ 8) {
    				input4.checked = /*DEV_SETTINGS*/ ctx[3].showClientPredictedBullet;
    			}

    			if (dirty & /*settingsPage*/ 16) {
    				toggle_class(div, "show", /*settingsPage*/ ctx[4].isOpen);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(222:4) {#if devMode()}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let center;
    	let t0;
    	let t1;
    	let div0;
    	let t2;
    	let canvas_1;
    	let t3;
    	let div1;
    	let joystick;
    	let t4;
    	let show_if = /*devMode*/ ctx[7]();
    	let t5;
    	let directionpad;
    	let current;

    	joystick = new Joystick({
    			props: { callback: /*moveJoystick*/ ctx[5] },
    			$$inline: true
    		});

    	let if_block = show_if && create_if_block$1(ctx);

    	directionpad = new DirectionPad({
    			props: { callback: /*moveRightPad*/ ctx[6] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			center = element("center");
    			t0 = text(/*username*/ ctx[0]);
    			t1 = space();
    			div0 = element("div");
    			t2 = space();
    			canvas_1 = element("canvas");
    			t3 = space();
    			div1 = element("div");
    			create_component(joystick.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			create_component(directionpad.$$.fragment);
    			attr_dev(center, "class", "svelte-15f4wix");
    			add_location(center, file$1, 216, 0, 8300);
    			attr_dev(div0, "class", "scoreboard svelte-15f4wix");
    			add_location(div0, file$1, 217, 0, 8329);
    			attr_dev(canvas_1, "class", "svelte-15f4wix");
    			add_location(canvas_1, file$1, 218, 0, 8384);
    			attr_dev(div1, "class", "input-container svelte-15f4wix");
    			add_location(div1, file$1, 219, 0, 8414);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, center, anchor);
    			append_dev(center, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			/*div0_binding*/ ctx[9](div0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[10](canvas_1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(joystick, div1, null);
    			append_dev(div1, t4);
    			if (if_block) if_block.m(div1, null);
    			append_dev(div1, t5);
    			mount_component(directionpad, div1, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*username*/ 1) set_data_dev(t0, /*username*/ ctx[0]);
    			if (show_if) if_block.p(ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(joystick.$$.fragment, local);
    			transition_in(directionpad.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(joystick.$$.fragment, local);
    			transition_out(directionpad.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(center);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div0);
    			/*div0_binding*/ ctx[9](null);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[10](null);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			destroy_component(joystick);
    			if (if_block) if_block.d();
    			destroy_component(directionpad);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function traumatize() {
    	const a = document.body.classList;
    	const b = document.getElementById("bloodscreen").classList;
    	a.toggle("shake", !b.toggle("bleed"));
    	b.toggle("bleed2", !a.toggle("shake2"));
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameClient", slots, []);
    	let { socket } = $$props;
    	let { username } = $$props;
    	let NETWORK_LATENCY = -1;

    	const getNetworkLatency = () => {
    		const start = Date.now();

    		// volatile, so the packet will be discarded if the socket is not connected
    		

    		socket.volatile.emit("ping", () => {
    			NETWORK_LATENCY = Date.now() - start;
    			console.log("lag = ", NETWORK_LATENCY);
    		});
    	};

    	getNetworkLatency();
    	setInterval(getNetworkLatency, 5000);
    	let canvas;
    	let ctx;
    	let scoreboard;

    	const state = {
    		pendingInputs: [],
    		playerControls: {
    			x: 0,
    			y: 0,
    			angle: 0,
    			isPressingTrigger: false,
    			messageNumber: 0,
    			deltaTime: 0
    		},
    		playerProperties: { LAST_SHOT: -1 },
    		bulletReceptionTimes: new WeakMap(),
    		players: { [username]: createPlayer(username) },
    		bullets: [],
    		playerBullets: []
    	};

    	let lastGameTickMessage = { players: [], bullets: [], newBullets: [] };

    	const DEV_SETTINGS = {
    		enableClientSidePrediction: true,
    		showServerPlayer: false,
    		serverplayer: {},
    		showServerBullet: false,
    		showClientBullet: true,
    		showClientPredictedBullet: true
    	};

    	onMount(() => {
    		ctx = canvas.getContext("2d");
    		$$invalidate(1, canvas.height = window.innerWidth, canvas);
    		$$invalidate(1, canvas.width = window.innerWidth, canvas);
    		socket.on("removedPlayer", name => delete state.players[name]);

    		socket.on("gameTick", msg => {
    			lastGameTickMessage = msg;
    			const now = Date.now();
    			state.bullets.push(...msg.newBullets);

    			for (const b of msg.newBullets) {
    				state.bulletReceptionTimes.set(b, now);
    			}

    			for (const p of msg.players) {
    				// TODO: 'addPlayer' socket event?
    				if (!state.players[p.name]) {
    					state.players[p.name] = p;
    				}

    				const player = state.players[p.name];

    				if (p.name === username) {
    					Object.assign(player, p);
    					Object.assign(DEV_SETTINGS.serverplayer, p);
    					if (DEV_MODE && !DEV_SETTINGS.enableClientSidePrediction) continue;
    					let j = 0;

    					while (j < state.pendingInputs.length) {
    						const input = state.pendingInputs[j];

    						if (input.messageNumber <= p.lastProcessedInput) {
    							// Already processed. Its effect is already taken into account into the world update
    							// we just got, so we can drop it.
    							state.pendingInputs.splice(j, 1);
    						} else {
    							// Not processed by the server yet. Re-apply it.
    							movePlayer(player, input, input.deltaTime);

    							j++;
    						}
    					}
    				} else {
    					{
    						Object.assign(player, p); // do interpolation
    					}
    				}
    			}
    		});

    		let lastRender = -1;

    		(function updateRender() {
    			const now = Date.now();
    			const lastTime = lastRender || now;
    			const deltaTime = now - lastTime;
    			lastRender = now;
    			processInputs(deltaTime, now);
    			requestAnimationFrame(updateRender);
    			ctx.clearRect(0, 0, canvas.width, canvas.height);
    			$$invalidate(2, scoreboard.innerHTML = Object.values(state.players).sort((p1, p2) => p2.score - p1.score).map(p => `<span style="color: orange">${p.name}:</span> ${p.score}`).join("<br>") + `<br> pending requests: ${state.pendingInputs.length}` + `<br> network latency: ${NETWORK_LATENCY}`, scoreboard);

    			for (const name in state.players) {
    				drawPlayer(state.players[name], now);
    			}

    			if (DEV_SETTINGS.showServerPlayer && DEV_SETTINGS.serverplayer.name) {
    				drawPlayer(DEV_SETTINGS.serverplayer, now, "purple");
    			}

    			if (DEV_SETTINGS.showServerBullet) {
    				ctx.fillStyle = "#099";
    				const { bullets } = lastGameTickMessage;

    				for (const { x, y } of bullets) {
    					circle(x * canvas.width, y * canvas.height, 2);
    				}
    			}

    			if (DEV_SETTINGS.showClientBullet) {
    				ctx.fillStyle = "#f50";

    				state.bullets = state.bullets.filter(b => {
    					const age = now - (state.bulletReceptionTimes.get(b) || 0); // - NETWORK_LATENCY
    					const bx = b.x + b.speedX * age;
    					const by = b.y + b.speedY * age;
    					const x = bx * canvas.width;
    					const y = by * canvas.height;
    					circle(x, y, 2);
    					return 0 <= bx && bx <= 1 && 0 <= by && by <= 1;
    				});
    			}

    			if (DEV_SETTINGS.showClientPredictedBullet) {
    				ctx.fillStyle = "#c0c";

    				state.playerBullets = state.playerBullets.filter(bullet => {
    					const age = now - bullet.timeCreated;
    					const b = bullet.data;
    					const bx = b.x + b.speedX * age;
    					const by = b.y + b.speedY * age;
    					const x = bx * canvas.width;
    					const y = by * canvas.height;
    					circle(x, y, 2);
    					return 0 <= bx && bx <= 1 && 0 <= by && by <= 1;
    				});
    			}
    		})();
    	});

    	function processInputs(deltaTime, now) {
    		state.playerControls.deltaTime = deltaTime;

    		// TODO: avoid sending controls while idling?
    		sendInputsToServer(state.playerControls);

    		// TODO: make babel plugin to remove if conditions for production mode
    		if (!DEV_MODE || DEV_SETTINGS.enableClientSidePrediction) {
    			movePlayer(state.players[username], state.playerControls, deltaTime);
    		}

    		if (canShoot(state.playerControls, now, state.playerProperties.LAST_SHOT)) {
    			state.playerProperties.LAST_SHOT = now;
    			const { x, y } = state.players[username];
    			const { angle } = state.playerControls;
    			state.playerBullets.push(new ClientPredictedBullet({ x, y, angle }, state.playerControls));
    		}
    	}

    	function sendInputsToServer(playerControls) {
    		// Save this input for later reconciliation:
    		state.pendingInputs.push(Object.assign({}, playerControls));

    		socket.emit("controlsInput", playerControls);
    		playerControls.messageNumber++;
    	}

    	function moveJoystick(x, y) {
    		state.playerControls.x = x;
    		state.playerControls.y = y;
    	}

    	function moveRightPad(angle, active) {
    		state.playerControls.angle = angle;
    		state.playerControls.isPressingTrigger = active;
    	}

    	function drawPlayer(p, now, color = "#333") {
    		const [x, y] = [p.x * canvas.width, p.y * canvas.height];
    		const playerGunSize = 2;
    		const bloodCooldown = 256;
    		const R = now - p.lastTimeGettingShot | 0;
    		const isGettingShot = R <= bloodCooldown;
    		ctx.fillStyle = isGettingShot ? `rgb(${bloodCooldown - R},0,0)` : color;

    		if (p.name === username && isGettingShot) {
    			const wait = 50 + Math.random() * 200;
    			throttled(traumatize, wait, now);
    		}

    		circle(x, y, PLAYER_RADIUS);

    		const angle = p.name === username
    		? state.playerControls.angle
    		: p.angle;

    		const [X, Y] = [x + PLAYER_RADIUS * Math.cos(angle), y + PLAYER_RADIUS * Math.sin(angle)];
    		circle(X, Y, playerGunSize);
    		ctx.fillStyle = "#40f";
    		ctx.fillText(p.name, x - 17, y - 17);
    	}

    	function circle(x, y, r) {
    		ctx.beginPath();
    		ctx.arc(x, y, r, 0, 7);
    		ctx.fill();
    		ctx.closePath();
    	}

    	const devMode = () => DEV_MODE; // It's not defined outside of script tags 🤷

    	const settingsPage = {
    		toggle() {
    			$$invalidate(4, settingsPage.isOpen ^= 1, settingsPage);
    		},
    		isOpen: 0
    	};

    	const writable_props = ["socket", "username"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<GameClient> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			scoreboard = $$value;
    			$$invalidate(2, scoreboard);
    		});
    	}

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	function input0_change_handler() {
    		DEV_SETTINGS.enableClientSidePrediction = this.checked;
    		$$invalidate(3, DEV_SETTINGS);
    	}

    	function input1_change_handler() {
    		DEV_SETTINGS.showServerPlayer = this.checked;
    		$$invalidate(3, DEV_SETTINGS);
    	}

    	function input2_change_handler() {
    		DEV_SETTINGS.showServerBullet = this.checked;
    		$$invalidate(3, DEV_SETTINGS);
    	}

    	function input3_change_handler() {
    		DEV_SETTINGS.showClientBullet = this.checked;
    		$$invalidate(3, DEV_SETTINGS);
    	}

    	function input4_change_handler() {
    		DEV_SETTINGS.showClientPredictedBullet = this.checked;
    		$$invalidate(3, DEV_SETTINGS);
    	}

    	$$self.$$set = $$props => {
    		if ("socket" in $$props) $$invalidate(8, socket = $$props.socket);
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		DirectionPad,
    		Joystick,
    		ClientPredictedBullet,
    		socket,
    		username,
    		NETWORK_LATENCY,
    		getNetworkLatency,
    		canvas,
    		ctx,
    		scoreboard,
    		state,
    		lastGameTickMessage,
    		DEV_SETTINGS,
    		processInputs,
    		sendInputsToServer,
    		moveJoystick,
    		moveRightPad,
    		drawPlayer,
    		circle,
    		traumatize,
    		devMode,
    		settingsPage
    	});

    	$$self.$inject_state = $$props => {
    		if ("socket" in $$props) $$invalidate(8, socket = $$props.socket);
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("NETWORK_LATENCY" in $$props) NETWORK_LATENCY = $$props.NETWORK_LATENCY;
    		if ("canvas" in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("scoreboard" in $$props) $$invalidate(2, scoreboard = $$props.scoreboard);
    		if ("lastGameTickMessage" in $$props) lastGameTickMessage = $$props.lastGameTickMessage;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		canvas,
    		scoreboard,
    		DEV_SETTINGS,
    		settingsPage,
    		moveJoystick,
    		moveRightPad,
    		devMode,
    		socket,
    		div0_binding,
    		canvas_1_binding,
    		input0_change_handler,
    		input1_change_handler,
    		input2_change_handler,
    		input3_change_handler,
    		input4_change_handler
    	];
    }

    class GameClient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { socket: 8, username: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameClient",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*socket*/ ctx[8] === undefined && !("socket" in props)) {
    			console_1$1.warn("<GameClient> was created without expected prop 'socket'");
    		}

    		if (/*username*/ ctx[0] === undefined && !("username" in props)) {
    			console_1$1.warn("<GameClient> was created without expected prop 'username'");
    		}
    	}

    	get socket() {
    		throw new Error("<GameClient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set socket(value) {
    		throw new Error("<GameClient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get username() {
    		throw new Error("<GameClient>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set username(value) {
    		throw new Error("<GameClient>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\App.svelte generated by Svelte v3.38.2 */

    const { console: console_1 } = globals;
    const file = "src\\App.svelte";

    // (18:0) {:else}
    function create_else_block(ctx) {
    	let gameclient;
    	let current;

    	gameclient = new GameClient({
    			props: {
    				socket: /*socket*/ ctx[2],
    				username: /*username*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(gameclient.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(gameclient, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const gameclient_changes = {};
    			if (dirty & /*username*/ 2) gameclient_changes.username = /*username*/ ctx[1];
    			gameclient.$set(gameclient_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(gameclient.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(gameclient.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(gameclient, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(18:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (16:0) {#if username.length === 0}
    function create_if_block_1(ctx) {
    	let nomination;
    	let current;

    	nomination = new Nomination({
    			props: {
    				proceed: /*proceed*/ ctx[3],
    				socket: /*socket*/ ctx[2],
    				blaze: /*blaze*/ ctx[0]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(nomination.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(nomination, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const nomination_changes = {};
    			if (dirty & /*blaze*/ 1) nomination_changes.blaze = /*blaze*/ ctx[0];
    			nomination.$set(nomination_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nomination.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nomination.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(nomination, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(16:0) {#if username.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if devMode()}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "debug-window");
    			attr_dev(div, "class", "svelte-yuxzpj");
    			add_location(div, file, 21, 1, 599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(21:0) {#if devMode()}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div;
    	let t0;
    	let current_block_type_index;
    	let if_block0;
    	let t1;
    	let show_if = /*devMode*/ ctx[4]();
    	let if_block1_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*username*/ ctx[1].length === 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = show_if && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(div, "id", "bloodscreen");
    			attr_dev(div, "class", "svelte-yuxzpj");
    			add_location(div, file, 14, 0, 427);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t0, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(t1.parentNode, t1);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t0);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(t1);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let { blaze } = $$props;
    	const socket = io();
    	console.log("client PLAYER_RADIUS =", PLAYER_RADIUS);
    	let username = "";

    	function proceed(name) {
    		console.log("Welcome to the game,", name + "!");
    		$$invalidate(1, username = name);
    	}

    	const devMode = () => DEV_MODE; // It's not defined outside of script tags 🤷
    	const writable_props = ["blaze"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("blaze" in $$props) $$invalidate(0, blaze = $$props.blaze);
    	};

    	$$self.$capture_state = () => ({
    		blaze,
    		Nomination,
    		GameClient,
    		socket,
    		username,
    		proceed,
    		devMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("blaze" in $$props) $$invalidate(0, blaze = $$props.blaze);
    		if ("username" in $$props) $$invalidate(1, username = $$props.username);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [blaze, username, socket, proceed, devMode];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { blaze: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*blaze*/ ctx[0] === undefined && !("blaze" in props)) {
    			console_1.warn("<App> was created without expected prop 'blaze'");
    		}
    	}

    	get blaze() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set blaze(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
        target: document.body,
        props: {
            blaze: 'Blaze'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
