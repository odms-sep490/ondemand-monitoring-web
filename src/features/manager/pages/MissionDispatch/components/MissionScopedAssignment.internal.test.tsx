import {render,screen} from '@testing-library/react'
import {afterEach,expect,it,vi} from 'vitest'
import {financeApi} from '../../../../finance/api'
import {missionsApi} from '../../../api/missionsApi'
import {MissionScopedAssignmentPage} from './MissionScopedAssignment'
vi.mock('../../../components/common/LiveDispatchPage',()=>({LiveDispatchPage:({missionId}:{missionId:string})=><div>Assignment {missionId}</div>}))
vi.mock('../../MissionCreate/ReworkPlanningPage',()=>({ReworkPlanningPage:()=> <div>Customer rework workspace</div>}))
afterEach(()=>vi.restoreAllMocks())
it('routes an internal supplemental mission to the existing exact-mission assignment wizard',async()=>{
 vi.spyOn(missionsApi,'getMissionResponse').mockResolvedValue({id:'child',orderId:'order',status:'PLANNING',purpose:'REWORK',inspectionCorrectionId:'correction',inspectionSourceMissionId:'parent'} as never)
 vi.spyOn(financeApi,'getInvoice').mockResolvedValue({id:'invoice'} as never)
 render(<MissionScopedAssignmentPage missionId="child"/>);expect(await screen.findByText('Assignment child')).toBeInTheDocument();expect(screen.queryByText('Customer rework workspace')).not.toBeInTheDocument()
})
it('still fails closed for rework without either a customer case or internal origin',async()=>{
 vi.spyOn(missionsApi,'getMissionResponse').mockResolvedValue({id:'child',orderId:'order',status:'PLANNING',purpose:'REWORK'} as never)
 render(<MissionScopedAssignmentPage missionId="child"/>);expect(await screen.findByRole('alert')).toHaveTextContent('Không thể tải nhiệm vụ');expect(screen.queryByText('Assignment child')).not.toBeInTheDocument()
})
