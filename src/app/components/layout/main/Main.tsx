import styles from "./main.module.scss";

export default function Main({ children }: { children: React.ReactNode }) {
  return <main className={styles.main}>{children}</main>;
}
