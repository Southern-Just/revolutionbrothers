import Revolution from "@/components/Revolution";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <div>
        <Revolution />
      </div>
    </Suspense>
  );
}
