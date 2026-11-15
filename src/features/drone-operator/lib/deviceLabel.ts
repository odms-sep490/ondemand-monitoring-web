export function formatDeviceLabel(
  mission: {
    deviceId?: string | null
    deviceCode?: string | null
    droneCode?: string | null
    droneName?: string | null
  },
) {
  const code =
    mission.droneCode?.trim() ||
    mission.deviceCode?.trim() ||
    mission.deviceId?.trim() ||
    ''
  if (!code) return null

  const name = mission.droneName?.trim()
  return name && name !== code ? `${code} ${name}` : code
}

export function deviceRoleLabel(role?: string | null) {
  if (role === 'MAIN') return 'Thiết bị chính'
  if (role === 'SUPPORT') return 'Thiết bị hỗ trợ'
  if (role === 'BACKUP') return 'Thiết bị dự phòng'
  return 'Thiết bị được gán'
}
