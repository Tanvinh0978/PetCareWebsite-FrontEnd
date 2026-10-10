import React from 'react'
import PetManagementTable from '@/components/pet/PetManagementTable'

const StaffPetListPage: React.FC = () => {
  return (
    <PetManagementTable
      basePath="/staff/pets"
      title="Staff Pet Management"
      subtitle="Lookup pet records, health details, check-in status, and update care notes."
    />
  )
}

export default StaffPetListPage
