import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import CustomRequestDetailView from '../../components/shared/CustomRequestDetailView'
import { useCustomRequests } from '../../hooks/useCustomRequests'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'

export default function ArtisanCustomRequestDetail() {
  const { requestId } = useParams()
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const shop = getShopByOwnerId(user.id)
  const { requests, updateRequestStatus } = useCustomRequests()
  const found = requests.find((r) => r.id === requestId)
  // Only the artisan who owns the target shop may view/manage the request.
  const request = found && shop && found.shopId === shop.id ? found : undefined

  return (
    <DashboardLayout role="artisan">
      <CustomRequestDetailView request={request} role="artisan" backTo="/artisan/custom-requests" onUpdateStatus={updateRequestStatus} />
    </DashboardLayout>
  )
}
