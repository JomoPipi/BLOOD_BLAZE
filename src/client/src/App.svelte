
<script lang="ts">
	export let blaze : string
	import Nomination from './game/views/Nomination.svelte'
	import GameClient from './game/views/GameClient.svelte'

	// @ts-ignore
	const socket = io({transports: ['websocket'], upgrade: false})
	
	let username = ''
	function proceed(name : string) {
		username = name
		console.log('Welcome to the game,', name + '!')
	}

    const devMode = CONSTANTS.DEV_MODE // It's not defined outside of script tags 🤷

	const isMobile = /Mobi|Android/i.test(navigator.userAgent)

</script>

{#if !isMobile}
	<h1 style="color:white;background:black;text-align:center;"> Sorry, only mobile devices are supported at the moment! </h1>
{/if}

<div id="bloodscreen"></div>
{#if username.length === 0}
	<Nomination {proceed} {socket} {blaze}/>
{:else}
	<GameClient {socket} {username}/>
{/if}
{#if devMode}
	<div id="debug-window"></div>
{/if}

<style lang="scss">
	#bloodscreen {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		background-color: red;
		opacity: 0;
		pointer-events: none;
		z-index: 99999
	}

	#debug-window {
		position: absolute;
		width: 100%;
		height: 100%;
		top: 0;
		left: 0;
		padding-top: 2rem;
		background-color: transparent;
		pointer-events: none;
		color: black;
		z-index: 9999;
	}
</style>