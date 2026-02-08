<script>
  let dark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

  $: if (typeof document !== 'undefined') {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
</script>

<button on:click={() => dark = !dark} class="theme-toggle outline" aria-label="Toggle theme">
  {dark ? '☀️' : '🌙'}
</button>

<style>
  .theme-toggle {
    width: auto;
    margin: 0;
    padding: 0.25rem 0.5rem;
    font-size: 1.2rem;
    line-height: 1;
    border: none;
    background: none;
    cursor: pointer;
  }
  .theme-toggle:hover {
    background: none;
    opacity: 0.7;
  }
</style>
