import React from 'react'
import PetManagementTable from '@/components/pet/PetManagementTable'

const AdminPetListPage: React.FC = () => {
  return (
    <PetManagementTable
      basePath="/admin/pets"
      title="Pet Management"
      subtitle="Comprehensive view of all customer pets registered in the PetCare system."
    />
  )
}

export default AdminPetListPage
