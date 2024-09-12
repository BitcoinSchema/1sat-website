
import ProfilePage from "@/components/pages/profile";
import { Suspense } from "react";

const Profile = () => {
  return (
    <Suspense>
      <ProfilePage />
    </Suspense>
  );
};
export default Profile;

export async function generateMetadata() {
  return {
    title: "Profile Page - 1SatOrdinals",
    description: "View your profile information.",
    openGraph: {
      title: "Profile Page - 1SatOrdinals",
      description: "View your profile information.",
      type: "website",
    },
    twitter: {
      card: "ummary_large_image",
      title: "Profile Page - 1SatOrdinals",
      description: "Profile page on 1SatOrdinals.",
    },
  };
}
