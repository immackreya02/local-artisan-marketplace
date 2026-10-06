import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import OrderDetailView from '../../components/shared/OrderDetailView'
import { useOrders } from '../../hooks/useOrders'
import { useAuth } from '../../hooks/useAuth'
import { useShops } from '../../hooks/useShops'

export default function ArtisanOrderDetail() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const { getShopByOwnerId } = useShops()
  const shop = getShopByOwnerId(user.id)
  const { orders, updateStatus, cancelOrder } = useOrders()
  const found = orders.find((o) => o.id === orderId)
  // An artisan may only view orders placed with THEIR OWN shop - manually
  // entering another shop's order ID must behave the same as "order not
  // found", not leak another artisan's customer/order details.
  const order = found && shop && found.shopId === shop.id ? found : undefined

  return (
    <DashboardLayout role="artisan">
      <OrderDetailView order={order} role="artisan" backTo="/artisan/orders" onUpdateStatus={updateStatus} onCancelOrder={cancelOrder} />
    </DashboardLayout>
  )
}
