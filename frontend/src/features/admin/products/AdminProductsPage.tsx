import { useEffect, useState } from 'react';
import { Archive, Edit3, Plus, RotateCcw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../../api/adminApi';
import type { Brand, Category, Page, Product } from '../admin.types';
import { AdminShell } from '../layout/AdminShell';
import {
  EmptyPanel,
  ErrorNotice,
  LoadingPanel,
  StatusBadge,
  input,
  panel,
  primaryButton,
  secondaryButton,
} from '../components/AdminUi';
export function AdminProductsPage() {
  const [data, setData] = useState<Page<Product> | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    lifecycle: '',
    categoryId: '',
    brandId: '',
    inventoryState: '',
    sort: 'newest',
    page: 0,
    size: 20,
  });
  const [error, setError] = useState('');
  const load = () => {
    setError('');
    api
      .listProducts(filters)
      .then(setData)
      .catch(() => setError('Products could not be loaded.'));
  };
  useEffect(() => {
    setError('');
    void api
      .listProducts(filters)
      .then(setData)
      .catch(() => setError('Products could not be loaded.'));
  }, [filters]);
  useEffect(() => {
    void Promise.all([api.listCategories(), api.listBrands()]).then(([c, b]) => {
      setCategories(c);
      setBrands(b);
    });
  }, []);
  const change = (name: string, value: string) =>
    setFilters((current) => ({ ...current, [name]: value, page: 0 }));
  const archive = async (p: Product) => {
    try {
      if (p.lifecycle === 'ARCHIVED') await api.restoreProduct(p.id);
      else await api.archiveProduct(p.id);
      load();
    } catch {
      setError('The lifecycle change could not be completed.');
    }
  };
  return (
    <AdminShell
      title="Products"
      description="Search, filter, publish, archive, and monitor inventory."
      actions={
        <Link to="/admin/products/new" className={primaryButton}>
          <Plus size={17} className="mr-2" />
          Add product
        </Link>
      }
    >
      <div className={`${panel} mb-4 grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-6`}>
        <label className="relative sm:col-span-2">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            className={`${input} pl-10`}
            value={filters.search}
            onChange={(e) => change('search', e.target.value)}
            placeholder="Name, code, or slug"
            aria-label="Search products"
          />
        </label>
        <select
          className={input}
          aria-label="Lifecycle"
          value={filters.lifecycle}
          onChange={(e) => change('lifecycle', e.target.value)}
        >
          <option value="">All lifecycles</option>
          <option>DRAFT</option>
          <option>ACTIVE</option>
          <option>ARCHIVED</option>
        </select>
        <select
          className={input}
          aria-label="Category"
          value={filters.categoryId}
          onChange={(e) => change('categoryId', e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className={input}
          aria-label="Brand"
          value={filters.brandId}
          onChange={(e) => change('brandId', e.target.value)}
        >
          <option value="">All brands</option>
          {brands.map((b) => (
            <option value={b.id} key={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          className={input}
          aria-label="Inventory"
          value={filters.inventoryState}
          onChange={(e) => change('inventoryState', e.target.value)}
        >
          <option value="">All inventory</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
        <select
          className={input}
          aria-label="Sort products"
          value={filters.sort}
          onChange={(e) => change('sort', e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="name_asc">Name A–Z</option>
          <option value="name_desc">Name Z–A</option>
          <option value="price_asc">Price low–high</option>
          <option value="price_desc">Price high–low</option>
          <option value="stock_asc">Stock low–high</option>
          <option value="stock_desc">Stock high–low</option>
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
        <EmptyPanel title="No products match these filters" />
      ) : (
        data && (
          <div className={`${panel} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="p-4">Product</th>
                    <th>Category / Brand</th>
                    <th>Price</th>
                    <th>Inventory</th>
                    <th>Lifecycle</th>
                    <th>Membership</th>
                    <th className="pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
                    <tr key={p.id} className="border-t border-slate-100">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {p.images[0] ? (
                            <img
                              src={
                                p.images.find((i) => i.primaryImage)?.imageUrl ??
                                p.images[0].imageUrl
                              }
                              alt=""
                              className="h-12 w-12 rounded-xl border object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-slate-100" />
                          )}
                          <div>
                            <div className="font-bold">{p.name}</div>
                            <div className="text-xs text-slate-400">
                              {p.productCode} · /{p.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{p.category.name}</div>
                        <div className="text-xs text-slate-400">{p.brand?.name ?? 'No brand'}</div>
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
                            p.inventoryState === 'IN_STOCK'
                              ? 'success'
                              : p.inventoryState === 'LOW_STOCK'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {p.inventoryState.replace(/_/g, ' ')}
                        </StatusBadge>
                        <div className="mt-1 text-xs text-slate-400">
                          {p.stockQuantity} in stock
                        </div>
                      </td>
                      <td>
                        <StatusBadge
                          tone={
                            p.lifecycle === 'ACTIVE' && p.active
                              ? 'success'
                              : p.lifecycle === 'ARCHIVED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {p.lifecycle}
                          {!p.active ? ' · OFF' : ''}
                        </StatusBadge>
                      </td>
                      <td>{p.membershipDiscountEligible ? 'Eligible' : 'Excluded'}</td>
                      <td className="pr-4 text-right">
                        <Link
                          to={`/admin/products/${p.id}/edit`}
                          className="inline-block p-2"
                          aria-label={`Edit ${p.name}`}
                        >
                          <Edit3 size={17} />
                        </Link>
                        <button
                          onClick={() => void archive(p)}
                          className="p-2"
                          aria-label={
                            p.lifecycle === 'ARCHIVED' ? 'Restore product' : 'Archive product'
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
            <div className="flex items-center justify-between border-t p-4 text-sm">
              <span>{data.totalElements} products</span>
              <div className="flex gap-2">
                <button
                  className={secondaryButton}
                  disabled={data.first}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
                >
                  Previous
                </button>
                <span className="px-3 py-2">
                  {data.page + 1} / {Math.max(data.totalPages, 1)}
                </span>
                <button
                  className={secondaryButton}
                  disabled={data.last}
                  onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )
      )}
    </AdminShell>
  );
}
