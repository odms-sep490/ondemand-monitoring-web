import { useEffect, useRef, useState } from 'react'
import {
  CheckSquareOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { Button } from 'antd'
import { displayLocalized, useI18n } from '../../../../../shared/i18n'
import { adminHref } from '../../../routes'
import { servicesTableMessages } from './ServicesTable.messages'
import type { AdminService } from '../../../types/catalog'

export function ServiceRowActions({
  service,
  edit,
  remove,
}: {
  service: AdminService
  edit: () => void
  remove: () => void
}) {
  const { t } = useI18n(servicesTableMessages)
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const deleteButton = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    deleteButton.current?.focus()
    function outside(event: MouseEvent) {
      if (
        event.target instanceof Node &&
        !container.current?.contains(event.target)
      )
        setOpen(false)
    }
    document.addEventListener('mousedown', outside)
    return () => document.removeEventListener('mousedown', outside)
  }, [open])
  return (
    <div
      className="service-row-actions"
      ref={container}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          trigger.current?.focus()
        }
      }}
    >
      <Button
        size="small"
        href={adminHref({ screen: 'serviceChecklists', serviceId: service.id })}
        icon={<CheckSquareOutlined aria-hidden="true" aria-label={undefined} />}
      >
        Checklist
      </Button>
      <Button
        type="text"
        className="service-action-icon"
        aria-label={t.edit + ' ' + displayLocalized(service.name)}
        title={t.edit}
        icon={<EditOutlined aria-hidden="true" aria-label={undefined} />}
        onClick={edit}
      />
      <Button
        type="text"
        className="service-action-icon"
        ref={trigger}
        aria-label={t.more + ' ' + displayLocalized(service.name)}
        aria-expanded={open}
        title={t.more}
        icon={<MoreOutlined aria-hidden="true" aria-label={undefined} />}
        onClick={() => setOpen((value) => !value)}
      />
      {open && (
        <div
          className="service-action-disclosure"
          role="group"
          aria-label={t.more + ' ' + displayLocalized(service.name)}
        >
          <Button
            danger
            size="small"
            className="service-action-delete"
            ref={deleteButton}
            aria-label={t.remove + ' ' + displayLocalized(service.name)}
            icon={<DeleteOutlined aria-hidden="true" aria-label={undefined} />}
            onClick={() => {
              setOpen(false)
              remove()
            }}
          >
            {t.remove}
          </Button>
        </div>
      )}
    </div>
  )
}
