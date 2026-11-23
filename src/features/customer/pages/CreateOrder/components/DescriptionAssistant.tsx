import { useEffect, useRef, useState } from 'react'
import { Alert, Button, Checkbox, Input, Modal, Space } from 'antd'
import { ApiError, apiRequest } from '../../../../../shared/api/httpClient'
import type { CustomerQuoteSelection } from '../../../../../shared/api/checklistPricingApi'
import type { FormState, UpdateField } from '../../../lib/createOrder/types'

type Question = { questionId: string; questionText: string; options: string[]; required: boolean }
type Output = { status: string; followUpQuestions: Question[]; orderDescription: string; flightPurposeDraft: string; warnings: string[] }
type Session = { id: string; revision: number; status: string; state: { output: Output; answers: Record<string,string> } }
const base = '/api/customer/description-assistant'

async function assistantRequest<T>(path:string, options:Parameters<typeof apiRequest<T>>[1]={}):Promise<T> {
  const controller=new AbortController()
  const timer=window.setTimeout(()=>controller.abort(),60_000)
  const abort=()=>controller.abort()
  options.signal?.addEventListener('abort',abort,{once:true})
  try {
    return await Promise.race([
      apiRequest<T>(path,{...options,signal:controller.signal}),
      new Promise<never>((_,reject)=>controller.signal.addEventListener('abort',()=>reject(new Error('DESCRIPTION_TIMEOUT')),{once:true})),
    ])
  } finally {window.clearTimeout(timer);options.signal?.removeEventListener('abort',abort)}
}

export function DescriptionAssistant({ form, update, selection }: {
  form: FormState; update: UpdateField; selection?: CustomerQuoteSelection | null
}) {
  const [open,setOpen] = useState(false)
  const [session,setSession] = useState<Session>()
  const [answers,setAnswers] = useState<Record<string,string>>({})
  const [description,setDescription] = useState('')
  const [purpose,setPurpose] = useState('')
  const [confirmDescription,setConfirmDescription] = useState(false)
  const [confirmPurpose,setConfirmPurpose] = useState(false)
  const [busy,setBusy] = useState(false)
  const [error,setError] = useState('')
  const [mode,setMode] = useState<'GENERATE'|'REWRITE'>('GENERATE')
  const [source,setSource] = useState('')
  const pending=useRef<AbortController|null>(null)
  useEffect(()=>()=>pending.current?.abort(),[])
  function close() {pending.current?.abort();setBusy(false);setOpen(false)}
  const contextKey = JSON.stringify([form.serviceId, form.flightPurpose, form.address, selection?.items ?? []])
  const saved = form.descriptionAssistant
  const stale = Boolean(saved && (saved.status === 'STALE' || (selection && saved.contextKey !== contextKey) || (saved.status === 'CUSTOMER_CONFIRMED' && saved.description !== form.description)))
  function receive(value: Session) {
    setSource(JSON.stringify([form.description,contextKey]))
    setSession(value);setAnswers(value.state.answers ?? {})
    setDescription(value.state.output.orderDescription);setPurpose(value.state.output.flightPurposeDraft)
    setConfirmDescription(false);setConfirmPurpose(false)
    if(value.status!=='CUSTOMER_CONFIRMED') {
      if(saved?.status==='CUSTOMER_CONFIRMED' && !stale) update('descriptionAssistantPendingId',value.id)
      else update('descriptionAssistant',{id:value.id,revision:value.revision,status:value.status,description:value.state.output.orderDescription,
          purpose:value.state.output.flightPurposeDraft,contextKey})
    }
  }
  async function run(nextMode=mode,skipQuestions=false,only?:'description'|'purpose') {
    if (busy) return
    setBusy(true);setError('');setMode(nextMode)
    const controller=new AbortController();pending.current=controller
    try {
      const candidate=session?.id ?? (!stale?saved?.id:undefined)
      const id=saved?.status==='CUSTOMER_CONFIRMED' && candidate===saved.id ? undefined : candidate
      const revision=id ? (session?.revision ?? saved?.revision ?? 0) : 0
      const value=await assistantRequest<Session>(base+'/generate',{signal:controller.signal,method:'POST',body:{sessionId:id,revision,
        serviceId:form.serviceId,description:form.description,mode:nextMode,answers,skipQuestions,selection:selection ?? undefined,
        address:form.address,flightPurpose:form.flightPurpose || undefined}})
      if(controller.signal.aborted)return
      receive(value)
      if(only==='description') setPurpose(purpose)
      if(only==='purpose') setDescription(description)
    } catch (cause) {if(!controller.signal.aborted)setError(cause instanceof ApiError && cause.status===409
      ? 'Bản nháp đã thay đổi ở phiên khác. Hãy tải bản mới trước khi tiếp tục.'
      : 'AI chưa tạo được nội dung hợp lệ. Hãy thử tạo lại hoặc tiếp tục nhập thủ công.')}
    finally {if(pending.current===controller)setBusy(false)}
  }
  async function start(nextMode:'GENERATE'|'REWRITE') {
    setOpen(true);setMode(nextMode);setError('')
    if(nextMode==='GENERATE' && !stale && (form.descriptionAssistantPendingId || saved)) {
      setBusy(true)
      const controller=new AbortController();pending.current=controller
      try {
        const value=await assistantRequest<Session>(base+'/'+(form.descriptionAssistantPendingId ?? saved!.id),{signal:controller.signal})
        if(!controller.signal.aborted)receive(value)
      } catch {if(!controller.signal.aborted)setError('Không tải được phiên. Nội dung thủ công vẫn được giữ nguyên.')}
      finally {if(pending.current===controller)setBusy(false)}
    } else {setSession(undefined);await run(nextMode)}
  }
  async function apply() {
    if(!session || !confirmDescription || !confirmPurpose || busy) return
    if(source !== JSON.stringify([form.description,contextKey])) {
      setError('Yêu cầu đã thay đổi trong khi soạn. Hãy tạo lại bản nháp để kiểm tra nội dung mới.')
      return
    }
    setBusy(true);setError('')
    try {
      const value=await assistantRequest<Session>(`${base}/${session.id}/confirm`,{method:'POST',body:{revision:session.revision,orderDescription:description,flightPurposeDraft:purpose}})
      update('descriptionAssistant',{id:value.id,revision:value.revision,status:value.status,
        description:value.state.output.orderDescription,purpose:value.state.output.flightPurposeDraft,contextKey})
      update('descriptionAssistantPendingId',undefined)
      setOpen(false)
    } catch {setError('Chưa thể áp dụng. Hãy tải bản mới để tránh ghi đè nội dung đã thay đổi.')}
    finally {setBusy(false)}
  }
  const output=session?.state.output
  return <>
    <Space wrap style={{marginTop:8}}>
      <Button disabled={!form.serviceId || selection===null || busy} onClick={()=>void start('GENERATE')}>AI viết giúp tôi</Button>
      <Button disabled={!form.description.trim() || !form.serviceId || selection===null || busy} onClick={()=>void start('REWRITE')}>Viết chuyên nghiệp hơn</Button>
    </Space>
    {stale && <Alert type="warning" message="Lựa chọn đã thay đổi. Hãy kiểm tra và xác nhận lại mô tả cùng mục đích bay." style={{marginTop:8}} />}
    <Modal title="Trợ lý viết mô tả" open={open} onCancel={close} footer={null} width={680} destroyOnHidden>
      <div style={{display:'grid',gap:14}}>
        {error && <Alert type="warning" message={error} action={<Button disabled={busy} onClick={()=>void run(mode,true)}>Tạo lại bản nháp</Button>} />}
        {busy && <span role="status">Đang chuẩn bị bản nháp…</span>}
        {output?.followUpQuestions.map(q=><label key={q.questionId}>
          <strong>{q.questionText}{!q.required && ' (có thể bỏ qua)'}</strong>
          <Space wrap style={{marginBlock:8}}>{q.options.map(o=><Button key={o} onClick={()=>setAnswers(a=>({...a,[q.questionId]:o}))}>{o}</Button>)}</Space>
          <Input maxLength={1000} value={answers[q.questionId]??''} onChange={e=>setAnswers(a=>({...a,[q.questionId]:e.target.value}))} placeholder="Câu trả lời của bạn" />
        </label>)}
        {output?.status==='COLLECTING_INFORMATION' && Boolean(output.followUpQuestions.length) && <Space wrap>
          <Button type="primary" loading={busy} onClick={()=>void run()}>Tiếp tục</Button>
          <Button disabled={busy} onClick={()=>void run(mode,true)}>Tạo từ thông tin hiện có</Button>
        </Space>}
        {output?.status==='READY_FOR_PREVIEW' && <>
          <details><summary>Mô tả đang có</summary><p>{form.description || 'Chưa nhập mô tả'}</p></details>
          <label><strong>Mô tả chi tiết yêu cầu giám sát</strong><Input.TextArea aria-label="Bản nháp mô tả" rows={4} maxLength={2000} value={description} onChange={e=>{setDescription(e.target.value);setConfirmDescription(false)}} /></label>
          <Checkbox checked={confirmDescription} onChange={e=>setConfirmDescription(e.target.checked)}>Tôi xác nhận mô tả yêu cầu</Checkbox>
          <label><strong>Mục đích hoạt động bay — Bản nháp</strong><Input.TextArea aria-label="Bản nháp mục đích bay" rows={3} maxLength={1500} value={purpose} onChange={e=>{setPurpose(e.target.value);setConfirmPurpose(false)}} /></label>
          <small>Nhân viên sẽ kiểm tra nội dung này khi chuẩn bị hồ sơ xin phép.</small>
          <Checkbox checked={confirmPurpose} onChange={e=>setConfirmPurpose(e.target.checked)}>Tôi xác nhận mục đích hoạt động bay</Checkbox>
          <Space wrap>
            <Button onClick={()=>void navigator.clipboard.writeText(description)}>Sao chép mô tả</Button>
            <Button onClick={()=>void navigator.clipboard.writeText(purpose)}>Sao chép mục đích bay</Button>
            <Button disabled={busy} onClick={()=>void run(mode,true,'description')}>Viết lại mô tả</Button>
            <Button disabled={busy} onClick={()=>void run(mode,true,'purpose')}>Viết lại mục đích bay</Button>
          </Space>
          <Button type="primary" loading={busy} disabled={!confirmDescription || !confirmPurpose || !description.trim() || !purpose.trim()} onClick={()=>void apply()}>Áp dụng vào yêu cầu</Button>
        </>}
        <Button onClick={close}>Giữ nguyên và tiếp tục nhập thủ công</Button>
      </div>
    </Modal>
  </>
}
