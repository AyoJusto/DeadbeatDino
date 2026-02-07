<script>
  let dark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

  $: if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
</script>

<button on:click={() => dark = !dark} class="theme-toggle" aria-label="Toggle theme">
  {dark ? 'Light' : 'Dark'}
</button>

<style>
  .theme-toggle {
    width: auto;
    margin: 0;
    padding: 0.25rem 0.75rem;
  }
</style>
