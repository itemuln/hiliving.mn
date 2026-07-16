import { fireEvent,render,screen,waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach,describe,expect,it,vi } from 'vitest'
import { AuthContext,type AuthContextValue } from '../../auth/AuthContext'
import { authenticatedUser } from '../../../test/accountFixtures'
import { AdminProductEditorPage } from './AdminProductEditorPage'
import * as api from '../../../api/adminApi'

vi.mock('../../../api/adminApi',()=>({
  listCategories:vi.fn().mockResolvedValue([{id:1,name:'Home',slug:'home',parentId:null,parentName:null,description:null,sortOrder:0,active:true,childCount:0,productCount:0}]),
  listBrands:vi.fn().mockResolvedValue([]),
  createProduct:vi.fn().mockResolvedValue({}),
  uploadMediaImage:vi.fn().mockResolvedValue({id:1,storageKey:'products/generated.png',url:'/media/products/generated.png',originalFilename:'photo.png',contentType:'image/png',sizeBytes:100,width:10,height:10}),
}))

const auth:AuthContextValue={state:{status:'authenticated',user:{...authenticatedUser,role:'ADMIN'}},hydrationError:false,login:vi.fn(),register:vi.fn(),logout:vi.fn(),refresh:vi.fn(),replaceUser:vi.fn()}

describe('admin product editor',()=>{
  beforeEach(()=>{vi.clearAllMocks();vi.stubGlobal('URL',{...URL,createObjectURL:vi.fn(()=> 'blob:preview'),revokeObjectURL:vi.fn()})})
  it('offers exactly four upload slots, persists returned URLs, and validates publishing',async()=>{
    render(<AuthContext.Provider value={auth}><MemoryRouter><AdminProductEditorPage/></MemoryRouter></AuthContext.Provider>)
    await waitFor(()=>expect(screen.getByText('1. Product information')).toBeInTheDocument())
    expect(screen.getAllByText('Choose file')).toHaveLength(4)
    expect(screen.queryByPlaceholderText('https://…')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button',{name:'Publish'}))
    expect(await screen.findByRole('alert')).toHaveTextContent('Publishing requires exactly one primary image')
    const file=new File(['png'],'photo.png',{type:'image/png'})
    fireEvent.change(document.querySelector('input[type="file"]') as HTMLInputElement,{target:{files:[file]}})
    await waitFor(()=>expect(api.uploadMediaImage).toHaveBeenCalledWith(file,'PRODUCT',expect.any(Object)))
    await waitFor(()=>expect(screen.getByAltText('Product image 1 preview')).toHaveAttribute('src','/media/products/generated.png'))
    expect(screen.getAllByText('Choose file')).toHaveLength(3)
    expect(screen.getByText('Replace')).toBeInTheDocument()
    expect(screen.getByRole('radio',{name:'Primary image'})).toBeChecked()
  })
})
