import Header from "../components/Header";
import Footer from "../components/Footer";
import AccountClient from "./AccountClient";

export const metadata = {
  title: "Mon compte - 1111.tn",
  description: "Espace client 1111.tn.",
};

export default function ComptePage() {
  return (
    <>
      <Header />
      <AccountClient />
      <Footer />
    </>
  );
}
