"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./sidebar.module.scss";

const menus = [
  { label: "대시보드", href: "/main/dashboard" },
  { label: "거래내역", href: "/main/transactions" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <nav>
        {menus.map((menu) => (
          <Link
            className={
              pathname === menu.href &&
              (menu.label === "대시보드" || menu.label === "거래내역")
                ? styles.active
                : ""
            }
            href={menu.href}
            key={menu.label}
          >
            {menu.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
