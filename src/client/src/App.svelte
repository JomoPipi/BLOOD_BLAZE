
<script lang="ts">
	export let blaze : string
	import Nomination from './Nomination.svelte'

	const socket = io()

	console.log('client poop ===',poop)

	let approved = false
	function proceed(name : string) {
		console.log('Welcome to the game,', name + '!')
		approved = true
	}
</script>

{#if !approved}
	<Nomination {proceed} {socket} {blaze}/>
{:else}
<!-- <Arena  -->
	<div>Awesome! 😋😋😋😋😋😋😋😋😋 </div>
{/if}