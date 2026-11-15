import { useState } from 'react'
import { Modal } from 'antd'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { droneApi } from '../../../../staff/api/droneApi'
import { operatorApi } from '../../../../staff/api/operatorApi'
import { missionsApi } from '../../../api/missionsApi'
import type { MissionResponse } from '../../../types/missions'
import { ResourceReplacementForm } from '../../Missions/components/DetailPanel'
import { missionsPageMessages } from '../../Missions/MissionsPage.messages'

export type ReplacementTarget = { kind: 'DEVICE' | 'STAFF'; id: string; name: string }

export function MissionResourceReplacementDialog({ mission, target, onClose, onSaved }: {
  mission: MissionResponse; target: ReplacementTarget; onClose: () => void; onSaved: () => void
}) {
  const { t } = useI18n(missionsPageMessages)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const candidates = useApiQuery(async () => {
    if (target.kind === 'DEVICE') {
      const assigned = new Set((mission.deviceAssignments ?? []).map(a => a.deviceId))
      return (await droneApi.getAvailable(mission.id)).filter(d => !assigned.has(d.id)).map(d => ({ value: d.id, label: d.label }))
    }
    const assignments = (mission.staffAssignments ?? []).filter(assignment => assignment.isCurrent !== false)
    const replacedRoles = new Set(assignments
      .filter(assignment => assignment.staffId === target.id)
      .map(assignment => assignment.assignedRole))
    const assigned = new Set(assignments
      .filter(assignment => replacedRoles.has(assignment.assignedRole))
      .map(assignment => assignment.staffId))
    return (await operatorApi.getAvailable(mission.id))
      .filter(person => person.id !== target.id && !assigned.has(person.id))
      .map(person => ({ value: person.id, label: `${person.fullName} (${person.email})` }))
  }, [mission.id, target.kind, target.id])
  const title = target.kind === 'DEVICE' ? t.assignments.replaceDevice : t.assignments.replaceStaff
  async function save(values: { resourceId: string; reason: string }) {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (target.kind === 'DEVICE') await missionsApi.replaceDevice(mission.id, target.id, values.resourceId, values.reason.trim())
      else await missionsApi.replaceStaff(mission.id, target.id, values.resourceId, values.reason.trim())
      onSaved()
      onClose()
    } catch (e) { setError(e instanceof Error ? e.message : t.assignments.replacementError) }
    finally { setBusy(false) }
  }
  return <Modal title={`${title} · ${target.name}`} open onCancel={() => { if (!busy) onClose() }} footer={null} maskClosable={!busy} closable={!busy}>
    <ResourceReplacementForm title={mission.missionCode} t={t.assignments} options={candidates.data ?? []}
      loading={candidates.loading} busy={busy} error={error || (candidates.error ? t.assignments.replacementLoadError : '')}
      onCancel={onClose} onSubmit={values => void save(values)} />
  </Modal>
}
