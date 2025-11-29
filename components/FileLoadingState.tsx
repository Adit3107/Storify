"use client";

import { Spinner } from "@/components/ui/spinner";

export default function FileLoadingState() {
  return (
    <div className="flex flex-col justify-center items-center py-20">
      <Spinner size="lg" color="primary" />
      <p className="mt-4 text-muted-foreground">Loading your files...</p>
    </div>
  );
}
