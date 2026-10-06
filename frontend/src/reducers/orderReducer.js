// ============================================================
// orderReducer.js
// Pure reducer function for the orders list.
// ============================================================

export function orderReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE_ORDERS':
      return action.payload

    case 'CREATE_ORDER':
      return [action.payload, ...state]

    case 'UPDATE_ORDER_STATUS': {
      const { orderId, status } = action.payload
      return state.map((o) =>
        o.id === orderId
          ? { ...o, status, payment: status === 'Cancelled' ? 'Failed' : o.payment }
          : o
      )
    }

    case 'CANCEL_ORDER':
      return state.map((o) =>
        o.id === action.payload.orderId ? { ...o, status: 'Cancelled', payment: 'Failed' } : o
      )

    default:
      return state
  }
}
