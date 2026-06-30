"use client";

import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./login.module.scss";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(error);
      alert("로그인에 실패했습니다.");
      setIsSubmitting(false);
      return;
    }

    document.cookie = "accountBookLogin=true; path=/; max-age=86400";

    router.replace("/main/dashboard");
  };

  return (
    <main className={styles.authPage}>
      <section className={styles.heroPanel}>
        <p className={styles.eyebrow}>AI Household Ledger</p>
        <h1>문자 결제 내역을 한눈에 정리하세요</h1>
        <p className={styles.description}>
          대시보드와 같은 흐름으로 로그인 후 거래 분석, 직접 입력, 최근
          거래내역을 바로 관리할 수 있습니다.
        </p>

        <div className={styles.metricGrid} aria-label="서비스 요약">
          <div>
            <span>분석</span>
            <strong>SMS</strong>
          </div>
          <div>
            <span>입력</span>
            <strong>Manual</strong>
          </div>
          <div>
            <span>관리</span>
            <strong>History</strong>
          </div>
        </div>
      </section>

      <section className={styles.authCard} aria-labelledby="login-title">
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>로그인</p>
          <h2 id="login-title">계정으로 들어가기</h2>
          <p>저장된 거래내역과 분석 도구를 사용하려면 로그인해주세요.</p>
        </div>

        <form className={styles.form} onSubmit={submitLogin}>
          <label>
            이메일
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label>
            비밀번호
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              type="password"
              autoComplete="current-password"
            />
          </label>

          <button
            className={styles.primaryButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "로그인 중" : "로그인"}
          </button>
        </form>

        <div className={styles.switchBox}>
          <span>아직 계정이 없나요?</span>
          <Link href="/auth/signup">회원가입</Link>
        </div>
      </section>
    </main>
  );
}
