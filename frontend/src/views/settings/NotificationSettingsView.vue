<template>
  <div class="container mx-auto px-4 py-8">
    <div class="text-center py-12">
      <Icon name="bell" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h2 class="text-2xl font-bold text-gray-900 mb-2">Notification Settings - Coming Soon</h2>
      <p class="text-gray-600 mb-6">
        The notification settings feature is planned for a future phase of development.
      </p>
      <Button @click="$router.push('/settings')" variant="primary">
        Back to Settings
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Icon } from '@/components/atoms'
</script>