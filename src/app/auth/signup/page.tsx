"use client";

import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../login/login.module.scss";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim() || !passwordConfirm.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setIsSubmitting(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("회원가입이 완료되었습니다. 로그인해주세요.");
    router.replace("/auth/login");
  };

  return (
    <main className={styles.authPage}>
      <section className={styles.heroPanel}>
        <p className={styles.eyebrow}>Create Account</p>
        <h1>가계부를 시작할 계정을 만드세요</h1>
        <p className={styles.description}>
          가입 후 로그인하면 문자 분석 결과와 직접 입력한 거래내역을 계정에
          저장해 다시 확인할 수 있습니다.
        </p>

        <div className={styles.metricGrid} aria-label="회원가입 후 사용 기능">
          <div>
            <span>저장</span>
            <strong>Cloud</strong>
          </div>
          <div>
            <span>분류</span>
            <strong>Category</strong>
          </div>
          <div>
            <span>조회</span>
            <strong>Recent</strong>
          </div>
        </div>
      </section>

      <section className={styles.authCard} aria-labelledby="signup-title">
        <div className={styles.cardHeader}>
          <p className={styles.eyebrow}>회원가입</p>
          <h2 id="signup-title">새 계정 만들기</h2>
          <p>로그인 화면과 분리된 가입 화면입니다.</p>
        </div>

        <form className={styles.form} onSubmit={submitSignup}>
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
              autoComplete="new-password"
            />
          </label>

          <label>
            비밀번호 확인
            <input
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              type="password"
              autoComplete="new-password"
            />
          </label>

          <button
            className={styles.primaryButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "가입 중" : "회원가입"}
          </button>
        </form>

        <div className={styles.switchBox}>
          <span>이미 계정이 있나요?</span>
          <Link href="/auth/login">로그인</Link>
        </div>
      </section>
    </main>
  );
}
