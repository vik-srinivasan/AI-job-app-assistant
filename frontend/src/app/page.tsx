"use client";

import { useState } from "react";
import TopBar from "@/components/TopBar";
import JobDescriptionBar from "@/components/JobDescriptionBar";
import CoverLetterFlow from "@/components/CoverLetterFlow";
import ResumeEditorPanel from "@/components/ResumeEditorPanel";

type Tool = "cover-letter" | "resume";

export default function Home() {
  const [activeTool, setActiveTool] = useState<Tool>("cover-letter");
  const [jobDescription, setJobDescription] = useState("");

  return (
    <div className="h-screen flex flex-col">
      <TopBar activeTool={activeTool} onToolChange={setActiveTool} />
      <JobDescriptionBar
        jobDescription={jobDescription}
        setJobDescription={setJobDescription}
      />

      {/* Cover Letter — narrow centered column */}
      <div className={activeTool === "cover-letter" ? "flex-1 overflow-y-auto" : "hidden"}>
        <div className="max-w-2xl mx-auto px-5 pb-20">
          <CoverLetterFlow jobDescription={jobDescription} />
        </div>
      </div>

      {/* Resume Editor — full-width split pane */}
      <div className={activeTool === "resume" ? "flex-1 flex min-h-0" : "hidden"}>
        <ResumeEditorPanel jobDescription={jobDescription} />
      </div>
    </div>
  );
}
