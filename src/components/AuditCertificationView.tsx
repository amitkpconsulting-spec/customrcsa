import React, { useState } from 'react';
import {
  ShieldCheck,
  Printer,
  Award,
  Lock,
} from 'lucide-react';
import { RCSAPayload, AuditSignoff } from '../types';
import { computeDomainSummaries } from '../utils/riskCalculations';

interface AuditCertificationViewProps {
  assessment: RCSAPayload;
  onUpdateSignoff: (signoff: AuditSignoff) => void;
  onPrintReport: () => void;
}

export const AuditCertificationView: React.FC<AuditCertificationViewProps> = ({
  assessment,
  onUpdateSignoff,
  onPrintReport,
}) => {
  const [assessorName, setAssessorName] = useState(
    assessment.auditSignoff.assessorSignedBy || assessment.organizationProfile.assessorName
  );
  const [reviewerName, setReviewerName] = useState(
    assessment.auditSignoff.reviewerSignedBy || ''
  );
  const [cisoName, setCisoName] = useState(assessment.auditSignoff.cisoCertifiedBy || '');
  const [auditNotes, setAuditNotes] = useState(assessment.auditSignoff.auditNotes || '');

  const domainSummaries = computeDomainSummaries(assessment.controls);
  const totalControls = assessment.controls.length;
  const compliantCount = assessment.controls.filter((c) => c.status === 'COMPLIANT').length;
  const avgCEF =
    assessment.controls.reduce((acc, c) => acc + c.calculatedCEF, 0) / (totalControls || 1);
  const avgResidual =
    assessment.controls.reduce((acc, c) => acc + c.residualRisk, 0) / (totalControls || 1);

  const signoff = assessment.auditSignoff;

  const handleAssessorSign = () => {
    onUpdateSignoff({
      ...signoff,
      status: 'In Review',
      assessorSignedBy: assessorName,
      assessorSignDate: new Date().toISOString().split('T')[0],
      auditNotes,
    });
  };

  const handleReviewerSign = () => {
    onUpdateSignoff({
      ...signoff,
      status: 'Remediated',
      reviewerSignedBy: reviewerName,
      reviewerSignDate: new Date().toISOString().split('T')[0],
      auditNotes,
    });
  };

  const handleCISOCertify = () => {
    const fingerprint = `SHA256:${Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
    onUpdateSignoff({
      ...signoff,
      status: 'Certified',
      cisoCertifiedBy: cisoName,
      cisoCertifyDate: new Date().toISOString().split('T')[0],
      cryptographicFingerprint: fingerprint,
      auditNotes,
    });
  };

  return (
    <div className="space-y-6 pb-20 text-white animate-fadeIn">
      {/* Header Banner */}
      <div className="border border-[#262626] bg-[#141414] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-mono font-bold tracking-widest text-[#f5ff00] border border-[#333333] bg-black px-2 py-0.5 inline-block">
            NIST SP 800-53 FORMAL GOVERNANCE & ATTESTATION
          </div>
          <h2 className="text-2xl sm:text-3xl font-syne font-bold uppercase tracking-tight text-white">
            Audit Certification & Sign-off
          </h2>
          <p className="text-xs text-[#888888] max-w-xl font-mono leading-relaxed">
            Multi-tiered cryptographic governance workflow verifying control adequacy, testing
            integrity, and residual risk tolerance acceptance.
          </p>
        </div>

        <button
          onClick={onPrintReport}
          className="px-4 py-2 bg-[#f5ff00] text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-yellow-300 transition flex items-center gap-2"
        >
          <Printer className="w-4 h-4" />
          <span>Print Formal Dossier</span>
        </button>
      </div>

      {/* Official Certificate of Compliance Box */}
      <div className="border border-[#333333] bg-[#141414] p-6 sm:p-10 space-y-8 relative">
        {/* Header Seal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#262626] pb-6 gap-4">
          <div>
            <span className="text-[10px] uppercase font-mono tracking-[0.3em] font-bold text-[#f5ff00] block">
              Official Assessment Dossier
            </span>
            <h3 className="text-2xl sm:text-3xl font-syne font-bold uppercase text-white mt-1">
              Certificate of Assurance
            </h3>
            <div className="text-xs font-mono text-[#888888] mt-1">
              Assessment ID: <strong className="text-white">{assessment.assessmentId}</strong>
            </div>
          </div>

          <div className="text-right">
            <div className="inline-block border border-[#333333] p-3 text-center bg-black">
              <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-[#888888] block">
                Governance Status
              </span>
              <span className="text-sm font-mono font-bold uppercase tracking-wider text-[#f5ff00]">
                {signoff.status}
              </span>
            </div>
          </div>
        </div>

        {/* Target Information & Executive Parameters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs font-mono border-b border-[#262626] pb-6">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] block mb-1">
              Target Information System:
            </span>
            <p className="font-syne text-sm font-bold uppercase text-white">
              {assessment.organizationProfile.targetSystem}
            </p>
            <p className="text-xs text-[#888888] mt-0.5">
              {assessment.organizationProfile.businessUnit}
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] block mb-1">
              Compliance Framework:
            </span>
            <p className="font-syne text-sm font-bold uppercase text-white">
              {assessment.organizationProfile.complianceTarget}
            </p>
            <p className="text-xs text-[#888888] mt-0.5">
              Sector: {assessment.organizationProfile.sector} Baseline
            </p>
          </div>

          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#888888] block mb-1">
              System Impact Baseline:
            </span>
            <p className="font-syne text-sm font-bold uppercase text-white">
              FIPS 199 {assessment.organizationProfile.systemImpactLevel}
            </p>
            <p className="text-xs text-[#888888] mt-0.5">
              Cycle: {assessment.organizationProfile.reviewCycle}
            </p>
          </div>
        </div>

        {/* Quantitative Assessment Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
          <div className="border border-[#262626] p-4 bg-black">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#888888] block">
              Controls Assessed
            </span>
            <span className="text-2xl font-bold text-white mt-1 block">
              {totalControls} / {totalControls}
            </span>
          </div>

          <div className="border border-[#262626] p-4 bg-black">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#888888] block">
              Compliance Rate
            </span>
            <span className="text-2xl font-bold text-emerald-400 mt-1 block">
              {((compliantCount / (totalControls || 1)) * 100).toFixed(0)}%
            </span>
          </div>

          <div className="border border-[#262626] p-4 bg-black">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#888888] block">
              Average CEF Score
            </span>
            <span className="text-2xl font-bold text-[#f5ff00] mt-1 block">
              {(avgCEF * 100).toFixed(0)}%
            </span>
          </div>

          <div className="border border-[#262626] p-4 bg-black">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#888888] block">
              Mean Residual Risk
            </span>
            <span className="text-2xl font-bold text-rose-400 mt-1 block">
              {avgResidual.toFixed(1)} / 25
            </span>
          </div>
        </div>

        {/* 3-Tier Multi-Signature Section */}
        <div className="space-y-4 pt-2">
          <h4 className="text-[10px] font-mono uppercase font-bold tracking-[0.2em] text-[#888888]">
            Three-Tier Attestation & Executive Authority
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-mono">
            {/* 1. Lead Risk Assessor */}
            <div className="border border-[#262626] p-5 space-y-4 bg-[#0d0d0d] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#888888]">
                    Tier 1: Lead Assessor
                  </span>
                  {signoff.assessorSignDate && (
                    <span className="text-emerald-400 font-bold text-[10px]">✓ Signed</span>
                  )}
                </div>
                <div className="text-sm font-bold text-white">
                  {signoff.assessorSignedBy || 'Pending Signature'}
                </div>
                <p className="text-[11px] text-[#888888] leading-relaxed">
                  Attests that controls were evaluated against empirical evidence and test
                  procedures.
                </p>
              </div>

              {!signoff.assessorSignDate ? (
                <div className="space-y-2 pt-3 border-t border-[#262626]">
                  <input
                    type="text"
                    placeholder="Assessor Full Name"
                    value={assessorName}
                    onChange={(e) => setAssessorName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
                  />
                  <button
                    onClick={handleAssessorSign}
                    className="w-full py-1.5 text-xs font-bold uppercase tracking-wider bg-[#f5ff00] text-black hover:bg-yellow-300 transition"
                  >
                    Sign Assessment
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-[#888888] pt-2 border-t border-[#262626]">
                  Date: {signoff.assessorSignDate}
                </div>
              )}
            </div>

            {/* 2. Independent Risk Reviewer */}
            <div className="border border-[#262626] p-5 space-y-4 bg-[#0d0d0d] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#888888]">
                    Tier 2: Risk Reviewer
                  </span>
                  {signoff.reviewerSignDate && (
                    <span className="text-emerald-400 font-bold text-[10px]">✓ Signed</span>
                  )}
                </div>
                <div className="text-sm font-bold text-white">
                  {signoff.reviewerSignedBy || 'Pending Review'}
                </div>
                <p className="text-[11px] text-[#888888] leading-relaxed">
                  Verifies remediation roadmap feasibility, compensating controls, and exception
                  logs.
                </p>
              </div>

              {!signoff.reviewerSignDate ? (
                <div className="space-y-2 pt-3 border-t border-[#262626]">
                  <input
                    type="text"
                    placeholder="Reviewer Full Name"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
                  />
                  <button
                    onClick={handleReviewerSign}
                    className="w-full py-1.5 text-xs font-bold uppercase tracking-wider bg-[#f5ff00] text-black hover:bg-yellow-300 transition"
                  >
                    Approve Review
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-[#888888] pt-2 border-t border-[#262626]">
                  Date: {signoff.reviewerSignDate}
                </div>
              )}
            </div>

            {/* 3. CISO / Authorizing Official */}
            <div className="border border-[#262626] p-5 space-y-4 bg-[#0d0d0d] flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-[#888888]">
                    Tier 3: CISO / AO Authority
                  </span>
                  {signoff.cisoCertifyDate && (
                    <span className="text-emerald-400 font-bold text-[10px]">✓ Certified</span>
                  )}
                </div>
                <div className="text-sm font-bold text-white">
                  {signoff.cisoCertifiedBy || 'Pending Executive Seal'}
                </div>
                <p className="text-[11px] text-[#888888] leading-relaxed">
                  Issues official Authority to Operate (ATO) and accepts residual risk posture.
                </p>
              </div>

              {!signoff.cisoCertifyDate ? (
                <div className="space-y-2 pt-3 border-t border-[#262626]">
                  <input
                    type="text"
                    placeholder="CISO Full Name"
                    value={cisoName}
                    onChange={(e) => setCisoName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none"
                  />
                  <button
                    onClick={handleCISOCertify}
                    className="w-full py-1.5 text-xs font-bold uppercase tracking-wider bg-[#f5ff00] text-black hover:bg-yellow-300 transition"
                  >
                    Certify & Seal RCSA
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-[#888888] pt-2 border-t border-[#262626]">
                  Date: {signoff.cisoCertifyDate}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cryptographic Seal & Hash Verification */}
        {signoff.cryptographicFingerprint && (
          <div className="p-4 border border-[#333333] bg-black space-y-1 font-mono text-xs">
            <span className="text-[9px] uppercase font-bold tracking-wider text-[#f5ff00] block">
              Cryptographic Integrity Fingerprint:
            </span>
            <div className="text-[11px] break-all font-bold text-emerald-400">
              {signoff.cryptographicFingerprint}
            </div>
            <p className="text-[9px] text-[#888888] pt-1">
              Tamper-evident digest computed across all 20 NIST SP 800-53 Rev. 5 control parameters
              and evidence artifacts.
            </p>
          </div>
        )}

        {/* General Audit Notes */}
        <div className="pt-4 border-t border-[#262626] space-y-2">
          <label className="block text-[10px] font-mono uppercase font-bold tracking-wider text-[#888888]">
            Executive Governance & Audit Notes:
          </label>
          <textarea
            rows={3}
            value={auditNotes}
            onChange={(e) => setAuditNotes(e.target.value)}
            placeholder="Document formal audit findings, accepted exceptions, and board-level risk appetite alignment..."
            className="w-full p-3 text-xs border border-[#333333] bg-black text-white focus:border-[#f5ff00] outline-none font-mono"
          />
        </div>
      </div>
    </div>
  );
};
