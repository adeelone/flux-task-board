import type { TeamMember } from '../types'

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({ member, size = 24 }: { member: TeamMember; size?: number }) {
  return (
    <div
      title={member.name}
      className="flex items-center justify-center rounded-full font-semibold text-white ring-2 ring-white shrink-0"
      style={{ backgroundColor: member.color, width: size, height: size, fontSize: size * 0.4 }}
    >
      {initials(member.name)}
    </div>
  )
}

export function AvatarStack({ members, max = 3 }: { members: TeamMember[]; max?: number }) {
  if (members.length === 0) return null
  const shown = members.slice(0, max)
  const rest = members.length - shown.length
  return (
    <div className="flex items-center -space-x-1.5">
      {shown.map((m) => (
        <Avatar key={m.id} member={m} size={22} />
      ))}
      {rest > 0 && (
        <div
          className="flex items-center justify-center rounded-full bg-[var(--color-ink-faint)] text-white ring-2 ring-white shrink-0"
          style={{ width: 22, height: 22, fontSize: 9 }}
        >
          +{rest}
        </div>
      )}
    </div>
  )
}
