import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import OrderDetailView from '../../components/shared/OrderDetailView'
import { useOrders } from '../../hooks/useOrders'
import { useAuth } from '../../hooks/useAuth'

export default function CustomerOrderDetail() {
  const { orderId } = useParams()
  const { user } = useAuth()
  const { orders, cancelOrder } = useOrders()
  const found = orders.find((o) => o.id === orderId)
  // A customer may only view their OWN order - manually entering another
  // customer's order ID must behave the same as "order not found", not
  // leak someone else's items/address/payment info.
  const order = found && found.customerId === user.id ? found : undefined

  return (
    <DashboardLayout role="customer">
      <OrderDetailView order={order} role="customer" backTo="/customer/orders" onCancelOrder={cancelOrder} />
    </DashboardLayout>
  )
}
