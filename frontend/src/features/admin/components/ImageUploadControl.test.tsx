import { act,fireEvent,render,screen,waitFor } from '@testing-library/react'
import { beforeEach,describe,expect,it,vi } from 'vitest'
import { ImageUploadControl } from './ImageUploadControl'
import { AccountApiError } from '../../../api/accountApi'
import * as api from '../../../api/adminApi'

vi.mock('../../../api/adminApi',()=>({uploadMediaImage:vi.fn()}))

describe('ImageUploadControl',()=>{
  beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('URL',{...URL,createObjectURL:vi.fn(()=> 'blob:temporary'),revokeObjectURL:vi.fn()})})

  it('uploads selected files, reports progress, previews safely, and persists only the returned URL',async()=>{
    const change=vi.fn();const pending=vi.fn()
    let complete!:()=>void
    vi.mocked(api.uploadMediaImage).mockImplementation((_file,_purpose,options)=>new Promise(resolve=>{options?.onProgress?.(55);complete=()=>resolve({id:7,storageKey:'brands/generated.png',url:'/media/brands/generated.png',originalFilename:'logo.png',contentType:'image/png',sizeBytes:12,width:10,height:10})}))
    render(<ImageUploadControl label="Brand logo" purpose="BRAND" value="https://legacy.example/logo.png" onChange={change} onPendingChange={pending}/>)
    expect(screen.getByAltText('Brand logo preview')).toHaveAttribute('src','https://legacy.example/logo.png')
    const file=new File(['png'],'logo.png',{type:'image/png'})
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement,{target:{files:[file]}})
    expect(await screen.findByText('Uploading… 55%')).toBeInTheDocument()
    await act(async()=>complete())
    await waitFor(()=>expect(change).toHaveBeenCalledWith('/media/brands/generated.png'))
    expect(change).not.toHaveBeenCalledWith('blob:temporary')
    expect(pending).toHaveBeenNthCalledWith(1,true);expect(pending).toHaveBeenLastCalledWith(false)
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:temporary')
  })

  it('supports drag and drop, safe errors, retry, and removing an existing reference',async()=>{
    const change=vi.fn();vi.mocked(api.uploadMediaImage).mockRejectedValueOnce(new AccountApiError(400,'MEDIA_FORMAT_UNSUPPORTED')).mockResolvedValueOnce({id:8,storageKey:'news/retry.jpg',url:'/media/news/retry.jpg',originalFilename:'news.jpg',contentType:'image/jpeg',sizeBytes:15,width:10,height:10})
    const {container}=render(<ImageUploadControl label="News thumbnail" purpose="NEWS" value="/media/news/existing.jpg" onChange={change}/>)
    const file=new File(['jpg'],'news.jpg',{type:'image/jpeg'})
    fireEvent.drop(container.querySelector('.border-dashed') as HTMLElement,{dataTransfer:{files:[file]}})
    expect(await screen.findByRole('alert')).toHaveTextContent('Choose a valid JPEG or PNG image')
    fireEvent.click(screen.getByRole('button',{name:/Retry/}))
    await waitFor(()=>expect(change).toHaveBeenCalledWith('/media/news/retry.jpg'))
    fireEvent.click(screen.getByRole('button',{name:/Remove/}))
    expect(change).toHaveBeenCalledWith('')
  })
})
