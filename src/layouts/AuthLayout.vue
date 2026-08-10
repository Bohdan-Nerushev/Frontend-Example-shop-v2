<template>
  <div class="layout-auth">
    <main class="auth-main">
      <slot></slot>
    </main>
  </div>
</template>

<style scoped>
.layout-auth {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: var(--color-bg-main);
  padding: 1.5rem;
}

.auth-main {
  width: 100%;
  max-width: 450px;
}
</style>
