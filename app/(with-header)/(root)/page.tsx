import { Suspense } from "react";
import { redirect } from "next/navigation";
import Revolution from "@/components/Revolution";
import { getCurrentUser } from "@/lib/actions/user.actions";

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <Suspense fallback={null}>
      <div>
        <Revolution />
      </div>
    </Suspense>
  );
}
