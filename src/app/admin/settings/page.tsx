'use client'

import { useState, useEffect } from 'react'
import AdminLayout from '@/components/AdminLayout'
import toast from 'react-hot-toast'
import { Setting } from '@/lib/settings'

export default function Settings() {
  const [activeTab, setActiveTab] = useState('contact')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    contactPhone: '', contactWhatsapp: '', contactEmail: '',
    businessName: '', businessAddress: '', businessWorkingHours: '',
    currencyUsdToLbp: 1500, currencyPrimary: 'USD',
    paymentTestMode: false, paymentMinimumAmount: 10
  })

  const tabs = [
    { id: 'contact', name: 'Contact' },
    { id: 'business', name: 'Business' },
    { id: 'currency', name: 'Currency' },
    { id: 'payment', name: 'Payment' }
  ]

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/admin/settings')
        const data = await response.json()
        if (data.success && data.data) {
          const s = data.data
          setSettings({
            contactPhone: s.find((i: Setting) => i.key === 'contact_phone')?.value || '',
            contactWhatsapp: s.find((i: Setting) => i.key === 'contact_whatsapp')?.value || '',
            contactEmail: s.find((i: Setting) => i.key === 'contact_email')?.value || '',
            businessName: s.find((i: Setting) => i.key === 'business_name')?.value || '',
            businessAddress: s.find((i: Setting) => i.key === 'business_address')?.value || '',
            businessWorkingHours: s.find((i: Setting) => i.key === 'business_working_hours')?.value || '',
            currencyUsdToLbp: Number(s.find((i: Setting) => i.key === 'currency_usd_to_lbp')?.value) || 1500,
            currencyPrimary: s.find((i: Setting) => i.key === 'currency_primary')?.value || 'USD',
            paymentTestMode: s.find((i: Setting) => i.key === 'payment_test_mode')?.value === 'true',
            paymentMinimumAmount: Number(s.find((i: Setting) => i.key === 'payment_minimum_amount')?.value) || 10
          })
        }
      } catch (error) {
        console.error('Error:', error)
        toast.error('Failed to load settings')
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = [
        { key: 'contact_phone', value: settings.contactPhone, type: 'string', category: 'contact' },
        { key: 'contact_whatsapp', value: settings.contactWhatsapp, type: 'string', category: 'contact' },
        { key: 'contact_email', value: settings.contactEmail, type: 'string', category: 'contact' },
        { key: 'business_name', value: settings.businessName, type: 'string', category: 'business' },
        { key: 'business_address', value: settings.businessAddress, type: 'string', category: 'business' },
        { key: 'business_working_hours', value: settings.businessWorkingHours, type: 'string', category: 'business' },
        { key: 'currency_usd_to_lbp', value: settings.currencyUsdToLbp, type: 'number', category: 'currency' },
        { key: 'currency_primary', value: settings.currencyPrimary, type: 'string', category: 'currency' },
        { key: 'payment_test_mode', value: settings.paymentTestMode, type: 'boolean', category: 'payment' },
        { key: 'payment_minimum_amount', value: settings.paymentMinimumAmount, type: 'number', category: 'payment' }
      ]
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates })
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Saved')
        await fetch('/api/admin/clear-cache', { method: 'POST' })
      } else {
        toast.error('Failed to save')
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <AdminLayout><div className="p-4 text-sm text-gray-500">Loading...</div></AdminLayout>
  }

  return (
    <AdminLayout>
      <div>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Settings</h1>
          <button onClick={handleSave} disabled={saving} className="px-3 py-2 text-sm bg-gray-900 text-white rounded hover:bg-gray-800 disabled:opacity-50 w-full sm:w-auto">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4 text-sm">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded ${activeTab === tab.id ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab.name}
            </button>
          ))}
        </div>

        {/* Content - Mobile-friendly tables with larger inputs */}
        {activeTab === 'contact' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 min-w-[300px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 w-28 sm:w-40">Setting</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Phone</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <input type="tel" value={settings.contactPhone} onChange={(e) => setSettings({...settings, contactPhone: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="+961-76-103-365" />
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">WhatsApp</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <input type="tel" value={settings.contactWhatsapp} onChange={(e) => setSettings({...settings, contactWhatsapp: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="96176103365" />
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Email</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <input type="email" value={settings.contactEmail} onChange={(e) => setSettings({...settings, contactEmail: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="info@eweeha.com" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'business' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 min-w-[300px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 w-28 sm:w-40">Setting</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Name</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <input type="text" value={settings.businessName} onChange={(e) => setSettings({...settings, businessName: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="Eweeha" />
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Address</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <input type="text" value={settings.businessAddress} onChange={(e) => setSettings({...settings, businessAddress: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="Beirut, Lebanon" />
                  </td>
                </tr>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Hours</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <input type="text" value={settings.businessWorkingHours} onChange={(e) => setSettings({...settings, businessWorkingHours: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded text-base" placeholder="24/7 Service" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'currency' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-gray-300 min-w-[300px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 w-28 sm:w-40">Setting</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Value</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Currency</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <select value={settings.currencyPrimary} onChange={(e) => setSettings({...settings, currencyPrimary: e.target.value})} className="px-3 py-2 border border-gray-300 rounded text-base w-full sm:w-auto">
                      <option value="USD">USD</option>
                      <option value="LBP">LBP</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">USD→LBP</td>
                  <td className="px-3 py-2 border-b border-gray-200">
                    <input type="number" value={settings.currencyUsdToLbp} onChange={(e) => setSettings({...settings, currencyUsdToLbp: Number(e.target.value)})} className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded text-base" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'payment' && (
          <>
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-sm border border-gray-300 min-w-[300px]">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300 w-28 sm:w-40">Setting</th>
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-b border-gray-300">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Min $</td>
                    <td className="px-3 py-2 border-b border-gray-200">
                      <input type="number" value={settings.paymentMinimumAmount} onChange={(e) => setSettings({...settings, paymentMinimumAmount: Number(e.target.value)})} className="w-full sm:w-32 px-3 py-2 border border-gray-300 rounded text-base" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 border-r border-b border-gray-200 font-medium">Test Mode</td>
                    <td className="px-3 py-2 border-b border-gray-200">
                      <label className="flex items-center gap-2 py-1">
                        <input type="checkbox" checked={settings.paymentTestMode} onChange={(e) => setSettings({...settings, paymentTestMode: e.target.checked})} className="w-5 h-5" />
                        <span>Enabled</span>
                      </label>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Payment Methods Status */}
            <h3 className="font-semibold text-gray-900 mb-2">Payment Methods</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-3 py-2 text-left font-medium text-gray-700 border-r border-b border-gray-300">Method</th>
                    <th className="px-3 py-2 text-center font-medium text-gray-700 border-b border-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-white">
                    <td className="px-3 py-2 border-r border-b border-gray-200">Cards (Stripe)</td>
                    <td className="px-3 py-2 border-b border-gray-200 text-center"><span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5">Active</span></td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2 border-r border-b border-gray-200">OMT</td>
                    <td className="px-3 py-2 border-b border-gray-200 text-center"><span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5">Active</span></td>
                  </tr>
                  <tr className="bg-white">
                    <td className="px-3 py-2 border-r border-b border-gray-200">Bank Transfer</td>
                    <td className="px-3 py-2 border-b border-gray-200 text-center"><span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5">Active</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
