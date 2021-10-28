
<script lang="ts">
    import DevSwitches from "./DevSwitches.svelte";
    import PageButton from "../uielements/PageButton.svelte";
    export let socket : any // ClientSocket
</script>

<PageButton btnText={'⚙️'}>
    <div>
        <button 
            on:click={socket.emit('command_randomize_map', {})}>
            RANDOMIZE MAP
        </button>

        <PageButton btnText={'GIVE FEEDBACK'}>
            <br/>
            Your feedback is super important to us!!
        </PageButton>

        <div class="begging">
            <h4>
                about me: <a href="https://ronald-ronaldmcorona.vercel.app" target="_blank">https://ronald-ronaldmcorona.vercel.app</a>        
            </h4>
            <form action="https://www.paypal.com/donate" method="post" target="_top">
                <input type="hidden" name="hosted_button_id" value="NH4KDT52XGUTN" />
                <input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
                <img alt="" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
            </form>
        </div>
        
        <DevSwitches/>
    </div>
</PageButton>


<style lang="scss">
    div {
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        height: 50%;
    }
    button {
        margin: auto;
        margin-top: 0.5em;
        padding: 0 1em;
        font-size: 2em;
        width: 95%;
        border-radius: 4px;
    }
    .begging {
        text-align:center;
    }
</style>