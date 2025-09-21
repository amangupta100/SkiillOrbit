// components/userDashboard/OpportunityFooter.jsx
"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ButtonLoader from "@/utils/Loader";

export function OpportunityFooter({loadingTxt ,onApply,nextBtn,goBack,isConCheck,loading }) {
  const router = useRouter();

  return (
    <footer className="fixed flex justify-end bottom-0 left-0 right-0 bg-[#F8FAFC]/60 backdrop-blur-md border-t border-gray-200 py-3 px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <Button onClick={goBack}
          variant="outline" 
          className="px-5 cursor-pointer hover:bg-slate-300/60 transition-all duration-300"
        >
          Go Back
        </Button>
        <Button 
          onClick={onApply} disabled={!isConCheck || loading} className="cursor-pointer px-5 hover:bg-black/70 transition-all duration-300">
          {nextBtn ? loading ? loadingTxt ? loadingTxt :<ButtonLoader/> : nextBtn : "Apply Now"}
        </Button>
      </div>
    </footer>
  );
}