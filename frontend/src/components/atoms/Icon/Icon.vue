<template>
  <component
    :is="iconComponent"
    :class="iconClasses"
    :aria-hidden="!ariaLabel"
    :aria-label="ariaLabel"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  UserIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  XMarkIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ClockIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  InboxIcon,
  DocumentIcon,
  Cog6ToothIcon,
  BellIcon,
  HomeIcon,
  ChartBarIcon,
  FolderIcon,
  ListBulletIcon,
  TableCellsIcon,
  MapPinIcon,
  TagIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  LinkIcon,
  GlobeAltIcon,
  CloudIcon,
  ServerIcon,
  ShieldCheckIcon,
  KeyIcon,
  LockClosedIcon,
  UserGroupIcon,
  AdjustmentsHorizontalIcon,
  FunnelIcon,
  Bars3Icon,
  EllipsisHorizontalIcon
} from '@heroicons/vue/24/outline'

interface Props {
  name: string
  size?: number | string
  class?: string
  ariaLabel?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 20
})

const iconMap = {
  // User and People
  user: UserIcon,
  'user-group': UserGroupIcon,
  
  // Business
  'building-office': BuildingOfficeIcon,
  'currency-dollar': CurrencyDollarIcon,
  'chart-bar': ChartBarIcon,
  
  // Communication
  phone: PhoneIcon,
  envelope: EnvelopeIcon,
  'globe-alt': GlobeAltIcon,
  link: LinkIcon,
  
  // Navigation
  home: HomeIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-down': ChevronDownIcon,
  'arrow-up': ArrowUpIcon,
  'arrow-down': ArrowDownIcon,
  
  // Actions
  plus: PlusIcon,
  'x-mark': XMarkIcon,
  x: XMarkIcon,
  pencil: PencilIcon,
  trash: TrashIcon,
  eye: EyeIcon,
  search: MagnifyingGlassIcon,
  'magnifying-glass': MagnifyingGlassIcon,
  'arrow-down-tray': ArrowDownTrayIcon,
  printer: PrinterIcon,
  share: ShareIcon,
  
  // Status
  clock: ClockIcon,
  'exclamation-circle': ExclamationCircleIcon,
  'check-circle': CheckCircleIcon,
  'information-circle': InformationCircleIcon,
  'exclamation-triangle': ExclamationTriangleIcon,
  
  // Data
  calendar: CalendarIcon,
  document: DocumentIcon,
  folder: FolderIcon,
  inbox: InboxIcon,
  'table-cells': TableCellsIcon,
  'list-bullet': ListBulletIcon,
  
  // System
  'cog-6-tooth': Cog6ToothIcon,
  bell: BellIcon,
  cloud: CloudIcon,
  server: ServerIcon,
  'shield-check': ShieldCheckIcon,
  key: KeyIcon,
  'lock-closed': LockClosedIcon,
  
  // UI
  'adjustments-horizontal': AdjustmentsHorizontalIcon,
  funnel: FunnelIcon,
  'bars-3': Bars3Icon,
  'ellipsis-horizontal': EllipsisHorizontalIcon,
  
  // Misc
  'map-pin': MapPinIcon,
  tag: TagIcon,
  star: StarIcon,
  heart: HeartIcon
}

const iconComponent = computed(() => {
  return iconMap[props.name as keyof typeof iconMap] || DocumentIcon
})

const iconClasses = computed(() => {
  const baseClasses = ['flex-shrink-0']
  const sizeClass = typeof props.size === 'number' ? `w-${props.size/4} h-${props.size/4}` : props.size
  const customClasses = props.class ? props.class.split(' ') : []
  
  return [...baseClasses, sizeClass, ...customClasses].join(' ')
})
</script>