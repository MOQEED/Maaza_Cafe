import React, { useRef } from 'react';
import { FiX, FiPrinter, FiCoffee } from 'react-icons/fi';

export default function ReceiptModal({ isOpen, onClose, bill }) {
  const receiptRef = useRef(null);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const amount = Number(bill.amount || bill.totalPrice || 0);
  const tax = Number((amount * 0.05).toFixed(2)); // 5% GST example
  const grandTotal = amount;
  const subTotal = (amount - tax).toFixed(2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in no-print-bg">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 dark:border-stone-800 no-print">
          <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-stone-300">
            <FiPrinter className="w-4 h-4 text-amber-500" />
            <span>Thermal Cafe Receipt</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
          >
            <FiX className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div className="p-6 overflow-y-auto bg-stone-50 dark:bg-stone-950/40 flex justify-center">
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-full bg-white text-stone-900 p-6 rounded-2xl shadow-md border border-stone-200 font-mono text-xs space-y-4"
          >
            {/* Cafe Header */}
            <div className="text-center space-y-1">
              <div className="inline-flex p-2 rounded-xl bg-amber-500 text-white mx-auto mb-1">
                <FiCoffee className="w-5 h-5" />
              </div>
              <h2 className="text-base font-black tracking-wider uppercase">MAAZA CAFE</h2>
              <p className="text-[10px] text-stone-500">Main Road, Food Court Lane</p>
              <p className="text-[10px] text-stone-500">GSTIN: 36AAACM1234F1Z5</p>
              <div className="border-b border-dashed border-stone-300 my-2" />
            </div>

            {/* Bill Details */}
            <div className="text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-stone-500">Receipt No:</span>
                <span className="font-bold">#{(bill._id || bill.id || '101').slice(-6).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Date:</span>
                <span>{bill.date || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Time:</span>
                <span>{bill.time || new Date().toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Cashier:</span>
                <span>Counter 1 (Manager)</span>
              </div>
            </div>

            <div className="border-b border-dashed border-stone-300 my-2" />

            {/* Order Items Table */}
            <div className="space-y-2 text-[11px]">
              <div className="flex justify-between font-bold border-b border-stone-200 pb-1">
                <span>ITEM / DESCRIPTION</span>
                <span>AMT (₹)</span>
              </div>

              <div className="flex justify-between items-start pt-1">
                <span className="flex-1 pr-2 font-semibold">{bill.billName || bill.itemName || 'Cafe Order'}</span>
                <span className="font-bold whitespace-nowrap">₹{amount.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-stone-300 my-2" />

            {/* Totals */}
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal:</span>
                <span>₹{subTotal}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>CGST (2.5%):</span>
                <span>₹{(tax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>SGST (2.5%):</span>
                <span>₹{(tax / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-black border-t border-stone-900 pt-2 mt-1">
                <span>TOTAL PAYABLE:</span>
                <span className="text-amber-700 font-extrabold">₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-b border-dashed border-stone-300 my-2" />

            {/* Footer Thank You */}
            <div className="text-center space-y-1 text-[10px] text-stone-500 pt-1">
              <p className="font-semibold text-stone-800">*** THANK YOU FOR VISITING ***</p>
              <p>Fresh Coffee • Fresh Bakery • Friendly Smiles</p>
              <p className="text-[9px] text-stone-400">Powered by Maaza Cafe Management</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/60 flex items-center justify-between no-print">
          <button
            onClick={onClose}
            className="btn-secondary text-xs cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="btn-primary text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <FiPrinter className="w-4 h-4" />
            <span>Print Receipt</span>
          </button>
        </div>
      </div>
    </div>
  );
}
