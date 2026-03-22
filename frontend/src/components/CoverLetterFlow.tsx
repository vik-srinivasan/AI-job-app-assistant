"use client";

import { useState } from "react";
import StepIndicator from "@/components/StepIndicator";
import ResumeUpload from "@/components/ResumeUpload";
import CoverLetterView from "@/components/CoverLetterView";
import FeedbackPanel from "@/components/FeedbackPanel";
import LoadingState from "@/components/LoadingState";
import { generateCoverLetter } from "@/lib/api";
import { Step } from "@/types";

interface CoverLetterFlowProps {
  jobDescription: string;
}

export default function CoverLetterFlow({ jobDescription }: CoverLetterFlowProps) {
  const [step, setStep] = useState<Step>(1);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<File[]>([]);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleResumeSubmit(resume: File, docs: File[]) {
    if (!jobDescription.trim()) {
      setError("Please add a job description in the bar above first.");
      return;
    }
    setResumeFile(resume);
    setAdditionalDocs(docs);
    setStep(2);
    setLoading(true);
    setError("");
    try {
      const result = await generateCoverLetter(jobDescription, resume, docs);
      setCoverLetter(result.cover_letter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate cover letter");
    } finally {
      setLoading(false);
    }
  }

  async function handleFeedback(feedback: string) {
    if (!resumeFile) return;
    setLoading(true);
    setError("");
    try {
      const result = await generateCoverLetter(
        jobDescription,
        resumeFile,
        additionalDocs,
        coverLetter,
        feedback
      );
      setCoverLetter(result.cover_letter);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to revise cover letter");
    } finally {
      setLoading(false);
    }
  }

  function handleStartOver() {
    setStep(1);
    setResumeFile(null);
    setAdditionalDocs([]);
    setCoverLetter("");
    setError("");
  }

  return (
    <div className="pt-8">
      <StepIndicator currentStep={step} />

      {step === 1 && (
        <>
          {!jobDescription && (
            <div className="mb-4 p-4 bg-amber-50 border border-amber-200/60 rounded-2xl text-sm text-amber-700 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              Add a job description in the bar above to get a tailored cover letter.
            </div>
          )}
          <ResumeUpload
            onSubmit={handleResumeSubmit}
            onBack={undefined}
          />
        </>
      )}

      {step === 2 && (
        <>
          {loading && !coverLetter ? (
            <LoadingState />
          ) : coverLetter ? (
            <>
              <CoverLetterView
                letter={coverLetter}
                onStartOver={handleStartOver}
              />
              <FeedbackPanel
                onSubmitFeedback={handleFeedback}
                loading={loading}
              />
            </>
          ) : null}

          {error && (
            <div className="animate-fade-in-up mt-4 p-5 bg-red-50 border border-red-200/60 rounded-2xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">{error}</p>
                  <button
                    onClick={handleStartOver}
                    className="mt-2 text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                  >
                    Start over
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
