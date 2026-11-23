import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, PlusCircle } from 'lucide-react';
import { donationsApi } from '../api/services';
import { extractErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export const CreateDonationPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('Cooked Food');
  const [quantity, setQuantity] = useState('10');
  const [unit, setUnit] = useState('kg');
  const [foodCondition, setFoodCondition] = useState('Cooked');
  const [storageType, setStorageType] = useState('Hot Box');
  const [pickupDeadline, setPickupDeadline] = useState('');
  const [pickupAddress, setPickupAddress] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const qtyNum = Number(quantity);
    if (!foodName.trim()) return setError('Food name is required.');
    if (!qtyNum || qtyNum <= 0) return setError('Quantity must be greater than zero.');
    if (!pickupDeadline) return setError('Pickup deadline is required.');
    const deadlineIso = new Date(pickupDeadline).toISOString();
    if (new Date(deadlineIso).getTime() <= Date.now()) {
      return setError('Pickup deadline must be in the future.');
    }
    if (!pickupAddress.trim()) return setError('Pickup address is required.');

    setSubmitting(true);
    try {
      const created = await donationsApi.create({
        foodName: foodName.trim(),
        foodCategory,
        quantity: qtyNum,
        unit,
        foodCondition,
        storageType,
        pickupDeadline: deadlineIso,
        pickupAddress: pickupAddress.trim(),
        description: description.trim() || undefined
      });
      showToast(`Donation #${created.donationId} created (Urgency: ${created.urgencyScore} · ${created.urgencyLevel})!`, 'success');
      navigate(`/donations/${created.donationId}`);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Create Surplus Food Donation</h1>
        <p className="text-sm text-slate-500">
          Your Donor ID is automatically attached from your JWT session. The backend calculates the AI urgency score on submission.
        </p>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Food Name *</label>
            <input
              type="text"
              required
              maxLength={200}
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              placeholder="e.g., Veg Pulao & Raita"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Food Category *</label>
            <select
              value={foodCategory}
              onChange={(e) => setFoodCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            >
              <option value="Cooked Food">Cooked Food</option>
              <option value="Raw Vegetables">Raw Vegetables</option>
              <option value="Bakery Items">Bakery Items</option>
              <option value="Dairy & Beverages">Dairy &amp; Beverages</option>
              <option value="Packaged Dry Goods">Packaged Dry Goods</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Quantity *</label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Unit *</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            >
              <option value="kg">kg</option>
              <option value="meals">meals</option>
              <option value="packets">packets</option>
              <option value="litres">litres</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Food Condition *</label>
            <select
              value={foodCondition}
              onChange={(e) => setFoodCondition(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            >
              <option value="Highly Perishable">Highly Perishable</option>
              <option value="Perishable">Perishable</option>
              <option value="Cooked">Cooked</option>
              <option value="Fresh">Fresh</option>
              <option value="Packed">Packed</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Type *</label>
            <select
              value={storageType}
              onChange={(e) => setStorageType(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm bg-white"
            >
              <option value="Hot Box">Hot Box</option>
              <option value="Refrigerated">Refrigerated</option>
              <option value="Room Temperature">Room Temperature</option>
              <option value="Frozen">Frozen</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Deadline *</label>
            <input
              type="datetime-local"
              required
              value={pickupDeadline}
              onChange={(e) => setPickupDeadline(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Pickup Address *</label>
          <input
            type="text"
            required
            maxLength={500}
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            placeholder="Street, landmark, city"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
          <textarea
            rows={3}
            maxLength={1000}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Packaging details, allergens, or pickup instructions..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlusCircle className="w-4 h-4" />}
            <span>{submitting ? 'Submitting...' : 'Submit Donation'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
