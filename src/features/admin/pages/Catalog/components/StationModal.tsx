import { Alert, Form, Input, Modal } from 'antd'
import { useState } from 'react'

import { mgrPopupContainer } from '../../../../../shared/components/antd'
import { useI18n } from '../../../../../shared/i18n'
import { adminApi } from '../../../api/adminApi'
import { AdminFormFooter } from '../../../components/common/AdminFormFooter'
import { onFormSubmit } from '../../../components/common/formSubmit'
import { readApiError } from '../../../lib/catalogMappers'
import type { AdminStation } from '../../../types/catalog'
import { stationModalMessages } from './StationModal.messages'

type Props = {
  station?: AdminStation
  onClose: () => void
  onSaved: () => void
}

export function StationModal({ station, onClose, onSaved }: Props) {
  const { t } = useI18n(stationModalMessages)
  const [code, setCode] = useState(station?.code ?? '')
  const [name, setName] = useState(station?.name ?? '')
  const [address, setAddress] = useState(station?.address ?? '')
  const [lat, setLat] = useState(String(station?.lat ?? 0))
  const [lon, setLon] = useState(String(station?.lon ?? 0))
  const [radius, setRadius] = useState(String(station?.maxServiceRadiusM ?? 5000))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit() {
    const next: Record<string, string> = {}
    if (!station && !code.trim()) next.code = t.required
    if (!name.trim()) next.name = t.required
    setErrors(next)
    if (Object.keys(next).length > 0) return
    setBusy(true)
    setSubmitError(null)
    const fields = {
      name: name.trim(),
      address,
      lat: Number(lat),
      lon: Number(lon),
      maxServiceRadiusM: Number(radius),
    }
    try {
      if (station) await adminApi.updateStation(station.id, fields)
      else await adminApi.createStation({ code: code.trim(), ...fields })
      onSaved()
    } catch (err) {
      const parsed = readApiError(err, t.genericError)
      setErrors(parsed.fields)
      setSubmitError(parsed.message)
    } finally {
      setBusy(false)
    }
  }

  const status = (key: string) => (errors[key] ? 'error' : undefined)

  return (
    <Modal
      open
      centered
      getContainer={mgrPopupContainer}
      width={560}
      title={station ? t.editTitle : t.createTitle}
      onCancel={onClose}
      footer={<AdminFormFooter formId="adm-station-form" busy={busy} onClose={onClose} />}
    >
      <p className="mgr-modal-sub">{t.subtitle}</p>
      <Form
        id="adm-station-form"
        layout="vertical"
        onSubmitCapture={onFormSubmit(handleSubmit)}
        noValidate
      >
        {!station && (
          <Form.Item label={t.code} required htmlFor="adm-st-code" validateStatus={status('code')} help={errors.code}>
            <Input id="adm-st-code" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </Form.Item>
        )}
        <Form.Item label={t.name} required htmlFor="adm-st-name" validateStatus={status('name')} help={errors.name}>
          <Input id="adm-st-name" value={name} onChange={(e) => setName(e.target.value)} />
        </Form.Item>
        <Form.Item label={t.address} htmlFor="adm-st-addr">
          <Input id="adm-st-addr" value={address} onChange={(e) => setAddress(e.target.value)} />
        </Form.Item>
        <div className="adm-form-pair">
          <Form.Item label={t.lat} htmlFor="adm-st-lat">
            <Input id="adm-st-lat" type="number" step="0.0001" value={lat} onChange={(e) => setLat(e.target.value)} />
          </Form.Item>
          <Form.Item label={t.lon} htmlFor="adm-st-lon">
            <Input id="adm-st-lon" type="number" step="0.0001" value={lon} onChange={(e) => setLon(e.target.value)} />
          </Form.Item>
        </div>
        <Form.Item label={t.radius} htmlFor="adm-st-radius">
          <Input id="adm-st-radius" type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
        </Form.Item>
        {submitError && <Alert type="error" showIcon role="alert" message={submitError} />}
      </Form>
    </Modal>
  )
}
