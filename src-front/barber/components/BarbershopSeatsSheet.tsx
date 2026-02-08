import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Users, Copy, Loader2 } from 'lucide-react';
import BottomSheet from './BottomSheet';
import MaterialInput from './MaterialInput';
import { api } from '../utils/api';
import type {
  BarbershopInvitationItem,
  BarbershopMemberItem,
} from '../types/api';

interface BarbershopSeatsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BarbershopSeatsSheet({ isOpen, onClose }: BarbershopSeatsSheetProps) {
  const [inviteePhone, setInviteePhone] = useState('');
  const [sending, setSending] = useState(false);
  const [invitations, setInvitations] = useState<BarbershopInvitationItem[]>([]);
  const [members, setMembers] = useState<BarbershopMemberItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [ownerAccess, setOwnerAccess] = useState<boolean | null>(null);

  const fetchLists = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setOwnerAccess(null);
    try {
      const [invRes, memRes] = await Promise.all([
        api.get<{ success: boolean; message: string; invitations?: BarbershopInvitationItem[] }>('/barber/barbershop/invitations'),
        api.get<{ success: boolean; message: string; members?: BarbershopMemberItem[] }>('/barber/barbershop/members'),
      ]);
      if (invRes.success && invRes.invitations != null) {
        setOwnerAccess(true);
        setInvitations(invRes.invitations);
      }
      if (memRes.success && memRes.members != null) {
        setOwnerAccess(true);
        setMembers(memRes.members);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('مالک') || msg.includes('دسترسی')) {
        setOwnerAccess(false);
      } else {
        setOwnerAccess(false);
        setInvitations([]);
        setMembers([]);
      }
    } finally {
      setLoading(false);
    }
  }, [isOpen]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    const phone = inviteePhone.trim().replace(/\s/g, '');
    if (!phone) return;
    setSending(true);
    try {
      const res = await api.post<{ success: boolean; message: string; token?: string }>('/barber/barbershop/invitations', { inviteePhone: phone });
      if (res.success) {
        window.showToast(res.message || 'دعوتنامه ایجاد شد', 'success');
        setInviteePhone('');
        fetchLists();
      } else {
        window.showToast(res.message || 'خطا در ایجاد دعوتنامه', 'error');
      }
    } catch (err: unknown) {
      window.showToast(err instanceof Error ? err.message : 'خطا در ارسال دعوت', 'error');
    } finally {
      setSending(false);
    }
  };

  const copyInviteLink = (token: string) => {
    const base = window.location.origin + window.location.pathname;
    const link = `${base}?invite=${token}`;
    navigator.clipboard.writeText(link).then(() => {
      window.showToast('لینک دعوت کپی شد', 'success');
    }).catch(() => {
      window.showToast('کپی لینک انجام نشد', 'error');
    });
  };

  const pendingInvitations = invitations.filter((i) => i.status === 'pending' && i.expiresAt > Date.now());

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="تیم و صندلی‌ها">
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : ownerAccess === false ? (
        <p className="text-gray-600 text-center py-6">
          فقط مالک سالن می‌تواند اعضا را دعوت و مدیریت کند.
        </p>
      ) : (
        <div className="space-y-6">
          <section>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <UserPlus size={18} />
              افزودن صندلی (دعوت به پنل)
            </h3>
            <form onSubmit={handleInvite} className="space-y-2">
              <MaterialInput
                id="inviteePhone"
                label="شماره تلفن دعوت‌شونده"
                type="tel"
                value={inviteePhone}
                onChange={(e) => setInviteePhone(e.target.value)}
                placeholder="09xxxxxxxxx"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full h-11 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 size={18} className="animate-spin" /> : null}
                ارسال دعوتنامه
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2">
              پس از ایجاد دعوت، لینک دعوت را برای شخص به اشتراک بگذارید تا در اپ وارد شود و دعوت را بپذیرد.
            </p>
          </section>

          {pendingInvitations.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Users size={18} />
                دعوتنامه‌های در انتظار
              </h3>
              <ul className="space-y-2">
                {pendingInvitations.map((inv) => (
                  <li
                    key={inv.id}
                    className="bg-gray-50 rounded-lg p-3 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{inv.inviteePhone}</p>
                      <p className="text-xs text-gray-500">
                        منقضی: {new Date(inv.expiresAt).toLocaleDateString('fa-IR')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyInviteLink(inv.token)}
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-100 flex items-center gap-1 text-sm"
                      title="کپی لینک دعوت"
                    >
                      <Copy size={16} />
                      لینک
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {members.length > 0 && (
            <section>
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-2">
                <Users size={18} />
                اعضای سالن
              </h3>
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.barberId} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-gray-800">
                      {m.fullName || m.phone || `آرایشگر #${m.barberId}`}
                      {m.isOwner && <span className="text-xs text-primary-600 mr-2">(مالک)</span>}
                    </p>
                    {m.phone && <p className="text-xs text-gray-500">{m.phone}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </BottomSheet>
  );
}
