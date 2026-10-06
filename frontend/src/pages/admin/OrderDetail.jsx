import { useParams } from 'react-router-dom'
import DashboardLayout from '../../components/layout/DashboardLayout'
import OrderDetailView from '../../components/shared/OrderDetailView'
import { useOrders } from '../../hooks/useOrders'

export default function AdminOrderDetail() {
  const { orderId } = useParams()
  const { orders, updateStatus, cancelOrder } = useOrders()
  const order = orders.find((o) => o.id === orderId)

  return (
    <DashboardLayout role="admin">
      <OrderDetailView order={order} role="admin" backTo="/admin/orders" onUpdateStatus={updateStatus} onCancelOrder={cancelOrder} />
    </DashboardLayout>
  )
}
