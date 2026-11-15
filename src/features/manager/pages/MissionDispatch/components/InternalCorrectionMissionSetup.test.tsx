import {render,screen} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {financeApi} from '../../../../finance/api'
import {InternalCorrectionMissionSetup} from './InternalCorrectionMissionSetup'
vi.mock('../../../components/common/FlightPermitCard',()=>({FlightPermitCard:({depositPaid}:{depositPaid:boolean})=><div>{depositPaid?'Permit actions available':'Permit payment gate closed'}</div>}))
vi.mock('../../../components/common/LiveDispatchPage',()=>({LiveDispatchPage:()=><div>Existing resource wizard</div>}))
afterEach(()=>vi.restoreAllMocks())
it('opens the existing permit workflow after internal mission planning, using the real invoice contract',async()=>{vi.spyOn(financeApi,'getInvoice').mockResolvedValue({status:'ISSUED',depositStatus:'DEPOSIT_PAID',paidAmount:300,depositAmount:300,contractRequired:true,contractConfirmedAt:'2026-11-14T00:00:00Z'} as never);render(<InternalCorrectionMissionSetup mission={{id:'child',orderId:'order',status:'PENDING_CONFIRMATION'} as never} onChanged={()=>{}}/>);expect(await screen.findByText('Permit actions available')).toBeInTheDocument()})
it('does not invent a paid deposit when the contract is unconfirmed',async()=>{vi.spyOn(financeApi,'getInvoice').mockResolvedValue({status:'ISSUED',depositStatus:'DEPOSIT_PAID',paidAmount:300,depositAmount:300,contractRequired:true,contractConfirmedAt:null} as never);render(<InternalCorrectionMissionSetup mission={{id:'child',orderId:'order',status:'PENDING_CONFIRMATION'} as never} onChanged={()=>{}}/>);expect(await screen.findByText('Permit payment gate closed')).toBeInTheDocument()})
