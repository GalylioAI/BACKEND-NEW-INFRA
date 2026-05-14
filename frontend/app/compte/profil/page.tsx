import Header from "../../components/Header";
import Footer from "../../components/Footer";
import ProfileSettingsClient from "./ProfileSettingsClient";

export const metadata = {
  title: "Profil - 1111.tn",
  description: "Profil et securite du compte 1111.tn.",
};

export default function ProfilPage() {
  return (
    <>
      <Header />
      <ProfileSettingsClient />
      <Footer />
    </>
  );
}
