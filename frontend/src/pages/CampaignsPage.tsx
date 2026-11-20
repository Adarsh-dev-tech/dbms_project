import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { Campaign, CampaignType, DistrictItem, StateItem } from '../types';

interface CampaignsPageProps {
  onNotify: (msg: string, isError?: boolean) => void;
}

const EMPTY_FORM = {
  campaignName: '',
  campaignTypeId: '',
  description: '',
  fromDate: '',
  toDate: '',
  stateId: '',
  districtId: '',
  location: '',
  campaignObjective: '',
  status: true,
};

export function CampaignsPage({ onNotify }: CampaignsPageProps) {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [types, setTypes] = useState<CampaignType[]>([]);
  const [states, setStates] = useState<StateItem[]>([]);
  const [districts, setDistricts] = useState<DistrictItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const [c, t, s, d] = await Promise.all([
        apiRequest<Campaign[]>('/campaign-master'),
        apiRequest<CampaignType[]>('/campaign-type-master').catch(() => []),
        apiRequest<StateItem[]>('/state-master').catch(() => []),
        apiRequest<DistrictItem[]>('/district-master').catch(() => []),
      ]);
      setCampaigns(Array.isArray(c) ? c : []);
      setTypes(Array.isArray(t) ? t : []);
      setStates(Array.isArray(s) ? s : []);
      setDistricts(Array.isArray(d) ? d : []);
    } catch (err: any) {
      onNotify(err.message || 'Failed to load campaigns', true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const typeMap = new Map(types.map((t) => [t.id, t.camapignType]));
  const stateMap = new Map(states.map((s) => [s.id, s.name]));
  const districtMap = new Map(districts.map((d) => [d.id, d.name]));

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

    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      campaignTypeId: types[0]?.id ? String(types[0].id) : '',
      stateId: defaultState?.id ? String(defaultState.id) : '',
      districtId: defaultDistrict?.id ? String(defaultDistrict.id) : '',
    });
    setModalOpen(true);
  }

  function openEdit(c: Campaign) {
    setEditingId(c.id);
    setForm({
      campaignName: c.campaignName,
      campaignTypeId: String(c.campaignTypeId),
      description: c.description || '',
      fromDate: c.fromDate,
      toDate: c.toDate,
      stateId: String(c.stateId),
      districtId: String(c.districtId),
      location: c.location || '',
      campaignObjective: c.campaignObjective || '',
      status: c.status,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        orgId: user?.orgId || 1,
        campaignName: form.campaignName.trim(),
        campaignTypeId: Number(form.campaignTypeId),
        description: form.description.trim() || undefined,
        fromDate: form.fromDate,
        toDate: form.toDate,
        stateId: Number(form.stateId),
        districtId: Number(form.districtId),
        location: form.location.trim() || undefined,
        campaignObjective: form.campaignObjective.trim() || undefined,
        createdBy: user?.username || 'Admin',
        status: form.status,
      };

      if (editingId) {
        await apiRequest(`/campaign-master/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        onNotify('Campaign updated successfully');
      } else {
        await apiRequest('/campaign-master', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        onNotify('Campaign created successfully');
      }

      setModalOpen(false);
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to save campaign', true);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await apiRequest(`/campaign-master/${id}`, { method: 'DELETE' });
      onNotify('Campaign deleted');
      await loadAll();
    } catch (err: any) {
      onNotify(err.message || 'Failed to delete campaign', true);
    }
  }

  const visibleCampaigns = campaigns.filter(
    (c) =>
      c.campaignName.toLowerCase().includes(search.toLowerCase()) ||
      (c.location || '').toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Exhibition Campaigns</h1>
          <p className="page-subtitle">
            Plan trade shows, expos, and regional roadshows across locations.
          </p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          <Plus size={16} />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            All Campaigns ({visibleCampaigns.length})
          </h2>
          <input
            className="search-input"
            placeholder="Search by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="empty-state">Loading campaigns...</div>
          ) : visibleCampaigns.length === 0 ? (
            <div className="empty-state">
              No campaigns found. Click "New Campaign" to create one.
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name & Objective</th>
                  <th>Type</th>
                  <th>Schedule</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleCampaigns.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.campaignName}</div>
                      {c.campaignObjective && (
                        <div className="muted">{c.campaignObjective}</div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-primary">
                        {typeMap.get(c.campaignTypeId) ||
                          `Type #${c.campaignTypeId}`}
                      </span>
                    </td>
                    <td className="muted">
                      {c.fromDate} → {c.toDate}
                    </td>
                    <td>
                      <div>{c.location || '—'}</div>
                      <div className="muted">
                        {[
                          districtMap.get(c.districtId),
                          stateMap.get(c.stateId),
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          c.status ? 'badge-success' : 'badge-neutral'
                        }`}
                      >
                        {c.status ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ marginRight: 6 }}
                        onClick={() => openEdit(c)}
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(c.id)}
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

      {modalOpen && (
        <div className="modal-backdrop">
          <div className="modal">
            <div className="modal-header">
              <h2 className="card-title">
                {editingId ? 'Edit Campaign' : 'Create Campaign'}
              </h2>
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
                  <div className="form-group full">
                    <label>Campaign Name *</label>
                    <input
                      required
                      placeholder="e.g. AutoTech Expo 2026"
                      value={form.campaignName}
                      onChange={(e) =>
                        setForm({ ...form, campaignName: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Campaign Type *</label>
                    <select
                      required
                      value={form.campaignTypeId}
                      onChange={(e) =>
                        setForm({ ...form, campaignTypeId: e.target.value })
                      }
                    >
                      <option value="">Select type</option>
                      {types.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.camapignType}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Venue / Stall Location</label>
                    <input
                      placeholder="Hall A, Booth 12"
                      value={form.location}
                      onChange={(e) =>
                        setForm({ ...form, location: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      required
                      value={form.fromDate}
                      onChange={(e) =>
                        setForm({ ...form, fromDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>End Date *</label>
                    <input
                      type="date"
                      required
                      value={form.toDate}
                      onChange={(e) =>
                        setForm({ ...form, toDate: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <select
                      required
                      value={form.stateId}
                      onChange={(e) => {
                        const nextStateId = e.target.value;
                        const firstDist = districts.find(
                          (d) => d.stateId === Number(nextStateId),
                        );
                        setForm({
                          ...form,
                          stateId: nextStateId,
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

                  <div className="form-group full">
                    <label>Objective</label>
                    <input
                      placeholder="e.g. Capture 200 qualified B2B leads"
                      value={form.campaignObjective}
                      onChange={(e) =>
                        setForm({ ...form, campaignObjective: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label>Description</label>
                    <textarea
                      rows={2}
                      placeholder="Optional campaign notes..."
                      value={form.description}
                      onChange={(e) =>
                        setForm({ ...form, description: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group full">
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={form.status}
                        onChange={(e) =>
                          setForm({ ...form, status: e.target.checked })
                        }
                      />
                      <span>Campaign is active</span>
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
                  {saving ? 'Saving...' : editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
