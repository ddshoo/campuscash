"use client";

import Link from "next/link";
import { useAppStore } from "@/store/useAppStore";

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="white">
      <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="white">
      <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
    </svg>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2 mt-2">
      {title}
    </p>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 px-4">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  );
}

function AccountRow({
  name,
  last4,
  type,
  color,
}: {
  name: string;
  last4: string;
  type: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 px-4">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: color }}
      >
        <span className="text-white text-xs font-bold">{name[0]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
        <p className="text-xs text-gray-400">•••• {last4}</p>
      </div>
      <span className="text-xs text-gray-400 shrink-0">{type}</span>
    </div>
  );
}

export default function ProfilePage() {
  const profile = useAppStore((s) => s.profile);

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div className="flex flex-col min-h-full">
      {/* Header */}
      <header className="bg-navy px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-white text-xl font-bold">Profile & Settings</h1>
          <div className="flex items-center gap-3">
            <button aria-label="Edit profile" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10">
              <EditIcon />
            </button>
            <Link href="/notifications" aria-label="Notifications" className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10">
              <BellIcon />
            </Link>
          </div>
        </div>
        {/* Avatar */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-orange flex items-center justify-center" style={{ backgroundColor: "#F26522" }}>
            <span className="text-white text-xl font-bold">{initials}</span>
          </div>
          <div>
            <p className="text-white text-lg font-semibold">{profile.name}</p>
            <p className="text-blue-200 text-xs">{profile.school}</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col py-4 gap-1">
        {/* Personal Info */}
        <SectionHeader title="Personal Info" />
        <div className="bg-white shadow-sm">
          <InfoRow label="Name" value={profile.name} />
          <InfoRow label="School" value={profile.school} />
          <InfoRow label="Year" value={profile.year} />
        </div>

        {/* Linked Accounts */}
        <SectionHeader title="Linked Accounts" />
        <div className="bg-white shadow-sm">
          <AccountRow
            name={profile.accountName}
            last4={profile.accountLast4}
            type="Checking"
            color="#5E8AC7"
          />
          <AccountRow
            name="PNC Savings"
            last4="9421"
            type="Savings"
            color="#F26522"
          />
        </div>

        {/* Credit Cards */}
        <SectionHeader title="Credit Cards" />
        <div className="bg-white shadow-sm">
          <AccountRow
            name="Bank of America"
            last4="9543"
            type="Credit"
            color="#E31837"
          />
          <AccountRow
            name="Chase Sapphire"
            last4="3004"
            type="Credit"
            color="#117ACA"
          />
        </div>

        {/* App Info */}
        <SectionHeader title="App" />
        <div className="bg-white shadow-sm">
          <InfoRow label="Version" value="1.0.0" />
          <InfoRow label="Build" value="Demo" />
        </div>
      </div>
    </div>
  );
}
