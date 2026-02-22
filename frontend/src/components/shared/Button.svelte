<script>
  let {
    variant = 'primary',
    size = 'md',
    disabled = false,
    type = 'button',
    title = undefined,
    draggable = undefined,
    class: className = '',
    onclick,
    children,
  } = $props();

  const variantClasses = {
    primary: 'bg-accent text-crust hover:opacity-90',
    secondary: 'bg-bg-elevated text-text-primary border border-border-default hover:border-accent/50',
    danger: 'text-text-muted hover:text-th-red hover:bg-th-red/10',
    success: 'bg-th-green text-crust hover:opacity-90',
    ghost: 'text-text-muted hover:text-accent hover:bg-accent/10',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    icon: 'w-6 h-6 flex items-center justify-center',
  };

  const base = 'cursor-pointer rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
</script>

<button
  {type}
  {disabled}
  {title}
  {draggable}
  {onclick}
  class="{base} {variantClasses[variant] || ''} {sizeClasses[size] || ''} {className}"
>
  {#if children}
    {@render children()}
  {/if}
</button>
