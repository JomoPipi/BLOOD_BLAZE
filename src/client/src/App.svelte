
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

{#if username.length === 0}
	<Nomination {proceed} {socket} {blaze}/>
{:else}
	<GameClient {socket} {username}/>
{/if}