import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import DataTable from '../DataTable.vue'

// Mock all the atomic components
vi.mock('@/components/atoms', () => ({
  Badge: {
    name: 'Badge',
    props: ['variant'],
    template: '<span data-testid="badge" :data-variant="variant"><slot /></span>'
  },
  Button: {
    name: 'Button',
    props: ['variant', 'size', 'icon', 'disabled'],
    template: '<button data-testid="button" :data-variant="variant" :data-size="size" :data-icon="icon" :disabled="disabled" @click="$emit(\'click\')"><slot /></button>'
  },
  Checkbox: {
    name: 'Checkbox',
    props: ['modelValue', 'indeterminate'],
    template: '<input data-testid="checkbox" type="checkbox" :checked="modelValue" :indeterminate="indeterminate" @change="$emit(\'update:modelValue\', $event.target.checked)" />'
  },
  Icon: {
    name: 'Icon',
    props: ['name', 'class'],
    template: '<span data-testid="icon" :data-name="name" :class="$props.class"></span>'
  },
  LoadingSpinner: {
    name: 'LoadingSpinner',
    props: ['size'],
    template: '<div data-testid="loading-spinner" :data-size="size"></div>'
  },
  Select: {
    name: 'Select',
    props: ['id', 'modelValue', 'options', 'size'],
    template: '<select data-testid="select" :id="id" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value); $emit(\'change\')"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>'
  }
}))

const mockColumns = [
  { key: 'id', label: 'ID', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: false },
  { key: 'status', label: 'Status', sortable: true }
]

const mockData = [
  { id: 1, name: 'John Doe', email: 'john@example.com', status: 'active' },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'inactive' },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'active' }
]

const mockActions = [
  { key: 'add', label: 'Add Item', icon: 'plus', variant: 'primary' as const },
  { key: 'export', label: 'Export', icon: 'download', variant: 'secondary' as const }
]

const mockRowActions = [
  { key: 'edit', label: 'Edit', icon: 'pencil', variant: 'ghost' as const },
  { key: 'delete', label: 'Delete', icon: 'trash', variant: 'danger' as const }
]

const mockFilters = [
  { 
    key: 'status', 
    label: 'Status', 
    options: [
      { value: '', label: 'All' },
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  }
]

describe('DataTable Component', () => {
  it('renders with basic props', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns
      }
    })

    expect(wrapper.text()).toContain('Test Table')
    expect(wrapper.find('table').exists()).toBe(true)
  })

  it('renders table headers correctly', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns
      }
    })

    const headers = wrapper.findAll('th')
    expect(headers).toHaveLength(4) // 4 columns
    expect(headers[0].text()).toContain('ID')
    expect(headers[1].text()).toContain('Name')
    expect(headers[2].text()).toContain('Email')
    expect(headers[3].text()).toContain('Status')
  })

  it('renders table data correctly', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns
      }
    })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(3)
    
    // Check first row data
    const firstRowCells = rows[0].findAll('td')
    expect(firstRowCells[0].text()).toBe('1')
    expect(firstRowCells[1].text()).toBe('John Doe')
    expect(firstRowCells[2].text()).toBe('john@example.com')
    expect(firstRowCells[3].text()).toBe('active')
  })

  it('displays total count badge', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        totalCount: 3
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toBe('3 items')
  })

  it('displays singular item count correctly', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: [mockData[0]],
        columns: mockColumns,
        totalCount: 1
      }
    })

    const badge = wrapper.find('[data-testid="badge"]')
    expect(badge.text()).toBe('1 item')
  })

  it('renders table actions', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        tableActions: mockActions
      }
    })

    const actionButtons = wrapper.findAll('[data-testid="button"]')
    expect(actionButtons.length).toBeGreaterThanOrEqual(2)
    expect(actionButtons[0].text()).toBe('Add Item')
    expect(actionButtons[1].text()).toBe('Export')
  })

  it('renders row actions', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        rowActions: mockRowActions
      }
    })

    // Should have Actions header
    const headers = wrapper.findAll('th')
    expect(headers[headers.length - 1].text()).toBe('Actions')

    // Each row should have action buttons
    const rows = wrapper.findAll('tbody tr')
    rows.forEach(row => {
      const actionButtons = row.findAll('[data-testid="button"]')
      expect(actionButtons).toHaveLength(2)
    })
  })

  it('handles selectable rows', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        selectable: true
      }
    })

    // Should have select all checkbox in header
    const headerCheckbox = wrapper.find('thead [data-testid="checkbox"]')
    expect(headerCheckbox.exists()).toBe(true)

    // Should have checkbox in each row
    const rowCheckboxes = wrapper.findAll('tbody [data-testid="checkbox"]')
    expect(rowCheckboxes).toHaveLength(3)
  })

  it('handles sortable columns', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        sortField: 'name',
        sortOrder: 'asc' as const
      }
    })

    // Find sortable header (Name column)
    const nameHeader = wrapper.findAll('th')[1]
    expect(nameHeader.classes()).toContain('cursor-pointer')

    // Click to sort
    await nameHeader.trigger('click')

    expect(wrapper.emitted('sort')).toBeTruthy()
    expect(wrapper.emitted('sort')![0]).toEqual(['name', 'desc'])
  })

  it('displays loading state', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: [],
        columns: mockColumns,
        loading: true
      }
    })

    const loadingSpinner = wrapper.find('[data-testid="loading-spinner"]')
    expect(loadingSpinner.exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading...')
  })

  it('displays empty state', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: [],
        columns: mockColumns,
        loading: false,
        emptyTitle: 'No data found',
        emptyDescription: 'Try adding some items.'
      }
    })

    expect(wrapper.text()).toContain('No data found')
    expect(wrapper.text()).toContain('Try adding some items.')
    expect(wrapper.find('[data-testid="icon"][data-name="inbox"]').exists()).toBe(true)
  })

  it('displays empty action button', async () => {
    const emptyAction = { key: 'add-first', label: 'Add First Item' }
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: [],
        columns: mockColumns,
        loading: false,
        emptyAction
      }
    })

    const emptyActionButton = wrapper.find('[data-testid="button"]')
    expect(emptyActionButton.exists()).toBe(true)
    expect(emptyActionButton.text()).toBe('Add First Item')

    await emptyActionButton.trigger('click')
    expect(wrapper.emitted('table-action')).toBeTruthy()
    expect(wrapper.emitted('table-action')![0]).toEqual(['add-first'])
  })

  it('handles pagination', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        pagination: true,
        currentPage: 2,
        totalPages: 5,
        totalCount: 100,
        pageSize: 20
      }
    })

    // Should show pagination info
    expect(wrapper.text()).toContain('Showing 21 to 40 of 100 results')

    // Should have pagination buttons
    const paginationButtons = wrapper.findAll('[data-testid="button"]')
    const prevButton = paginationButtons.find(btn => btn.text() === 'Previous')
    const nextButton = paginationButtons.find(btn => btn.text() === 'Next')
    
    expect(prevButton?.exists()).toBe(true)
    expect(nextButton?.exists()).toBe(true)
  })

  it('handles page navigation', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        pagination: true,
        currentPage: 2,
        totalPages: 5
      }
    })

    const nextButton = wrapper.findAll('[data-testid="button"]').find(btn => btn.text() === 'Next')
    await nextButton?.trigger('click')

    expect(wrapper.emitted('page-change')).toBeTruthy()
    expect(wrapper.emitted('page-change')![0]).toEqual([3])
  })

  it('handles filters', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        filters: mockFilters
      }
    })

    const filterSelect = wrapper.find('[data-testid="select"]')
    expect(filterSelect.exists()).toBe(true)

    // Simulate filter change
    await filterSelect.setValue('active')
    await filterSelect.trigger('change')

    expect(wrapper.emitted('filter-change')).toBeTruthy()
  })

  it('handles row selection', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        selectable: true
      }
    })

    // Select first row
    const firstRowCheckbox = wrapper.findAll('tbody [data-testid="checkbox"]')[0]
    await firstRowCheckbox.trigger('change')

    expect(wrapper.emitted('selection-change')).toBeTruthy()
    expect(wrapper.emitted('selection-change')![0][0]).toEqual(['1'])
  })

  it('handles select all functionality', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        selectable: true
      }
    })

    // Select all rows
    const selectAllCheckbox = wrapper.find('thead [data-testid="checkbox"]')
    await selectAllCheckbox.trigger('change')

    expect(wrapper.emitted('selection-change')).toBeTruthy()
    expect(wrapper.emitted('selection-change')![0][0]).toEqual(['1', '2', '3'])
  })

  it('displays bulk actions when rows are selected', async () => {
    const bulkActions = [
      { key: 'bulk-delete', label: 'Delete Selected', variant: 'danger' as const }
    ]

    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        selectable: true,
        bulkActions
      }
    })

    // Initially no bulk actions visible
    expect(wrapper.text()).not.toContain('Delete Selected')

    // Select a row
    const firstRowCheckbox = wrapper.findAll('tbody [data-testid="checkbox"]')[0]
    await firstRowCheckbox.trigger('change')
    await wrapper.vm.$nextTick()

    // Now bulk actions should be visible
    expect(wrapper.text()).toContain('1 selected')
    expect(wrapper.text()).toContain('Delete Selected')
  })

  it('handles table actions', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        tableActions: [{ key: 'add', label: 'Add Item' }]
      }
    })

    const addButton = wrapper.find('[data-testid="button"]')
    await addButton.trigger('click')

    expect(wrapper.emitted('table-action')).toBeTruthy()
    expect(wrapper.emitted('table-action')![0]).toEqual(['add'])
  })

  it('handles row actions', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        rowActions: [{ key: 'edit', label: 'Edit' }]
      }
    })

    // Find first row's edit button
    const firstRowActionButton = wrapper.findAll('tbody tr')[0].find('[data-testid="button"]')
    await firstRowActionButton.trigger('click')

    expect(wrapper.emitted('row-action')).toBeTruthy()
    expect(wrapper.emitted('row-action')![0]).toEqual(['edit', mockData[0]])
  })

  it('handles bulk actions', async () => {
    const bulkActions = [{ key: 'bulk-delete', label: 'Delete Selected' }]

    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        selectable: true,
        bulkActions
      }
    })

    // Select first row
    const firstRowCheckbox = wrapper.findAll('tbody [data-testid="checkbox"]')[0]
    await firstRowCheckbox.trigger('change')
    await wrapper.vm.$nextTick()

    // Click bulk action
    const bulkActionButton = wrapper.findAll('[data-testid="button"]').find(btn => btn.text() === 'Delete Selected')
    await bulkActionButton?.trigger('click')

    expect(wrapper.emitted('bulk-action')).toBeTruthy()
    expect(wrapper.emitted('bulk-action')![0]).toEqual(['bulk-delete', [mockData[0]]])
  })

  it('handles nested object values', () => {
    const nestedData = [
      { id: 1, user: { profile: { name: 'John Doe' } } }
    ]
    const nestedColumns = [
      { key: 'id', label: 'ID' },
      { key: 'user.profile.name', label: 'Name' }
    ]

    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: nestedData,
        columns: nestedColumns
      }
    })

    const cells = wrapper.findAll('tbody td')
    expect(cells[0].text()).toBe('1')
    expect(cells[1].text()).toBe('John Doe')
  })

  it('handles custom formatters', () => {
    const columnsWithFormatter = [
      { 
        key: 'id', 
        label: 'ID', 
        formatter: (value: number) => `#${value.toString().padStart(3, '0')}`
      }
    ]

    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: [{ id: 1 }],
        columns: columnsWithFormatter
      }
    })

    const cell = wrapper.find('tbody td')
    expect(cell.text()).toBe('#001')
  })

  it('handles custom row keys', () => {
    const dataWithCustomKey = [
      { uuid: 'abc-123', name: 'John' },
      { uuid: 'def-456', name: 'Jane' }
    ]

    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: dataWithCustomKey,
        columns: [{ key: 'name', label: 'Name' }],
        selectable: true,
        rowKey: 'uuid'
      }
    })

    // Select first row
    const firstRowCheckbox = wrapper.findAll('tbody [data-testid="checkbox"]')[0]
    firstRowCheckbox.trigger('change')

    expect(wrapper.emitted('selection-change')![0][0]).toEqual(['abc-123'])
  })

  it('calculates visible pages correctly', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        pagination: true,
        currentPage: 5,
        totalPages: 10
      }
    })

    // Should show pages 3, 4, 5, 6, 7 (current ± 2)
    const pageButtons = wrapper.findAll('[data-testid="button"]').filter(btn => 
      /^\d+$/.test(btn.text())
    )
    
    expect(pageButtons).toHaveLength(5)
    expect(pageButtons.map(btn => btn.text())).toEqual(['3', '4', '5', '6', '7'])
  })

  it('handles indeterminate selection state', async () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        selectable: true
      }
    })

    // Select only first row
    const firstRowCheckbox = wrapper.findAll('tbody [data-testid="checkbox"]')[0]
    await firstRowCheckbox.trigger('change')
    await wrapper.vm.$nextTick()

    // Header checkbox should be indeterminate
    const headerCheckbox = wrapper.find('thead [data-testid="checkbox"]')
    expect(headerCheckbox.attributes('indeterminate')).toBe('true')
  })

  it('displays correct pagination info', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        pagination: true,
        currentPage: 1,
        pageSize: 2,
        totalCount: 5
      }
    })

    expect(wrapper.text()).toContain('Showing 1 to 2 of 5 results')
  })

  it('handles empty data with no loading', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: [],
        columns: mockColumns,
        loading: false
      }
    })

    expect(wrapper.text()).toContain('No data available')
    expect(wrapper.text()).toContain('There are no items to display.')
  })

  it('does not show pagination when totalCount is 0', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: [],
        columns: mockColumns,
        pagination: true,
        totalCount: 0
      }
    })

    expect(wrapper.text()).not.toContain('Showing')
    expect(wrapper.text()).not.toContain('Previous')
    expect(wrapper.text()).not.toContain('Next')
  })

  it('handles disabled pagination buttons correctly', () => {
    const wrapper = mount(DataTable, {
      props: {
        title: 'Test Table',
        data: mockData,
        columns: mockColumns,
        pagination: true,
        currentPage: 1,
        totalPages: 5
      }
    })

    const prevButton = wrapper.findAll('[data-testid="button"]').find(btn => btn.text() === 'Previous')
    expect(prevButton?.attributes('disabled')).toBeDefined()

    const nextButton = wrapper.findAll('[data-testid="button"]').find(btn => btn.text() === 'Next')
    expect(nextButton?.attributes('disabled')).toBeUndefined()
  })
})