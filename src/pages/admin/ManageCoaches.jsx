import React, { useState, useEffect } from 'react';
import { getAllCoaches } from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import CustomSelect from '../../components/CustomSelect';
import { UserCheck, Plus, Mail, Award, X, CheckCircle2 } from 'lucide-react';

export default function ManageCoaches() {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [email, setEmail] = useState('');
  const [track, setTrack] = useState('Technical (Excel, SQL, PowerBI, Python)');
  const [role, setRole] = useState('Technical Coach');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    async function loadCoaches() {
      try {
        const res = await getAllCoaches();
        if (res && res.success && Array.isArray(res.data)) {
          setCoaches(res.data);
        }
      } catch (err) {
        console.error('Error fetching coaches:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCoaches();
  }, []);

  const handleAddCoach = (e) => {
    e.preventDefault();
    const newCoach = {
      coachID: `TSDP2026-COA-${number.padStart(3, '0')}`,
      coachNumber: number.padStart(3, '0'),
      name,
      email,
      role,
      track
    };

    setCoaches(prev => [...prev, newCoach]);
    setSuccess(`Successfully added ${name} to instructional staff.`);
    setShowModal(false);
    setName('');
    setNumber('');
    setEmail('');
  };

  if (loading) {
    return <LoadingSpinner size="lg" text="Loading instructional staff roster..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-neutral">Manage Coaches & Instructors</h1>
          <p className="text-sm text-brand-neutral-muted mt-1">
            Instructional team overseeing technical, professional, and capstone analytics tracks.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="btn-secondary py-2.5 px-4 font-bold shadow-md self-start sm:self-auto flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Coach</span>
        </button>
      </div>

      {success && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-brand-success flex items-center gap-2 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-brand-primary" />
          <span>{success}</span>
        </div>
      )}

      {/* Coaches Grid */}
      {coaches.length === 0 ? (
        <div className="portal-card text-center py-12 text-brand-neutral-muted">
          <UserCheck className="w-10 h-10 mx-auto text-gray-300 mb-2" />
          <p className="font-semibold text-sm">No registered coaches found in database.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {coaches.map((coach) => {
            const cName = coach.name || `${coach.firstName || ''} ${coach.lastName || ''}`.trim() || coach.coachID || 'Instructor';
            return (
              <div key={coach.coachID} className="portal-card border-l-4 border-l-brand-secondary space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-orange-100 text-brand-secondary flex items-center justify-center font-bold text-lg">
                      {cName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-brand-neutral">{cName}</h3>
                      <p className="text-xs font-mono text-brand-primary font-bold">{coach.coachID}</p>
                    </div>
                  </div>
                  <span className="badge-secondary text-[10px] uppercase font-bold">{coach.role || 'Coach'}</span>
                </div>

                <div className="space-y-1.5 text-xs text-brand-neutral-muted bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <p className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-brand-neutral font-medium">{coach.email || '—'}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Award className="w-3.5 h-3.5 text-gray-400" />
                    <span>Track: <strong className="text-brand-neutral">{coach.track || 'Data Analytics'}</strong></span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* Add Coach Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-neutral-border pb-3">
              <h3 className="text-base font-bold text-brand-neutral">Add New Instructor</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-brand-neutral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCoach} className="space-y-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., Coach Adeleke"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Coach Number (3 digits)</label>
                <input
                  type="text"
                  placeholder="e.g., 003"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  className="form-input font-mono"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  placeholder="coach3@shamzbridge.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Track Focus</label>
                <CustomSelect
                  value={track}
                  onChange={(val) => setTrack(val)}
                  options={[
                    'Technical (Excel, SQL, PowerBI, Python)',
                    'Professional & Soft Skills',
                    'Capstone & Data Modeling'
                  ]}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-brand-neutral-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-outline py-2 px-4 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-secondary py-2 px-5 text-xs font-bold"
                >
                  Add Coach
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
