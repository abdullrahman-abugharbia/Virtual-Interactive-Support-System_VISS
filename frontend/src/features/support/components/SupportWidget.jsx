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
      {/* Modal panel (opens above the FAB) */}
      {isOpen && <SupportModal />}

      {/* Onboarding tooltip */}
      {showTooltip && !isOpen && (
        <div className="fixed bottom-[100px] right-7 z-[150] max-w-[220px] animate-fade-up rounded-card border border-line-aria bg-surface px-4 py-2.5 text-sm text-content shadow-aria">
          <span className="text-primary-light">✦</span> Hi, I'm Aria! Need help? Ask me anything.
          <button
            onClick={() => {
              setShowTooltip(false);
              localStorage.setItem('support_tooltip_seen', '1');
            }}
            className="ml-2 text-dim transition-colors hover:text-content"
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
        className="fixed bottom-7 right-7 z-[150] flex h-[58px] w-[58px] items-center justify-center rounded-full bg-logo-gradient text-white shadow-fab transition-transform duration-200 hover:scale-[1.06] focus:outline-none"
        aria-label={isOpen ? 'Close support chat' : 'Open support chat'}
      >
        {!isOpen && (
          <span className="absolute inset-0 rounded-full border-[1.5px] border-primary-hover/55 animate-ring-fab" />
        )}
        {isOpen ? (
          <span className="text-[18px] leading-none">✕</span>
        ) : (
          <span className="text-[22px] leading-none">✦</span>
        )}
      </button>
    </>
  );
}
