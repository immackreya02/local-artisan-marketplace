// Deterministic soft-color placeholder used wherever the Figma PDF shows a photo.
// Keeps layout fidelity without fabricating stock imagery.
const PALETTES = [
  ['#E7D9C6', '#C1673B'], ['#DCE3D6', '#3F6B52'], ['#EAD9DE', '#A6532C'],
  ['#DDE6EC', '#4B6C8A'], ['#EDE3CF', '#8A6A3F'], ['#E3DCE9', '#6B4B8A'],
]

function hashStr(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

const ROUNDED_CLASS = {
  rounded: 'swatch-rounded',
  'rounded-lg': 'swatch-rounded-lg',
  'rounded-full': 'swatch-rounded-full',
  'rounded-none': 'swatch-rounded-none',
  square: 'swatch-square',
}

export default function Swatch({ seed = 'x', className = '', rounded = 'rounded', icon: Icon, style = {} }) {
  const [bg, fg] = PALETTES[hashStr(seed) % PALETTES.length]
  const roundedClass = ROUNDED_CLASS[rounded] || 'swatch-rounded'
  return (
    <div
      className={`swatch ${roundedClass} ${className}`}
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}CC)`, ...style }}
    >
      {Icon && <Icon size={28} style={{ color: fg }} strokeWidth={1.5} />}
    </div>
  )
}
