import React, { useEffect, useState } from 'react';
import { Download, Plus, Trash2, X } from 'lucide-react';
import { apiRequest, downloadExcelFile } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Campaign,
  CompanyType,
  DistrictItem,
  IndustryType,
  Product,
  StateItem,
  Visitor,
} from '../types';

interface VisitorsPageProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

const EMPTY_FORM = {
  companyName: '',
  visitorName: '',
  email: '',
  mobileNo: '',
  campaignId: '',
  industryTypeId: '',
  companyType: '',
  stateId: '',
  districtId: '',
  address: '',
  pincode: '',
  productId: '',
  noOfMachines: '1',
  planningTimeline: '1-3 Months',
  financingReuired: false,
  noOfPeopleAccompanied: '1',
  noOfGifts: '0',
  giftDetails: '',
};

export function VisitorsPage({ onNotify }: VisitorsPageProps) {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [industries, setIndustries] = useState<IndustryType[]>([]);
  const [companyTypes, setCompanyTypes] = useState<CompanyType[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [v, c, ind, ct, s, d, p] = await Promise.all([
        apiRequest<Visitor[]>('/visitor-master'),
        apiRequest<Campaign[]>('/campaign-master').catch(() => []),
        apiRequest<IndustryType[]>('/industry-type-master').catch(() => []),
        apiRequest<CompanyType[]>('/company-type-master').catch(() => []),
        apiRequest<StateItem[]>('/state-master').catch(() => []),
        apiRequest<DistrictItem[]>('/district-master').catch(() => []),
        apiRequest<Product[]>('/product-master').catch(() => []),
      ]);
      setVisitors(Array.isArray(v) ? v : []);
      setCampaigns(Array.isArray(c) ? c : []);
      setIndustries(Array.isArray(ind) ? ind : []);
      setCompanyTypes(Array.isArray(ct) ? ct : []);
      setStates(Array.isArray(s) ? s : []);
      setDistricts(Array.isArray(d) ? d : []);
      setProducts(Array.isArray(p) ? p : []);
    } catch (err: any) {
      onNotify(err.message || 'Failed to load visitors', true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const campaignMap = new Map(campaigns.map((c) => [c.id, c.campaignName]));
  const industryMap = new Map(industries.map((i) => [i.id, i.industryType]));
  const stateMap = new Map(states.map((s) => [s.id, s.name]));
  const districtMap = new Map(districts.map((d) => [d.id, d.name]));
  const productMap = new Map(products.map((p) => [p.id, p]));

  const filteredDistricts = form.stateId
    ? districts.filter((d) => d.stateId === Number(form.stateId))
    : districts;

  function openCreate() {
    const defaultState = states.find((s) =>
      districts.some((d) => d.stateId === s.id),
    );
    const defaultDistrict = defaultState
      ? districts.find((d) => d.stateId === defaultState.id)
      : districts[0];

    setForm({
      ...EMPTY_FORM,
      campaignId: campaigns[0]?.id ? String(campaigns[0].id) : '',
      industryTypeId: industries[0]?.id ? String(industries[0].id) : '',
      companyType: companyTypes[0]?.id ? String(companyTypes[0].id) : '',
      stateId: defaultState?.id ? String(defaultState.id) : '',
      districtId: defaultDistrict?.id ? String(defaultDistrict.id) : '',
      productId: products[0]?.id ? String(products[0].id) : '',
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedProduct = form.productId
        ? productMap.get(Number(form.productId))
        : undefined;

      const payload = {
        orgId: user?.orgId || 1,
        sbuId: user?.sbuId || undefined,
        userId: user?.id || 1,
        campaignId: Number(form.campaignId),
        industryTypeId: Number(form.industryTypeId),
        companyType: form.companyType ? Number(form.companyType) : undefined,
        companyName: form.companyName.trim(),
        address: form.address.trim() || undefined,
        pincode: form.pincode ? Number(form.pincode) : undefined,
        stateId: Number(form.stateId),
        districtId: Number(form.districtId),
        planningTimeline: form.planningTimeline,
        financingReuired: form.financingReuired,
        noOfPeopleAccompanied: form.noOfPeopleAccompanied
          ? Number(form.noOfPeopleAccompanied)
          : 1,
        noOfGifts: form.noOfGifts || '0',
        giftDetails: form.giftDetails.trim() || undefined,
        createdBy: user?.username || 'Admin',
        visitorDetails: [
          {
            visitorName: form.visitorName.trim(),
            email: form.email.trim() || undefined,
            mobileNo: form.mobileNo.trim() || undefined,
          },
        ],
        productsInterested: selectedProduct
          ? [
              {
                productFamilyId: selectedProduct.productFamilyId,
                productId: selectedProduct.id,
                noOfMachines: Number(form.noOfMachines) || 1,
              },
            ]
          : [],
      };

      await apiRequest('/visitor-master', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      onNotify('Visitor lead captured successfully');
      setModalOpen(false);
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to save visitor lead', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this visitor lead?')) return;
    try {
      await apiRequest(`/visitor-master/${id}`, { method: 'DELETE' });
      onNotify('Visitor lead deleted');
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to delete visitor lead', true);
    }
  }

  async function handleExportExcel() {
    setExporting(true);
    try {
      await downloadExcelFile(
        '/visitor-master/export-excel',
        'exhibition-visitors-report.xlsx',
      );
      onNotify('Excel report downloaded');
    } catch (err: any) {
      onNotify(err.message || 'Failed to export Excel report', true);
    } finally {
      setExporting(false);
    }
  }

  const visibleVisitors = visitors.filter((v) => {
    const q = search.toLowerCase();
    const contactNames = (v.visitorDetails || [])
      .map((d) => `${d.visitorName || ''} ${d.email || ''} ${d.mobileNo || ''}`)
      .join(' ')
      .toLowerCase();
    return (
      (v.companyName || '').toLowerCase().includes(q) ||
      contactNames.includes(q) ||
      (campaignMap.get(v.campaignId) || '').toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Visitors & Lead Capture</h1>
          <p className="page-subtitle">
            Record exhibition booth visitors, product interests, and gift
            disbursements.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleExportExcel}
            disabled={exporting}
          >
            <Download size={16} />
            <span>{exporting ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={openCreate}
          >
            <Plus size={16} />
            <span>Add Visitor Lead</span>
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            Captured Leads ({visibleVisitors.length})
          </h2>
          <input
            className="search-input"
            placeholder="Search company, visitor, campaign..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading visitor leads...</div>
          ) : visibleVisitors.length === 0 ? (
            <div className="empty-state">
              No visitor leads found. Click "Add Visitor Lead" to record one.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Company & Contact</th>
                  <th>Campaign & Industry</th>
                  <th>Location</th>
                  <th>Interested Products</th>
                  <th>Timeline / Gift</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleVisitors.map((v) => {
                  const primary = v.visitorDetails?.[0];
                  return (
                    <tr key={v.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {v.companyName || 'Walk-in Visitor'}
                        </div>
                        <div className="muted">
                          {primary?.visitorName || '—'}
                          {primary?.mobileNo ? ` · ${primary.mobileNo}` : ''}
                        </div>
                        {primary?.email && (
                          <div className="muted">{primary.email}</div>
                        )}
                      </td>
                      <td>
                        <div>
                          {campaignMap.get(v.campaignId) || `#${v.campaignId}`}
                        </div>
                        <div className="muted">
                          {industryMap.get(v.industryTypeId) ||
                            `Industry #${v.industryTypeId}`}
                        </div>
                      </td>
                      <td className="muted">
                        {[
                          districtMap.get(v.districtId),
                          stateMap.get(v.stateId),
                        ]
                          .filter(Boolean)
                          .join(', ') || '—'}
                      </td>
                      <td>
                        {v.productsInterested && v.productsInterested.length > 0
                          ? v.productsInterested.map((p, idx) => {
                              const prod = p.productId
                                ? productMap.get(p.productId)
                                : undefined;
                              return (
                                <div key={idx}>
                                  <span className="badge badge-primary">
                                    {prod?.productName ||
                                      `Product #${p.productId}`}
                                    {p.noOfMachines ? ` ×${p.noOfMachines}` : ''}
                                  </span>
                                </div>
                              );
                            })
                          : '—'}
                      </td>
                      <td>
                        <span className="badge badge-success">
                          {v.planningTimeline || 'Standard'}
                        </span>
                        {v.giftDetails && (
                          <div className="muted" style={{ marginTop: 4 }}>
                            Gift: {v.giftDetails}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(v.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="card-title">Add Exhibition Visitor Lead</h2>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setModalOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Company Name *</label>
                    <input
                      required
                      placeholder="e.g. Zenith Robotics Pvt Ltd"
                      value={form.companyName}
                      onChange={(e) =>
                        setForm({ ...form, companyName: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Visitor Contact Name *</label>
                    <input
                      required
                      placeholder="e.g. Vikram Mehta"
                      value={form.visitorName}
                      onChange={(e) =>
                        setForm({ ...form, visitorName: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Visitor Email</label>
                    <input
                      type="email"
                      placeholder="vikram@zenith.example"
                      value={form.email}
                      onChange={(e) =>
                        setForm({ ...form, email: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Mobile Number</label>
                    <input
                      placeholder="9876500111"
                      value={form.mobileNo}
                      onChange={(e) =>
                        setForm({ ...form, mobileNo: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Campaign *</label>
                    <select
                      required
                      value={form.campaignId}
                      onChange={(e) =>
                        setForm({ ...form, campaignId: e.target.value })
                      }
                    >
                      <option value="">Select campaign</option>
                      {campaigns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.campaignName}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Industry *</label>
                    <select
                      required
                      value={form.industryTypeId}
                      onChange={(e) =>
                        setForm({ ...form, industryTypeId: e.target.value })
                      }
                    >
                      <option value="">Select industry</option>
                      {industries.map((ind) => (
                        <option key={ind.id} value={ind.id}>
                          {ind.industryType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <select
                      required
                      value={form.stateId}
                      onChange={(e) => {
                        const nextState = e.target.value;
                        const firstDist = districts.find(
                          (d) => d.stateId === Number(nextState),
                        );
                        setForm({
                          ...form,
                          stateId: nextState,
                          districtId: firstDist ? String(firstDist.id) : '',
                        });
                      }}
                    >
                      <option value="">Select state</option>
                      {states.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>District *</label>
                    <select
                      required
                      value={form.districtId}
                      onChange={(e) =>
                        setForm({ ...form, districtId: e.target.value })
                      }
                    >
                      <option value="">Select district</option>
                      {filteredDistricts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Interested Product</label>
                    <select
                      value={form.productId}
                      onChange={(e) =>
                        setForm({ ...form, productId: e.target.value })
                      }
                    >
                      <option value="">None selected</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.productName} ({p.productCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Units / Machines Needed</label>
                    <input
                      type="number"
                      min={1}
                      value={form.noOfMachines}
                      onChange={(e) =>
                        setForm({ ...form, noOfMachines: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Purchase Timeline</label>
                    <select
                      value={form.planningTimeline}
                      onChange={(e) =>
                        setForm({ ...form, planningTimeline: e.target.value })
                      }
                    >
                      <option value="Immediate">Immediate</option>
                      <option value="1-3 Months">1-3 Months</option>
                      <option value="3-6 Months">3-6 Months</option>
                      <option value="6+ Months">6+ Months</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Gift / Voucher Given</label>
                    <input
                      placeholder="e.g. Branded Notebook"
                      value={form.giftDetails}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          giftDetails: e.target.value,
                          noOfGifts: e.target.value ? '1' : '0',
                        })
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.financingReuired}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            financingReuired: e.target.checked,
                          })
                        }
                      />
                      <span>Visitor requested financing / credit options</span>
                    </label>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Visitor Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
