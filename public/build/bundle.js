
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
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

    /* src\game\Nomination.svelte generated by Svelte v3.38.2 */
    const file$4 = "src\\game\\Nomination.svelte";

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
    			add_location(h1, file$4, 35, 2, 922);
    			attr_dev(h2, "class", "svelte-1ggq3y7");
    			add_location(h2, file$4, 36, 2, 950);
    			attr_dev(div0, "class", "title svelte-1ggq3y7");
    			add_location(div0, file$4, 34, 1, 899);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "placeholder", "Enter your name");
    			attr_dev(input, "pattern", "[A-Za-z0-9 _]*");
    			attr_dev(input, "class", "svelte-1ggq3y7");
    			add_location(input, file$4, 41, 4, 1111);
    			attr_dev(button, "class", "svelte-1ggq3y7");
    			add_location(button, file$4, 45, 4, 1244);
    			attr_dev(form, "type", "text");
    			attr_dev(form, "action", "");
    			add_location(form, file$4, 40, 3, 1053);
    			add_location(span0, file$4, 47, 2, 1281);
    			attr_dev(span1, "class", "inner svelte-1ggq3y7");
    			add_location(span1, file$4, 39, 2, 1028);
    			attr_dev(div1, "class", "svelte-1ggq3y7");
    			add_location(div1, file$4, 38, 1, 1019);
    			attr_dev(bloodblaze, "class", "svelte-1ggq3y7");
    			add_location(bloodblaze, file$4, 49, 1, 1300);
    			attr_dev(main, "class", "svelte-1ggq3y7");
    			add_location(main, file$4, 33, 0, 890);
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
    				socket.removeAllListeners("nomination");
    				proceed(name);
    			}

    			alert(success
    			? `Welcome, ${name}!`
    			: `Sorry, "${name}" is not available.`);
    		});

    		// To speed things up while testing:
    		if (CONSTANTS.DEV_MODE) {
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
    			attr_dev(canvas_1, "class", "svelte-18l9nl");
    			add_location(canvas_1, file$2, 88, 4, 2663);
    			attr_dev(div, "class", "svelte-18l9nl");
    			add_location(div, file$2, 87, 0, 2630);
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

    const canvasScale = 1.5;
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
    	const size = window.innerWidth / 2.5 / PHI;
    	let { callback = () => 0 } = $$props;

    	onMount(() => {
    		$$invalidate(0, container.style.width = $$invalidate(0, container.style.height = Math.round(size) + "px", container), container);
    		W = $$invalidate(1, canvas.width = H = $$invalidate(1, canvas.height = Math.round(size * canvasScale), canvas), canvas);
    		const d = Math.floor(size - size * canvasScale) * 0.5;
    		$$invalidate(1, canvas.style.left = $$invalidate(1, canvas.style.top = d + "px", canvas), canvas);
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
    			const sensitivity = 0.5;
    			const dx = (e.targetTouches[0].clientX - startX) * sensitivity;
    			const dy = (e.targetTouches[0].clientY - startY) * sensitivity;

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
    			const r = W / 2 - radius - lineWidth;

    			const r2 = Math.pow(r, 2);
    			const a = Math.pow(dx, 2) + Math.pow(dy, 2);
    			const k = Math.sqrt(r2 / a);
    			const [jx, jy] = a > r2 ? [dx * k, dy * k] : [dx, dy];
    			point[0] = jx + W / 2;
    			point[1] = jy + W / 2;
    			render();
    			const x = jx / r;
    			const y = jy / r;
    			callback(x, y);
    		}

    		function touchend() {
    			point[0] = W / 2;
    			point[1] = H / 2;
    			render();
    			callback(0, 0);
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
    		const rot = 1.2 * Math.PI / 4; // 16

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
    		size,
    		canvasScale,
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
            this.data = CONSTANTS.CREATE_BULLET(p, joystick, Math.random());
        }
    }

    const DEV_SETTINGS = { enableClientSidePrediction: true,
        showPredictedPlayer: true,
        showServerPlayer: false,
        showServerBullet: false,
        showClientBullet: true,
        showClientPredictedBullet: true,
        interpolateEnemyPositions: true
    };

    const PLAYER_RADIUS = CONSTANTS.PLAYER_RADIUS * window.innerWidth;
    class GameRenderer {
        canvas;
        ctx;
        username;
        state;
        constructor(canvas, username, state) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.username = username;
            this.state = state;
        }
        render(now) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            for (const name in this.state.players) {
                if (name === this.username)
                    continue;
                const p = this.state.players[name];
                if (DEV_SETTINGS.interpolateEnemyPositions) {
                    // // "standard" interpolation/
                    // ///////////////////////////////////////////////////////////////
                    // const props = ['x','y','angle'] as const
                    // const buffer = p.interpolationBuffer
                    // const oneGameTickAway = now - CONSTANTS.GAME_TICK
                    // // Drop older positions.
                    // while (buffer.length >= 2 && buffer[1]![0] <= oneGameTickAway)
                    // {
                    //     buffer.shift()
                    // }
                    // if (buffer.length >= 2 && buffer[0]![0] <= oneGameTickAway && oneGameTickAway <= buffer[1]![0])
                    // {
                    //     for (const prop of props)
                    //     {
                    //         const x0 = buffer[0]![1][prop]
                    //         const x1 = buffer[1]![1][prop]
                    //         const t0 = buffer[0]![0]
                    //         const t1 = buffer[1]![0]
                    //         p.data[prop] = x0 + (x1 - x0) * (oneGameTickAway - t0) / (t1 - t0)
                    //     }
                    // }
                    // this.drawPlayer(p.data, now)
                    // //////////////////////////////////////////////////////////////////////////
                    const data = { ...p.data };
                    const dt = now - this.state.lastGameTickMessageTime;
                    const props = ['x', 'y', 'angle'];
                    const d_ = CONSTANTS.PLAYER_SPEED * dt;
                    const dx = data.controls.x * d_;
                    const dy = data.controls.y * d_;
                    for (const prop of props) {
                        // extrapolation
                        const predictionDelta = prop === 'x' ? dx : prop === 'y' ? dy : 0;
                        data[prop] += predictionDelta;
                        // p.data[prop] = x0 + (x1 - x0) * (oneGameTickAway - t0) / (t1 - t0)
                    }
                    this.drawPlayer(data, now);
                }
                else {
                    this.drawPlayer(p.data, now);
                }
            }
            if (DEV_SETTINGS.showPredictedPlayer) {
                this.drawPlayer(this.state.myPlayer.predictedPosition, now);
            }
            if (DEV_SETTINGS.showServerPlayer) {
                this.drawPlayer(this.state.players[this.username].data, now, 'purple');
            }
            if (DEV_SETTINGS.showServerBullet) {
                this.ctx.fillStyle = '#099';
                const { bullets } = this.state.lastGameTickMessage;
                for (const { x, y } of bullets) {
                    this.circle(x * this.canvas.width, y * this.canvas.height, 2);
                }
            }
            if (DEV_SETTINGS.showClientBullet) {
                this.ctx.fillStyle = '#770';
                const { deletedBullets } = this.state.lastGameTickMessage;
                this.state.bullets = this.state.bullets.filter(b => {
                    if (deletedBullets[b.id])
                        return false;
                    const age = now - (this.state.bulletReceptionTimes.get(b) || 0); // - NETWORK_LATENCY
                    const bx = b.x + b.speedX * age;
                    const by = b.y + b.speedY * age;
                    const x = bx * this.canvas.width;
                    const y = by * this.canvas.height;
                    this.circle(x, y, 2);
                    return 0 <= bx && bx <= 1 && 0 <= by && by <= 1;
                });
            }
            if (DEV_SETTINGS.showClientPredictedBullet) {
                this.ctx.fillStyle = '#c0c';
                const { deletedBullets } = this.state.lastGameTickMessage;
                this.state.myPlayer.bullets = this.state.myPlayer.bullets.filter(bullet => {
                    if (deletedBullets[bullet.data.id])
                        return false;
                    const age = now - bullet.timeCreated;
                    const b = bullet.data;
                    const bx = b.x + b.speedX * age;
                    const by = b.y + b.speedY * age;
                    const x = bx * this.canvas.width;
                    const y = by * this.canvas.height;
                    this.circle(x, y, 2);
                    return 0 <= bx && bx <= 1 && 0 <= by && by <= 1;
                });
            }
        }
        drawPlayer(p, now, color = '#333') {
            const [x, y] = [p.x * this.canvas.width, p.y * this.canvas.height];
            const playerGunSize = 2;
            const bloodCooldown = 256;
            const R = now - p.lastTimeGettingShot;
            const isGettingShot = R <= bloodCooldown;
            this.ctx.fillStyle = isGettingShot ? `rgb(${bloodCooldown - R},0,0)` : color;
            if (p.name === this.username && isGettingShot) {
                const wait = 50 + Math.random() * 200;
                throttled(traumatize, wait, now);
            }
            this.circle(x, y, PLAYER_RADIUS);
            const [X, Y] = [x + PLAYER_RADIUS * Math.cos(p.angle),
                y + PLAYER_RADIUS * Math.sin(p.angle)
            ];
            this.circle(X, Y, playerGunSize);
            this.ctx.fillStyle = '#40f';
            this.ctx.fillText(p.name, x - 17, y - 17);
        }
        circle(x, y, r) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, 7);
            this.ctx.fill();
            this.ctx.closePath();
        }
    }
    function traumatize() {
        const a = document.body.classList;
        const b = document.getElementById('bloodscreen').classList;
        a.toggle('shake', !b.toggle('bleed'));
        b.toggle('bleed2', !a.toggle('shake2'));
    }

    class Player {
        data;
        interpolationBuffer = [];
        constructor(data) {
            this.data = data;
        }
    }

    class MyPlayer {
        predictedPosition;
        // lastServerTickData : SocketPlayer
        controls = { x: 0,
            y: 0,
            angle: 0,
            messageNumber: 0,
            deltaTime: 0
        };
        lastTimeShooting = -1;
        isPressingTrigger = false;
        bullets = [];
        constructor(data) {
            this.predictedPosition = data;
        }
    }
    const defaultClientState = username => ({ pendingInputs: [],
        myPlayer: new MyPlayer(CONSTANTS.CREATE_PLAYER(username)),
        bulletReceptionTimes: new WeakMap(),
        players: { [username]: new Player(CONSTANTS.CREATE_PLAYER(username)) },
        bullets: [],
        lastGameTickMessage: { players: [],
            bullets: [],
            newBullets: [],
            deletedBullets: []
        },
        lastGameTickMessageTime: Date.now()
    });

    const NETWORK_LATENCY = { value: 0,
        beginRetrieving(socket) {
            const go = () => {
                const start = Date.now();
                socket.volatile.emit("ping", () => {
                    this.value = Date.now() - start;
                    socket.volatile.emit("networkLatency", this.value);
                });
            };
            setInterval(go, 5000);
            go();
        }
    };

    /* src\game\GameClient.svelte generated by Svelte v3.38.2 */

    const { Object: Object_1 } = globals;
    const file$1 = "src\\game\\GameClient.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[19] = list;
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (136:4) {#if devMode()}
    function create_if_block$1(ctx) {
    	let button0;
    	let t1;
    	let div;
    	let button1;
    	let t3;
    	let mounted;
    	let dispose;
    	let each_value = /*devSwitches*/ ctx[8]();
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			button0.textContent = "⚙️";
    			t1 = space();
    			div = element("div");
    			button1 = element("button");
    			button1.textContent = "back";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(button0, "class", "settings-button svelte-15f4wix");
    			add_location(button0, file$1, 136, 8, 5835);
    			add_location(button1, file$1, 140, 12, 6018);
    			attr_dev(div, "class", "settings-page svelte-15f4wix");
    			toggle_class(div, "show", /*settingsPage*/ ctx[4].isOpen);
    			add_location(div, file$1, 139, 8, 5944);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, button1);
    			append_dev(div, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

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
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*devSwitches, camelCase, DEV_SETTINGS*/ 258) {
    				each_value = /*devSwitches*/ ctx[8]();
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*settingsPage*/ 16) {
    				toggle_class(div, "show", /*settingsPage*/ ctx[4].isOpen);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(136:4) {#if devMode()}",
    		ctx
    	});

    	return block;
    }

    // (145:12) {#each devSwitches() as option}
    function create_each_block(ctx) {
    	let label;
    	let input;
    	let t0;
    	let h4;
    	let t1_value = /*option*/ ctx[18].split(camelCase).map(func).join(" ") + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[12].call(input, /*option*/ ctx[18]);
    	}

    	const block = {
    		c: function create() {
    			label = element("label");
    			input = element("input");
    			t0 = space();
    			h4 = element("h4");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file$1, 146, 20, 6196);
    			attr_dev(h4, "class", "svelte-15f4wix");
    			add_location(h4, file$1, 147, 20, 6275);
    			attr_dev(label, "class", "svelte-15f4wix");
    			add_location(label, file$1, 145, 16, 6167);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*DEV_SETTINGS*/ ctx[1][/*option*/ ctx[18]];
    			append_dev(label, t0);
    			append_dev(label, h4);
    			append_dev(h4, t1);
    			append_dev(label, t2);

    			if (!mounted) {
    				dispose = listen_dev(input, "change", input_change_handler);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*DEV_SETTINGS, devSwitches*/ 258) {
    				input.checked = /*DEV_SETTINGS*/ ctx[1][/*option*/ ctx[18]];
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(145:12) {#each devSwitches() as option}",
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
    			add_location(center, file$1, 130, 0, 5620);
    			attr_dev(div0, "class", "scoreboard svelte-15f4wix");
    			add_location(div0, file$1, 131, 0, 5649);
    			attr_dev(canvas_1, "class", "svelte-15f4wix");
    			add_location(canvas_1, file$1, 132, 0, 5704);
    			attr_dev(div1, "class", "input-container svelte-15f4wix");
    			add_location(div1, file$1, 133, 0, 5734);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, center, anchor);
    			append_dev(center, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div0, anchor);
    			/*div0_binding*/ ctx[10](div0);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[11](canvas_1);
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
    			/*div0_binding*/ ctx[10](null);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[11](null);
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

    const camelCase = /([A-Z]+|[A-Z]?[a-z]+)(?=[A-Z]|\b)/;
    const func = s => !s[0] ? s : s[0].toUpperCase() + s.slice(1);

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("GameClient", slots, []);
    	let { socket } = $$props;
    	let { username } = $$props;
    	let canvas;
    	let ctx;
    	let scoreboard;
    	const state = defaultClientState(username);

    	onMount(() => {
    		ctx = canvas.getContext("2d");
    		$$invalidate(2, canvas.height = window.innerWidth, canvas);
    		$$invalidate(2, canvas.width = window.innerWidth, canvas);
    		NETWORK_LATENCY.beginRetrieving(socket);

    		socket.on("removedPlayer", name => {
    			delete state.players[name];
    		});

    		socket.on("gameTick", msg => {
    			const now = Date.now();
    			state.lastGameTickMessage = msg;
    			state.lastGameTickMessageTime = now;
    			state.bullets.push(...msg.newBullets);

    			for (const b of msg.newBullets) {
    				state.bulletReceptionTimes.set(b, now);
    			}

    			for (const p of msg.players) {
    				// TODO: 'addPlayer' socket event?
    				if (!state.players[p.name]) {
    					state.players[p.name] = new Player(p);
    				}

    				const player = state.players[p.name];
    				player.data = p;

    				if (p.name === username) {
    					state.myPlayer.predictedPosition = Object.assign({}, p);
    					state.myPlayer.predictedPosition.angle = state.myPlayer.controls.angle; // We don't want the server's angle.
    					if (CONSTANTS.DEV_MODE && !DEV_SETTINGS.enableClientSidePrediction) continue;

    					for (let j = 0; j < state.pendingInputs.length; ) {
    						const input = state.pendingInputs[j];

    						if (input.messageNumber <= p.lastProcessedInput) {
    							// Already processed. Its effect is already taken into account into the world update
    							// we just got, so we can drop it.
    							state.pendingInputs.splice(j, 1);
    						} else {
    							// Not processed by the server yet. Re-apply it.
    							CONSTANTS.MOVE_PLAYER(state.myPlayer.predictedPosition, input, input.deltaTime);

    							j++;
    						}
    					}
    				} else {
    					player.interpolationBuffer.push([now, p]);
    				}
    			}
    		});

    		let lastUpdate = 0;
    		const renderer = new GameRenderer(canvas, username, state);

    		(function updateLoop() {
    			requestAnimationFrame(updateLoop);
    			const now = Date.now();
    			const lastTime = lastUpdate || now;
    			const deltaTime = now - lastTime;
    			lastUpdate = now;
    			processInputs(deltaTime, now);
    			$$invalidate(3, scoreboard.innerHTML = Object.values(state.players).sort((p1, p2) => p2.data.score - p1.data.score).map(p => `<span style="color: orange">${p.data.name}:</span> ${p.data.score}`).join("<br>") + `<br> pending requests: ${state.pendingInputs.length}` + `<br> network latency: ${NETWORK_LATENCY.value}`, scoreboard);
    			renderer.render(now);
    		})();
    	});

    	let canSendIdleInput = true;

    	function processInputs(deltaTime, now) {
    		state.myPlayer.controls.deltaTime = deltaTime;
    		CONSTANTS.MOVE_PLAYER(state.myPlayer.predictedPosition, state.myPlayer.controls, deltaTime);

    		if (state.myPlayer.isPressingTrigger && CONSTANTS.CAN_SHOOT(now, state.myPlayer.lastTimeShooting)) {
    			state.myPlayer.lastTimeShooting = now;
    			const bullet = new ClientPredictedBullet(state.myPlayer.predictedPosition, state.myPlayer.controls);

    			if (DEV_SETTINGS.enableClientSidePrediction) {
    				state.myPlayer.bullets.push(bullet);
    			}

    			state.myPlayer.controls.requestedBullet = bullet.data;
    		}

    		const userIsNotIdle = state.myPlayer.controls.x !== 0 || state.myPlayer.controls.y !== 0 || state.myPlayer.isPressingTrigger;

    		if (userIsNotIdle || canSendIdleInput) {
    			sendInputsToServer(state.myPlayer.controls);
    			canSendIdleInput = false;
    		}

    		if (userIsNotIdle) {
    			canSendIdleInput = true;
    		}
    	}

    	function sendInputsToServer(playerControls) {
    		// Save this input for later reconciliation:
    		state.pendingInputs.push(Object.assign({}, playerControls));

    		socket.emit("controlsInput", playerControls);
    		playerControls.messageNumber++;
    		playerControls.requestedBullet = undefined;
    	}

    	function moveJoystick(x, y) {
    		state.myPlayer.controls.x = x;
    		state.myPlayer.controls.y = y;
    	}

    	function moveRightPad(angle, active) {
    		// Assign state.players[username].angle for a minor
    		// convenience when shooting client predicted bullets:
    		state.myPlayer.controls.angle = state.players[username].data.angle = state.myPlayer.predictedPosition.angle = angle;

    		state.myPlayer.isPressingTrigger = active;
    	}

    	const devMode = () => CONSTANTS.DEV_MODE; // It's not defined outside of script tags 🤷

    	const settingsPage = {
    		toggle() {
    			$$invalidate(4, settingsPage.isOpen ^= 1, settingsPage);
    		},
    		isOpen: 0
    	};

    	const devSwitches = () => Object.keys(DEV_SETTINGS).filter(k => typeof DEV_SETTINGS[k] === "boolean");
    	const writable_props = ["socket", "username"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameClient> was created with unknown prop '${key}'`);
    	});

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			scoreboard = $$value;
    			$$invalidate(3, scoreboard);
    		});
    	}

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(2, canvas);
    		});
    	}

    	function input_change_handler(option) {
    		DEV_SETTINGS[option] = this.checked;
    		$$invalidate(1, DEV_SETTINGS);
    		$$invalidate(8, devSwitches);
    	}

    	$$self.$$set = $$props => {
    		if ("socket" in $$props) $$invalidate(9, socket = $$props.socket);
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		DirectionPad,
    		Joystick,
    		ClientPredictedBullet,
    		DEV_SETTINGS,
    		GameRenderer,
    		defaultClientState,
    		Player,
    		NETWORK_LATENCY,
    		socket,
    		username,
    		canvas,
    		ctx,
    		scoreboard,
    		state,
    		canSendIdleInput,
    		processInputs,
    		sendInputsToServer,
    		moveJoystick,
    		moveRightPad,
    		devMode,
    		settingsPage,
    		devSwitches,
    		camelCase
    	});

    	$$self.$inject_state = $$props => {
    		if ("socket" in $$props) $$invalidate(9, socket = $$props.socket);
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("canvas" in $$props) $$invalidate(2, canvas = $$props.canvas);
    		if ("ctx" in $$props) ctx = $$props.ctx;
    		if ("scoreboard" in $$props) $$invalidate(3, scoreboard = $$props.scoreboard);
    		if ("canSendIdleInput" in $$props) canSendIdleInput = $$props.canSendIdleInput;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		DEV_SETTINGS,
    		canvas,
    		scoreboard,
    		settingsPage,
    		moveJoystick,
    		moveRightPad,
    		devMode,
    		devSwitches,
    		socket,
    		div0_binding,
    		canvas_1_binding,
    		input_change_handler
    	];
    }

    class GameClient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { socket: 9, username: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameClient",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*socket*/ ctx[9] === undefined && !("socket" in props)) {
    			console.warn("<GameClient> was created without expected prop 'socket'");
    		}

    		if (/*username*/ ctx[0] === undefined && !("username" in props)) {
    			console.warn("<GameClient> was created without expected prop 'username'");
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

    // (17:0) {:else}
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
    		source: "(17:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:0) {#if username.length === 0}
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
    		source: "(15:0) {#if username.length === 0}",
    		ctx
    	});

    	return block;
    }

    // (20:0) {#if devMode()}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "debug-window");
    			attr_dev(div, "class", "svelte-yuxzpj");
    			add_location(div, file, 20, 1, 564);
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
    		source: "(20:0) {#if devMode()}",
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
    			add_location(div, file, 13, 0, 392);
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
    	let username = "";

    	function proceed(name) {
    		console.log("Welcome to the game,", name + "!");
    		$$invalidate(1, username = name);
    	}

    	const devMode = () => CONSTANTS.DEV_MODE; // It's not defined outside of script tags 🤷
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
