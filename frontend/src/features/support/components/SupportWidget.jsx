import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { openWidget, closeWidget, selectSupportOpen } from '../supportSlice';
import SupportModal from './SupportModal';

export default function SupportWidget() {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectSupportOpen);
  const [showTooltip, setShowTooltip] = useState(false);

  // Show onboarding tooltip after 3 seconds on first visit
  useEffect(() => {
    const seen = localStorage.getItem('support_tooltip_seen');
    if (seen) return;
    const timer = setTimeout(() => setShowTooltip(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  function handleOpen() {
    setShowTooltip(false);
    localStorage.setItem('support_tooltip_seen', '1');
    dispatch(openWidget());
  }

  function handleClose() {
    dispatch(closeWidget());
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 left-6 z-40 flex flex-col items-start gap-2">
        {/* Tooltip */}
        {showTooltip && !isOpen && (
          <div className="bg-gray-900 text-white text-sm px-4 py-2 rounded-xl shadow-lg max-w-[200px] text-center animate-fade-in">
            👋 Need help? Ask me anything!
            <button
              onClick={() => { setShowTooltip(false); localStorage.setItem('support_tooltip_seen', '1'); }}
              className="ml-2 text-gray-400 hover:text-white text-xs"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* FAB */}
        <button
          type="button"
          onClick={isOpen ? handleClose : handleOpen}
          className={`
            w-14 h-14 rounded-full shadow-xl flex items-center justify-center
            transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-indigo-400
            ${isOpen
              ? 'bg-gray-700 hover:bg-gray-800 rotate-0'
              : 'bg-indigo-600 hover:bg-indigo-700'}
          `}
          aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
        >
          {isOpen ? (
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
            </svg>
          )}
        </button>
      </div>

      {/* Modal */}
      {isOpen && <SupportModal />}
    </>
  );
}
