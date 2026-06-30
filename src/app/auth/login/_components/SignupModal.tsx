"use client";

import { supabase } from "@/lib/supabase/client";
import { useState } from "react";

type SignupModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function SignupModal({ open, onClose }: SignupModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!open) return null;

  const submitSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      alert("이메일과 비밀번호를 입력해주세요.");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    alert("회원가입이 완료되었습니다.");
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>회원가입</h2>

        <form onSubmit={submitSignup}>
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="비밀번호"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">가입하기</button>
          <button type="button" onClick={onClose}>
            닫기
          </button>
        </form>
      </div>
    </div>
  );
}
