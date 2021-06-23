
<script lang="ts">
	export let blaze : string
	import Nomination from './Nomination.svelte'
	import GameClient from './GameClient.svelte'

	const socket = io()

	console.log('client poop ===',poop)
	console.log('client PLAYER_RADIUS =',PLAYER_RADIUS)

	let username = ''
	function proceed(name : string) {
		console.log('Welcome to the game,', name + '!')
		username = name
	}
</script>

<div id="bloodscreen"></div>
{#if username.length === 0}
	<Nomination {proceed} {socket} {blaze}/>
{:else}
	<GameClient {socket} {username}/>
{/if}

<style lang="scss">
	// #bloodscreen {
	// 	// .party-mode {
	// 	// 	position: absolute;
	// 	// 	background: transparent;
	// 	// 	top: 0;
	// 	// 	left: 0;
	// 	// 	width: 100vw;
	// 	// 	height: 100vh;
	// 	// 	pointer-events: none;
	// 		// animation: woo 4s linear infinite;
	// 	// 	z-index: 2147483645;
	// 	// }

	// 	// @keyframes woo {
	// 	// 	0% {
	// 	// 		backdrop-filter: hue-rotate(360deg);
	// 	// 	}
	// 	// 	100% {
	// 	// 		backdrop-filter: hue-rotate(0deg);
	// 	// 	}
	// 	// }
	// }

	// .shake {
	// 	animation: shake 0.42s cubic-bezier(.36,.07,.19,.97) both;
	// }
	// .bleed {
	// 	animation: bleed .69s ease;
	// }
	// .shake2 {
	// 	animation: shake2 0.42s cubic-bezier(.36,.07,.19,.97) both;
	// }
	// .bleed2 {
	// 	animation: bleed2 .69s ease;
	// }
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
	// @keyframes bleed {
	// 	0% { opacity: 0.5; }
	// 	100% { opacity: 0; }
	// }
	// @keyframes shake {
	// 	10%, 90% { transform: translate3d(-1px, 1px, 0); }
	// 	20%, 80% { transform: translate3d(2px, -2px, 0); }
	// 	30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
	// 	40%, 60% { transform: translate3d(4px, 2px, 0); }
	// }
	// @keyframes bleed2 {
	// 	0% { opacity: 0.5; }
	// 	100% { opacity: 0; }
	// }
	// @keyframes shake2 {
	// 	10%, 90% { transform: translate3d(-1px, 1px, 0); }
	// 	20%, 80% { transform: translate3d(2px, -2px, 0); }
	// 	30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
	// 	40%, 60% { transform: translate3d(4px, 2px, 0); }
	// }
</style>