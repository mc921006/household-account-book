import styles from "../dashboard.module.scss";

type TransactionInputPanelProps = {
  messageText: string;
  isAnalyzing: boolean;
  isSaving: boolean;
  onMessageTextChange(value: string): void;
  onAnalyze(): void;
  onReset(): void;
};

export function TransactionInputPanel({
  messageText,
  isAnalyzing,
  isSaving,
  onMessageTextChange,
  onAnalyze,
  onReset,
}: TransactionInputPanelProps) {
  return (
    <div className={styles.inputPanel}>
      <div className={styles.panelHeader}>
        <div>
          <p className={styles.eyebrow}>입력</p>
          <h2>결제 문자</h2>
        </div>
      </div>

      <div className={styles.smsInput}>
        <label htmlFor="payment-message">결제 문자 또는 빠른 입력</label>
        <textarea
          id="payment-message"
          value={messageText}
          onChange={(event) => onMessageTextChange(event.target.value)}
          placeholder={`결제 문자를 입력해주세요`}
          rows={10}
        />
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onReset}
          >
            초기화
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onAnalyze}
            disabled={isAnalyzing || isSaving}
          >
            {isAnalyzing || isSaving ? "저장 중" : "저장하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
