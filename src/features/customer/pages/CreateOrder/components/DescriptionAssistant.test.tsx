import { act, renderHook, render, screen, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DescriptionAssistant } from './DescriptionAssistant'
import { useCreateOrderForm } from '../hooks/useCreateOrderForm'
import { createDefaultForm, readStoredDraft, writeStoredDraft } from '../../../lib/createOrder/draftStorage'
import { apiRequest } from '../../../../../shared/api/httpClient'
vi.mock('../../../../../shared/api/httpClient',()=>({apiRequest:vi.fn()}))
afterEach(()=>{vi.clearAllMocks();localStorage.clear()})
const draft={id:'s',revision:2,status:'CUSTOMER_CONFIRMED',description:'Mô tả đã xác nhận',purpose:'Mục đích nháp',contextKey:'context'}
it('applies confirmed description atomically to the real form and restores through draft storage',()=>{
  const {result}=renderHook(()=>useCreateOrderForm(null))
  act(()=>result.current.update('description','Nội dung ban đầu'))
  act(()=>result.current.update('descriptionAssistant',{...draft,status:'READY_FOR_PREVIEW'}))
  expect(result.current.form.description).toBe('Nội dung ban đầu')
  act(()=>result.current.update('descriptionAssistant',draft))
  expect(result.current.form.description).toBe(draft.description)
  expect(result.current.form.descriptionAssistant?.purpose).toBe(draft.purpose)
  writeStoredDraft({step:1,form:result.current.form,mapPoint:{x:50,y:50}})
  expect(readStoredDraft()?.form?.descriptionAssistant).toEqual(draft)
})
it('keeps manual text until explicit confirmation and never calls order submission',async()=>{
  const output={status:'READY_FOR_PREVIEW',followUpQuestions:[],orderDescription:'Bản mô tả mới',flightPurposeDraft:'Bản mục đích bay',warnings:[]}
  vi.mocked(apiRequest).mockResolvedValueOnce({id:'s',revision:1,status:'READY_FOR_PREVIEW',state:{output,answers:{}}})
    .mockResolvedValueOnce({id:'s',revision:2,status:'CUSTOMER_CONFIRMED',state:{output,answers:{}}})
  const update=vi.fn()
  render(<DescriptionAssistant form={{...createDefaultForm(),serviceId:'real-service',description:'Mô tả cũ'}} update={update} />)
  fireEvent.click(screen.getByText('AI viết giúp tôi'))
  await screen.findByLabelText('Bản nháp mô tả')
  expect(update.mock.calls[0][1].status).toBe('READY_FOR_PREVIEW')
  fireEvent.click(screen.getByText('Tôi xác nhận mô tả yêu cầu'))
  fireEvent.click(screen.getByText('Tôi xác nhận mục đích hoạt động bay'))
  fireEvent.click(screen.getByText('Áp dụng vào yêu cầu'))
  await waitFor(()=>expect(update).toHaveBeenCalledWith('descriptionAssistant',expect.objectContaining({status:'CUSTOMER_CONFIRMED',purpose:'Bản mục đích bay'})))
  expect(vi.mocked(apiRequest).mock.calls.map(c=>c[0])).toEqual(['/api/customer/description-assistant/generate','/api/customer/description-assistant/s/confirm'])
})
