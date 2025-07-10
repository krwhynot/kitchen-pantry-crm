<template>
  <div class="container mx-auto px-4 py-8">
    <div class="text-center py-12">
      <Icon name="cog-6-tooth" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Settings - Coming Soon</h2>
      <p class="text-gray-600 mb-6">
        The settings management feature is planned for a future phase of development.
      </p>
      <Button @click="$router.push('/dashboard')" variant="primary">
        Back to Dashboard
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Icon } from '@/components/atoms'
</script>