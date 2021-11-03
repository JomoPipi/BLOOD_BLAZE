
<script lang="ts">
	import { onMount } from "svelte";
	import { SoundEngine } from "../../SoundEngine"
	import BoundlessMortality from './BoundlessMortality.svelte'

	export let proceed : (name : string) => void
	export let blaze : string
	export let socket : ClientSocket

	let nameInput : HTMLInputElement

	onMount(() => {
		socket.on('nomination', ([success, name]) => {
			alert(success ? `Welcome, ${name}!` : `Sorry, "${name}" is not available.`)
			console.log('yooo!')
			if (success)
			{
        		socket.removeAllListeners('nomination')
				proceed(name)
			}
		})

		socket.on('error' as any, data => {
			document.body.innerHTML += data
		})

		// To speed things up while testing:
		if (CONSTANTS.DEV_MODE)
		{
			socket.emit('nomination', Math.random().toString())
		}
	})

	function tryUsername(e : Event) {
		e.preventDefault()
		const input = (e.target as HTMLElement).children[0] as HTMLInputElement

		if (input.value)
		{
			socket.emit('nomination', input.value)
			input.value = ''
		}
	}
	Object.assign(window, { tryUsername })

	const charLimit = CONSTANTS.USERNAME_CHARACTER_LIMIT
	let firstTime = true
	function sanitizeText(event : any) {
		if (firstTime)
		{
			firstTime = false
			SoundEngine.initialize()
		}
		event.target.value = 
		event.target.value
			.replace(/[^A-Za-z0-9 _]/g, '')
			.slice(0, charLimit)
	}

</script>

<main>
	<h1> 
		<span class="_1"> BLOOD </span> 
		<span class="_2"> {blaze} </span>
	</h1>
	<div>
		<BoundlessMortality/>
		<form type="text" action="" on:submit={tryUsername}>
			<input autocomplete="off" 
				placeholder="Enter a username..." 
				pattern="[A-Za-z0-9 _]*"
				maxlength={charLimit}
				bind:this={nameInput}
				on:keyup={sanitizeText}/>
			<button> GO </button>
			<h3> last update - 11/2/2021 </h3>
		</form>
	</div>
	<bloodblaze/>
</main>

<style lang="scss">
	h3 {
		color: rgb(129, 80, 65);
	}
	main {
		position: absolute;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		text-align: center;
		padding: 0;
	}

	@keyframes blur {
		from {
			$col: #ff3e00;
			text-shadow:0px 0px 10px $col,
			0px 0px 10px $col, 
			0px 0px 25px $col,
			0px 0px 25px $col,
			0px 0px 25px $col,
			0px 0px 25px $col,
			0px 0px 25px $col,
			0px 0px 25px $col,
			0px 0px 50px $col,
			0px 0px 50px $col,
			0px 0px 50px rgb(238, 78, 185),
			0px 0px 150px rgb(238, 78, 185),
			0px 10px 100px rgb(238, 78, 185),
			0px 10px 100px rgb(238, 78, 185),
			0px 10px 100px rgb(238, 78, 185),
			0px 10px 100px rgb(238, 78, 185),
			0px -10px 100px rgb(238, 78, 185),
			0px -10px 100px rgb(238, 78, 185);
		}
	}
	@keyframes breathe {
		from {
			filter: hue-rotate(0);
		}
		to {
			filter: hue-rotate(-18deg);
		}
	}	
	
	@keyframes breathe2 {
		from {
			filter: invert(0);
		}
		to {
			filter: invert(0.5);
		}
	}
	
	h1 {
		$col: rgb(255, 0, 0);
		color: $col;
		text-transform: uppercase;
		font-size: 4em;
		letter-spacing: 0.2em;
		font-weight: 600;
		// border: 1px solid rgb(189, 185, 84);
		animation: border-glow 3s infinite;

		text-align: center;
		font-size: 6em;
		letter-spacing: -3px;
		font-weight: 700;
		text-transform: uppercase;
		animation: breathe 1s alternate infinite;
		text-shadow: 0px 0px 5px $col, 0px 0px 7px $col;
		margin: 0;

		._1 {
			animation: blur 3s ease-out infinite;
		}

		._2 {
			animation: blur 3s ease-out infinite;
			animation-delay: 0.5s;
		}
	}

	input, button {
		font-size: 1.25rem;
		height: 50px;
		
		&::placeholder { /* Chrome, Firefox, Opera, Safari 10.1+ */
			color: rgba(189, 185, 84, 0.712);
			opacity: 1; /* Firefox */
		}
	}
	input {
		background-color: rgb(33, 16, 16);
		color: rgb(252, 246, 82);
		border-radius: 10px;
	}
	button {
		border-radius: 5px;
		background: radial-gradient(rgb(85, 72, 0),rgb(29, 0, 0));
		color: rgb(252, 198, 82);
		width: 60px;
		text-align: center;
	}
	bloodblaze {
		z-index: -1;
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		opacity: 1;
  		background: linear-gradient(135deg, #430000, #cc0058d0, #430000);
		  
		box-sizing: border-box;
  		
		background-size: 120% 120%;
  		animation: 
		  	GradientSwirl 5s ease infinite,
  			GradientSwirl2 8s linear infinite;
	}
	@keyframes spin {
		0% { transform: rotate(0deg); }
		100% { transform: rotate(360deg); }
	}
	@keyframes GradientSwirl { 
		0% { opacity: .9; }
		50% { opacity: 1; }
		100% { opacity: .9; }
	}
	@keyframes GradientSwirl2 { 
		0% { background-position: 15% 0%; }
		50% { background-position: 86% 100%; }
		100% { background-position: 15% 0%; }
	}
	@keyframes border-glow {
		0% { border: 1px solid rgb(189, 185, 84); }
		50% { border: 1px solid rgba(189, 185, 84, 0.5); }
		100% { border: 1px solid rgb(189, 185, 84); }
	}
	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>