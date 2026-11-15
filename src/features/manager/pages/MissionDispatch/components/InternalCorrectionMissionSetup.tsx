import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { financeApi } from '../../../../finance/api'
import { FlightPermitCard } from '../../../components/common/FlightPermitCard'
import { LiveDispatchPage } from '../../../components/common/LiveDispatchPage'
import { Button, EmptyState } from '../../../../../shared/components/ui'
import type { MissionResponse } from '../../../types/missions'
import { missionScopedAssignmentMessages } from './MissionScopedAssignment.messages'
export function InternalCorrectionMissionSetup({mission,onChanged}:{mission:MissionResponse;onChanged:()=>void}) {
 const {t}=useI18n(missionScopedAssignmentMessages)
 const invoice=useApiQuery(signal=>financeApi.getInvoice(mission.orderId,signal),[mission.orderId])
 if(mission.status==='PLANNING')return <LiveDispatchPage missionId={mission.id}/>
 if(invoice.loading)return <p role="status">{t.loading}</p>
 if(invoice.error||!invoice.data)return <EmptyState title={t.loadError} action={<Button onClick={invoice.reload}>{t.retry}</Button>}/>
 const paid=!['CANCELLED','REFUNDED','OVERDUE'].includes(invoice.data.status)&&(!invoice.data.contractRequired||Boolean(invoice.data.contractConfirmedAt))&&(invoice.data.depositStatus==='DEPOSIT_PAID'||invoice.data.paidAmount>=invoice.data.depositAmount)
 return <FlightPermitCard mission={mission} onChanged={onChanged} depositPaid={paid} readOnly={['COMPLETED','FAILED','CANCELLED'].includes(mission.status)} refundEligible={false}/>
}
