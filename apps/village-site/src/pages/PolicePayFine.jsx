// apps/village-site/src/pages/PolicePayFine.jsx
import { Link } from 'react-router-dom'
import {
  CreditCard, Mail, MapPin, Clock, ChevronLeft,
  ExternalLink, CheckCircle, AlertCircle,
} from 'lucide-react'

const PAYMENT_URL = 'https://www.ohioticketpayments.com/SaintLouisville/DocketSearch.php'

export default function PolicePayFine() {
  return (
    <div>
      {/* Page header */}
      <div className="bg-blue-900 text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/police"
            className="inline-flex items-center gap-1 text-blue-300 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} />
            Back to Police Department
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-700 rounded-xl flex items-center justify-center flex-shrink-0">
              <CreditCard size={28} className="text-yellow-400" />
            </div>
            <div>
              <p className="text-blue-300 text-sm font-medium uppercase tracking-widest">Saint Louisville Police Department</p>
              <h1 className="text-3xl font-bold">Pay a Fine</h1>
            </div>
          </div>
          <p className="mt-4 text-blue-200 max-w-2xl text-sm leading-relaxed">
            The Village of Saint Louisville offers several ways to pay citations and court fines.
            Choose the option that works best for you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* CTA — online payment */}
        <div className="bg-blue-900 rounded-2xl p-8 mb-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-700 rounded-2xl flex items-center justify-center flex-shrink-0">
              <CreditCard size={28} className="text-yellow-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Pay Online</h2>
              <p className="text-blue-200 text-sm mt-0.5">
                Search for your citation and pay securely — available 24/7
              </p>
              <p className="text-blue-300 text-xs mt-1">A 3.5% processing fee applies to credit card payments</p>
            </div>
          </div>
          <a
            href={PAYMENT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-yellow-400 text-blue-900 font-bold rounded-xl hover:bg-yellow-300 transition-colors shadow-lg text-sm whitespace-nowrap"
          >
            Pay Now
            <ExternalLink size={15} />
          </a>
        </div>

        {/* Other payment methods */}
        <h2 className="text-xl font-bold text-gray-800 mb-4">Other Payment Options</h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">

          {/* Mail */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail size={20} className="text-blue-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Pay by Mail</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Make checks or money orders payable to <strong>Village of Saint Louisville</strong> and mail to:
                </p>
                <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm font-medium text-gray-700 leading-relaxed">
                  Violations Bureau<br />
                  P.O. Box 149<br />
                  St. Louisville, OH 43071
                </div>
              </div>
            </div>
          </div>

          {/* Drop box */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-green-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Drop Box</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  A secure drop box is available at:
                </p>
                <div className="mt-3 bg-gray-50 rounded-lg p-3 text-sm font-medium text-gray-700">
                  1 School Street<br />
                  Saint Louisville, OH 43071
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle size={13} />
                  No cash — checks or money orders only
                </div>
              </div>
            </div>
          </div>

          {/* In person */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sm:col-span-2">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-amber-700" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">Pay In Person</h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-3">
                  Visit the Violations Bureau office during the following hours:
                </p>
                <div className="flex flex-wrap gap-4">
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-700">Office Hours</p>
                    <p className="text-gray-500 mt-0.5">Monday: 9:00 AM – 12:00 PM</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm">
                    <p className="font-semibold text-gray-700">Location</p>
                    <p className="text-gray-500 mt-0.5">1 School Street, Saint Louisville, OH</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Accepted methods */}
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-6">
          <h3 className="font-semibold text-gray-800 mb-3">Accepted Payment Methods</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Cash (in-person only)', 'Check', 'Money Order', 'Credit Card (online, 3.5% fee)'].map(m => (
              <div key={m} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle size={15} className="text-green-500 flex-shrink-0" />
                {m}
              </div>
            ))}
          </div>
        </div>

        {/* Questions */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Questions about your citation?{' '}
            <a href="tel:7405687800" className="text-blue-700 font-semibold hover:underline">
              Call (740) 568-7800
            </a>{' '}
            or{' '}
            <a href="mailto:pd@saintlouisvilleohio.gov" className="text-blue-700 font-semibold hover:underline">
              email the department
            </a>.
          </p>
        </div>
      </div>
    </div>
  )
}
