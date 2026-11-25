import { useEffect, useState } from 'react'
import { Alert, Button, Input } from 'antd'
import { apiRequest } from '../../shared/api/httpClient'

type Purpose = { customerDraft?: string; customerConfirmedAt?: string; reviewedPurpose?: string; reviewedAt?: string; revision:number }
export function FlightPurposeDraftReview({missionId,canReview=true}:{missionId:string;canReview?:boolean}) {
  const [data,setData]=useState<Purpose>()
  const [text,setText]=useState('')
  const [error,setError]=useState('')
  const [busy,setBusy]=useState(false)
  const [reload,setReload]=useState(0)
  const path=`/api/missions/${encodeURIComponent(missionId)}/flight-purpose-draft`
  useEffect(()=>{
    const controller=new AbortController()
    apiRequest<Purpose>(path,{signal:controller.signal}).then(value=>{
      setData(value);setText(value.reviewedPurpose??value.customerDraft??'');setError('')
    }).catch(()=>{if(!controller.signal.aborted)setError('Không tải được bản nháp mục đích bay.')})
    return ()=>controller.abort()
  },[path,reload])
  async function confirm() {
    if(!data || busy || !text.trim())return
    setBusy(true);setError('')
    try {setData(await apiRequest<Purpose>(path,{method:'POST',body:{purpose:text,revision:data.revision}}))}
    catch {setError('Chưa lưu được. Hãy tải lại bản mới trước khi xác nhận.')}
    finally {setBusy(false)}
  }
  if(!data?.customerDraft && !data?.reviewedPurpose && !error) return null
  return <section style={{padding:16,border:'1px solid #dbe5f3',borderRadius:12,background:'#fff',marginBlock:12}}>
    <strong>Mục đích hoạt động bay — Nhân viên kiểm tra</strong>
    {error && <Alert type="warning" message={error} action={<Button onClick={()=>setReload(n=>n+1)}>Tải lại</Button>} />}
    {(data?.customerDraft || data?.reviewedPurpose) && <>
      <details><summary>Bản nháp khách hàng đã xác nhận</summary><p>{data.customerDraft}</p></details>
      <Input.TextArea aria-label="Mục đích bay nhân viên xác minh" rows={3} maxLength={1500} value={text} onChange={e=>setText(e.target.value)} readOnly={!canReview} />
      <small>Nội dung hỗ trợ chuẩn bị hồ sơ; việc xác nhận này không phê duyệt giấy phép bay.</small>
      {data.reviewedAt && <p>Đã được nhân viên xác minh: {new Date(data.reviewedAt).toLocaleString('vi-VN')}</p>}
      {canReview && <Button loading={busy} disabled={!text.trim()} onClick={()=>void confirm()}>Xác nhận nội dung mục đích bay</Button>}
    </>}
  </section>
}
