import App from './App.svelte';

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
})

export default app;