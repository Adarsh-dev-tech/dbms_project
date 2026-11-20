import React, { useEffect, useState } from 'react';
import { FolderPlus, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Product, ProductFamily, SbuItem } from '../types';

interface ProductsPageProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

export function ProductsPage({ onNotify }: ProductsPageProps) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [families, setFamilies] = useState<ProductFamily[]>([]);
  const [sbus, setSbus] = useState<SbuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [familyModalOpen, setFamilyModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [productForm, setProductForm] = useState({
    productCode: '',
    productName: '',
    productDescription: '',
    productFamilyId: '',
    sbuId: '',
    modelName: '',
  });

  const [familyForm, setFamilyForm] = useState({
    productFamilyName: '',
    productFamilyDescription: '',
    sbuId: '',
  });

  async function loadAll() {
    setLoading(true);
    try {
      const [p, f, s] = await Promise.all([
        apiRequest<Product[]>('/product-master'),
        apiRequest<ProductFamily[]>('/product-family-master').catch(() => []),
        apiRequest<SbuItem[]>('/sbu-master').catch(() => []),
      ]);
      setProducts(Array.isArray(p) ? p : []);
      setFamilies(Array.isArray(f) ? f : []);
      setSbus(Array.isArray(s) ? s : []);
    } catch (err: any) {
      onNotify(err.message || 'Failed to load products', true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const familyMap = new Map(families.map((f) => [f.id, f.productFamilyName]));
  const sbuMap = new Map(sbus.map((s) => [s.id, s.sbuName]));

  function openCreateProduct() {
    setProductForm({
      productCode: '',
      productName: '',
      productDescription: '',
      productFamilyId: families[0]?.id ? String(families[0].id) : '',
      sbuId: sbus[0]?.id ? String(sbus[0].id) : '1',
      modelName: '',
    });
    setProductModalOpen(true);
  }

  function openCreateFamily() {
    setFamilyForm({
      productFamilyName: '',
      productFamilyDescription: '',
      sbuId: sbus[0]?.id ? String(sbus[0].id) : '1',
    });
    setFamilyModalOpen(true);
  }

  async function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/product-master', {
        method: 'POST',
        body: JSON.stringify({
          orgId: user?.orgId || 1,
          sbuId: Number(productForm.sbuId),
          productFamilyId: Number(productForm.productFamilyId),
          productCode: productForm.productCode.trim(),
          productName: productForm.productName.trim(),
          productDescription: productForm.productDescription.trim() || undefined,
          model: productForm.modelName.trim()
            ? [{ modelName: productForm.modelName.trim() }]
            : [],
          createdBy: user?.username || 'Admin',
        }),
      });
      onNotify('Product added to catalog');
      setProductModalOpen(false);
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to create product', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveFamily(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiRequest('/product-family-master', {
        method: 'POST',
        body: JSON.stringify({
          orgId: user?.orgId || 1,
          sbuId: Number(familyForm.sbuId) || undefined,
          productFamilyName: familyForm.productFamilyName.trim(),
          productFamilyDescription:
            familyForm.productFamilyDescription.trim() || undefined,
          createdBy: user?.username || 'Admin',
          status: true,
        }),
      });
      onNotify('Product family created');
      setFamilyModalOpen(false);
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to create product family', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProduct(id: number) {
    if (!window.confirm('Delete this product?')) return;
    try {
      await apiRequest(`/product-master/${id}`, { method: 'DELETE' });
      onNotify('Product deleted');
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to delete product', true);
    }
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p className="page-subtitle">
            Manage product families and equipment showcased at exhibitions.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openCreateFamily}
          >
            <FolderPlus size={16} />
            <span>New Product Family</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreateProduct}
          >
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Products ({products.length})</h2>
        </div>
        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading products...</div>
          ) : products.length === 0 ? (
            <div className="empty-state">No products added yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Product Name</th>
                  <th>Family</th>
                  <th>Business Unit</th>
                  <th>Models</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <span className="badge badge-neutral">
                        {p.productCode}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{p.productName}</div>
                      {p.productDescription && (
                        <div className="muted">{p.productDescription}</div>
                      )}
                    </td>
                    <td>
                      {familyMap.get(p.productFamilyId) ||
                        `Family #${p.productFamilyId}`}
                    </td>
                    <td className="muted">
                      {sbuMap.get(p.sbuId) || `SBU #${p.sbuId}`}
                    </td>
                    <td>
                      {p.model && p.model.length > 0
                        ? p.model.map((m, idx) => (
                            <span
                              key={idx}
                              className="badge badge-primary"
                              style={{ marginRight: 4 }}
                            >
                              {m.modelName}
                            </span>
                          ))
                        : '—'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteProduct(p.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Product Families ({families.length})</h2>
        </div>
        <div className="table-wrap">
          {families.length === 0 ? (
            <div className="empty-state">No product families yet.</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Family Name</th>
                  <th>Description</th>
                  <th>Business Unit</th>
                </tr>
              </thead>
              <tbody>
                {families.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 600 }}>{f.productFamilyName}</td>
                    <td className="muted">
                      {f.productFamilyDescription || '—'}
                    </td>
                    <td className="muted">
                      {f.sbuId ? sbuMap.get(f.sbuId) || `SBU #${f.sbuId}` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {productModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="card-title">Add New Product</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setProductModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveProduct}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Product Code *</label>
                    <input
                      required
                      placeholder="e.g. IOT-300"
                      value={productForm.productCode}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          productCode: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Product Name *</label>
                    <input
                      required
                      placeholder="e.g. Smart Sensor Hub"
                      value={productForm.productName}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          productName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group">
                    <label>Product Family *</label>
                    <select
                      required
                      value={productForm.productFamilyId}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          productFamilyId: e.target.value,
                        })
                      }
                    >
                      <option value="">Select family</option>
                      {families.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.productFamilyName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Business Unit (SBU) *</label>
                    <select
                      required
                      value={productForm.sbuId}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          sbuId: e.target.value,
                        })
                      }
                    >
                      {sbus.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sbuName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group full">
                    <label>Primary Model Name</label>
                    <input
                      placeholder="e.g. Pro Edition v2"
                      value={productForm.modelName}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          modelName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="form-group full">
                    <label>Description</label>
                    <textarea
                      rows={2}
                      placeholder="Short product highlights..."
                      value={productForm.productDescription}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          productDescription: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setProductModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {familyModalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="card-title">Create Product Family</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setFamilyModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveFamily}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Family Name *</label>
                  <input
                    required
                    placeholder="e.g. Industrial Sensors"
                    value={familyForm.productFamilyName}
                    onChange={(e) =>
                      setFamilyForm({
                        ...familyForm,
                        productFamilyName: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="form-group">
                  <label>Business Unit (SBU)</label>
                  <select
                    value={familyForm.sbuId}
                    onChange={(e) =>
                      setFamilyForm({ ...familyForm, sbuId: e.target.value })
                    }
                  >
                    {sbus.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.sbuName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={familyForm.productFamilyDescription}
                    onChange={(e) =>
                      setFamilyForm({
                        ...familyForm,
                        productFamilyDescription: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setFamilyModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Create Family'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
