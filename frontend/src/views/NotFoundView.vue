<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8 text-center">
      <div>
        <Icon name="question-mark-circle" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h2 class="text-3xl font-bold text-gray-900 mb-2">Page not found</h2>
        <p class="text-gray-600 mb-6">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div class="space-y-3">
          <Button @click="$router.push('/dashboard')" variant="primary" class="w-full">
            Back to Dashboard
          </Button>
          <Button @click="$router.go(-1)" variant="secondary" class="w-full">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button, Icon } from '@/components/atoms'
</script>