import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import CustomRequestDetailView from '../../components/shared/CustomRequestDetailView'
import { useCustomRequests } from '../../hooks/useCustomRequests'
import { useAuth } from '../../hooks/useAuth'

export default function CustomerCustomRequestDetail() {
  const { requestId } = useParams()
  const { user } = useAuth()
  const { requests } = useCustomRequests()
  const found = requests.find((r) => r.id === requestId)
  // Only the customer who created the request may view it.
  const request = found && found.customerId === user.id ? found : undefined

  return (
    <DashboardLayout role="customer">
      <CustomRequestDetailView request={request} role="customer" backTo="/customer/custom-requests" />
    </DashboardLayout>
  )
}
