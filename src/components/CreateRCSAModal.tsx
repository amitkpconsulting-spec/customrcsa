import React from 'react';
import { X } from 'lucide-react';
import { RCSAPayload } from '../types';
import { CreateRCSASection } from './CreateRCSASection';

interface CreateRCSAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssessmentCreated: (newAssessment: RCSAPayload) => void;
}

export const CreateRCSAModal: React.FC<CreateRCSAModalProps> = ({
  isOpen,
  onClose,
  onAssessmentCreated,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-4xl bg-[#111111] border border-[#333333] shadow-2xl z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-[#262626] bg-[#0c0c0c] flex items-center justify-between">
          <div className="font-syne font-bold uppercase text-sm text-white">
            Create New Domain Assessment
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-[#333333] bg-[#1a1a1a] text-[#888888] hover:text-white hover:border-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          <CreateRCSASection
            onAssessmentCreated={(assessment) => {
              onAssessmentCreated(assessment);
              onClose();
            }}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
};
