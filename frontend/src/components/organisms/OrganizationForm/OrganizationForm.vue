<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <div class="bg-white shadow rounded-lg">
      <div class="px-6 py-4 border-b border-gray-200">
        <h2 class="text-lg font-medium text-gray-900">
          {{ isEdit ? 'Edit Organization' : 'Create Organization' }}
        </h2>
        <p class="mt-1 text-sm text-gray-500">
          {{ isEdit ? 'Update the organization information below.' : 'Add a new organization to your CRM.' }}
        </p>
      </div>
      
      <div class="px-6 py-4 space-y-6">
        <!-- Basic Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            v-model="form.name"
            label="Organization Name"
            placeholder="Enter organization name"
            :error="errors.name"
            required
            @blur="validateField('name')"
          />
          
          <FormField
            v-model="form.dbaName"
            label="DBA Name"
            placeholder="Doing Business As name"
            :error="errors.dbaName"
            help-text="Optional alternate business name"
            @blur="validateField('dbaName')"
          />
        </div>
        
        <!-- Industry and Priority -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Industry Segment"
            :error="errors.industrySegment"
            required
          >
            <Select
              v-model="form.industrySegment"
              :options="industrySegmentOptions"
              placeholder="Select industry segment"
              @change="validateField('industrySegment')"
            />
          </FormField>
          
          <FormField
            label="Priority Level"
            :error="errors.priorityLevel"
            required
          >
            <Select
              v-model="form.priorityLevel"
              :options="priorityLevelOptions"
              placeholder="Select priority level"
              @change="validateField('priorityLevel')"
            />
          </FormField>
        </div>
        
        <!-- Contact Information -->
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-base font-medium text-gray-900 mb-4">Contact Information</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              v-model="form.primaryPhone"
              label="Primary Phone"
              type="tel"
              placeholder="(555) 123-4567"
              :error="errors.primaryPhone"
              @blur="validateField('primaryPhone')"
            />
            
            <FormField
              v-model="form.primaryEmail"
              label="Primary Email"
              type="email"
              placeholder="contact@company.com"
              :error="errors.primaryEmail"
              @blur="validateField('primaryEmail')"
            />
          </div>
          
          <FormField
            v-model="form.website"
            label="Website"
            type="url"
            placeholder="https://www.company.com"
            :error="errors.website"
            @blur="validateField('website')"
          />
        </div>
        
        <!-- Address Information -->
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-base font-medium text-gray-900 mb-4">Address Information</h3>
          
          <div class="space-y-4">
            <FormField
              v-model="form.address.street"
              label="Street Address"
              placeholder="123 Main Street"
              :error="errors['address.street']"
              @blur="validateField('address.street')"
            />
            
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                v-model="form.address.city"
                label="City"
                placeholder="City"
                :error="errors['address.city']"
                @blur="validateField('address.city')"
              />
              
              <FormField
                v-model="form.address.state"
                label="State"
                placeholder="State"
                :error="errors['address.state']"
                @blur="validateField('address.state')"
              />
              
              <FormField
                v-model="form.address.zipCode"
                label="ZIP Code"
                placeholder="12345"
                :error="errors['address.zipCode']"
                @blur="validateField('address.zipCode')"
              />
            </div>
          </div>
        </div>
        
        <!-- Business Details -->
        <div class="border-t border-gray-200 pt-6">
          <h3 class="text-base font-medium text-gray-900 mb-4">Business Details</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              v-model="form.annualRevenue"
              label="Annual Revenue"
              type="number"
              placeholder="1000000"
              :error="errors.annualRevenue"
              help-text="Optional: Enter annual revenue in dollars"
              @blur="validateField('annualRevenue')"
            />
            
            <FormField
              v-model="form.employeeCount"
              label="Employee Count"
              type="number"
              placeholder="50"
              :error="errors.employeeCount"
              help-text="Optional: Number of employees"
              @blur="validateField('employeeCount')"
            />
          </div>
          
          <FormField
            label="Distributor"
            :error="errors.distributorId"
          >
            <Select
              v-model="form.distributorId"
              :options="distributorOptions"
              placeholder="Select distributor (optional)"
              @change="validateField('distributorId')"
            />
          </FormField>
        </div>
        
        <!-- Notes -->
        <div class="border-t border-gray-200 pt-6">
          <FormField
            label="Notes"
            :error="errors.notes"
          >
            <textarea
              v-model="form.notes"
              rows="3"
              class="block w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Additional notes about this organization..."
              @blur="validateField('notes')"
            />
          </FormField>
        </div>
      </div>
      
      <!-- Form Actions -->
      <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          @click="handleCancel"
        >
          Cancel
        </Button>
        
        <div class="flex items-center space-x-3">
          <Button
            v-if="isEdit"
            type="button"
            variant="secondary"
            :disabled="loading"
            @click="handleReset"
          >
            Reset
          </Button>
          
          <Button
            type="submit"
            :loading="loading"
            :disabled="!isFormValid"
          >
            {{ isEdit ? 'Update Organization' : 'Create Organization' }}
          </Button>
        </div>
      </div>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Button, Select } from '@/components/atoms'
import { FormField } from '@/components/molecules'

interface Address {
  street: string
  city: string
  state: string
  zipCode: string
}

interface Organization {
  id?: string
  name: string
  dbaName?: string
  industrySegment: string
  priorityLevel: string
  primaryPhone?: string
  primaryEmail?: string
  website?: string
  address: Address
  annualRevenue?: number
  employeeCount?: number
  distributorId?: string
  notes?: string
}

interface Props {
  organization?: Organization
  loading?: boolean
  industrySegmentOptions?: Array<{ value: string; label: string }>
  priorityLevelOptions?: Array<{ value: string; label: string }>
  distributorOptions?: Array<{ value: string; label: string }>
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  industrySegmentOptions: () => [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'catering', label: 'Catering' },
    { value: 'institutional', label: 'Institutional' },
    { value: 'retail', label: 'Retail' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'education', label: 'Education' }
  ],
  priorityLevelOptions: () => [
    { value: 'A', label: 'A - High Priority' },
    { value: 'B', label: 'B - Medium Priority' },
    { value: 'C', label: 'C - Low Priority' }
  ],
  distributorOptions: () => [
    { value: 'sysco', label: 'Sysco' },
    { value: 'us-foods', label: 'US Foods' },
    { value: 'performance', label: 'Performance Food Group' },
    { value: 'reinhart', label: 'Reinhart FoodService' }
  ]
})

const emit = defineEmits<{
  submit: [organization: Organization]
  cancel: []
  reset: []
}>()

const initialForm: Organization = {
  name: '',
  dbaName: '',
  industrySegment: '',
  priorityLevel: '',
  primaryPhone: '',
  primaryEmail: '',
  website: '',
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: ''
  },
  annualRevenue: undefined,
  employeeCount: undefined,
  distributorId: '',
  notes: ''
}

const form = ref<Organization>({ ...initialForm })
const errors = ref<Record<string, string>>({})
const touched = ref<Record<string, boolean>>({})

const isEdit = computed(() => Boolean(props.organization?.id))

const isFormValid = computed(() => {
  const requiredFields = ['name', 'industrySegment', 'priorityLevel']
  return requiredFields.every(field => {
    const value = getNestedValue(form.value, field)
    return value && value.toString().trim().length > 0
  }) && Object.keys(errors.value).length === 0
})

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

const setNestedValue = (obj: any, path: string, value: any): void => {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

const validateField = (field: string) => {
  const value = getNestedValue(form.value, field)
  
  // Clear previous error
  delete errors.value[field]
  
  // Required field validation
  const requiredFields = ['name', 'industrySegment', 'priorityLevel']
  if (requiredFields.includes(field)) {
    if (!value || value.toString().trim().length === 0) {
      errors.value[field] = `${field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} is required`
      return
    }
  }
  
  // Email validation
  if (field === 'primaryEmail' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      errors.value[field] = 'Please enter a valid email address'
      return
    }
  }
  
  // URL validation
  if (field === 'website' && value) {
    try {
      new URL(value)
    } catch {
      errors.value[field] = 'Please enter a valid URL'
      return
    }
  }
  
  // Phone validation
  if (field === 'primaryPhone' && value) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
    const cleanPhone = value.replace(/[\s\-\(\)]/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      errors.value[field] = 'Please enter a valid phone number'
      return
    }
  }
  
  touched.value[field] = true
}

const handleSubmit = () => {
  // Validate all fields
  const allFields = [
    'name', 'dbaName', 'industrySegment', 'priorityLevel',
    'primaryPhone', 'primaryEmail', 'website',
    'address.street', 'address.city', 'address.state', 'address.zipCode',
    'annualRevenue', 'employeeCount', 'distributorId', 'notes'
  ]
  
  allFields.forEach(field => validateField(field))
  
  if (isFormValid.value) {
    emit('submit', { ...form.value })
  }
}

const handleCancel = () => {
  emit('cancel')
}

const handleReset = () => {
  if (props.organization) {
    form.value = { ...props.organization }
  } else {
    form.value = { ...initialForm }
  }
  errors.value = {}
  touched.value = {}
  emit('reset')
}

// Initialize form with organization data
watch(() => props.organization, (newOrganization) => {
  if (newOrganization) {
    form.value = { ...newOrganization }
  } else {
    form.value = { ...initialForm }
  }
  errors.value = {}
  touched.value = {}
}, { immediate: true })
</script>