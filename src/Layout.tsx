import { ReactNode } from "react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export function Layout({
  menu,
  children,
  navigate,
}: {
  menu?: ReactNode;
  children: ReactNode;
  navigate?: (to: string) => void;
}) {
  return (
    <div className="flex h-screen w-full flex-col">
      <Header menu={menu} navigate={navigate} />
      <main className="flex grow flex-col">{children}</main>
      <Footer />
    </div>
  );
}
