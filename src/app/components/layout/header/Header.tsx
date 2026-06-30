"use client";

import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./header.module.scss";

export default function Header() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const logout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error(error);
      alert("로그아웃에 실패했습니다.");
      setIsLoggingOut(false);
      return;
    }

    document.cookie = "accountBookLogin=; path=/; max-age=0";
    router.replace("/auth/login");
  };

  return (
    <header className={styles.header}>
      <div>
        <strong>Household Account Book</strong>
        <span>AI 거래 정리</span>
      </div>
      <button type="button" onClick={logout} disabled={isLoggingOut}>
        {isLoggingOut ? "로그아웃 중" : "로그아웃"}
      </button>
    </header>
  );
}
