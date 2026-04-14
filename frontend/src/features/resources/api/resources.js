export const resourceTypeOptions = [
  { value: '', label: 'All types' },
  { value: 'LECTURE_HALL', label: 'Lecture hall' },
  { value: 'LAB', label: 'Lab' },
  { value: 'MEETING_ROOM', label: 'Meeting room' },
  { value: 'EQUIPMENT', label: 'Equipment' },
]

export const resourceStatusOptions = [
  { value: '', label: 'Any status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OUT_OF_SERVICE', label: 'Out of service' },
]

export function formatResourceType(type) {
  return type
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

