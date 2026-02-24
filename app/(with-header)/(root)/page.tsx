// import { Suspense } from "react";
// import { redirect } from "next/navigation";
// import Revolution from "@/components/Revolution";
// import { getCurrentUser } from "@/lib/actions/user.actions";

// export default async function Page() {
//   const user = await getCurrentUser();

//   if (!user) {
//     redirect("/sign-in");
//   }

//   return (
//     <Suspense fallback={null}>
//       <div>
//         <Revolution />
//       </div>
//     </Suspense>
//   );
// }
import { Suspense } from "react";
import { redirect } from "next/navigation";
import Revolution from "@/components/Revolution";
import { getCurrentUser } from "@/lib/actions/user.actions";
import InvestmentsTemporary from "@/components/InvestmentsTemporary";

const LAUNCH_DATE = new Date("2026-02-24T00:00:00"); // set your start date

export default async function Page() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const now = new Date();
  const diffInDays =
    (now.getTime() - LAUNCH_DATE.getTime()) / (1000 * 60 * 60 * 24);

  const showTemporary = diffInDays <= 10;

  return (
    <Suspense fallback={null}>
      <div>
        {showTemporary ? <InvestmentsTemporary /> : <Revolution />}
      </div>
    </Suspense>
  );
}