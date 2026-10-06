// Reusable Button component.
// Demonstrates: props (variant/size/children), conditional class names.
export default function Button({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  const variantClass = `btn-${variant}`
  const sizeClass = `btn-${size}`

  return (
    <button className={`btn ${sizeClass} ${variantClass} ${className}`} {...props}>
      {children}
    </button>
  )
}
