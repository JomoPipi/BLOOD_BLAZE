
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
            throw new Error(`Function called outside component initialization`);
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
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
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
        const prop_values = options.props || {};
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
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
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
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
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
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.24.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
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
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\game\views\Nomination.svelte generated by Svelte v3.24.0 */
    const file$7 = "src\\game\\views\\Nomination.svelte";

    function create_fragment$7(ctx) {
    	let main;
    	let span2;
    	let h1;
    	let span0;
    	let t1;
    	let span1;
    	let t2;
    	let t3;
    	let h2;
    	let t5;
    	let span4;
    	let form;
    	let input;
    	let t6;
    	let button;
    	let t8;
    	let span3;
    	let t9;
    	let bloodblaze;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			span2 = element("span");
    			h1 = element("h1");
    			span0 = element("span");
    			span0.textContent = "BLOOD";
    			t1 = space();
    			span1 = element("span");
    			t2 = text(/*blaze*/ ctx[0]);
    			t3 = space();
    			h2 = element("h2");
    			h2.textContent = "A Devastating Bloodbath of Boundless Mortality";
    			t5 = space();
    			span4 = element("span");
    			form = element("form");
    			input = element("input");
    			t6 = space();
    			button = element("button");
    			button.textContent = "GO";
    			t8 = space();
    			span3 = element("span");
    			t9 = space();
    			bloodblaze = element("bloodblaze");
    			attr_dev(span0, "class", "_1 svelte-151gubb");
    			add_location(span0, file$7, 38, 3, 1096);
    			attr_dev(span1, "class", "_2 svelte-151gubb");
    			add_location(span1, file$7, 39, 3, 1133);
    			attr_dev(h1, "class", "svelte-151gubb");
    			add_location(h1, file$7, 37, 2, 1086);
    			attr_dev(h2, "class", "svelte-151gubb");
    			add_location(h2, file$7, 41, 2, 1179);
    			attr_dev(span2, "class", "title svelte-151gubb");
    			add_location(span2, file$7, 36, 1, 1062);
    			attr_dev(input, "autocomplete", "off");
    			attr_dev(input, "placeholder", "Enter your name");
    			attr_dev(input, "pattern", "[A-Za-z0-9 _]*");
    			attr_dev(input, "maxlength", /*charLimit*/ ctx[2]);
    			attr_dev(input, "class", "svelte-151gubb");
    			add_location(input, file$7, 45, 3, 1330);
    			attr_dev(button, "class", "svelte-151gubb");
    			add_location(button, file$7, 50, 3, 1485);
    			attr_dev(form, "type", "text");
    			attr_dev(form, "action", "");
    			add_location(form, file$7, 44, 2, 1273);
    			add_location(span3, file$7, 52, 1, 1520);
    			attr_dev(bloodblaze, "class", "svelte-151gubb");
    			add_location(bloodblaze, file$7, 53, 1, 1530);
    			attr_dev(span4, "class", "inner svelte-151gubb");
    			add_location(span4, file$7, 43, 1, 1249);
    			attr_dev(main, "class", "svelte-151gubb");
    			add_location(main, file$7, 35, 0, 1053);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, span2);
    			append_dev(span2, h1);
    			append_dev(h1, span0);
    			append_dev(h1, t1);
    			append_dev(h1, span1);
    			append_dev(span1, t2);
    			append_dev(span2, t3);
    			append_dev(span2, h2);
    			append_dev(main, t5);
    			append_dev(main, span4);
    			append_dev(span4, form);
    			append_dev(form, input);
    			append_dev(form, t6);
    			append_dev(form, button);
    			append_dev(span4, t8);
    			append_dev(span4, span3);
    			append_dev(span4, t9);
    			append_dev(span4, bloodblaze);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "keyup", sanitizeText, false, false, false),
    					listen_dev(form, "submit", /*tryUsername*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*blaze*/ 1) set_data_dev(t2, /*blaze*/ ctx[0]);
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
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function sanitizeText(event) {
    	event.target.value = event.target.value.replace(/[^A-Za-z0-9 _]/g, "").slice(0, CONSTANTS.USERNAME_CHARACTER_LIMIT);
    }

    function instance$7($$self, $$props, $$invalidate) {
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

    	const charLimit = CONSTANTS.USERNAME_CHARACTER_LIMIT;
    	const writable_props = ["proceed", "blaze", "socket"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Nomination> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Nomination", $$slots, []);

    	$$self.$set = $$props => {
    		if ("proceed" in $$props) $$invalidate(3, proceed = $$props.proceed);
    		if ("blaze" in $$props) $$invalidate(0, blaze = $$props.blaze);
    		if ("socket" in $$props) $$invalidate(4, socket = $$props.socket);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		proceed,
    		blaze,
    		socket,
    		tryUsername,
    		sanitizeText,
    		charLimit
    	});

    	$$self.$inject_state = $$props => {
    		if ("proceed" in $$props) $$invalidate(3, proceed = $$props.proceed);
    		if ("blaze" in $$props) $$invalidate(0, blaze = $$props.blaze);
    		if ("socket" in $$props) $$invalidate(4, socket = $$props.socket);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [blaze, tryUsername, charLimit, proceed, socket];
    }

    class Nomination extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, { proceed: 3, blaze: 0, socket: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nomination",
    			options,
    			id: create_fragment$7.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*proceed*/ ctx[3] === undefined && !("proceed" in props)) {
    			console.warn("<Nomination> was created without expected prop 'proceed'");
    		}

    		if (/*blaze*/ ctx[0] === undefined && !("blaze" in props)) {
    			console.warn("<Nomination> was created without expected prop 'blaze'");
    		}

    		if (/*socket*/ ctx[4] === undefined && !("socket" in props)) {
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

    /* src\game\uielements\DirectionPad.svelte generated by Svelte v3.24.0 */
    const file$6 = "src\\game\\uielements\\DirectionPad.svelte";

    function create_fragment$6(ctx) {
    	let canvas_1;

    	const block = {
    		c: function create() {
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "class", "svelte-eupre8");
    			add_location(canvas_1, file$6, 47, 0, 1423);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
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
    		const [x2, y2] = [Math.cos(angle) * (r / 2) + W / 2, Math.sin(angle) * (r / 2) + H / 2];
    		ctx.beginPath();
    		ctx.arc(W / 2, H / 2, r, 0, 7);
    		ctx.closePath();
    		ctx.moveTo(x, y);
    		ctx.lineTo(x2, y2);
    		ctx.stroke();
    		ctx.beginPath();
    	}

    	const writable_props = ["callback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DirectionPad> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DirectionPad", $$slots, []);

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(0, canvas);
    		});
    	}

    	$$self.$set = $$props => {
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
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { callback: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DirectionPad",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get callback() {
    		throw new Error("<DirectionPad>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<DirectionPad>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\game\uielements\Joystick.svelte generated by Svelte v3.24.0 */
    const file$5 = "src\\game\\uielements\\Joystick.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let canvas_1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			canvas_1 = element("canvas");
    			attr_dev(canvas_1, "class", "svelte-18l9nl");
    			add_location(canvas_1, file$5, 88, 4, 2707);
    			attr_dev(div, "class", "svelte-18l9nl");
    			add_location(div, file$5, 87, 0, 2674);
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const canvasScale = 1.5;
    const radius = 40;
    const lineWidth = 8;

    function instance$5($$self, $$props, $$invalidate) {
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
    			const sensitivity = 0.75;
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

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Joystick", $$slots, []);

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

    	$$self.$set = $$props => {
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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { callback: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Joystick",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get callback() {
    		throw new Error("<Joystick>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set callback(value) {
    		throw new Error("<Joystick>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const DEV_SETTINGS = { enableClientSidePrediction: true,
        showPredictedPlayer: true,
        showServerPlayer: false,
        showServerBullet: false,
        showClientBullet: false,
        showIdealClientBullet: true,
        showClientPredictedBullet: true,
        showExtrapolatedEnemyPositions: true,
        showInterpolatedEnemyPositions: false,
        showUninterpolatedEnemyPositions: false,
        showWhatOtherClientsPredict: false,
        showGameMetadeta: true
    };

    /* src\game\views\DevSwitches.svelte generated by Svelte v3.24.0 */

    const { Object: Object_1 } = globals;
    const file$4 = "src\\game\\views\\DevSwitches.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (18:4) {#each DEV_SWITCHES as option}
    function create_each_block$1(ctx) {
    	let label;
    	let input;
    	let t0;
    	let h4;
    	let t1_value = /*option*/ ctx[4].split(camelSections).map(func).join(" ") + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	function input_change_handler() {
    		/*input_change_handler*/ ctx[3].call(input, /*option*/ ctx[4]);
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
    			add_location(input, file$4, 19, 12, 656);
    			attr_dev(h4, "class", "svelte-1p5603t");
    			add_location(h4, file$4, 20, 12, 727);
    			attr_dev(label, "class", "svelte-1p5603t");
    			add_location(label, file$4, 18, 8, 635);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, input);
    			input.checked = /*DEV_SETTINGS*/ ctx[0][/*option*/ ctx[4]];
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

    			if (dirty & /*DEV_SETTINGS, DEV_SWITCHES*/ 5) {
    				input.checked = /*DEV_SETTINGS*/ ctx[0][/*option*/ ctx[4]];
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
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(18:4) {#each DEV_SWITCHES as option}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let button0;
    	let t1;
    	let div;
    	let button1;
    	let t3;
    	let mounted;
    	let dispose;
    	let each_value = /*DEV_SWITCHES*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
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

    			attr_dev(button0, "class", "settings-button svelte-1p5603t");
    			add_location(button0, file$4, 8, 0, 366);
    			add_location(button1, file$4, 13, 4, 519);
    			attr_dev(div, "class", "settings-page svelte-1p5603t");
    			toggle_class(div, "show", /*settingsPage*/ ctx[1].isOpen);
    			add_location(div, file$4, 12, 0, 453);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    							if (is_function(/*settingsPage*/ ctx[1].toggle)) /*settingsPage*/ ctx[1].toggle.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*settingsPage*/ ctx[1].toggle)) /*settingsPage*/ ctx[1].toggle.apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*DEV_SWITCHES, camelSections, DEV_SETTINGS*/ 5) {
    				each_value = /*DEV_SWITCHES*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*settingsPage*/ 2) {
    				toggle_class(div, "show", /*settingsPage*/ ctx[1].isOpen);
    			}
    		},
    		i: noop,
    		o: noop,
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
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const camelSections = /([A-Z]+|[A-Z]?[a-z]+)(?=[A-Z]|\b)/;
    const func = s => !s[0] ? s : s[0].toUpperCase() + s.slice(1);

    function instance$4($$self, $$props, $$invalidate) {
    	const DEV_SWITCHES = Object.keys(DEV_SETTINGS).filter(k => typeof DEV_SETTINGS[k] === "boolean");

    	const settingsPage = {
    		toggle() {
    			$$invalidate(1, settingsPage.isOpen ^= 1, settingsPage);
    		},
    		isOpen: 0
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DevSwitches> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DevSwitches", $$slots, []);

    	function input_change_handler(option) {
    		DEV_SETTINGS[option] = this.checked;
    		$$invalidate(0, DEV_SETTINGS);
    		$$invalidate(2, DEV_SWITCHES);
    	}

    	$$self.$capture_state = () => ({
    		DEV_SETTINGS,
    		DEV_SWITCHES,
    		settingsPage,
    		camelSections
    	});

    	return [DEV_SETTINGS, settingsPage, DEV_SWITCHES, input_change_handler];
    }

    class DevSwitches extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DevSwitches",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\game\views\Score.svelte generated by Svelte v3.24.0 */
    const file$3 = "src\\game\\views\\Score.svelte";

    function create_fragment$3(ctx) {
    	let h4;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t0 = text(/*name*/ ctx[0]);
    			t1 = text(" - ");
    			t2 = text(/*value*/ ctx[1]);
    			attr_dev(h4, "class", "svelte-9w6kgf");
    			add_location(h4, file$3, 20, 0, 523);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t0);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			/*h4_binding*/ ctx[4](h4);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t0, /*name*/ ctx[0]);
    			if (dirty & /*value*/ 2) set_data_dev(t2, /*value*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			/*h4_binding*/ ctx[4](null);
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
    	let { name } = $$props;
    	let { value } = $$props;
    	let { maximum } = $$props;
    	let bar;
    	let mounted = false;

    	onMount(() => {
    		$$invalidate(2, bar.style.background = `linear-gradient(to right, #39f ${Math.round(100 * value / maximum)}%, #111 0%)`, bar);
    		$$invalidate(5, mounted = true);
    	});

    	const writable_props = ["name", "value", "maximum"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Score> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Score", $$slots, []);

    	function h4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			bar = $$value;
    			((($$invalidate(2, bar), $$invalidate(5, mounted)), $$invalidate(1, value)), $$invalidate(3, maximum));
    		});
    	}

    	$$self.$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("maximum" in $$props) $$invalidate(3, maximum = $$props.maximum);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		name,
    		value,
    		maximum,
    		bar,
    		mounted
    	});

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    		if ("value" in $$props) $$invalidate(1, value = $$props.value);
    		if ("maximum" in $$props) $$invalidate(3, maximum = $$props.maximum);
    		if ("bar" in $$props) $$invalidate(2, bar = $$props.bar);
    		if ("mounted" in $$props) $$invalidate(5, mounted = $$props.mounted);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*mounted, value, maximum*/ 42) {
    			{
    				if (mounted) {
    					$$invalidate(2, bar.style.background = `linear-gradient(to right, #39f ${Math.round(100 * value / maximum)}%, #111 0%)`, bar);
    				}
    			}
    		}
    	};

    	return [name, value, bar, maximum, h4_binding];
    }

    class Score extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0, value: 1, maximum: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Score",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Score> was created without expected prop 'name'");
    		}

    		if (/*value*/ ctx[1] === undefined && !("value" in props)) {
    			console.warn("<Score> was created without expected prop 'value'");
    		}

    		if (/*maximum*/ ctx[3] === undefined && !("maximum" in props)) {
    			console.warn("<Score> was created without expected prop 'maximum'");
    		}
    	}

    	get name() {
    		throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get value() {
    		throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maximum() {
    		throw new Error("<Score>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maximum(value) {
    		throw new Error("<Score>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\game\views\Scoreboard.svelte generated by Svelte v3.24.0 */
    const file$2 = "src\\game\\views\\Scoreboard.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (11:4) {#each scores as score}
    function create_each_block(ctx) {
    	let score;
    	let current;

    	score = new Score({
    			props: {
    				name: /*score*/ ctx[2].name,
    				value: /*score*/ ctx[2].value,
    				maximum: /*scores*/ ctx[0][0]?.value || 0
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(score.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(score, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const score_changes = {};
    			if (dirty & /*scores*/ 1) score_changes.name = /*score*/ ctx[2].name;
    			if (dirty & /*scores*/ 1) score_changes.value = /*score*/ ctx[2].value;
    			if (dirty & /*scores*/ 1) score_changes.maximum = /*scores*/ ctx[0][0]?.value || 0;
    			score.$set(score_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(score.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(score.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(score, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(11:4) {#each scores as score}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let current;
    	let each_value = /*scores*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "svelte-1rg865m");
    			add_location(div, file$2, 8, 0, 270);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scores*/ 1) {
    				each_value = /*scores*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let scores = [{ name: "12345678", value: 3 }, { name: "Bob", value: 2 }];

    	const updateScoreboard = newScores => {
    		$$invalidate(0, scores = newScores);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Scoreboard> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Scoreboard", $$slots, []);
    	$$self.$capture_state = () => ({ Score, scores, updateScoreboard });

    	$$self.$inject_state = $$props => {
    		if ("scores" in $$props) $$invalidate(0, scores = $$props.scores);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [scores, updateScoreboard];
    }

    class Scoreboard extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { updateScoreboard: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Scoreboard",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get updateScoreboard() {
    		return this.$$.ctx[1];
    	}

    	set updateScoreboard(value) {
    		throw new Error("<Scoreboard>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    class Bullet {
        data;
        receptionTime;
        display;
        constructor(data, time, display) {
            this.data = data;
            this.receptionTime = time;
            this.display = display;
        }
    }

    class Player {
        data;
        interpolationBuffer = [];
        lastExtrapolatedPosition;
        constructor(data) {
            this.data = data;
            this.lastExtrapolatedPosition = { x: data.x, y: data.y };
        }
    }

    // import { CONSTANTS } from '../../../shared/constants'
    class MyPlayer {
        name;
        predictedPosition;
        controls;
        lastTimeShooting = -1;
        isPressingTrigger = false;
        bullets = [];
        constructor(data) {
            this.name = data.name;
            this.predictedPosition = data;
            this.controls =
                { x: 0,
                    y: 0,
                    angle: 0,
                    messageNumber: 0,
                    deltaTime: 0
                };
        }
    }
    class ClientState {
        pendingInputs = [];
        bullets = [];
        structures = { [WallType.BRICK]: [],
            [WallType.FENCE]: [],
            [WallType.NON_NEWTONIAN]: []
        };
        players;
        myPlayer;
        lastGameTickMessageTime;
        lastGameTickMessage;
        constructor(username) {
            this.players = { [username]: new Player(CONSTANTS.CREATE_PLAYER(username)) };
            this.myPlayer = new MyPlayer(CONSTANTS.CREATE_PLAYER(username));
            this.lastGameTickMessageTime = Date.now();
            this.lastGameTickMessage =
                { players: [],
                    newBullets: []
                    // , bullets: []
                };
        }
        processGameTick(msg) {
            const now = Date.now();
            this.lastGameTickMessage = msg;
            this.lastGameTickMessageTime = now;
            this.myPlayer.bullets = this.myPlayer.bullets.filter(b => !msg.deletedBullets[b.data.id]);
            this.bullets = this.bullets.filter(b => !msg.deletedBullets[b.data.id]);
            const W = window.innerWidth;
            for (const b of msg.newBullets) {
                // These are the coodinates of the player's gun
                // We have these x,y so we can show the bullet coming out of the player's gun
                const player = this.players[b.shooter];
                if (!player)
                    break;
                const p = player.data;
                if (DEV_SETTINGS.showExtrapolatedEnemyPositions) {
                    const display = { x: (player.lastExtrapolatedPosition.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)) * W,
                        y: (player.lastExtrapolatedPosition.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)) * W
                    };
                    this.bullets.push(new Bullet(b, now, display));
                }
                else {
                    const x = (p.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle)) * window.innerWidth;
                    const y = (p.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle)) * window.innerWidth;
                    this.bullets.push(new Bullet(b, now, { x, y }));
                }
            }
            for (const p of msg.players) {
                // Create the player if it doesn't exist:
                this.players[p.name] ||= new Player(p);
                const player = this.players[p.name];
                player.data = p;
                if (p.name === this.myPlayer.name) {
                    this.myPlayer.predictedPosition =
                        { ...p, angle: this.myPlayer.controls.angle }; // We don't want the server's angle.
                    if (CONSTANTS.DEV_MODE && !DEV_SETTINGS.enableClientSidePrediction)
                        continue;
                    for (let j = 0; j < this.pendingInputs.length;) {
                        const input = this.pendingInputs[j];
                        if (input.messageNumber <= p.lastProcessedInput) {
                            // Already processed. Its effect is already taken into account into the world update
                            // we just got, so we can drop it.
                            this.pendingInputs.splice(j, 1);
                        }
                        else {
                            // Not processed by the server yet. Re-apply it.
                            CONSTANTS.MOVE_PLAYER(this.myPlayer.predictedPosition, input);
                            j++;
                        }
                    }
                }
                else if (DEV_SETTINGS.showInterpolatedEnemyPositions) {
                    player.interpolationBuffer.push([now, p]);
                }
            }
        }
    }

    const NETWORK_LATENCY = { value: 0,
        beginRetrieving(socket) {
            if (this.isRetrieving)
                throw 'Please only call this function once.';
            this.isRetrieving = true;
            const go = () => {
                const start = Date.now();
                socket.volatile.emit("ping", () => {
                    this.value = Date.now() - start; // Math.min(Date.now() - start, 400)
                    socket.volatile.emit("networkLatency", this.value);
                });
            };
            setInterval(go, 5000);
            go();
        },
        isRetrieving: false };

    // import { CONSTANTS } from "../../../shared/constants"
    class ClientPredictedBullet {
        timeCreated;
        data;
        endPoint;
        constructor(p, joystick, walls) {
            this.timeCreated = Date.now();
            const [bullet, endPoint] = createBullet(p, joystick, Math.random() + ':' + p.name, walls);
            this.data = bullet;
            this.endPoint = endPoint;
        }
    }
    function createBullet(p, joystick, id, walls) {
        const speedX = CONSTANTS.BULLET_SPEED * Math.cos(p.angle) + joystick.x * CONSTANTS.PLAYER_SPEED;
        const speedY = CONSTANTS.BULLET_SPEED * Math.sin(p.angle) + joystick.y * CONSTANTS.PLAYER_SPEED;
        const x = p.x + CONSTANTS.PLAYER_RADIUS * Math.cos(p.angle);
        const y = p.y + CONSTANTS.PLAYER_RADIUS * Math.sin(p.angle);
        const bigX = x + speedX * 20000; // Arbitrary amount to ensure the bullet leaves the area
        const bigY = y + speedY * 20000; // and collides with at least the boundary wall.
        // The four boundary walls ensure that expirationDistance is less than Infinity.
        const bulletTrajectory = [p, { x: bigX, y: bigY }];
        const [[endX, endY], expirationDistance, collidedWall] = walls.reduce(([pt, min, _], w) => {
            const point = CONSTANTS.LINE_SEGMENT_INTERSECTION_POINT(w, bulletTrajectory);
            if (!point)
                return [pt, min, _];
            const dist = distance(point[0], point[1], x, y);
            return dist < min ? [point, dist, w] : [pt, min, _];
        }, [[69, 420], Infinity, null]);
        const bullet = { x, y, speedX, speedY, id, shooter: p.name, expirationDistance };
        return [bullet, { x: endX, y: endY }];
    }

    // import { CONSTANTS } from "../../../shared/constants"
    class InputProcessor {
        state;
        socket;
        canSendIdleInput = true;
        constructor(state, socket) {
            this.state = state;
            this.socket = socket;
        }
        processInputs(deltaTime, now) {
            this.state.myPlayer.controls.deltaTime = deltaTime;
            const { x: oldX, y: oldY } = this.state.myPlayer.predictedPosition;
            CONSTANTS.MOVE_PLAYER(this.state.myPlayer.predictedPosition, this.state.myPlayer.controls);
            const { x: tempX, y: tempY } = this.state.myPlayer.predictedPosition;
            const walls = this.state.structures;
            const wallsPlayersCannotPass = walls[WallType.BRICK].concat(walls[WallType.FENCE]);
            const [nextX, nextY] = CONSTANTS.GET_PLAYER_POSITION_AFTER_WALL_COLLISION(oldX, oldY, tempX, tempY, wallsPlayersCannotPass);
            const { x: resetX, y: resetY } = this.state.myPlayer.controls;
            let shouldResetControls = false;
            if (tempX !== nextX || tempY !== nextY) {
                // Player position after colliding with wall
                this.state.myPlayer.predictedPosition.x = nextX;
                this.state.myPlayer.predictedPosition.y = nextY;
                // "Sanitized" controls after doing player-wall collisions (that the client sends the server):
                const controllerX = (nextX - oldX) / (deltaTime * CONSTANTS.PLAYER_SPEED);
                const controllerY = (nextY - oldY) / (deltaTime * CONSTANTS.PLAYER_SPEED);
                // if c2 > 1, then it means the controller is telling us to move the
                // player past it's maximum speed. So we need to find k that limits
                // sqrt (controlsX ** 2, controlsY ** 2) to be at most 1.
                const c2 = controllerX ** 2 + controllerY ** 2;
                const k = Math.min(Math.sqrt(1 / c2), 1);
                this.state.myPlayer.controls.x = controllerX * k;
                this.state.myPlayer.controls.y = controllerY * k;
                // We should reset the controls because running directly into the "tip" of a line segment can cause unpredictable movement.
                shouldResetControls = true;
            }
            if (this.state.myPlayer.isPressingTrigger && CONSTANTS.CAN_SHOOT(now, this.state.myPlayer.lastTimeShooting)) {
                this.state.myPlayer.lastTimeShooting = now;
                const walls = this.state.structures;
                const wallsBulletsCannotPass = walls[WallType.BRICK].concat(walls[WallType.NON_NEWTONIAN]);
                const bullet = new ClientPredictedBullet(this.state.myPlayer.predictedPosition, this.state.myPlayer.controls, wallsBulletsCannotPass);
                if (DEV_SETTINGS.enableClientSidePrediction) {
                    this.state.myPlayer.bullets.push(bullet);
                }
                this.state.myPlayer.controls.requestedBullet = bullet.data;
            }
            const userIsNotIdle = this.state.myPlayer.controls.x !== 0 ||
                this.state.myPlayer.controls.y !== 0 ||
                this.state.myPlayer.isPressingTrigger;
            if (userIsNotIdle || this.canSendIdleInput) {
                this.sendInputsToServer(this.state.myPlayer.controls);
                this.canSendIdleInput = false;
                if (shouldResetControls) {
                    this.state.myPlayer.controls.x = resetX;
                    this.state.myPlayer.controls.y = resetY;
                }
            }
            if (userIsNotIdle) {
                this.canSendIdleInput = true;
            }
        }
        moveJoystick(x, y) {
            this.state.myPlayer.controls.x = x;
            this.state.myPlayer.controls.y = y;
        }
        adjustAim(angle, active) {
            // Assign state.players[username].angle for a minor
            // convenience when shooting client predicted bullets:
            this.state.myPlayer.controls.angle =
                this.state.players[this.state.myPlayer.name].data.angle =
                    this.state.myPlayer.predictedPosition.angle =
                        angle;
            this.state.myPlayer.isPressingTrigger = active;
        }
        sendInputsToServer(playerControls) {
            // Save this input for later reconciliation:
            this.state.pendingInputs.push({ ...playerControls });
            this.socket.emit('controlsInput', playerControls);
            playerControls.messageNumber++;
            playerControls.requestedBullet = undefined;
        }
    }

    // import { CONSTANTS } from "../../../shared/constants"
    const PLAYER_RADIUS = CONSTANTS.PLAYER_RADIUS * window.innerWidth;
    class GameRenderer {
        canvas;
        ctx;
        state;
        constructor(canvas, state) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.state = state;
        }
        render(now, renderDelta) {
            const W = this.canvas.width;
            const H = this.canvas.height;
            this.ctx.clearRect(0, 0, W, H);
            this.drawWalls(W, H);
            const msgDelta = now - this.state.lastGameTickMessageTime;
            for (const name in this.state.players) {
                if (name === this.state.myPlayer.name)
                    continue;
                const p = this.state.players[name];
                if (DEV_SETTINGS.showExtrapolatedEnemyPositions) {
                    const data = this.getExtrapolatedPlayer(p, msgDelta, renderDelta);
                    this.drawPlayer(data, now);
                }
                if (DEV_SETTINGS.showInterpolatedEnemyPositions) {
                    const data = CONSTANTS.INTERPOLATE_PLAYER_POSITION(p.data, now, p.interpolationBuffer);
                    this.drawPlayer(data, now, 'blue');
                }
                if (DEV_SETTINGS.showUninterpolatedEnemyPositions) {
                    this.drawPlayer(p.data, now, 'red');
                }
            }
            if (DEV_SETTINGS.showServerPlayer) {
                this.drawPlayer(this.state.players[this.state.myPlayer.name].data, now, 'purple');
            }
            // if (DEV_SETTINGS.showServerBullet)
            // {
            //     this.ctx.fillStyle = '#099'
            //     for (const b of this.state.lastGameTickMessage.bullets)
            //     {
            //         this.circle(b.x * W, b.y * H, 2)
            //     }
            // }
            if (DEV_SETTINGS.showPredictedPlayer) {
                this.drawPlayer(this.state.myPlayer.predictedPosition, now);
            }
            if (DEV_SETTINGS.showWhatOtherClientsPredict) {
                const data = this.getExtrapolatedPlayer(this.state.players[this.state.myPlayer.name], msgDelta, renderDelta);
                this.drawPlayer(data, now, 'cyan');
            }
            if (DEV_SETTINGS.showClientBullet) {
                this.ctx.fillStyle = '#770';
                this.state.bullets = this.state.bullets.filter(b => {
                    const age = now - b.receptionTime;
                    const bx = b.data.x + b.data.speedX * age;
                    const by = b.data.y + b.data.speedY * age;
                    const x = bx * W;
                    const y = by * H;
                    this.circle(x, y, 2);
                    return 0 <= bx && bx <= 1 && 0 <= by && by <= 1;
                });
            }
            if (DEV_SETTINGS.showIdealClientBullet) {
                this.ctx.fillStyle = '#00f';
                this.state.bullets = this.state.bullets.filter(b => {
                    if (b.data.shooter === this.state.myPlayer.name)
                        return false;
                    const age = now - b.receptionTime;
                    const bx = b.data.x + b.data.speedX * age;
                    const by = b.data.y + b.data.speedY * age;
                    const x = bx * W;
                    const y = by * H;
                    const secondsToMerge = 0.5;
                    const mergeRate = Math.min(now - b.receptionTime, 1000 * secondsToMerge) * 0.001 / secondsToMerge;
                    const x1 = b.display.x + age * b.data.speedX * W;
                    const y1 = b.display.y + age * b.data.speedY * H;
                    const dx = x - x1;
                    const dy = y - y1;
                    const X = x1 + dx * mergeRate;
                    const Y = y1 + dy * mergeRate;
                    const lag = -(this.state.players[b.data.shooter]?.data.latency || 0);
                    const traveled = distance(b.data.x + b.data.speedX * lag, b.data.y + b.data.speedY * lag, X / W, Y / H);
                    if (traveled >= b.data.expirationDistance)
                        return false;
                    this.circle(X, Y, 2);
                    return 0 <= bx && bx <= 1 && 0 <= by && by <= 1;
                });
            }
            if (DEV_SETTINGS.showClientPredictedBullet) {
                this.state.myPlayer.bullets = this.state.myPlayer.bullets.filter(bullet => {
                    const age = now - bullet.timeCreated;
                    const b = bullet.data;
                    const bx = b.x + b.speedX * age;
                    const by = b.y + b.speedY * age;
                    const x = bx * W;
                    const y = by * H;
                    const traveled = distance(b.x, b.y, bx, by);
                    if (traveled >= b.expirationDistance)
                        return false;
                    this.ctx.fillStyle = '#c0c';
                    this.circle(x, y, 2);
                    // Hit debugger / Powerup
                    // this.ctx.fillStyle = 'red'
                    // this.circle(bullet.endPoint.x * W, bullet.endPoint.y * H, 2)
                    return 0 <= bx && bx <= 1 && 0 <= by && by <= 1;
                });
            }
        }
        drawPlayer(p, now, color = '#333') {
            const [x, y] = [p.x * this.canvas.width, p.y * this.canvas.height];
            const playerGunSize = 2;
            const bloodCooldown = 255;
            const R = (now - p.lastTimeGettingShot);
            const isGettingShot = R <= bloodCooldown;
            this.ctx.fillStyle =
                this.ctx.strokeStyle =
                    isGettingShot ? `rgb(255,${R},${R})` : color;
            if (p.name === this.state.myPlayer.name && isGettingShot) {
                const wait = 50 + Math.random() * 200;
                throttled(traumatize, wait, now);
            }
            this.circle(x, y, PLAYER_RADIUS, !isGettingShot);
            const [X, Y] = [x + PLAYER_RADIUS * Math.cos(p.angle),
                y + PLAYER_RADIUS * Math.sin(p.angle)
            ];
            this.circle(X, Y, playerGunSize);
            this.ctx.fillStyle = '#40f';
            this.ctx.fillText(p.name, x - 17, y - 17);
        }
        drawWalls(w, h) {
            // this.ctx.lineWidth = 2
            const wallColors = [['#0e8', WallType.NON_NEWTONIAN],
                ['#44f', WallType.FENCE],
                ['#410', WallType.BRICK]
            ];
            for (const [color, type] of wallColors) {
                this.ctx.strokeStyle = color;
                for (const [p1, p2] of this.state.structures[type]) {
                    this.line(p1.x * w, p1.y * h, p2.x * w, p2.y * h);
                }
            }
        }
        circle(x, y, r, stroke) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, r, 0, 7);
            this.ctx[stroke ? 'stroke' : 'fill']();
            this.ctx.closePath();
        }
        line(x1, y1, x2, y2) {
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            this.ctx.closePath();
        }
        getExtrapolatedPlayer(p, msgDelta, renderDelta) {
            // /
            // // non-"smooth" version:
            // const deltaTime = msgDelta + p.data.latency
            // const data = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(p.data, deltaTime)
            // this.drawPlayer(data, now)
            // "smooth" version:
            /**
             * Extrapolation smoothening:
             * limit the distance between the next extrapolated player position
             * and the previous so that the player goes at most `smoothSpeed`
             */
            const deltaTime = msgDelta + p.data.latency;
            const { x: serverx, y: servery } = p.data;
            const data = CONSTANTS.EXTRAPOLATE_PLAYER_POSITION(p.data, deltaTime);
            const { x: lastx, y: lasty } = p.lastExtrapolatedPosition;
            const dist = distance(data.x, data.y, lastx, lasty);
            const speed = dist / renderDelta;
            const smoothSpeed = 1.5;
            if (speed > CONSTANTS.PLAYER_SPEED * smoothSpeed) {
                const limiter = CONSTANTS.PLAYER_SPEED * smoothSpeed / speed;
                const dx = data.x - lastx;
                const dy = data.y - lasty;
                data.x = lastx + dx * limiter;
                data.y = lasty + dy * limiter;
            }
            p.lastExtrapolatedPosition = data;
            const walls = this.state.structures;
            const wallsPlayersCannotPass = walls[WallType.BRICK].concat(walls[WallType.FENCE]);
            const [x, y] = CONSTANTS.GET_PLAYER_POSITION_AFTER_WALL_COLLISION(serverx, servery, data.x, data.y, wallsPlayersCannotPass);
            return { ...data, x, y };
        }
    }
    function traumatize() {
        const a = document.body.classList;
        const b = document.getElementById('bloodscreen').classList;
        a.toggle('shake', !b.toggle('bleed'));
        b.toggle('bleed2', !a.toggle('shake2'));
    }

    let isRunning = false;
    function runClient(elements, state, socket) {
        if (isRunning)
            throw 'The client is already running.';
        isRunning = true;
        if (CONSTANTS.DEV_MODE) {
            window.state = state;
        }
        elements.canvas.height = elements.canvas.width = window.innerWidth;
        const renderer = new GameRenderer(elements.canvas, state);
        socket.on('mapdata', segments => {
            console.log('got the mapdata');
            state.structures = segments;
        });
        socket.on('removedPlayer', name => { delete state.players[name]; });
        socket.on('gameTick', msg => { state.processGameTick(msg); });
        (function updateLoop(lastUpdate) {
            const now = Date.now();
            const lastTime = lastUpdate || now;
            const deltaTime = now - lastTime;
            requestAnimationFrame(() => updateLoop(now));
            elements.inputs.processInputs(deltaTime, now);
            renderer.render(now, deltaTime);
            // const gameMetadata = 
            //       `<br> pending requests: ${state.pendingInputs.length}`
            //     + `<br> network latency: ${NETWORK_LATENCY.value}`
            const scores = Object.values(state.players)
                .sort((p1, p2) => p2.data.score - p1.data.score)
                .map(p => ({ name: p.data.name, value: p.data.score }))
                .slice(0, 5);
            elements.updateScoreboard(scores);
        })();
    }

    let runningBotId = 0;
    function startBot() {
        clearInterval(runningBotId);
        const [stick, _, __, aim] = [...document.querySelector('.input-container').children];
        if (!stick || !aim)
            throw 'Something changed here that caused this to throw.';
        // Start shooting
        aim.ontouchstart();
        stick.ontouchstart({ targetTouches: [{ clientX: 0, clientY: 0 }] });
        stick.ontouchmove({ targetTouches: [{ clientX: 0, clientY: 100 }] });
        let direction = 1;
        runningBotId = window.setInterval(() => {
            stick.ontouchmove({ targetTouches: [{ clientX: 0, clientY: 100 * (direction *= -1) }] });
        }, 5000);
    }
    function endBot() {
        clearTimeout(runningBotId);
    }
    Object.assign(window, { startBot, endBot });

    /* src\game\views\GameClient.svelte generated by Svelte v3.24.0 */
    const file$1 = "src\\game\\views\\GameClient.svelte";

    // (29:4) {#if devMode}
    function create_if_block$1(ctx) {
    	let devswitches;
    	let current;
    	devswitches = new DevSwitches({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(devswitches.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(devswitches, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(devswitches.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(devswitches.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(devswitches, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(29:4) {#if devMode}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let center;
    	let t0;
    	let t1;
    	let scoreboard;
    	let updating_updateScoreboard;
    	let t2;
    	let canvas_1;
    	let t3;
    	let div;
    	let joystick;
    	let t4;
    	let t5;
    	let directionpad;
    	let current;

    	function scoreboard_updateScoreboard_binding(value) {
    		/*scoreboard_updateScoreboard_binding*/ ctx[6].call(null, value);
    	}

    	let scoreboard_props = {};

    	if (/*updateScoreboard*/ ctx[2] !== void 0) {
    		scoreboard_props.updateScoreboard = /*updateScoreboard*/ ctx[2];
    	}

    	scoreboard = new Scoreboard({ props: scoreboard_props, $$inline: true });
    	binding_callbacks.push(() => bind(scoreboard, "updateScoreboard", scoreboard_updateScoreboard_binding));

    	joystick = new Joystick({
    			props: {
    				callback: /*inputs*/ ctx[3].moveJoystick.bind(/*inputs*/ ctx[3])
    			},
    			$$inline: true
    		});

    	let if_block = /*devMode*/ ctx[4] && create_if_block$1(ctx);

    	directionpad = new DirectionPad({
    			props: {
    				callback: /*inputs*/ ctx[3].adjustAim.bind(/*inputs*/ ctx[3])
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			center = element("center");
    			t0 = text(/*username*/ ctx[0]);
    			t1 = space();
    			create_component(scoreboard.$$.fragment);
    			t2 = space();
    			canvas_1 = element("canvas");
    			t3 = space();
    			div = element("div");
    			create_component(joystick.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			create_component(directionpad.$$.fragment);
    			attr_dev(center, "class", "svelte-157jzbb");
    			add_location(center, file$1, 23, 0, 906);
    			attr_dev(canvas_1, "class", "svelte-157jzbb");
    			add_location(canvas_1, file$1, 25, 0, 972);
    			attr_dev(div, "class", "input-container svelte-157jzbb");
    			add_location(div, file$1, 26, 0, 1002);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, center, anchor);
    			append_dev(center, t0);
    			insert_dev(target, t1, anchor);
    			mount_component(scoreboard, target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, canvas_1, anchor);
    			/*canvas_1_binding*/ ctx[7](canvas_1);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(joystick, div, null);
    			append_dev(div, t4);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t5);
    			mount_component(directionpad, div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*username*/ 1) set_data_dev(t0, /*username*/ ctx[0]);
    			const scoreboard_changes = {};

    			if (!updating_updateScoreboard && dirty & /*updateScoreboard*/ 4) {
    				updating_updateScoreboard = true;
    				scoreboard_changes.updateScoreboard = /*updateScoreboard*/ ctx[2];
    				add_flush_callback(() => updating_updateScoreboard = false);
    			}

    			scoreboard.$set(scoreboard_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(scoreboard.$$.fragment, local);
    			transition_in(joystick.$$.fragment, local);
    			transition_in(if_block);
    			transition_in(directionpad.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(scoreboard.$$.fragment, local);
    			transition_out(joystick.$$.fragment, local);
    			transition_out(if_block);
    			transition_out(directionpad.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(center);
    			if (detaching) detach_dev(t1);
    			destroy_component(scoreboard, detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(canvas_1);
    			/*canvas_1_binding*/ ctx[7](null);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { socket } = $$props;
    	let { username } = $$props;
    	NETWORK_LATENCY.beginRetrieving(socket);
    	let canvas;
    	let updateScoreboard;
    	const state = new ClientState(username);
    	const inputs = new InputProcessor(state, socket);
    	onMount(() => runClient({ inputs, canvas, updateScoreboard }, state, socket));
    	const devMode = CONSTANTS.DEV_MODE;
    	const writable_props = ["socket", "username"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<GameClient> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("GameClient", $$slots, []);

    	function scoreboard_updateScoreboard_binding(value) {
    		updateScoreboard = value;
    		$$invalidate(2, updateScoreboard);
    	}

    	function canvas_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			canvas = $$value;
    			$$invalidate(1, canvas);
    		});
    	}

    	$$self.$set = $$props => {
    		if ("socket" in $$props) $$invalidate(5, socket = $$props.socket);
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		SvelteComponent: SvelteComponentDev,
    		DirectionPad,
    		Joystick,
    		DevSwitches,
    		Scoreboard,
    		ClientState,
    		NETWORK_LATENCY,
    		InputProcessor,
    		runClient,
    		socket,
    		username,
    		canvas,
    		updateScoreboard,
    		state,
    		inputs,
    		devMode
    	});

    	$$self.$inject_state = $$props => {
    		if ("socket" in $$props) $$invalidate(5, socket = $$props.socket);
    		if ("username" in $$props) $$invalidate(0, username = $$props.username);
    		if ("canvas" in $$props) $$invalidate(1, canvas = $$props.canvas);
    		if ("updateScoreboard" in $$props) $$invalidate(2, updateScoreboard = $$props.updateScoreboard);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		username,
    		canvas,
    		updateScoreboard,
    		inputs,
    		devMode,
    		socket,
    		scoreboard_updateScoreboard_binding,
    		canvas_1_binding
    	];
    }

    class GameClient extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { socket: 5, username: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GameClient",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*socket*/ ctx[5] === undefined && !("socket" in props)) {
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

    /* src\App.svelte generated by Svelte v3.24.0 */

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

    // (21:0) {#if devMode}
    function create_if_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "id", "debug-window");
    			attr_dev(div, "class", "svelte-yuxzpj");
    			add_location(div, file, 21, 1, 666);
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
    		source: "(21:0) {#if devMode}",
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
    	let if_block1 = /*devMode*/ ctx[4] && create_if_block(ctx);

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
    			add_location(div, file, 14, 0, 496);
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
    	let { blaze } = $$props;

    	// @ts-ignore
    	const socket = io({
    		transports: ["websocket"],
    		upgrade: false
    	});

    	let username = "";

    	function proceed(name) {
    		$$invalidate(1, username = name);
    		console.log("Welcome to the game,", name + "!");
    	}

    	const devMode = CONSTANTS.DEV_MODE; // It's not defined outside of script tags 🤷
    	const writable_props = ["blaze"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);

    	$$self.$set = $$props => {
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

    // import '../../shared/QuadTree'
    // import '../../shared/constants'
    // import '../../shared/helpers'
    // import '../../shared/typehelpers'
    // import '../../shared/types'
    const app = new App({
        target: document.body,
        props: {
            blaze: 'Blaze'
        }
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
