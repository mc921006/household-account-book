import { Header, Main, Sidebar } from "../components/layout";
import styles from "./main-layout.module.scss";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.shell}>
      <Header />
      <div className={styles.body}>
        <Sidebar />
        <Main>{children}</Main>
      </div>
    </div>
  );
}
