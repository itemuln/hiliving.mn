import { useEffect, useState } from 'react';
import { Archive, Edit3, Plus, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { Brand, Category, Page, Product } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  EmptyPanel,
  ErrorNotice,
  LoadingPanel,
  Pagination,
  SearchInput,
  StatusBadge,
  input,
  panel,
  primaryButton,
} from '../components/AdminUi';
import { lifecycleLabel } from '../adminLocale';
import { useDebouncedValue } from '../components/useDebouncedValue';
export function AdminProductsPage() {
  const [data, setData] = useState<Page<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    lifecycle: '',
    categoryId: '',
    brandId: '',
    sort: 'newest',
    page: 0,
    size: 20,
  });
  const [error, setError] = useState('');
  const debouncedSearch = useDebouncedValue(filters.search);
  const load = () => {
    setError('');
    api
      .listProducts({ ...filters, search: debouncedSearch })
      .then(setData)
      .catch(() => setError('Бүтээгдэхүүний мэдээллийг уншиж чадсангүй.'));
  };
  useEffect(() => {
    let active = true;
    setError('');
    void api
      .listProducts({
        search: debouncedSearch,
        lifecycle: filters.lifecycle,
        categoryId: filters.categoryId,
        brandId: filters.brandId,
        sort: filters.sort,
        page: filters.page,
        size: filters.size,
      })
      .then(
        (products) => {
          if (active) setData(products);
        },
        () => {
          if (active) setError('Бүтээгдэхүүний мэдээллийг уншиж чадсангүй.');
        }
      );
    return () => {
      active = false;
    };
  }, [
    debouncedSearch,
    filters.brandId,
    filters.categoryId,
    filters.lifecycle,
    filters.page,
    filters.size,
    filters.sort,
  ]);
  useEffect(() => {
    let active = true;
    void Promise.all([api.listCategories(), api.listBrands()]).then(
      ([c, b]) => {
        if (!active) return;
        setCategories(c);
        setBrands(b);
      },
      () => {
        if (active) setError('Шүүлтүүрийн мэдээллийг уншиж чадсангүй.');
      }
    );
    return () => {
      active = false;
    };
  }, []);
  const change = (name: string, value: string) =>
    setFilters((current) => ({ ...current, [name]: value, page: 0 }));
  const archive = async (p: Product) => {
    try {
      if (p.lifecycle === 'ARCHIVED') await api.restoreProduct(p.id);
      else await api.archiveProduct(p.id);
      load();
    } catch {
      setError('Бүтээгдэхүүний төлөвийг өөрчилж чадсангүй.');
    }
  };
  return (
    <AdminShell
      title="Бүтээгдэхүүн"
      description="Бүтээгдэхүүн хайх, шүүх, нийтлэх болон архивлах."
      actions={
        <Link to="/admin/products/new" className={primaryButton}>
          <Plus size={17} className="mr-2" />
          Бүтээгдэхүүн нэмэх
        </Link>
      }
    >
      <div className={`${panel} mb-4 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6`}>
        <div className="sm:col-span-2">
          <SearchInput
            value={filters.search}
            onChange={(value) => change('search', value)}
            placeholder="Нэр эсвэл код"
            label="Бүтээгдэхүүн хайх"
          />
        </div>
        <select
          className={input}
          aria-label="Нийтлэлийн төлөв"
          value={filters.lifecycle}
          onChange={(e) => change('lifecycle', e.target.value)}
        >
          <option value="">Бүх төлөв</option>
          <option value="DRAFT">Ноорог</option>
          <option value="ACTIVE">Нийтэлсэн</option>
          <option value="ARCHIVED">Архивласан</option>
        </select>
        <select
          className={input}
          aria-label="Ангилал"
          value={filters.categoryId}
          onChange={(e) => change('categoryId', e.target.value)}
        >
          <option value="">Бүх ангилал</option>
          {categories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={input}
          aria-label="Брэнд"
          value={filters.brandId}
          onChange={(e) => change('brandId', e.target.value)}
        >
          <option value="">Бүх брэнд</option>
          {brands.map((b) => (
            <option value={b.id} key={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          className={`${input} hidden sm:block`}
          aria-label="Бүтээгдэхүүн эрэмбэлэх"
          value={filters.sort}
          onChange={(e) => change('sort', e.target.value)}
        >
          <option value="newest">Шинэ эхэнд</option>
          <option value="oldest">Хуучин эхэнд</option>
          <option value="name_asc">Нэр А–Я</option>
          <option value="name_desc">Нэр Я–А</option>
          <option value="price_asc">Үнэ өсөхөөр</option>
          <option value="price_desc">Үнэ буурахаар</option>
        </select>
      </div>
      {error && (
        <div className="mb-4">
          <ErrorNotice message={error} />
        </div>
      )}
      {!data && !error ? (
        <LoadingPanel />
      ) : data?.items.length === 0 ? (
        <EmptyPanel title="Шүүлтүүрт тохирох бүтээгдэхүүн олдсонгүй" />
      ) : (
        data && (
          <div className={`${panel} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Бүтээгдэхүүн</th>
                    <th>Ангилал / Брэнд</th>
                    <th>Үнэ</th>
                    <th>Төлөв</th>
                    <th>Гишүүнчлэл</th>
                    <th className="pr-4 text-right">Үйлдэл</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr
                      key={p.id}
                      className="border-t border-slate-100 transition hover:bg-slate-50/70"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.images[0] ? (
                            <img
                              src={
                                p.images.find((i) => i.primaryImage)?.imageUrl ??
                                p.images[0].imageUrl
                              }
                              alt=""
                              loading="lazy"
                              className="h-12 w-12 rounded-xl border object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-100" />
                          )}
                          <div>
                            <div className="font-bold">{p.name}</div>
                            <div className="text-xs text-slate-400">{p.productCode}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{p.category.name}</div>
                        <div className="text-xs text-slate-400">{p.brand?.name ?? 'Брэндгүй'}</div>
                      </td>
                      <td>
                        <div className="font-semibold">₮ {p.basePrice.toLocaleString()}</div>
                        {p.discountPrice !== null && (
                          <div className="text-xs text-brand-500">
                            ₮ {p.discountPrice.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td>
                        <StatusBadge
                          tone={
                            p.lifecycle === 'ACTIVE'
                              ? 'success'
                              : p.lifecycle === 'ARCHIVED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {lifecycleLabel(p.lifecycle)}
                        </StatusBadge>
                      </td>
                      <td>{p.membershipDiscountEligible ? 'Хамаарна' : 'Хамаарахгүй'}</td>
                      <td className="pr-4 text-right">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="inline-block p-2"
                          aria-label={`${p.name} засах`}
                        >
                          <Edit3 size={17} />
                        </Link>
                        <button
                          onClick={() => void archive(p)}
                          className="p-2"
                          aria-label={
                            p.lifecycle === 'ARCHIVED'
                              ? 'Бүтээгдэхүүн сэргээх'
                              : 'Бүтээгдэхүүн архивлах'
                          }
                        >
                          {p.lifecycle === 'ARCHIVED' ? (
                            <RotateCcw size={17} />
                          ) : (
                            <Archive size={17} />
                          )}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              first={data.first}
              last={data.last}
              noun="бүтээгдэхүүн"
              onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
            />
          </div>
        )
      )}
    </AdminShell>
  );
}
