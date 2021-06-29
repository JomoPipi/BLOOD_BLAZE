
<script lang="ts">
	export let blaze : string
	import Nomination from './Nomination.svelte'
	import GameClient from './GameClient.svelte'

	const socket = io()
	
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
</style>