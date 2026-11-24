import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';
import { DEPARTMENTS } from '../types';

export const RegisterSurplusPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [department, setDepartment] = useState('Restaurant');
  const [foodName, setFoodName] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('kg');
  const [foodCondition, setFoodCondition] = useState('Fresh');
  const [storageType, setStorageType] = useState('Refrigerated');
  const [pickupDeadline, setPickupDeadline] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!department) {
      setError('Please select a source department / food category.');
      return;
    }

    const numQty = Number(quantity);
    if (!numQty || numQty <= 0) {
      setError('Quantity must be greater than zero.');
      return;
    }

    if (!pickupDeadline) {
      setError('Please provide a pickup deadline.');
      return;
    }

    const deadlineDate = new Date(pickupDeadline);
    if (isNaN(deadlineDate.getTime()) || deadlineDate.getTime() <= Date.now()) {
      setError('Pickup deadline must be set to a future date and time.');
      return;
    }

    if (!pickupAddress.trim()) {
      setError('Pickup address is required.');
      return;
    }

    setLoading(true);

    try {
      // Backend expects UTC ISO string
      const utcDeadline = deadlineDate.toISOString();

      const created = await donationsApi.create({
        foodName: foodName.trim(),
        foodCategory: department,
        quantity: numQty,
        unit: unit.trim() || 'kg',
        foodCondition: foodCondition.trim(),
        storageType: storageType.trim(),
        pickupDeadline: utcDeadline,
        pickupAddress: pickupAddress.trim(),
        description: description.trim() || undefined
      });

      showToast(
        `Surplus registered successfully! Urgency Score: ${created.urgencyScore} (${created.urgencyLevel}).`,
        'success'
      );
      navigate('/my-donations');
    } catch (err) {
      const msg = extractErrorMessage(err);
      setError(msg);
      showToast(msg, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-view">
      <div className="page-header">
        <div>
          <h2>Register Surplus Food</h2>
          <p>List food that would otherwise go to waste. Storage & near-expiry items are welcome.</p>
        </div>
      </div>

      <div className="card-custom">
        <div className="card-body">
          {error && (
            <div className="alert alert-danger py-2 px-3 mb-4 d-flex align-items-center gap-2" style={{ borderRadius: '0.75rem' }}>
              <i className="bi bi-exclamation-triangle-fill"></i>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-section-title">
              <i className="bi bi-building"></i> Source Department / Type *
            </div>
            <div className="d-flex flex-wrap gap-2 mb-4">
              {DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  className={`dept-chip ${department === dept.label ? 'active' : ''}`}
                  onClick={() => setDepartment(dept.label)}
                >
                  <i className={`bi ${dept.icon}`}></i> {dept.label}
                </div>
              ))}
            </div>

            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label" htmlFor="regFood">Food Item / Description *</label>
                <input
                  type="text"
                  className="form-control"
                  id="regFood"
                  placeholder="e.g. Cooked meals, Bread loaves, Canned lentils"
                  value={foodName}
                  onChange={(e) => setFoodName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="regQty">Quantity *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  className="form-control"
                  id="regQty"
                  placeholder="e.g. 10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value ? parseFloat(e.target.value) : '')}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label" htmlFor="regUnit">Unit *</label>
                <select
                  className="form-select"
                  id="regUnit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="kg">kg (Kilograms)</option>
                  <option value="packs">packs (Packages)</option>
                  <option value="boxes">boxes (Boxes)</option>
                  <option value="liters">liters (Liters)</option>
                  <option value="portions">portions (Meals)</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="regCondition">Food Condition *</label>
                <select
                  className="form-select"
                  id="regCondition"
                  value={foodCondition}
                  onChange={(e) => setFoodCondition(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="Fresh">Fresh</option>
                  <option value="Packed">Packed</option>
                  <option value="Leftover">Leftover</option>
                  <option value="Near Expiry">Near Expiry</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="regStorage">Storage Type *</label>
                <select
                  className="form-select"
                  id="regStorage"
                  value={storageType}
                  onChange={(e) => setStorageType(e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="Refrigerated">Refrigerated</option>
                  <option value="Hot Storage">Hot Storage</option>
                  <option value="Room Temperature">Room Temperature</option>
                  <option value="Frozen">Frozen</option>
                  <option value="Dry Storage">Dry Storage</option>
                </select>
              </div>

              <div className="col-md-4">
                <label className="form-label" htmlFor="regDeadline">Pickup Deadline *</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  id="regDeadline"
                  value={pickupDeadline}
                  onChange={(e) => setPickupDeadline(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="regAddress">Pickup Address *</label>
                <input
                  type="text"
                  className="form-control"
                  id="regAddress"
                  placeholder="Complete street address or pickup counter instructions"
                  value={pickupAddress}
                  onChange={(e) => setPickupAddress(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="col-12">
                <label className="form-label" htmlFor="regNotes">Notes / Special Instructions (Optional)</label>
                <textarea
                  className="form-control"
                  id="regNotes"
                  rows={2}
                  placeholder="Dietary details (e.g. Vegetarian, Halal), packaging (sealed containers), allergens..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                ></textarea>
              </div>
            </div>

            <div className="mt-4 d-flex gap-2 flex-wrap">
              <button
                type="submit"
                className="btn btn-primary-custom"
                style={{ width: 'auto' }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Calculating Urgency & Submitting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-1"></i> Submit for Matching
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate('/dashboard')}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
